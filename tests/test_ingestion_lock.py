import json
import os
import time
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from batch_fetch_real_data import IngestionLock


class TestIngestionLock(unittest.TestCase):
    def setUp(self):
        self.temp_dir = TemporaryDirectory()
        self.lock_file = Path(self.temp_dir.name) / ".ingestion.lock"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_acquire_and_release(self):
        lock = IngestionLock(lock_path=self.lock_file, timeout=60)
        self.assertTrue(lock.acquire())
        self.assertTrue(self.lock_file.exists())

        data = json.loads(self.lock_file.read_text(encoding="utf-8"))
        self.assertEqual(data["pid"], os.getpid())
        self.assertIn("timestamp", data)

        lock.release()
        self.assertFalse(self.lock_file.exists())

    def test_mutual_exclusion(self):
        lock1 = IngestionLock(lock_path=self.lock_file, timeout=60)
        self.assertTrue(lock1.acquire())

        # Second lock attempt should fail while first is active
        lock2 = IngestionLock(lock_path=self.lock_file, timeout=60)
        self.assertFalse(lock2.acquire())

        lock1.release()
        self.assertTrue(lock2.acquire())
        lock2.release()

    def test_stale_lock_recovery(self):
        # Create a stale lock from a dead PID with old timestamp
        stale_info = {
            "pid": 99999999,  # Non-existent PID
            "timestamp": time.time() - 3600,  # 1 hour ago
            "created_at": "2026-10-11T00:00:00Z",
        }
        self.lock_file.write_text(json.dumps(stale_info), encoding="utf-8")

        lock = IngestionLock(lock_path=self.lock_file, timeout=1800)
        # Should break the stale lock and acquire successfully
        self.assertTrue(lock.acquire())

        data = json.loads(self.lock_file.read_text(encoding="utf-8"))
        self.assertEqual(data["pid"], os.getpid())
        lock.release()


if __name__ == "__main__":
    unittest.main()
