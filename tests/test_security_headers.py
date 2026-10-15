import unittest
from fastapi.testclient import TestClient

from main import app


class TestSecurityHeaders(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_security_headers_present(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(response.headers.get("x-frame-options"), "SAMEORIGIN")
        self.assertEqual(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin")
        self.assertEqual(response.headers.get("x-xss-protection"), "1; mode=block")

    def test_cors_localhost_allowed(self):
        response = self.client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:3000")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")

    def test_cors_disallowed_external_origin(self):
        response = self.client.get(
            "/api/v1/health",
            headers={"Origin": "http://evil-attacker.com"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.headers.get("access-control-allow-origin"))


if __name__ == "__main__":
    unittest.main()
