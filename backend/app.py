"""FastAPI service. Pipeline runs every 5 min in background; endpoints serve cache."""
from __future__ import annotations

import threading
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from collections import Counter

from .config import (
    BUNCHING_THRESHOLD_BUSES,
    BUNCHING_WINDOW_MIN,
    FORECAST_BUCKET_MIN,
    FORECAST_HORIZON_HOURS,
    PASSENGERS_PER_BUS_OTHER,
    PASSENGERS_PER_BUS_SETC,
    STALE_DATA_THRESHOLD_MIN,
    TZ_IST,
)


def _passengers_for(corp: str) -> int:
    """Per-bus passenger estimate based on corporation. Replaces the
    under-reported TOTAL_PASSENGERS column from the source xlsx."""
    return (
        PASSENGERS_PER_BUS_SETC
        if str(corp).strip().upper() == "SETC"
        else PASSENGERS_PER_BUS_OTHER
    )
from .cost_tracker import monthly_summary
from .drive_sync import sync_latest
from .eta import get_etas
from .forecast import (
    arrival_forecast,
    attach_arrival,
    by_corporation,
    detect_bunching,
    find_peak_window,
)
from .geocode import get_geocodes
from .parser import load_snapshot
from .traffic import get_approach_traffic

# Track the last file we actually processed. Subsequent scheduler ticks short-
# circuit if the filename hasn't changed — avoids re-calling Google APIs every
# 5 min when files only land every 30 min.
_LAST_FILENAME: str | None = None

# In-memory state, refreshed on schedule
_STATE: dict[str, Any] = {
    "snapshot_ts": None,
    "filename": None,
    "refreshed_at": None,
    "buses": [],            # list of dicts (one per in-flight bus)
    "forecast": [],         # list of {hour, buses, passengers}
    "by_corp": [],
    "totals": {
        "buses": 0, "passengers": 0,
        "next_1h": 0, "passengers_1h": 0,
        "next_2h": 0, "passengers_2h": 0,
        "next_3h": 0, "passengers_3h": 0,
        "next_4h": 0, "passengers_4h": 0,
        "next_5h": 0, "passengers_5h": 0,
        "by_corp_1h": [], "by_corp_2h": [], "by_corp_5h": [],
    },
    "peak_window": None,
    "bunching_alert": None,
    "approach_traffic": None,
    "is_stale": False,
    "error": None,
}
_LOCK = threading.Lock()


def refresh_pipeline(force: bool = False) -> None:
    """Pull -> parse -> ETA -> geocode -> bucket. Mutates _STATE atomically.

    When force=False (the scheduler default), skip the pipeline if the latest
    file in Drive matches the one we already processed — prevents repeat API
    calls between 30-min file uploads. The /api/refresh endpoint passes
    force=True so a user-initiated refresh always re-runs.
    """
    global _LAST_FILENAME
    print(f"[refresh] starting at {datetime.now(TZ_IST).isoformat(timespec='seconds')} (force={force})")
    try:
        path = sync_latest()
        if path is None:
            raise RuntimeError("no source file in Drive")

        if not force and path.name == _LAST_FILENAME:
            print(f"[refresh] no new file ({path.name}), skipping")
            return

        df, snapshot_ts = load_snapshot(path)
        places = df["EFFECTIVE_PLACE"].unique().tolist()
        etas = get_etas(places)
        geos = get_geocodes(places)

        # Replace TOTAL_PASSENGERS / PASSENGERS_COUNT with the corp-based
        # estimate. Online bookings aren't in the source data, so a flat
        # per-bus count gives MTC a more realistic planning number.
        df["PASSENGERS_COUNT"] = df["CORPORATION"].apply(_passengers_for)

        now = datetime.now(TZ_IST)
        df = attach_arrival(df, etas, ref_time=now)
        fc = arrival_forecast(
            df,
            ref_time=now,
            hours=FORECAST_HORIZON_HOURS,
            bucket_minutes=FORECAST_BUCKET_MIN,
        )
        by_c = by_corporation(df)

        # Per-bus payload for map + table
        buses = []
        for _, r in df.iterrows():
            geo = geos.get(r["EFFECTIVE_PLACE"], {})
            arrival = r["ARRIVAL_DT"]
            # ARRIVAL_DT = now + duration, so mins_to_arrive == duration.
            mins_to_arrive = float(r["DURATION_MIN"])
            buses.append({
                "waybill": r["WAYBILLNO"],
                "vehicle": r["VEHICLE_NO"],
                "corporation": r["CORPORATION"],
                "depot": r["DEPOT"],
                "from_place": r["FIRST_TICKET_LOCATION"],
                "last_place": r["EFFECTIVE_PLACE"],
                "last_ticket_time": r["LAST_TICKET_TIME"],
                "last_ticket_dt": r["LAST_TICKET_DT"].isoformat(),
                "passengers": int(r["PASSENGERS_COUNT"]),
                "distance_km": round(float(r["DISTANCE_KM"]), 1),
                "duration_min": round(float(r["DURATION_MIN"]), 1),
                "arrival_dt": arrival.isoformat(),
                "mins_to_arrive": round(mins_to_arrive, 1),
                "lat": geo.get("lat"),
                "lng": geo.get("lng"),
            })

        def in_window(mins_max: float) -> tuple[int, int]:
            in_w = [b for b in buses if 0 <= b["mins_to_arrive"] <= mins_max]
            return len(in_w), sum(b["passengers"] for b in in_w)

        def by_corp_in_window(mins_max: float) -> list[dict]:
            counts = Counter(
                str(b["corporation"]).strip()
                for b in buses
                if 0 <= b["mins_to_arrive"] <= mins_max
            )
            return [{"corp": c, "buses": n} for c, n in counts.most_common()]

        w1, p1 = in_window(60)
        w2, p2 = in_window(120)
        w3, p3 = in_window(180)
        w4, p4 = in_window(240)
        w5, p5 = in_window(FORECAST_HORIZON_HOURS * 60)

        approach_traffic = get_approach_traffic()
        peak = find_peak_window(fc)
        bunching = detect_bunching(
            buses,
            ref_time=now,
            hours=FORECAST_HORIZON_HOURS,
            window_minutes=BUNCHING_WINDOW_MIN,
            threshold_buses=BUNCHING_THRESHOLD_BUSES,
        )
        is_stale = (now - snapshot_ts).total_seconds() / 60 > STALE_DATA_THRESHOLD_MIN

        with _LOCK:
            _STATE.update({
                "snapshot_ts": snapshot_ts.isoformat(),
                "filename": path.name,
                "refreshed_at": now.isoformat(),
                "buses": buses,
                "forecast": [
                    {
                        "hour": r["BUCKET_START"].isoformat(),
                        "buses": int(r["buses"]),
                        "passengers": int(r["passengers"]),
                        "city_buses_needed": int(r["city_buses_needed"]),
                    }
                    for _, r in fc.iterrows()
                ],
                "by_corp": [
                    {
                        "corporation": r["CORPORATION"],
                        "buses": int(r["buses"]),
                        "passengers": int(r["passengers"]),
                    }
                    for _, r in by_c.iterrows()
                ],
                "totals": {
                    "buses": len(buses),
                    "passengers": int(df["PASSENGERS_COUNT"].sum()),
                    "next_1h": w1, "passengers_1h": p1,
                    "next_2h": w2, "passengers_2h": p2,
                    "next_3h": w3, "passengers_3h": p3,
                    "next_4h": w4, "passengers_4h": p4,
                    "next_5h": w5, "passengers_5h": p5,
                    "by_corp_1h": by_corp_in_window(60),
                    "by_corp_2h": by_corp_in_window(120),
                    "by_corp_5h": by_corp_in_window(FORECAST_HORIZON_HOURS * 60),
                },
                "peak_window": peak,
                "bunching_alert": bunching,
                "approach_traffic": approach_traffic,
                "is_stale": is_stale,
                "error": None,
            })
        _LAST_FILENAME = path.name
        bunch_msg = f" BUNCHING: {bunching['buses']} buses in 15min" if bunching else ""
        print(f"[refresh] done: {len(buses)} buses, {w1} in 1h ({p1} pax), {w5} in 5h ({p5} pax){bunch_msg}")
    except Exception as e:
        print(f"[refresh] FAILED: {e}")
        with _LOCK:
            _STATE["error"] = str(e)


_scheduler = BackgroundScheduler(timezone=str(TZ_IST))


@asynccontextmanager
async def lifespan(app: FastAPI):
    refresh_pipeline()
    _scheduler.add_job(refresh_pipeline, "interval", minutes=5, id="refresh")
    _scheduler.start()
    yield
    _scheduler.shutdown(wait=False)


app = FastAPI(title="TN Bus Inflow Tracker", lifespan=lifespan)

# CORS: any *.netlify.app (covers prod + deploy previews) and any localhost port.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.netlify\.app|http://localhost:\d+",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/meta")
def meta():
    with _LOCK:
        return {
            "snapshot_ts": _STATE["snapshot_ts"],
            "filename": _STATE["filename"],
            "refreshed_at": _STATE["refreshed_at"],
            "totals": _STATE["totals"],
            "peak_window": _STATE["peak_window"],
            "bunching_alert": _STATE["bunching_alert"],
            "approach_traffic": _STATE["approach_traffic"],
            "is_stale": _STATE["is_stale"],
            "error": _STATE["error"],
        }


@app.get("/api/forecast")
def forecast():
    with _LOCK:
        return {"hours": _STATE["forecast"], "refreshed_at": _STATE["refreshed_at"]}


@app.get("/api/buses")
def buses():
    with _LOCK:
        return {"buses": _STATE["buses"], "refreshed_at": _STATE["refreshed_at"]}


@app.get("/api/by-corporation")
def by_corp():
    with _LOCK:
        return {"by_corp": _STATE["by_corp"], "refreshed_at": _STATE["refreshed_at"]}


@app.get("/api/cost")
def cost():
    return monthly_summary()


@app.post("/api/refresh")
def force_refresh():
    """Manual trigger for the pipeline (e.g., 'Refresh now' button)."""
    refresh_pipeline(force=True)
    with _LOCK:
        if _STATE["error"]:
            raise HTTPException(500, _STATE["error"])
        return {"ok": True, "refreshed_at": _STATE["refreshed_at"]}
