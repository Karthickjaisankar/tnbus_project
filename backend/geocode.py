"""Geocode TN place names -> lat/long, cached forever in SQLite.

Places do not move, so we never invalidate. ~$1.20 one-time cost for the
241 unique places in the current snapshot.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Iterable

import requests

from .config import CACHE_DB, GMAP_API_KEY, TZ_IST
from .cost_tracker import log_call

GEO_URL = "https://maps.googleapis.com/maps/api/geocode/json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS place_geo (
    place TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    formatted TEXT,
    status TEXT,
    fetched_at TEXT
)
"""


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(CACHE_DB)
    c.execute(SCHEMA)
    return c


def _read_cache(places: Iterable[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    with _conn() as c:
        for p in places:
            row = c.execute(
                "SELECT lat, lng, formatted, status FROM place_geo WHERE place=?",
                (p,),
            ).fetchone()
            if row:
                out[p] = {"lat": row[0], "lng": row[1], "formatted": row[2], "status": row[3]}
    return out


def _write_cache(rows: list[tuple]) -> None:
    with _conn() as c:
        c.executemany(
            "INSERT OR REPLACE INTO place_geo "
            "(place, lat, lng, formatted, status, fetched_at) VALUES (?, ?, ?, ?, ?, ?)",
            rows,
        )


def _geocode_one(place: str) -> dict:
    params = {
        "address": f"{place}, Tamil Nadu, India",
        "key": GMAP_API_KEY,
        "region": "in",
    }
    r = requests.get(GEO_URL, params=params, timeout=10)
    r.raise_for_status()
    payload = r.json()
    if payload.get("status") != "OK" or not payload.get("results"):
        return {"status": payload.get("status", "ERROR")}
    res = payload["results"][0]
    loc = res["geometry"]["location"]
    return {
        "status": "OK",
        "lat": loc["lat"],
        "lng": loc["lng"],
        "formatted": res.get("formatted_address"),
    }


def get_geocodes(places: Iterable[str]) -> dict[str, dict]:
    """Return {place: {lat, lng, formatted, status}}, hitting cache first."""
    unique = sorted({p for p in places if p})
    cached = _read_cache(unique)
    misses = [p for p in unique if p not in cached]
    print(f"[geocode] {len(unique)} places: {len(cached)} cached, {len(misses)} to fetch")

    now_iso = datetime.now(TZ_IST).isoformat()
    fetched: dict[str, dict] = {}
    rows_to_write: list[tuple] = []

    for p in misses:
        try:
            res = _geocode_one(p)
        except Exception as e:
            print(f"[geocode] {p!r} failed: {e}")
            res = {"status": "ERROR"}
        fetched[p] = res
        rows_to_write.append((
            p, res.get("lat"), res.get("lng"), res.get("formatted"),
            res.get("status"), now_iso,
        ))

    if rows_to_write:
        _write_cache(rows_to_write)

    log_call("geocoding", billed=len(misses), cached=len(cached))
    return {**cached, **fetched}
