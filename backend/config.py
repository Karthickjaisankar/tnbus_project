"""Shared paths, constants, and env loading."""
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

# Cache freshness for traffic-aware ETA. Buses are hours away — minute-level
# precision isn't needed, and we want to keep API spend low.
ETA_CACHE_TTL_MIN = 60

_env = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}
GMAP_API_KEY = _env.get("GMAP_API", "").strip().strip('"')

CACHE_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
