"""Pull the latest snapshot xlsx from Drive into data/."""
from __future__ import annotations

import io
from datetime import datetime
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from .config import DATA_DIR, DRIVE_FOLDER_ID, SERVICE_ACCOUNT_JSON
from .parser import parse_snapshot_ts

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def _drive():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_JSON, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def sync_latest() -> Path | None:
    svc = _drive()
    resp = svc.files().list(
        q=f"'{DRIVE_FOLDER_ID}' in parents and trashed = false",
        fields="files(id, name, modifiedTime)",
        pageSize=100,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()
    xlsx = [f for f in resp.get("files", []) if f["name"].lower().endswith(".xlsx")]
    if not xlsx:
        print("[drive_sync] no xlsx in folder")
        return None

    latest = max(
        xlsx,
        key=lambda f: (parse_snapshot_ts(f["name"]) or datetime.min, f["modifiedTime"]),
    )
    out = DATA_DIR / latest["name"]
    if out.exists():
        print(f"[drive_sync] up-to-date: {latest['name']}")
        return out

    request = svc.files().get_media(fileId=latest["id"])
    with io.FileIO(out, "wb") as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
    print(f"[drive_sync] downloaded {latest['name']}")
    return out
