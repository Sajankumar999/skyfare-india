import sqlite3
import tempfile
import unittest
from pathlib import Path

from database import get_db_connection


class TestDatabaseWalHardening(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_wal.db"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_wal_mode_and_pragmas_enabled(self):
        conn = get_db_connection(self.db_path)
        try:
            journal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
            self.assertEqual(journal_mode.lower(), "wal")

            busy_timeout = conn.execute("PRAGMA busy_timeout;").fetchone()[0]
            self.assertGreaterEqual(busy_timeout, 5000)

            foreign_keys = conn.execute("PRAGMA foreign_keys;").fetchone()[0]
            self.assertEqual(foreign_keys, 1)

            synchronous = conn.execute("PRAGMA synchronous;").fetchone()[0]
            # synchronous = NORMAL (1)
            self.assertEqual(synchronous, 1)
        finally:
            conn.close()

    def test_concurrent_read_during_write_in_wal(self):
        # 1. Establish writer connection
        writer = get_db_connection(self.db_path)
        writer.execute("CREATE TABLE test_data (id INTEGER PRIMARY KEY, val TEXT);")
        writer.execute("INSERT INTO test_data (val) VALUES ('initial');")
        writer.commit()

        # 2. Establish concurrent reader connection
        reader = get_db_connection(self.db_path, row_factory=True)

        # 3. Writer starts a transaction
        writer.execute("INSERT INTO test_data (val) VALUES ('pending_commit');")

        # 4. In WAL mode, reader should read without deadlocking or failing with 'database is locked'
        rows = reader.execute("SELECT COUNT(*) as cnt FROM test_data").fetchone()
        self.assertEqual(rows["cnt"], 1)

        # 5. Writer commits
        writer.commit()

        # 6. Reader now sees committed rows
        rows_after = reader.execute("SELECT COUNT(*) as cnt FROM test_data").fetchone()
        self.assertEqual(rows_after["cnt"], 2)

        writer.close()
        reader.close()


if __name__ == "__main__":
    unittest.main()
