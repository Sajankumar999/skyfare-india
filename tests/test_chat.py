import unittest
from fastapi.testclient import TestClient
import main


class ChatEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)
        main.chat_rate_limiter.reset()

    def test_chat_query_corridor_specific(self) -> None:
        """Test asking about a specific route (DEL-BOM)."""
        response = self.client.post(
            "/api/v1/chat/query",
            json={"query": "What is the fare for DEL to BOM today?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertIn("DEL-BOM", data["answer"])
        self.assertIn("Spot Fare", data["answer"])
        self.assertIn("Unbundled", data["answer"])
        self.assertTrue(len(data["suggestions"]) > 0)
        self.assertIn("source", data)

    def test_chat_query_carrier_specific(self) -> None:
        """Test asking about a specific carrier (IndiGo / HHI)."""
        response = self.client.post(
            "/api/v1/chat/query",
            json={"query": "What is IndiGo market share and HHI?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("IndiGo", data["answer"])
        self.assertIn("HHI", data["answer"])
        self.assertTrue(len(data["tags"]) > 0)

    def test_chat_query_formulas_specific(self) -> None:
        """Test asking about Fisher and Laspeyres formulas."""
        response = self.client.post(
            "/api/v1/chat/query",
            json={"query": "Explain how Superlative Fisher Ideal Index eliminates substitution bias"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("Fisher", data["answer"])
        self.assertIn("Laspeyres", data["answer"])
        self.assertIn("Paasche", data["answer"])

    def test_chat_query_advance_horizons(self) -> None:
        """Test asking about booking horizons and timing."""
        response = self.client.post(
            "/api/v1/chat/query",
            json={"query": "When should I book flight tickets? T+1 vs T+45"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("T+1", data["answer"])
        self.assertIn("T+45", data["answer"])

    def test_chat_query_rate_limiting(self) -> None:
        """Verify rate limiter triggers after exceeding threshold."""
        main.chat_rate_limiter = main.SlidingWindowRateLimiter(max_requests=3, window_seconds=60.0)
        for _ in range(3):
            res = self.client.post(
                "/api/v1/chat/query",
                json={"query": "National Index overview"},
            )
            self.assertEqual(res.status_code, 200)

        # 4th request should be rejected with HTTP 429
        res_blocked = self.client.post(
            "/api/v1/chat/query",
            json={"query": "National Index overview"},
        )
        self.assertEqual(res_blocked.status_code, 429)
        self.assertIn("Retry-After", res_blocked.headers)
        # Restore default rate limiter
        main.chat_rate_limiter = main.SlidingWindowRateLimiter(max_requests=40, window_seconds=60.0)


if __name__ == "__main__":
    unittest.main()
