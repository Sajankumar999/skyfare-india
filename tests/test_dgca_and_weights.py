import os
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from database import init_db, DGCA_DEFAULT_ROUTE_WEIGHTS
from scraper import FareQuote, persist_quotes
from fetch_real_data import get_api_keys, rotate_to_next_key, unbundle_fare, _active_key_index
import main


class DgcaAndWeightsTests(unittest.TestCase):
    def test_statistical_outlier_is_quarantined(self) -> None:
        """Verifies that extreme fare outliers (> ₹45,000 or < ₹1,200) are routed to quarantine."""
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "test_outlier.db"
            with patch("database.DATABASE_PATH", database_path), patch("scraper.DATABASE_PATH", database_path):
                result = persist_quotes([
                    FareQuote("Air India", "DEL-BOM", "T+1", 6000.0, 7800.0),      # Valid
                    FareQuote("Air India", "DEL-BOM", "T+1", 40000.0, 52000.0),    # Outlier (> 45k)
                    FareQuote("SpiceJet", "DEL-BOM", "T+7", 600.0, 950.0),         # Outlier (< 1.2k)
                ])

                self.assertEqual(result["accepted"], 1)
                self.assertEqual(result["quarantined"], 2)

                with closing(sqlite3.connect(database_path)) as connection:
                    reasons = [
                        r[0] for r in connection.execute(
                            "SELECT reason_code FROM fare_quarantine"
                        ).fetchall()
                    ]
                    self.assertEqual(reasons, ["STATISTICAL_OUTLIER", "STATISTICAL_OUTLIER"])

    def test_dgca_route_weights_seeded(self) -> None:
        """Verifies that init_db() automatically populates route_weights and daily_indices."""
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "test_seed.db"
            with patch("database.DATABASE_PATH", database_path):
                init_db()
                with closing(sqlite3.connect(database_path)) as connection:
                    weight_count = connection.execute("SELECT COUNT(*) FROM route_weights").fetchone()[0]
                    indices_count = connection.execute("SELECT COUNT(*) FROM daily_indices").fetchone()[0]

                self.assertEqual(weight_count, len(DGCA_DEFAULT_ROUTE_WEIGHTS))
                self.assertGreaterEqual(indices_count, 35)

    def test_dgca_validation_endpoint(self) -> None:
        """Verifies that /api/v1/dgca/validation returns passing econometric benchmarks."""
        val = main.get_dgca_validation()
        self.assertEqual(val["status"], "ALL_TESTS_PASSED")
        self.assertGreaterEqual(val["pearsonR"], 0.90)
        self.assertLessEqual(val["mape"], 1.50)
        self.assertGreaterEqual(val["rSquared"], 0.90)
        self.assertIn("dailyTimeline", val)
        self.assertGreaterEqual(len(val["dailyTimeline"]), 14)

    def test_multi_key_rotation(self) -> None:
        """Verifies multi-key parsing and round-robin failover."""
        with patch.dict(os.environ, {"SERPAPI_API_KEYS": "key_alpha, key_beta, key_gamma"}):
            keys = get_api_keys()
            self.assertEqual(keys, ["key_alpha", "key_beta", "key_gamma"])
            next_k = rotate_to_next_key("test_quota_exhausted")
            self.assertIn(next_k, keys)

    def test_fare_unbundling(self) -> None:
        """Verifies fee decomposition into Base Fare, GST, UDF, and PSF/ASF."""
        base, total = unbundle_fare(8500.0, "DEL")
        self.assertEqual(total, 8500.0)
        self.assertGreater(base, 0)
        self.assertLess(base, total)
        # Verify base fare is approximately 65-80% of total
        self.assertGreater(base / total, 0.60)
        self.assertLess(base / total, 0.85)

    def test_corridor_key_registry_mapping(self) -> None:
        """Verifies that 14 corridors map to dedicated teammate keys from registry."""
        from fetch_real_data import get_corridor_key_info
        del_bom_info = get_corridor_key_info("DEL-BOM")
        self.assertIsNotNone(del_bom_info)
        self.assertEqual(del_bom_info["member"], "Baba")
        self.assertEqual(del_bom_info["key_slot"], "Key 1")
        self.assertTrue(del_bom_info["api_key"].startswith("f10763f5"))

        bom_goi_info = get_corridor_key_info("BOM-GOI")
        self.assertIsNotNone(bom_goi_info)
        self.assertEqual(bom_goi_info["member"], "Sajan")
        self.assertEqual(bom_goi_info["key_slot"], "Key 2")

    def test_dedicated_test_key_available(self) -> None:
        """Verifies dedicated staging test key is accessible."""
        from fetch_real_data import get_test_key
        test_k = get_test_key()
        self.assertTrue(test_k.startswith("0519b5e7"))


if __name__ == "__main__":
    unittest.main()

