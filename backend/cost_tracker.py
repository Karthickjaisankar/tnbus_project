"""Track Google Maps API call counts -> CSV; estimate monthly cost.

NOTE on pricing accuracy:
  - Google charges in USD globally. In India, your bill arrives in INR at the
    daily exchange rate plus 18% GST (Goods & Services Tax).
  - Pricing tiers and free quotas change. Verify the constants below against:
      https://mapsplatform.google.com/pricing/
      https://console.cloud.google.com/billing
  - As of March 2025 Google moved from a single $200/month credit to per-API
    monthly free quotas. The values below are placeholder defaults — please
    confirm against your actual Cloud Billing dashboard.
"""
from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path

from .config import CACHE_DIR, TZ_IST

CSV_PATH = CACHE_DIR / "api_costs.csv"

# India-region Google Maps Platform free tiers (verified by user):
#   - Distance Matrix Advanced (Traffic ETA, Pro SKU): 35,000 requests/month
#   - Geocoding (Essentials):                          70,000 requests/month
# Per-1000 rates above the free tier — verify on your Cloud Billing dashboard.
PRICING = {
    "distance_matrix": {"rate_per_1000_usd": 5.00, "free_per_month": 35_000},
    "geocoding":       {"rate_per_1000_usd": 5.00, "free_per_month": 70_000},
}

USD_TO_INR = 84.0     # placeholder — update or pull from FX feed if you want INR figures
GST_RATE = 0.18       # India GST on Google Cloud invoices

HEADER = ["timestamp", "api", "elements_billed", "elements_cached", "trigger"]


def log_call(api: str, billed: int, cached: int, trigger: str = "auto") -> None:
    """Append one row per pipeline run, per API. Skips no-op rows."""
    if billed == 0 and cached == 0:
        return
    new_file = not CSV_PATH.exists()
    with CSV_PATH.open("a", newline="") as f:
        w = csv.writer(f)
        if new_file:
            w.writerow(HEADER)
        w.writerow([
            datetime.now(TZ_IST).isoformat(timespec="seconds"),
            api,
            int(billed),
            int(cached),
            trigger,
        ])


def monthly_summary() -> dict:
    """Aggregate the CSV for the current calendar month + cost estimate."""
    # now = datetime.now(TZ_IST)
    now = datetime.now(TZ_IST).replace(day=datetime.now(TZ_IST).day - 1, hour=21, minute=0, second=0)
    month = now.strftime("%Y-%m")
    by_api: dict[str, dict] = {}
    if CSV_PATH.exists():
        with CSV_PATH.open() as f:
            for row in csv.DictReader(f):
                if not row["timestamp"].startswith(month):
                    continue
                d = by_api.setdefault(row["api"], {"billed": 0, "cached": 0})
                d["billed"] += int(row["elements_billed"])
                d["cached"] += int(row["elements_cached"])

    apis = {}
    total_usd = 0.0
    for api, totals in by_api.items():
        cfg = PRICING.get(api, {"rate_per_1000_usd": 0, "free_per_month": 0})
        billable = max(0, totals["billed"] - cfg["free_per_month"])
        cost_usd = billable * cfg["rate_per_1000_usd"] / 1000.0
        total_usd += cost_usd
        apis[api] = {
            "billed_elements": totals["billed"],
            "cached_elements": totals["cached"],
            "free_quota": cfg["free_per_month"],
            "free_remaining": max(0, cfg["free_per_month"] - totals["billed"]),
            "billable_elements": billable,
            "rate_per_1000_usd": cfg["rate_per_1000_usd"],
            "estimated_cost_usd": round(cost_usd, 4),
        }

    cost_inr_with_gst = total_usd * USD_TO_INR * (1 + GST_RATE)
    return {
        "month": month,
        "apis": apis,
        "total_estimated_cost_usd": round(total_usd, 4),
        "total_estimated_cost_inr_with_gst": round(cost_inr_with_gst, 2),
        "fx_assumptions": {"usd_to_inr": USD_TO_INR, "gst_rate": GST_RATE},
        "csv_path": str(CSV_PATH),
        "warning": "Pricing constants are placeholders — verify against your Google Cloud Billing dashboard.",
    }
