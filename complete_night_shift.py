"""Complete tonight's interrupted night shift ingestion across all remaining corridors.

Targets:
1. CCU-DEL (T+30, T+45)
2. BOM-BLR, BLR-BOM, DEL-HYD, HYD-DEL, MAA-DEL, DEL-MAA, CCU-BOM, BOM-GOI (T+1 to T+45)
Recalculates and persists official National Airfare Index upon completion.
"""

import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

# Force UTF-8 encoding
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fetch_real_data import fetch_real_flight, get_corridor_key_info
from scrapling_fetcher import fetch_with_scrapling
from main import calculate_live_index, persist_daily_index

LOCK_FILE = Path(__file__).resolve().parent / ".ingestion.lock"

# Tasks to finish tonight's shift
TARGET_PLAN = [
    ("CCU-DEL", ("T+30", "T+45")),
    ("BOM-BLR", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("BLR-BOM", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("DEL-HYD", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("HYD-DEL", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("MAA-DEL", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("DEL-MAA", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("CCU-BOM", ("T+1", "T+7", "T+15", "T+30", "T+45")),
    ("BOM-GOI", ("T+1", "T+7", "T+15", "T+30", "T+45")),
]

def outbound_date_for_horizon(horizon: str) -> str:
    days = int(horizon.removeprefix("T+"))
    return (date.today() + timedelta(days=days)).isoformat()

def main():
    print("=" * 80)
    print("SkyFare India - Resuming & Completing Interrupted Night Shift Ingestion")
    print("=" * 80)
    
    # Remove stale lock if present
    if LOCK_FILE.exists():
        try:
            LOCK_FILE.unlink(missing_ok=True)
            print("  [LOCK CLEARED] Successfully removed previous stale ingestion lock.")
        except Exception as e:
            print(f"  [LOCK NOTICE] {e}")

    # Write new active lock
    lock_data = {
        "pid": os.getpid(),
        "timestamp": time.time(),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    LOCK_FILE.write_text(json.dumps(lock_data, indent=2), encoding="utf-8")

    total_tasks = sum(len(horizons) for _, horizons in TARGET_PLAN)
    print(f"Total Corridor Tasks Remaining: {len(TARGET_PLAN)} corridors | {total_tasks} horizon requests")
    print("=" * 80 + "\n")

    summary = {}
    counter = 0

    try:
        for route, horizons in TARGET_PLAN:
            origin, destination = route.split("-", maxsplit=1)
            info = get_corridor_key_info(route)
            owner = f"{info['member']} ({info['key_slot']})" if info else "Global Pool"
            print(f"\n--- Ingesting Corridor {route} (Assigned: {owner}) ---")

            route_summary = summary.setdefault(route, {"accepted": 0, "quarantined": 0})

            for horizon in horizons:
                counter += 1
                outbound_date = outbound_date_for_horizon(horizon)
                os.environ["SKYFARE_LIVE_ORIGIN"] = origin
                os.environ["SKYFARE_LIVE_DESTINATION"] = destination
                os.environ["SKYFARE_LIVE_OUTBOUND_DATE"] = outbound_date

                print(f"  [{counter:2d}/{total_tasks}] {route} @ {horizon} ({outbound_date})...")

                # 1. SerpApi Collection
                try:
                    res_serp = fetch_real_flight()
                    route_summary["accepted"] += res_serp.get("accepted", 0)
                    route_summary["quarantined"] += res_serp.get("quarantined", 0)
                except Exception as err:
                    print(f"     [SERPAPI WARN]: {err}")

                # 2. Scrapling Stealth Collection
                try:
                    res_scrapling = fetch_with_scrapling(route, horizon, outbound_date)
                    route_summary["accepted"] += res_scrapling.get("accepted", 0)
                    route_summary["quarantined"] += res_scrapling.get("quarantined", 0)
                except Exception as s_err:
                    print(f"     [SCRAPLING WARN]: {s_err}")

                time.sleep(1.2)

        print("\n" + "=" * 80)
        print("Resumption Batch Summary:")
        total_acc = sum(v["accepted"] for v in summary.values())
        total_quar = sum(v["quarantined"] for v in summary.values())
        for r, stats in summary.items():
            print(f"  {r:7s}: Accepted = {stats['accepted']}, Quarantined = {stats['quarantined']}")
        print(f"\nTotal Newly Ingested: {total_acc} accepted | {total_quar} quarantined")
        print("=" * 80)

        # Recalculate and persist live index
        print("\nRecalculating National Airfare Index from all live observations...")
        live_index = calculate_live_index()
        if live_index.get("observations", 0) > 0:
            persist_daily_index(live_index)
            print("  [INDEX UPDATED]")
            print(f"  - Fisher Ideal Index: {live_index['fisher_ideal_index']}")
            print(f"  - Laspeyres Index:    {live_index['laspeyres_index']}")
            print(f"  - Paasche Index:      {live_index['paasche_index']}")
            print(f"  - Total Observations: {live_index['observations']}")
            print(f"  - Corridors Active:   {live_index['routes']} / 14")
            print(f"  - Average Fare:       ₹{live_index['average_live_fare']}")
            print("=" * 80)

    finally:
        LOCK_FILE.unlink(missing_ok=True)
        print("\n[LOCK RELEASED] Ingestion lock cleanly removed.")

if __name__ == "__main__":
    main()
