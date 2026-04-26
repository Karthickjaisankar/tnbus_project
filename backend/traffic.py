"""Chennai approach corridor traffic — a leading indicator.

Single Distance Matrix call: Guduvanchery -> Kilambakkam. Compare
duration_in_traffic to duration (free flow). Ratio tells us how congested
the approach is right now, regardless of how many MTC buses are inbound —
private vehicles + government buses + city buses all pile up on this stretch
during peak hours, and every inbound bus's ETA gets worse as a result.
"""
from __future__ import annotations

import requests

from .config import DESTINATION, GMAP_API_KEY
from .cost_tracker import log_call

DM_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
APPROACH_ORIGIN = "Guduvanchery, Tamil Nadu, India"


def _classify(ratio: float) -> str:
    if ratio < 1.2:
        return "clear"
    if ratio < 1.5:
        return "moderate"
    return "heavy"


def get_approach_traffic() -> dict | None:
    """Return None on any failure — caller should treat absence as 'unknown'."""
    params = {
        "origins": APPROACH_ORIGIN,
        "destinations": DESTINATION,
        "key": GMAP_API_KEY,
        "mode": "driving",
        "departure_time": "now",
    }
    try:
        r = requests.get(DM_URL, params=params, timeout=10)
        r.raise_for_status()
        payload = r.json()
        if payload.get("status") != "OK":
            print(f"[traffic] DM error: {payload.get('status')}")
            return None
        el = payload["rows"][0]["elements"][0]
        if el.get("status") != "OK":
            print(f"[traffic] element status: {el.get('status')}")
            return None
    except Exception as e:
        print(f"[traffic] failed: {e}")
        return None

    log_call("distance_matrix", billed=1, cached=0, trigger="approach")

    d_normal = el["duration"]["value"] / 60.0
    d_traffic = el.get("duration_in_traffic", el["duration"])["value"] / 60.0
    ratio = d_traffic / d_normal if d_normal > 0 else 1.0
    return {
        "origin": "Guduvanchery",
        "destination": "Kilambakkam",
        "distance_km": round(el["distance"]["value"] / 1000.0, 1),
        "duration_normal_min": round(d_normal, 1),
        "duration_traffic_min": round(d_traffic, 1),
        "ratio": round(ratio, 2),
        "status": _classify(ratio),
    }
