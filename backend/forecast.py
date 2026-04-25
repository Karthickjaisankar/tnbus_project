"""Bucket buses into the next 10 hourly arrival bins."""
from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd

from .config import TZ_IST


def attach_arrival(df: pd.DataFrame, etas: dict[str, dict]) -> pd.DataFrame:
    """Add ETA + ARRIVAL_DT columns. Drops rows where ETA lookup failed."""
    df = df.copy()
    df["DURATION_MIN"] = df["EFFECTIVE_PLACE"].map(
        lambda p: etas.get(p, {}).get("duration_in_traffic_min")
    )
    df["DISTANCE_KM"] = df["EFFECTIVE_PLACE"].map(
        lambda p: etas.get(p, {}).get("distance_km")
    )
    df = df[df["DURATION_MIN"].notna()].copy()
    df["ARRIVAL_DT"] = df.apply(
        lambda r: r["LAST_TICKET_DT"] + timedelta(minutes=float(r["DURATION_MIN"])),
        axis=1,
    )
    return df


def hourly_forecast(
    df: pd.DataFrame, ref_time: datetime | None = None, hours: int = 10
) -> pd.DataFrame:
    """Hourly bins starting at ref_time (default: now IST, floored to hour).

    Buses whose ARRIVAL_DT lies before the first bin are reported as
    'already_arrived' (separate count returned via meta if needed).
    """
    ref = ref_time or datetime.now(TZ_IST)
    start = ref.replace(minute=0, second=0, microsecond=0)
    bins = [start + timedelta(hours=i) for i in range(hours + 1)]

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
    return out


def by_corporation(df: pd.DataFrame) -> pd.DataFrame:
    """Counts grouped by source corporation (district stand-in for v1)."""
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
