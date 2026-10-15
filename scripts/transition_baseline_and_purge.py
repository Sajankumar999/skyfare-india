"""
Script to:
1. Purge pre-epoch data (< 2026-09-24) from skyfare_live.db
2. Test empirical baseline calculation for 14 corridors
"""
import sqlite3
from pathlib import Path

DB_PATH = Path("skyfare_live.db")

def run():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Purge legacy observations
    cursor.execute("SELECT COUNT(*) FROM fare_observations WHERE observed_at < '2026-09-24 00:00:00'")
    obs_before = cursor.fetchone()[0]
    cursor.execute("DELETE FROM fare_observations WHERE observed_at < '2026-09-24 00:00:00'")

    # 2. Purge legacy quarantine
    cursor.execute("DELETE FROM fare_quarantine WHERE quarantined_at < '2026-09-24 00:00:00'")

    # 3. Purge legacy daily indices
    cursor.execute("SELECT COUNT(*) FROM daily_indices WHERE index_date < '2026-09-24'")
    ind_before = cursor.fetchone()[0]
    cursor.execute("DELETE FROM daily_indices WHERE index_date < '2026-09-24'")

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM fare_observations")
    total_obs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM daily_indices")
    total_ind = cursor.fetchone()[0]

    print(f"Purged {obs_before} pre-epoch observations and {ind_before} pre-epoch daily indices.")
    print(f"Remaining: {total_obs} empirical observations, {total_ind} empirical daily indices.")

    # 4. Test corridor baseline calculation
    query = """
    WITH latest_dates AS (
        SELECT route_code, MAX(observed_at) AS max_observed
        FROM fare_observations
        WHERE total_fare > 0
        GROUP BY route_code
    ),
    recent_fares AS (
        SELECT fo.route_code, AVG(fo.total_fare) AS current_fare
        FROM fare_observations fo
        JOIN latest_dates ld ON fo.route_code = ld.route_code
                            AND DATE(fo.observed_at) = DATE(ld.max_observed)
        WHERE fo.total_fare > 0
        GROUP BY fo.route_code
    ),
    baseline_fares AS (
        SELECT fo.route_code, AVG(fo.total_fare) AS baseline_fare, COUNT(*) AS count
        FROM fare_observations fo
        WHERE fo.total_fare > 0
        GROUP BY fo.route_code
    )
    SELECT
        b.route_code,
        ROUND(r.current_fare, 2) AS current_fare,
        ROUND(b.baseline_fare, 2) AS baseline_fare,
        ROUND((r.current_fare - b.baseline_fare) / b.baseline_fare * 100, 2) AS change_pct,
        b.count
    FROM baseline_fares b
    JOIN recent_fares r ON b.route_code = r.route_code
    ORDER BY b.route_code
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    print("\nCorridor Empirical Metrics:")
    print(f"{'Corridor':<10} {'Current Fare':<14} {'Baseline Fare':<14} {'Change %':<10} {'Quotes'}")
    print("-" * 60)
    for row in rows:
        print(f"{row[0]:<10} Rs. {row[1]:<10} Rs. {row[2]:<10} {row[3]:+6.2f}%    {row[4]}")

    conn.close()

if __name__ == "__main__":
    run()
