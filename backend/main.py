"""Run the full pipeline once and print the forecast (CLI sanity check)."""
from datetime import datetime

from .config import TZ_IST
from .eta import get_etas
from .forecast import attach_arrival, already_arrived, by_corporation, hourly_forecast
from .parser import load_snapshot


def main():
    df, snapshot_ts = load_snapshot()
    etas = get_etas(df["LAST_TICKET_PLACE"].unique().tolist())
    df = attach_arrival(df, etas)

    # now = datetime.now(TZ_IST)
    now = datetime.now(TZ_IST).replace(day=datetime.now(TZ_IST).day - 1, hour=21, minute=0, second=0)
    fc = hourly_forecast(df, ref_time=now, hours=10)
    print(f"\nReference time (IST): {now.isoformat(timespec='minutes')}")
    print(f"Snapshot timestamp:   {snapshot_ts.isoformat(timespec='minutes')}")
    print(f"Buses with valid ETA: {len(df)}")
    print(f"Already arrived (before ref):  {already_arrived(df, now)}")
    print(f"Buses missing ETA (dropped):   - see [eta] line above\n")

    print("=== Hourly arrivals (next 10h) ===")
    print(f"{'Hour':<22s} {'Buses':>7s} {'Passengers':>12s}")
    for _, r in fc.iterrows():
        print(f"{r['BUCKET_START'].strftime('%a %d %b %H:%M'):<22s} {r['buses']:>7d} {r['passengers']:>12d}")
    print(f"{'TOTAL':<22s} {fc['buses'].sum():>7d} {fc['passengers'].sum():>12d}")

    print("\n=== By corporation (in-flight buses, full set) ===")
    print(by_corporation(df).to_string(index=False))


if __name__ == "__main__":
    main()
