import unittest
from fastapi.testclient import TestClient

from main import (
    app,
    SlidingWindowRateLimiter,
    search_rate_limiter,
    worker_trigger_rate_limiter,
    auth_rate_limiter,
)


class TestRateLimiter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Reset all rate limiters before each test
        search_rate_limiter.reset()
        worker_trigger_rate_limiter.reset()
        auth_rate_limiter.reset()

    def tearDown(self):
        search_rate_limiter.reset()
        worker_trigger_rate_limiter.reset()
        auth_rate_limiter.reset()

    def test_sliding_window_unit_logic(self):
        limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10.0)
        # 1st request
        allowed1, count1, retry1 = limiter.is_allowed("client_a")
        self.assertTrue(allowed1)
        self.assertEqual(count1, 1)

        # 2nd request
        allowed2, count2, retry2 = limiter.is_allowed("client_a")
        self.assertTrue(allowed2)
        self.assertEqual(count2, 2)

        # 3rd request
        allowed3, count3, retry3 = limiter.is_allowed("client_a")
        self.assertTrue(allowed3)
        self.assertEqual(count3, 3)

        # 4th request (should exceed limit)
        allowed4, count4, retry4 = limiter.is_allowed("client_a")
        self.assertFalse(allowed4)
        self.assertGreater(retry4, 0.0)

        # Another client should still be allowed
        allowed_b, count_b, _ = limiter.is_allowed("client_b")
        self.assertTrue(allowed_b)
        self.assertEqual(count_b, 1)

    def test_search_endpoint_rate_limit(self):
        # Use low limit for test verification
        original_max = search_rate_limiter.max_requests
        search_rate_limiter.max_requests = 3
        try:
            # 3 valid search requests
            for _ in range(3):
                resp = self.client.get("/api/v1/fares/search?origin=DEL&destination=BOM")
                self.assertEqual(resp.status_code, 200)

            # 4th request should trigger 429
            resp4 = self.client.get("/api/v1/fares/search?origin=DEL&destination=BOM")
            self.assertEqual(resp4.status_code, 429)
            self.assertIn("Retry-After", resp4.headers)
            self.assertIn("Rate limit exceeded", resp4.json()["detail"])
        finally:
            search_rate_limiter.max_requests = original_max

    def test_auth_endpoint_rate_limit(self):
        original_max = auth_rate_limiter.max_requests
        auth_rate_limiter.max_requests = 2
        try:
            for _ in range(2):
                resp = self.client.post(
                    "/api/v1/auth/login",
                    json={"email": "officer@mospi.gov.in", "password": "wrong_password"},
                )
                self.assertEqual(resp.status_code, 401)

            # 3rd request triggers 429
            resp3 = self.client.post(
                "/api/v1/auth/login",
                json={"email": "officer@mospi.gov.in", "password": "wrong_password"},
            )
            self.assertEqual(resp3.status_code, 429)
            self.assertIn("Too many login attempts", resp3.json()["detail"])
        finally:
            auth_rate_limiter.max_requests = original_max


if __name__ == "__main__":
    unittest.main()
