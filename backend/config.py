"""Shared paths, constants, and env loading."""
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent
CREDS_DIR = ROOT / "credentials"
SERVICE_ACCOUNT_JSON = CREDS_DIR / "tnbusestrackingproject-ee9d06f7469d.json"
ENV_PATH = CREDS_DIR / ".env"
DATA_DIR = ROOT / "data"
CACHE_DIR = ROOT / "cache"
CACHE_DB = CACHE_DIR / "distances.sqlite"

DRIVE_FOLDER_ID = "1dkxIIJhD1Y60mlEGRjF_-eSZPxaIrAOP"
DESTINATION = "Kilambakkam Bus Terminus, Chennai, Tamil Nadu, India"

TZ_IST = ZoneInfo("Asia/Kolkata")

# Force-refresh ETAs on every file change. The pipeline only runs when a new
# xlsx arrives in Drive (file-change gating in app.py), so API calls happen
# at the same cadence as uploads — currently every 30 min.
ETA_CACHE_TTL_MIN = 0

_env = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}
# Local: from credentials/.env. Deployed (Railway/etc.): from real env vars.
GMAP_API_KEY = (_env.get("GMAP_API") or os.getenv("GMAP_API") or "").strip().strip('"')

# Handle Google credentials (local file or Railway environment variable)
if os.getenv("GOOGLE_CREDENTIALS"):
    # Railway: load from environment variable
    creds_json = json.loads(os.getenv("GOOGLE_CREDENTIALS"))
    # Write to temp location for google-auth to read
    SERVICE_ACCOUNT_JSON.parent.mkdir(exist_ok=True)
    with open(SERVICE_ACCOUNT_JSON, "w") as f:
        json.dump(creds_json, f)
CACHE_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
