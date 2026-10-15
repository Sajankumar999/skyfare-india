"""Migrate all historical data from local SQLite (skyfare_live.db) to Supabase PostgreSQL.

Transfers all past fare observations, daily national indices, route weights,
and quarantine audit records from the local SQLite database to Supabase.
"""

import argparse
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

LOCAL_DB_PATH = Path(__file__).resolve().parent / "skyfare_live.db"


def migrate_to_supabase(database_url: str) -> None:
    if not LOCAL_DB_PATH.exists():
        print(f"[ERROR] Local SQLite database not found at {LOCAL_DB_PATH}")
        sys.exit(1)

    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("[ERROR] psycopg2-binary not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    print("=" * 70)
    print("SkyFare India — Historical Data Migration: SQLite -> Supabase")
    print("=" * 70)
    print(f"Source Database : {LOCAL_DB_PATH}")
    print(f"Target Database : {database_url[:20]}...{database_url[-20:]}")
    print("-" * 70)

    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect(LOCAL_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    # 2. Connect to Supabase PostgreSQL
    try:
        pg_conn = psycopg2.connect(database_url, sslmode="require")
        pg_conn.autocommit = False
    except Exception as exc:
        print(f"[CONNECTION ERROR] Could not connect to Supabase PostgreSQL:\n{exc}")
        sys.exit(1)

    pg_cur = pg_conn.cursor()

    try:
        # A. Migrate daily_indices
        print("\n[1/3] Migrating daily_indices...")
        indices = sqlite_conn.execute("SELECT * FROM daily_indices ORDER BY index_date").fetchall()
        print(f"  Found {len(indices)} historical daily indices in SQLite.")
        if indices:
            idx_cols = [
                "index_date", "laspeyres_index", "paasche_index", "fisher_ideal_index",
                "jevons_index", "tornqvist_index", "dod_change_pct", "average_live_fare",
                "observations", "routes", "methodology", "calculated_at"
            ]
            idx_rows = [
                tuple(row[col] if col in row.keys() else None for col in idx_cols)
                for row in indices
            ]
            execute_values(
                pg_cur,
                """
                INSERT INTO public.daily_indices (
                    index_date, laspeyres_index, paasche_index, fisher_ideal_index,
                    jevons_index, tornqvist_index, dod_change_pct, average_live_fare,
                    observations, routes, methodology, calculated_at
                ) VALUES %s
                ON CONFLICT (index_date) DO UPDATE SET
                    laspeyres_index = EXCLUDED.laspeyres_index,
                    paasche_index = EXCLUDED.paasche_index,
                    fisher_ideal_index = EXCLUDED.fisher_ideal_index,
                    jevons_index = EXCLUDED.jevons_index,
                    tornqvist_index = EXCLUDED.tornqvist_index,
                    dod_change_pct = EXCLUDED.dod_change_pct,
                    average_live_fare = EXCLUDED.average_live_fare,
                    observations = EXCLUDED.observations,
                    routes = EXCLUDED.routes,
                    methodology = EXCLUDED.methodology,
                    calculated_at = EXCLUDED.calculated_at;
                """,
                idx_rows
            )
            pg_conn.commit()
            print(f"  [OK] Successfully migrated {len(idx_rows)} daily indices to Supabase!")

        # B. Migrate route_weights
        print("\n[2/3] Migrating route_weights...")
        weights = sqlite_conn.execute("SELECT * FROM route_weights").fetchall()
        if weights:
            weight_rows = [
                (
                    row["route_code"],
                    row["base_quantity"],
                    row["current_quantity"],
                    row["data_source"],
                    row["effective_date"]
                )
                for row in weights
            ]
            execute_values(
                pg_cur,
                """
                INSERT INTO public.route_weights (
                    route_code, base_quantity, current_quantity, data_source, effective_date
                ) VALUES %s
                ON CONFLICT (route_code) DO NOTHING;
                """,
                weight_rows
            )
            pg_conn.commit()
            print(f"  [OK] Successfully seeded {len(weight_rows)} DGCA route weights to Supabase!")

        # C. Migrate fare_observations (in batches of 1,000 for efficiency)
        print("\n[3/3] Migrating fare_observations...")
        total_obs = sqlite_conn.execute("SELECT COUNT(*) FROM fare_observations").fetchone()[0]
        print(f"  Found {total_obs:,} total historical observations in SQLite.")

        batch_size = 1000
        offset = 0
        migrated_obs = 0

        while offset < total_obs:
            rows = sqlite_conn.execute(
                f"""
                SELECT airline, route_code, booking_horizon, base_fare, total_fare,
                       corridor_baseline_30d,
                       COALESCE(source_platform, 'google_flights') as source_platform,
                       observed_at
                FROM fare_observations
                LIMIT {batch_size} OFFSET {offset}
                """
            ).fetchall()

            if not rows:
                break

            obs_data = [
                (
                    row["airline"],
                    row["route_code"],
                    row["booking_horizon"],
                    float(row["base_fare"]),
                    float(row["total_fare"]),
                    float(row["corridor_baseline_30d"]) if row["corridor_baseline_30d"] else None,
                    row["source_platform"],
                    row["observed_at"]
                )
                for row in rows
            ]

            execute_values(
                pg_cur,
                """
                INSERT INTO public.fare_observations (
                    airline, route_code, booking_horizon, base_fare, total_fare,
                    corridor_baseline_30d, source_platform, observed_at
                ) VALUES %s;
                """,
                obs_data
            )
            pg_conn.commit()
            migrated_obs += len(obs_data)
            offset += batch_size
            pct = (migrated_obs / total_obs) * 100
            print(f"  -> Uploaded {migrated_obs:,} / {total_obs:,} rows ({pct:.1f}%)...")

        print(f"\n[MIGRATION COMPLETE] All {migrated_obs:,} observations successfully uploaded to Supabase!")
        print("=" * 70)

    except Exception as exc:
        pg_conn.rollback()
        print(f"\n[MIGRATION FAILED]: {exc}")
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_cur.close()
        pg_conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload local SQLite data to Supabase PostgreSQL")
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Supabase PostgreSQL connection string (defaults to DATABASE_URL in .env)",
    )
    args = parser.parse_args()

    db_url = args.url or os.getenv("DATABASE_URL")
    if not db_url:
        print("[ERROR] Please provide your Supabase connection string:")
        print("  python migrate_sqlite_to_supabase.py --url \"postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres\"")
        print("  or set DATABASE_URL in .env")
        sys.exit(1)

    migrate_to_supabase(db_url)
