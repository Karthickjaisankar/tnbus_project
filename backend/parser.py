"""Load latest snapshot, clean it, apply exclusions, build datetime columns."""
from __future__ import annotations

import re
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

from .config import DATA_DIR, TZ_IST

RX_NEW = re.compile(r"(\d{2}-[A-Za-z]{3}-\d{4})_(\d{2})_(\d{2})")
RX_OLD = re.compile(r"(\d{2}-\d{2}-\d{4})")

EXCLUDE_LAST_PLACE = {"KILAMBAKKAM", "CHENNAI-KILAMBAKKAM-KCBT"}
EXCLUDE_FIRST_LOCATION = {"CHENNAI-KILAMBAKKAM-KCBT"}


def parse_snapshot_ts(name: str) -> datetime | None:
    """Pull the snapshot timestamp out of the filename, if present."""
    m = RX_NEW.search(name)
    if m:
        try:
            return datetime.strptime(
                f"{m.group(1)} {m.group(2)}:{m.group(3)}", "%d-%b-%Y %H:%M"
            ).replace(tzinfo=TZ_IST)
        except ValueError:
            pass
    m = RX_OLD.search(name)
    if m:
        try:
            return datetime.strptime(m.group(1), "%d-%m-%Y").replace(tzinfo=TZ_IST)
        except ValueError:
            pass
    return None


def find_latest_snapshot() -> Path:
    files = list(DATA_DIR.glob("*.xlsx"))
    if not files:
        raise FileNotFoundError(f"No xlsx in {DATA_DIR}")
    return max(files, key=lambda p: (parse_snapshot_ts(p.name) or datetime.min, p.stat().st_mtime))


def _to_dt(time_str: str, ref: datetime) -> datetime | None:
    """Combine an HH:MM:SS time-of-day with the snapshot date.

    Rule: if the time-of-day is later than the snapshot's time-of-day, the
    ticket was issued the previous calendar day (rolling 24h window).
    """
    try:
        t = datetime.strptime(time_str, "%H:%M:%S").time()
    except (ValueError, TypeError):
        return None
    candidate = datetime.combine(ref.date(), t, tzinfo=ref.tzinfo)
    if candidate > ref:
        candidate -= timedelta(days=1)
    return candidate


def load_snapshot(path: Path | None = None) -> tuple[pd.DataFrame, datetime]:
    """Return (cleaned dataframe of in-flight buses, snapshot timestamp)."""
    path = path or find_latest_snapshot()
    snapshot_ts = parse_snapshot_ts(path.name) or datetime.now(TZ_IST)

    df = pd.read_excel(path)
    df.columns = [c.strip() for c in df.columns]
    for c in df.select_dtypes(include="object").columns:
        df[c] = df[c].astype(str).str.strip()

    before = len(df)
    df = df[~df["LAST_TICKET_PLACE"].isin(EXCLUDE_LAST_PLACE)]
    df = df[~df["FIRST_TICKET_LOCATION"].isin(EXCLUDE_FIRST_LOCATION)]

    # Fallback: if LAST_TICKET_PLACE is empty/nan, use FIRST_TICKET_LOCATION
    df = df.copy()
    last = df["LAST_TICKET_PLACE"].replace({"": None, "nan": None})
    df["EFFECTIVE_PLACE"] = last.fillna(df["FIRST_TICKET_LOCATION"])
    df = df[df["EFFECTIVE_PLACE"].notna() & (df["EFFECTIVE_PLACE"] != "")]

    df["LAST_TICKET_DT"] = df["LAST_TICKET_TIME"].map(lambda t: _to_dt(t, snapshot_ts))
    df = df[df["LAST_TICKET_DT"].notna()].reset_index(drop=True)

    print(
        f"[parser] {path.name} snapshot={snapshot_ts.isoformat()} "
        f"rows: {before} -> {len(df)} after exclusions"
    )
    return df, snapshot_ts
