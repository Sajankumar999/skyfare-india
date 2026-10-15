import unittest
from database import BASE_CORRIDOR_TARIFFS, get_corridor_baseline
from scrapling_fetcher import fetch_with_scrapling
from main import calculate_live_index


class TestScraplingAndBaselines(unittest.TestCase):
    def test_corridor_baselines(self):
        self.assertIn("DEL-BOM", BASE_CORRIDOR_TARIFFS)
        self.assertGreater(get_corridor_baseline("DEL-BOM"), 5000.0)
        self.assertEqual(get_corridor_baseline("DEL-BOM"), round(5400.0 * 1.12, 2))

    def test_calculate_live_index_not_dropped(self):
        result = calculate_live_index()
        print(f"\n  [TODAY'S NATIONAL AIRFARE INDEX]")
        print(f"    - Fisher Ideal Index: {result.get('fisher_ideal_index')}")
        print(f"    - Laspeyres Index: {result.get('laspeyres_index')}")
        print(f"    - Paasche Index: {result.get('paasche_index')}")
        print(f"    - Average Live Fare: ₹{result.get('average_live_fare')}")
        print(f"    - Total Observations: {result.get('observations')}")
        print(f"    - Corridors Represented: {result.get('routes')}/14")
        self.assertGreater(result["fisher_ideal_index"], 150.0, "Index should reflect actual market level ~180, not collapsed to 140")
        self.assertGreater(result["average_live_fare"], 8000.0)

    def test_scrapling_fetcher_execution(self):
        res = fetch_with_scrapling("BOM-GOI", "T+7")
        self.assertEqual(res["engine"], "scrapling")
        self.assertGreater(res["accepted"], 0)
        self.assertTrue(res["backup_replicated_to_main"])
        self.assertIn("consensus", res)
        if res["consensus"]:
            self.assertIn("consensus_avg_fare", res["consensus"])

    def test_compare_datasets(self):
        from scrapling_fetcher import compare_datasets, SCRAPLING_DATABASE_PATH, get_all_platform_consensus
        comp = compare_datasets()
        self.assertTrue(SCRAPLING_DATABASE_PATH.exists())
        self.assertIn("primary_database", comp)
        self.assertIn("scrapling_database", comp)
        self.assertIn("platform_breakdown", comp)
        self.assertIn("comparison_metrics", comp)
        self.assertIn("corridors_comparison", comp)
        self.assertIn("parity_status", comp["comparison_metrics"])

        all_consensus = get_all_platform_consensus()
        self.assertIsInstance(all_consensus, list)

    def test_check_todays_shift_collection(self):
        import sqlite3
        from datetime import date
        today_iso = date.today().isoformat()
        print(f"\n================ AUDITING DATA FOR TODAY ({today_iso}) ================")
        
        # 1. Primary Database (SerpApi & Failover)
        with sqlite3.connect("skyfare_live.db") as conn:
            conn.row_factory = sqlite3.Row
            total_today = conn.execute(
                "SELECT COUNT(*) FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()[0]
            
            routes_covered = conn.execute(
                "SELECT COUNT(DISTINCT route_code) FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()[0]
            
            horizons = [r[0] for r in conn.execute(
                "SELECT DISTINCT booking_horizon FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchall()]
            
            recent_rows = conn.execute(
                "SELECT MAX(observed_at) AS latest_time, MIN(observed_at) AS earliest_time, AVG(total_fare) AS avg_fare FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()
            
            print(f"  [PRIMARY DB (skyfare_live.db)]")
            print(f"    - Quotes Today: {total_today}")
            print(f"    - Corridors Covered: {routes_covered}/14")
            print(f"    - Horizons: {horizons}")
            print(f"    - Time Range: {recent_rows['earliest_time']} to {recent_rows['latest_time']}")
            print(f"    - Average Fare: ₹{round(float(recent_rows['avg_fare'] or 0), 2)}")

        # 2. Scrapling Dedicated Database
        with sqlite3.connect("skyfare_scrapling.db") as s_conn:
            s_conn.row_factory = sqlite3.Row
            s_total_today = s_conn.execute(
                "SELECT COUNT(*) FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()[0]
            
            s_routes = s_conn.execute(
                "SELECT COUNT(DISTINCT route_code) FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()[0]
            
            s_horizons = [r[0] for r in s_conn.execute(
                "SELECT DISTINCT booking_horizon FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchall()]

            platforms = s_conn.execute(
                "SELECT source_platform, COUNT(*) AS count, AVG(total_fare) AS avg_fare FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ? GROUP BY source_platform",
                (today_iso,)
            ).fetchall()
            
            s_recent = s_conn.execute(
                "SELECT MAX(observed_at) AS latest_time, MIN(observed_at) AS earliest_time, AVG(total_fare) AS avg_fare FROM fare_observations WHERE date(observed_at) = date('now', 'localtime') OR date(observed_at) = ?",
                (today_iso,)
            ).fetchone()
            
            print(f"\n  [SCRAPLING DB (skyfare_scrapling.db)]")
            print(f"    - Quotes Today: {s_total_today}")
            print(f"    - Corridors Covered: {s_routes}/14")
            print(f"    - Horizons: {s_horizons}")
            print(f"    - Time Range: {s_recent['earliest_time']} to {s_recent['latest_time']}")
            print(f"    - Average Fare: ₹{round(float(s_recent['avg_fare'] or 0), 2)}")
            for p in platforms:
                print(f"      * Platform '{p['source_platform']}': {p['count']} quotes, Avg ₹{round(float(p['avg_fare'] or 0), 2)}")
        print("========================================================================\n")


if __name__ == "__main__":
    unittest.main()
