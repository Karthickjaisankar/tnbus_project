"""Inspect the downloaded xlsx — sheets, columns, dtypes, samples, basic stats."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

xlsx_files = sorted(DATA.glob("*.xlsx"))
if not xlsx_files:
    raise SystemExit("No xlsx in data/")

path = xlsx_files[-1]
print(f"File: {path.name}\n")

xl = pd.ExcelFile(path)
print(f"Sheets: {xl.sheet_names}\n")

for sheet in xl.sheet_names:
    df = pd.read_excel(path, sheet_name=sheet)
    print(f"=== Sheet: {sheet} ===")
    print(f"Shape: {df.shape}")
    print(f"\nColumns + dtypes:")
    for c in df.columns:
        print(f"  {c!r:40s} {df[c].dtype}")
    print(f"\nFirst 5 rows:")
    print(df.head().to_string())
    print(f"\nLast 3 rows:")
    print(df.tail(3).to_string())
    print(f"\nNull counts:")
    print(df.isna().sum().to_string())

    # Quick look at unique values for low-cardinality columns
    print(f"\nUnique-value counts per column (showing <=20):")
    for c in df.columns:
        n = df[c].nunique(dropna=True)
        if n <= 20:
            vals = df[c].dropna().unique().tolist()
            print(f"  {c!r}: {n} -> {vals}")
        else:
            print(f"  {c!r}: {n} (high cardinality)")
    print()
