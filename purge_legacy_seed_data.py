"""Purge legacy pre-epoch and hardcoded seed data after 45-day continuous collection.

Official Ingestion Epoch: 2026-09-24 (Regular twice-daily collection started).
Scheduled Transition Target: 2026-11-08 (T+45 days from epoch).
"""

import argparse
import os
import sqlite3
import sys
from datetime import date, datetime
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DATABASE_PATH = Path(__file__).resolve().parent / "skyfare_live.db"
EPOCH_DATE_STR = "2026-09-24"
TRANSITION_TARGET_STR = "2026-11-08"


def purge_pre_epoch_data(force: bool = False) -> None:
    today_str = date.today().isoformat()
    print("=" * 80)
    print("SkyFare India - 45-Day Legacy Data Transition & Purge Protocol")
    print("=" * 80)
    print(f"Ingestion Inception Epoch:  {EPOCH_DATE_STR} (Twice-daily live collection started)")
    print(f"Scheduled Transition Date:  {TRANSITION_TARGET_STR} (45 Days continuous collection)")
    print(f"Current System Date:        {today_str}")
    print("=" * 80 + "\n")

    if not DATABASE_PATH.exists():
        print(f"Error: Database not found at {DATABASE_PATH}")
        return

    with sqlite3.connect(DATABASE_PATH) as conn:
        cursor = conn.cursor()
        pre_count = cursor.execute(
            "SELECT COUNT(*) FROM fare_observations WHERE observed_at < ?",
            (f"{EPOCH_DATE_STR} 00:00:00",),
        ).fetchone()[0]

        post_count = cursor.execute(
            "SELECT COUNT(*) FROM fare_observations WHERE observed_at >= ?",
            (f"{EPOCH_DATE_STR} 00:00:00",),
        ).fetchone()[0]

    print(f"Database Census:")
    print(f"  - Pre-Epoch Legacy / Seed Observations (Prior to {EPOCH_DATE_STR}): {pre_count}")
    print(f"  - Post-Epoch Live Continuous Observations (Since {EPOCH_DATE_STR}):    {post_count}")
    print(f"  - Total Observations Currently in Database:                           {pre_count + post_count}\n")

    if not force and today_str < TRANSITION_TARGET_STR:
        days_remaining = (date.fromisoformat(TRANSITION_TARGET_STR) - date.today()).days
        print(f"[NOTICE] Continuous collection period in progress ({days_remaining} days remaining until {TRANSITION_TARGET_STR}).")
        print("   Pre-epoch data is currently retained as calibrated fallback to preserve chart continuity.")
        print("   To execute purge now regardless of date, run with --force flag:\n")
        print("      python purge_legacy_seed_data.py --force\n")
        return

    with sqlite3.connect(DATABASE_PATH) as conn:
        cursor = conn.cursor()

        if pre_count == 0:
            print("\n[OK] Database is already 100% clean! Zero pre-epoch records found.")
            return

        print(f"\nPurging {pre_count} pre-epoch records to leave ONLY pure live continuous data...")
        cursor.execute(
            "DELETE FROM fare_observations WHERE observed_at < ?",
            (f"{EPOCH_DATE_STR} 00:00:00",),
        )
        cursor.execute(
            "DELETE FROM daily_indices WHERE index_date < ?",
            (EPOCH_DATE_STR,),
        )
        cursor.execute(
            "DELETE FROM fare_quarantine WHERE quarantined_at < ?",
            (f"{EPOCH_DATE_STR} 00:00:00",),
        )
        conn.commit()

        remaining_count = cursor.execute("SELECT COUNT(*) FROM fare_observations").fetchone()[0]
        remaining_indices = cursor.execute("SELECT COUNT(*) FROM daily_indices").fetchone()[0]
        print(f"[OK] Successfully deleted {pre_count} legacy observation records.")
        print(f"     Remaining Real Observations in Database: {remaining_count}")
        print(f"     Remaining Real Daily Indices in Database: {remaining_indices}")

    # Recalculate Live National Price Index
    try:
        from main import calculate_live_index, persist_daily_index
        print("\nRecalculating official National Airfare Indices strictly from real observations...")
        live_index = calculate_live_index()
        if live_index.get("observations", 0) > 0:
            persist_daily_index(live_index)
            print(f"  [OK] Updated Today's Fisher Ideal Index: {live_index['fisher_ideal_index']}")
            print(f"       Observations: {live_index['observations']} | Methodology: {live_index['methodology']}")
    except Exception as exc:
        print(f"  Note: Live index recalculation: {exc}")

    print("\n" + "=" * 80)
    print("Transition complete! All graphs, matrices, and stats now show 100% real live data.")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Purge legacy pre-epoch observations after 45-day continuous collection.")
    parser.add_argument("--force", action="store_true", help="Force purge before 45-day transition date.")
    args = parser.parse_args()
    purge_pre_epoch_data(force=args.force)
