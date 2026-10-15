import unittest
from fastapi.testclient import TestClient

from main import app, create_admin_token, verify_admin_token


class TestAdminAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_admin_login_success(self):
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "mospi.officer@gov.in", "password": "MoSPI-Admin-2026"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "authenticated")
        self.assertIn("token", data)
        self.assertEqual(data["officer"], "mospi.officer@gov.in")
        self.assertEqual(data["expires_in_seconds"], 43200)

    def test_admin_login_wrong_password(self):
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "mospi.officer@gov.in", "password": "WrongPassword999"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid", response.json()["detail"])

    def test_admin_login_invalid_email(self):
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "notanemail", "password": "MoSPI-Admin-2026"},
        )
        self.assertEqual(response.status_code, 400)

    def test_admin_verify_token_success(self):
        # 1. Login to get genuine token
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "analyst@mospi.gov.in", "password": "MoSPI-Admin-2026"},
        )
        token = login_resp.json()["token"]

        # 2. Verify via X-Admin-Token
        verify_resp1 = self.client.get(
            "/api/v1/auth/verify",
            headers={"X-Admin-Token": token},
        )
        self.assertEqual(verify_resp1.status_code, 200)
        self.assertEqual(verify_resp1.json()["officer"], "analyst@mospi.gov.in")

        # 3. Verify via Authorization: Bearer
        verify_resp2 = self.client.get(
            "/api/v1/auth/verify",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(verify_resp2.status_code, 200)
        self.assertEqual(verify_resp2.json()["authenticated"], True)

    def test_admin_verify_token_tampered(self):
        response = self.client.get(
            "/api/v1/auth/verify",
            headers={"X-Admin-Token": "mospi.officer@gov.in:9999999999:tampered_signature_hex"},
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_verify_missing_token(self):
        response = self.client.get("/api/v1/auth/verify")
        self.assertEqual(response.status_code, 401)

    def test_ingest_run_unauthorized(self):
        response = self.client.post("/api/v1/ingest/run")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Unauthorized", response.json()["detail"])

    def test_ingest_run_invalid_key(self):
        response = self.client.post(
            "/api/v1/ingest/run",
            headers={"X-Admin-Key": "completely_bogus_key"},
        )
        self.assertEqual(response.status_code, 401)

    def test_worker_status_unauthorized(self):
        response = self.client.get("/api/v1/worker/status")
        self.assertEqual(response.status_code, 401)

    def test_worker_status_authorized_with_admin_key(self):
        response = self.client.get(
            "/api/v1/worker/status",
            headers={"X-Admin-Key": "skyfare_adm_live_key_2026"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["state"], ("STOPPED", "RUNNING", "PAUSED"))
        self.assertIn("observations_count", data)

    def test_worker_status_authorized_with_session_token(self):
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "supervisor@mospi.gov.in", "password": "MoSPI-Admin-2026"},
        )
        token = login_resp.json()["token"]

        response = self.client.get(
            "/api/v1/worker/status",
            headers={"X-Admin-Token": token},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json()["state"], ("STOPPED", "RUNNING", "PAUSED"))


if __name__ == "__main__":
    unittest.main()
