"""Bucketed arrival forecast + bunching / peak detection."""
from __future__ import annotations

import math
from datetime import datetime, timedelta

import pandas as pd

from .config import CITY_BUS_BUFFER_RATIO, CITY_BUS_CAPACITY, TZ_IST


def mtc_buses_required(passengers: int) -> int:
    """Minimum MTC city buses to staff for N passengers, with the operational
    buffer applied. base = ceil(passengers / capacity); recommended =
    ceil(base * BUFFER_RATIO). 10 base -> 12 with 20% buffer.
    """
    if passengers <= 0:
        return 0
    base = math.ceil(passengers / CITY_BUS_CAPACITY)
    return math.ceil(base * CITY_BUS_BUFFER_RATIO)


def attach_arrival(
    df: pd.DataFrame,
    etas: dict[str, dict],
    ref_time: datetime,
) -> pd.DataFrame:
    """Add ETA + ARRIVAL_DT columns. Drops rows where ETA lookup failed.

    ETA model: we treat each bus's LAST_TICKET_PLACE as its current position
    and compute ARRIVAL_DT = ref_time + duration_to_kilambakkam. This avoids
    the "Madurai bus arrived 4 hours ago" artifact you'd get from anchoring
    arrival to LAST_TICKET_DT — a long-distance bus that hasn't issued
    tickets in hours has a stale LAST_TICKET_DT, but its position (the place
    name) is still the best estimate of where it is.
    """
    df = df.copy()
    df["DURATION_MIN"] = df["EFFECTIVE_PLACE"].map(
        lambda p: etas.get(p, {}).get("duration_in_traffic_min")
    )
    df["DISTANCE_KM"] = df["EFFECTIVE_PLACE"].map(
        lambda p: etas.get(p, {}).get("distance_km")
    )
    df = df[df["DURATION_MIN"].notna()].copy()
    df["ARRIVAL_DT"] = df["DURATION_MIN"].apply(
        lambda d: ref_time + timedelta(minutes=float(d))
    )
    return df


def arrival_forecast(
    df: pd.DataFrame,
    ref_time: datetime | None = None,
    hours: int = 5,
    bucket_minutes: int = 30,
) -> pd.DataFrame:
    """Bucketed arrivals from ref_time forward.

    Returns DataFrame columns: BUCKET_START, buses, passengers, city_buses_needed.
    `city_buses_needed = ceil(passengers / CITY_BUS_CAPACITY)`.
    """
    ref = ref_time or datetime.now(TZ_IST)
    # Start at the NEXT bucket boundary so the chart only shows future hours.
    # E.g., at 09:30 with 60-min bins, the first bin is 10:00–11:00 (not 09:00).
    floor_minute = (ref.minute // bucket_minutes) * bucket_minutes
    floored = ref.replace(minute=floor_minute, second=0, microsecond=0)
    start = floored if floored == ref else floored + timedelta(minutes=bucket_minutes)
    n_buckets = int(hours * 60 / bucket_minutes)
    bins = [start + timedelta(minutes=i * bucket_minutes) for i in range(n_buckets + 1)]

    df = df.copy()
    df["ARRIVAL_DT"] = pd.to_datetime(df["ARRIVAL_DT"], utc=True).dt.tz_convert(TZ_IST)
    bins_pd = pd.to_datetime(pd.Series(bins), utc=True).dt.tz_convert(TZ_IST)
    df["BUCKET_IDX"] = pd.cut(
        df["ARRIVAL_DT"], bins=bins_pd, labels=False, right=False, include_lowest=True
    )

    in_window = df[df["BUCKET_IDX"].notna()].copy()
    in_window["BUCKET_IDX"] = in_window["BUCKET_IDX"].astype(int)
    in_window["BUCKET_START"] = in_window["BUCKET_IDX"].map(lambda i: bins[i])

    grouped = (
        in_window.groupby("BUCKET_START")
        .agg(buses=("WAYBILLNO", "count"), passengers=("PASSENGERS_COUNT", "sum"))
        .reset_index()
    )
    full = pd.DataFrame({"BUCKET_START": bins[:-1]})
    out = full.merge(grouped, on="BUCKET_START", how="left").fillna({"buses": 0, "passengers": 0})
    out["buses"] = out["buses"].astype(int)
    out["passengers"] = out["passengers"].astype(int)
    out["city_buses_needed"] = out["passengers"].map(mtc_buses_required)
    return out


def find_peak_window(forecast: pd.DataFrame) -> dict | None:
    """The single bucket carrying the most passengers in the forecast."""
    if forecast.empty or forecast["passengers"].sum() == 0:
        return None
    peak = forecast.loc[forecast["passengers"].idxmax()]
    return {
        "start": peak["BUCKET_START"].isoformat(),
        "buses": int(peak["buses"]),
        "passengers": int(peak["passengers"]),
        "city_buses_needed": mtc_buses_required(int(peak["passengers"])),
    }


def detect_bunching(
    buses: list[dict],
    ref_time: datetime,
    hours: int,
    window_minutes: int,
    threshold_buses: int,
) -> dict | None:
    """Return the worst sliding window if it crosses the threshold, else None.

    A "bunching" event = many buses arriving close together (in the same
    window_minutes span). MTC needs to know this so they can pre-stage extra
    city buses.
    """
    horizon_end_min = hours * 60
    items = sorted(
        [
            (datetime.fromisoformat(b["arrival_dt"]), b["passengers"])
            for b in buses
            if 0 <= b["mins_to_arrive"] <= horizon_end_min
        ],
        key=lambda x: x[0],
    )
    if not items:
        return None

    n = len(items)
    best = None
    for i in range(n):
        end = items[i][0] + timedelta(minutes=window_minutes)
        j = i
        pax = 0
        while j < n and items[j][0] < end:
            pax += items[j][1]
            j += 1
        count = j - i
        if best is None or count > best["buses"]:
            best = {
                "start": items[i][0].isoformat(),
                "end": end.isoformat(),
                "buses": count,
                "passengers": pax,
                "city_buses_needed": mtc_buses_required(pax),
            }
        if items[i][0] >= ref_time + timedelta(minutes=horizon_end_min):
            break

    return best if best and best["buses"] >= threshold_buses else None


def by_corporation(df: pd.DataFrame) -> pd.DataFrame:
    """Counts grouped by source corporation."""
    return (
        df.groupby("CORPORATION")
        .agg(buses=("WAYBILLNO", "count"), passengers=("PASSENGERS_COUNT", "sum"))
        .reset_index()
        .sort_values("buses", ascending=False)
    )


def already_arrived(df: pd.DataFrame, ref_time: datetime | None = None) -> int:
    ref = ref_time or datetime.now(TZ_IST)
    arrivals = pd.to_datetime(df["ARRIVAL_DT"], utc=True).dt.tz_convert(TZ_IST)
    return int((arrivals < ref).sum())
