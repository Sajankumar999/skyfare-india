import gc
import sqlite3
import json
import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from index_engine import (
    calculate_fisher_ideal_index,
    calculate_laspeyres_index,
    calculate_paasche_index,
    apply_locf_to_series,
    impute_missing_cells_locf,
)
from scraper import FareQuote, JsonFixtureAdapter, persist_quotes, validate_quote
from database import init_db
import main


class DataQualityTests(unittest.TestCase):
    def test_invalid_quote_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            validate_quote(FareQuote("IndiGo", "DEL-BOM", "T+2", 8000, 9000))

    def test_duplicate_and_invalid_quotes_are_quarantined(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "quality.db"
            with patch("database.DATABASE_PATH", database_path), patch(
                "scraper.DATABASE_PATH", database_path
            ):
                result = persist_quotes(
                    [
                        FareQuote("IndiGo", "DEL-BOM", "T+1", 8000, 9000),
                        FareQuote("IndiGo", "DEL-BOM", "T+1", 8000, 9000),
                        FareQuote("IndiGo", "DEL-BOM", "T+2", 8000, 9000),
                    ]
                )

                self.assertEqual(result, {"accepted": 1, "quarantined": 2})
                with closing(sqlite3.connect(database_path)) as connection:
                    self.assertEqual(
                        connection.execute(
                            "SELECT COUNT(*) FROM fare_observations"
                        ).fetchone()[0],
                        1,
                    )
                    self.assertEqual(
                        connection.execute(
                            "SELECT COUNT(*) FROM fare_quarantine"
                        ).fetchone()[0],
                        2,
                    )

    def test_fisher_index_is_geometric_mean(self) -> None:
        laspeyres = calculate_laspeyres_index([120, 90], [100, 100], [1, 1])
        paasche = calculate_paasche_index([120, 90], [100, 100], [2, 1])
        fisher = calculate_fisher_ideal_index(laspeyres, paasche)
        self.assertAlmostEqual(fisher, (laspeyres * paasche) ** 0.5)

    def test_json_fixture_adapter_normalizes_quotes(self) -> None:
        with TemporaryDirectory() as directory:
            fixture_path = Path(directory) / "quotes.json"
            fixture_path.write_text(
                json.dumps(
                    [
                        {
                            "airline": "IndiGo",
                            "route_code": "DEL-BOM",
                            "booking_horizon": "T+15",
                            "base_fare": 7000,
                            "total_fare": 7800,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            quotes = list(JsonFixtureAdapter(fixture_path).fetch_quotes())
            self.assertEqual(len(quotes), 1)
            self.assertEqual(quotes[0].booking_horizon, "T+15")
            self.assertEqual(quotes[0].total_fare, 7800)

    def test_database_bootstrap_creates_index_tables(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "schema.db"
            with patch("database.DATABASE_PATH", database_path):
                init_db()
                with closing(sqlite3.connect(database_path)) as connection:
                    tables = {
                        row[0]
                        for row in connection.execute(
                            "SELECT name FROM sqlite_master WHERE type = 'table'"
                        ).fetchall()
                    }
                self.assertTrue({"route_weights", "daily_indices"}.issubset(tables))

    def test_route_analytics_aggregates_live_quotes(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "analytics.db"
            with patch("database.DATABASE_PATH", database_path), patch(
                "scraper.DATABASE_PATH", database_path
            ), patch("main.DATABASE_PATH", database_path):
                persist_quotes(
                    [
                        FareQuote("IndiGo", "DEL-BOM", "T+1", 8000, 10000, 9000),
                        FareQuote("IndiGo", "DEL-BOM", "T+7", 7000, 7500, 7200),
                    ]
                )
                with closing(sqlite3.connect(database_path)) as conn:
                    conn.execute(
                        "INSERT INTO fare_observations (airline, route_code, booking_horizon, base_fare, total_fare, observed_at) VALUES (?, ?, ?, ?, ?, ?)",
                        ("IndiGo", "DEL-BOM", "T+1", 6000, 7000, "2026-09-24 10:00:00")
                    )
                    conn.commit()
                rows = main.get_route_analytics_rows()
                self.assertEqual(len(rows), 2)
                self.assertEqual(rows[0]["route_code"], "DEL-BOM")
                self.assertGreater(rows[0]["change_pct"], 0)

    def test_health_reports_database_connection(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "health.db"
            with patch("database.DATABASE_PATH", database_path), patch(
                "main.DATABASE_PATH", database_path
            ):
                init_db()
                health = main.get_health()
                self.assertEqual(health["status"], "ok")
                self.assertEqual(health["database"], "connected")
                self.assertEqual(health["observations"], 0)
                self.assertIn("timestamp", health)

    def test_scenario_simulation_returns_consistent_metrics(self) -> None:
        result = main.simulate_scenario(
            main.ScenarioSimulationRequest(
                atf_shock_pct=20,
                demand_shift_pct=10,
                fleet_grounding_pct=5,
            )
        )
        expected_shift = (20 * 0.40 * 0.65) + (5 * 0.55) + (10 * 0.35)
        self.assertAlmostEqual(result["airfare_shift_pct"], expected_shift)
        self.assertAlmostEqual(
            result["laspeyres_index"],
            114.59 * (1 + expected_shift / 100),
            places=2,
        )
        self.assertGreater(result["headline_bps"], 3.64)

    def test_scenario_request_rejects_non_numeric_values(self) -> None:
        with self.assertRaises(ValueError):
            main.ScenarioSimulationRequest(atf_shock_pct="invalid")

    def test_locf_timeseries_imputation(self) -> None:
        """Verifies that apply_locf_to_series forward-fills missing observations according to UN/ILO CPI manual."""
        raw_series = [5200.0, None, None, 5800.0, None, 6100.0]
        imputed = apply_locf_to_series(raw_series)
        self.assertEqual(imputed, [5200.0, 5200.0, 5200.0, 5800.0, 5800.0, 6100.0])

        # Test leading None with fallback baseline
        leading_none = [None, None, 7000.0, None]
        imputed_leading = apply_locf_to_series(leading_none, fallback_baseline=6500.0)
        self.assertEqual(imputed_leading, [6500.0, 6500.0, 7000.0, 7000.0])

    def test_locf_cell_imputation(self) -> None:
        """Verifies that impute_missing_cells_locf fills missing corridor/horizon cells without altering existing observations."""
        current_cells = {
            ("DEL-BOM", "T+1"): 8500.0,
            ("DEL-BOM", "T+7"): 7200.0,
        }
        expected_routes = ["DEL-BOM", "BOM-DEL"]
        expected_horizons = ("T+1", "T+7")
        historical_fallback = {
            ("BOM-DEL", "T+1"): 8100.0,
            ("BOM-DEL", "T+7"): 6900.0,
        }

        completed, count = impute_missing_cells_locf(
            current_cells=current_cells,
            expected_routes=expected_routes,
            expected_horizons=expected_horizons,
            historical_fallback=historical_fallback,
        )

        self.assertEqual(count, 2)
        self.assertEqual(completed[("DEL-BOM", "T+1")], 8500.0)
        self.assertEqual(completed[("DEL-BOM", "T+7")], 7200.0)
        self.assertEqual(completed[("BOM-DEL", "T+1")], 8100.0)
        self.assertEqual(completed[("BOM-DEL", "T+7")], 6900.0)


if __name__ == "__main__":
    unittest.main()
