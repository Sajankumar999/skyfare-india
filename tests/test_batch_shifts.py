import unittest
from datetime import datetime, timezone
from batch_fetch_real_data import detect_current_shift, ALL_HORIZONS

class TestBatchShiftDetection(unittest.TestCase):
    def test_shift_detection_windows(self):
        # Shift 1: Morning Early Bird (00:20 UTC -> hour 0.33, delayed up to 04:30 UTC)
        t_morn_exact = datetime(2026, 10, 17, 0, 20, tzinfo=timezone.utc)
        t_morn_delay = datetime(2026, 10, 17, 3, 45, tzinfo=timezone.utc)
        self.assertEqual(detect_current_shift(t_morn_exact), "morning")
        self.assertEqual(detect_current_shift(t_morn_delay), "morning")

        # Shift 2: Midday Market (05:40 UTC -> hour 5.67, delayed up to 08:45 UTC)
        t_mid_exact = datetime(2026, 10, 17, 5, 40, tzinfo=timezone.utc)
        t_mid_delay = datetime(2026, 10, 17, 8, 45, tzinfo=timezone.utc)
        self.assertEqual(detect_current_shift(t_mid_exact), "midday")
        self.assertEqual(detect_current_shift(t_mid_delay), "midday")

        # Shift 3: Evening Surge (11:20 UTC -> hour 11.33, delayed up to 14:30 UTC)
        t_eve_exact = datetime(2026, 10, 17, 11, 20, tzinfo=timezone.utc)
        t_eve_delay = datetime(2026, 10, 17, 14, 30, tzinfo=timezone.utc)
        self.assertEqual(detect_current_shift(t_eve_exact), "evening")
        self.assertEqual(detect_current_shift(t_eve_delay), "evening")

        # Shift 4: Night EOD & Index (16:40 UTC -> hour 16.67, delayed up to 21:00 UTC)
        t_night_exact = datetime(2026, 10, 17, 16, 40, tzinfo=timezone.utc)
        t_night_delay = datetime(2026, 10, 17, 20, 15, tzinfo=timezone.utc)
        t_night_late = datetime(2026, 10, 17, 23, 50, tzinfo=timezone.utc)
        self.assertEqual(detect_current_shift(t_night_exact), "night")
        self.assertEqual(detect_current_shift(t_night_delay), "night")
        self.assertEqual(detect_current_shift(t_night_late), "night")

    def test_all_horizons_constant(self):
        self.assertEqual(ALL_HORIZONS, ("T+1", "T+7", "T+15", "T+30", "T+45"))

if __name__ == "__main__":
    unittest.main()
