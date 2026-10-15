import unittest
from fastapi.testclient import TestClient

from main import app


class TestScenarioSimulator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_scenario_simulate_valid(self):
        response = self.client.post(
            "/api/v1/scenario/simulate",
            json={
                "atf_shock_pct": 20.0,
                "demand_shift_pct": 10.0,
                "fleet_grounding_pct": -15.0,
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("airfare_shift_pct", data)
        self.assertIn("laspeyres_index", data)
        self.assertIn("transport_bps", data)
        self.assertIn("headline_bps", data)

    def test_scenario_simulate_defaults(self):
        response = self.client.post("/api/v1/scenario/simulate", json={})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["airfare_shift_pct"], 0.0)
        self.assertEqual(data["laspeyres_index"], 114.59)

    def test_scenario_simulate_out_of_bounds_atf(self):
        response = self.client.post(
            "/api/v1/scenario/simulate",
            json={"atf_shock_pct": 250.0},
        )
        self.assertEqual(response.status_code, 422)

        response_low = self.client.post(
            "/api/v1/scenario/simulate",
            json={"atf_shock_pct": -150.0},
        )
        self.assertEqual(response_low.status_code, 422)

    def test_scenario_simulate_out_of_bounds_grounding(self):
        response = self.client.post(
            "/api/v1/scenario/simulate",
            json={"fleet_grounding_pct": 150.0},
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
