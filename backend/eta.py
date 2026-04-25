"""ETA from a place name to Kilambakkam, with SQLite caching.

Distance Matrix pricing: ~$5 / 1000 elements. We cache aggressively keyed on the
raw place string. TTL applies because traffic shifts during the day; structural
distance does not, but `duration_in_traffic` does.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from typing import Iterable

import requests

from .config import (
    CACHE_DB,
    DESTINATION,
    ETA_CACHE_TTL_MIN,
    GMAP_API_KEY,
    TZ_IST,
)
from .cost_tracker import log_call

DM_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
BATCH = 25  # Distance Matrix caps origins per request

SCHEMA = """
CREATE TABLE IF NOT EXISTS place_eta (
    place TEXT PRIMARY KEY,
    distance_km REAL,
    duration_min REAL,
    duration_in_traffic_min REAL,
    status TEXT,
    fetched_at TEXT
)
"""


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(CACHE_DB)
    c.execute(SCHEMA)
    return c


def _read_cache(places: Iterable[str]) -> dict[str, dict]:
    cutoff = (datetime.now(TZ_IST) - timedelta(minutes=ETA_CACHE_TTL_MIN)).isoformat()
    out: dict[str, dict] = {}
    with _conn() as c:
        for p in places:
            row = c.execute(
                "SELECT distance_km, duration_min, duration_in_traffic_min, status, fetched_at "
                "FROM place_eta WHERE place=? AND fetched_at>=?",
                (p, cutoff),
            ).fetchone()
            if row:
                out[p] = {
                    "distance_km": row[0],
                    "duration_min": row[1],
                    "duration_in_traffic_min": row[2],
                    "status": row[3],
                    "fetched_at": row[4],
                }
    return out


def _write_cache(rows: list[tuple]) -> None:
    with _conn() as c:
        c.executemany(
            "INSERT OR REPLACE INTO place_eta "
            "(place, distance_km, duration_min, duration_in_traffic_min, status, fetched_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            rows,
        )


def _call_distance_matrix(origins: list[str]) -> list[dict]:
    """One Distance Matrix call for up to BATCH origins -> single destination."""
    params = {
        "origins": "|".join(f"{o}, Tamil Nadu, India" for o in origins),
        "destinations": DESTINATION,
        "key": GMAP_API_KEY,
        "mode": "driving",
        "departure_time": "now",
    }
    r = requests.get(DM_URL, params=params, timeout=15)
    r.raise_for_status()
    payload = r.json()
    if payload.get("status") != "OK":
        raise RuntimeError(f"DM error: {payload.get('status')} {payload.get('error_message')}")
    out: list[dict] = []
    for el_row in payload["rows"]:
        el = el_row["elements"][0]
        if el.get("status") != "OK":
            out.append({"status": el.get("status")})
            continue
        out.append({
            "status": "OK",
            "distance_km": el["distance"]["value"] / 1000.0,
            "duration_min": el["duration"]["value"] / 60.0,
            "duration_in_traffic_min": el.get("duration_in_traffic", el["duration"])["value"] / 60.0,
        })
    return out


def get_etas(places: Iterable[str]) -> dict[str, dict]:
    """Return {place: {distance_km, duration_min, duration_in_traffic_min, status}}.

    Cached entries are reused; misses are batched against Distance Matrix.
    """
    unique = sorted({p for p in places if p})
    cached = _read_cache(unique)
    misses = [p for p in unique if p not in cached]
    print(f"[eta] {len(unique)} places: {len(cached)} cached, {len(misses)} to fetch")

    now_iso = datetime.now(TZ_IST).isoformat()
    fetched: dict[str, dict] = {}
    rows_to_write: list[tuple] = []

    for i in range(0, len(misses), BATCH):
        batch = misses[i:i + BATCH]
        try:
            results = _call_distance_matrix(batch)
        except Exception as e:
            print(f"[eta] batch failed ({batch[0]}..): {e}")
            for p in batch:
                fetched[p] = {"status": "ERROR"}
                rows_to_write.append((p, None, None, None, "ERROR", now_iso))
            continue
        for p, res in zip(batch, results):
            fetched[p] = res
            rows_to_write.append((
                p,
                res.get("distance_km"),
                res.get("duration_min"),
                res.get("duration_in_traffic_min"),
                res.get("status"),
                now_iso,
            ))

    if rows_to_write:
        _write_cache(rows_to_write)

    log_call("distance_matrix", billed=len(misses), cached=len(cached))
    return {**cached, **fetched}
