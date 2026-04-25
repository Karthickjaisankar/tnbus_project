"""Deeper look at PASSENGERS_COUNT and LAST_TICKET_PLACE distributions."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
path = sorted((ROOT / "data").glob("*.xlsx"))[-1]

df = pd.read_excel(path)
df.columns = [c.strip() for c in df.columns]
for c in df.select_dtypes(include="object").columns:
    df[c] = df[c].astype(str).str.strip()

print("=== PASSENGERS_COUNT distribution ===")
print(df["PASSENGERS_COUNT"].describe())
print("\nHistogram bins:")
print(df["PASSENGERS_COUNT"].value_counts(bins=10).sort_index())
print(f"\nRows with PASSENGERS_COUNT == 0: {(df['PASSENGERS_COUNT']==0).sum()} / {len(df)}")
print(f"Rows with PASSENGERS_COUNT > 0: {(df['PASSENGERS_COUNT']>0).sum()}")

print("\n=== Sample non-zero rows ===")
print(df[df["PASSENGERS_COUNT"] > 0].head(5).to_string())

print("\n=== Top 30 LAST_TICKET_PLACE values ===")
print(df["LAST_TICKET_PLACE"].value_counts().head(30).to_string())

print("\n=== LAST_TICKET_PLACE containing 'CHENNAI', 'KILAMB', 'TAMBARAM', 'GUINDY', 'THIRU' ===")
mask = df["LAST_TICKET_PLACE"].str.contains(
    "CHENNAI|KILAMB|TAMBARAM|GUINDY|THIRU|KCBT|CMBT|ADYAR|VELACHERY",
    case=False, na=False
)
print(f"Buses already at/near Chennai: {mask.sum()}")
print(df[mask]["LAST_TICKET_PLACE"].value_counts().head(20).to_string())

print("\n=== SERVICETO_PLACE variants (cleaned) ===")
print(df["SERVICETO_PLACE"].value_counts().to_string())

print("\n=== CORPORATION counts ===")
print(df["CORPORATION"].value_counts().to_string())

print("\n=== FIRST_TICKET_LOCATION top 20 ===")
print(df["FIRST_TICKET_LOCATION"].value_counts().head(20).to_string())

# Time format check
print("\n=== Sample LAST_TICKET_TIME values ===")
print(df["LAST_TICKET_TIME"].head(10).tolist())
print("\n=== Latest 5 LAST_TICKET_TIME values (sorted) ===")
print(sorted(df["LAST_TICKET_TIME"].tolist())[-5:])
