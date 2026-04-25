"""Fetch the latest 'All corporation ticket tracking details' xlsx from Drive."""
import io
import re
import sys
from datetime import datetime
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

ROOT = Path(__file__).resolve().parent.parent
CREDS = ROOT / "credentials" / "tnbusestrackingproject-ee9d06f7469d.json"
DATA_DIR = ROOT / "data"
FOLDER_ID = "1dkxIIJhD1Y60mlEGRjF_-eSZPxaIrAOP"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# New format: "25-Apr-2026_09_12.xlsx"  (DD-MMM-YYYY_HH_MM)
# Old format: "All corporation ticket tracking details on 25-04-2026.xlsx" (DD-MM-YYYY)
RX_NEW = re.compile(r"(\d{2}-[A-Za-z]{3}-\d{4})_(\d{2})_(\d{2})")
RX_OLD = re.compile(r"(\d{2}-\d{2}-\d{4})")


def parse_snapshot_ts(name: str):
    """Return the snapshot datetime encoded in the filename, or None."""
    m = RX_NEW.search(name)
    if m:
        try:
            return datetime.strptime(f"{m.group(1)} {m.group(2)}:{m.group(3)}", "%d-%b-%Y %H:%M")
        except ValueError:
            pass
    m = RX_OLD.search(name)
    if m:
        try:
            return datetime.strptime(m.group(1), "%d-%m-%Y")
        except ValueError:
            pass
    return None


def main():
    creds = service_account.Credentials.from_service_account_file(CREDS, scopes=SCOPES)
    svc = build("drive", "v3", credentials=creds)

    resp = svc.files().list(
        q=f"'{FOLDER_ID}' in parents and trashed = false",
        fields="files(id, name, modifiedTime, mimeType, size)",
        pageSize=100,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()

    files = resp.get("files", [])
    print(f"Found {len(files)} file(s) in folder:")
    for f in files:
        print(f"  - {f['name']} (modified {f['modifiedTime']}, {f.get('size', '?')} bytes)")

    xlsx = [f for f in files if f["name"].lower().endswith(".xlsx")]
    if not xlsx:
        print("No .xlsx files found.", file=sys.stderr)
        sys.exit(1)

    def sort_key(f):
        d = parse_snapshot_ts(f["name"])
        return (d or datetime.min, f["modifiedTime"])

    latest = sorted(xlsx, key=sort_key)[-1]
    print(f"\nLatest pick: {latest['name']}")

    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / latest["name"]
    request = svc.files().get_media(fileId=latest["id"])
    with io.FileIO(out, "wb") as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
    print(f"Saved -> {out}")


if __name__ == "__main__":
    main()
