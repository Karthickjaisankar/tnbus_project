"""FastAPI service. Pipeline runs every 5 min in background; endpoints serve cache."""
from __future__ import annotations

import os
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import TZ_IST
from .cost_tracker import monthly_summary
from .drive_sync import sync_latest
from .eta import get_etas
from .forecast import attach_arrival, by_corporation, hourly_forecast
from .geocode import get_geocodes
from .parser import load_snapshot

# In-memory state, refreshed on schedule
_STATE: dict[str, Any] = {
    "snapshot_ts": None,
    "filename": None,
    "refreshed_at": None,
    "buses": [],            # list of dicts (one per in-flight bus)
    "forecast": [],         # list of {hour, buses, passengers}
    "by_corp": [],
    "totals": {"buses": 0, "passengers": 0, "next_1h": 0, "next_3h": 0},
    "error": None,
}
_LOCK = threading.Lock()


def refresh_pipeline() -> None:
    """Pull -> parse -> ETA -> geocode -> bucket. Mutates _STATE atomically."""
    print(f"[refresh] starting at {datetime.now(TZ_IST).isoformat(timespec='seconds')}")
    try:
        path = sync_latest()
        if path is None:
            raise RuntimeError("no source file in Drive")

        df, snapshot_ts = load_snapshot(path)
        places = df["EFFECTIVE_PLACE"].unique().tolist()
        etas = get_etas(places)
        geos = get_geocodes(places)
        df = attach_arrival(df, etas)

        # TEST ONLY: Shift all dates forward by 1 day to match "today"
        df["ARRIVAL_DT"] = df["ARRIVAL_DT"] + timedelta(days=1)
        
        # For testing: use snapshot time + 12 hours (simulates buses being current)
        # For production: use datetime.now(TZ_IST)
        now = snapshot_ts + timedelta(hours=12)
        fc = hourly_forecast(df, ref_time=now, hours=5)
        by_c = by_corporation(df)

        # Per-bus payload for map + table
        buses = []
        for _, r in df.iterrows():
            geo = geos.get(r["EFFECTIVE_PLACE"], {})
            arrival = r["ARRIVAL_DT"]
            mins_to_arrive = (arrival - now).total_seconds() / 60.0
            buses.append({
                "waybill": r["WAYBILLNO"],
                "vehicle": r["VEHICLE_NO"],
                "corporation": r["CORPORATION"],
                "depot": r["DEPOT"],
                "from_place": r["SERVICE_FROMPLACE"],
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

        w1, p1 = in_window(60)
        w2, p2 = in_window(120)
        w3, p3 = in_window(180)
        w4, p4 = in_window(240)
        w5, p5 = in_window(300)

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
                },
                "error": None,
            })
        print(f"[refresh] done: {len(buses)} buses, {w1} arriving in 1h carrying {p1} pax")
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

# CORS configuration - allow localhost for dev, and deployed frontend for prod
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
    refresh_pipeline()
    with _LOCK:
        if _STATE["error"]:
            raise HTTPException(500, _STATE["error"])
        return {"ok": True, "refreshed_at": _STATE["refreshed_at"]}
