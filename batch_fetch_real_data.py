"""Build a multi-route, multi-horizon live fare basket with 14-corridor dedicated key assignment.

Reuses fetch_real_data.fetch_real_flight(), executing across all 14 official DGCA
domestic corridors and specified booking horizons (T+1 to T+45).
"""

import argparse
import atexit
import json
import os
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fetch_real_data import fetch_real_flight, get_api_keys, get_corridor_key_info
from scrapling_fetcher import fetch_with_scrapling


LOCK_FILE = Path(__file__).resolve().parent / ".ingestion.lock"
LOCK_STALE_TIMEOUT_SECONDS = 1800  # 30 minutes


def _is_pid_alive(pid: int) -> bool:
    """Checks if a given process ID is still alive."""
    if pid <= 0:
        return False
    try:
        if os.name == "nt":
            import ctypes
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            STILL_ACTIVE = 259
            handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if not handle:
                return False
            exit_code = ctypes.c_ulong()
            success = ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code))
            ctypes.windll.kernel32.CloseHandle(handle)
            return bool(success and exit_code.value == STILL_ACTIVE)
        else:
            os.kill(pid, 0)
            return True
    except Exception:
        return False


class IngestionLock:
    """Atomic file-based lock to prevent concurrent scheduled ingestion runs."""

    def __init__(self, lock_path: Path = LOCK_FILE, timeout: int = LOCK_STALE_TIMEOUT_SECONDS):
        self.lock_path = lock_path
        self.timeout = timeout
        self.acquired = False

    def acquire(self) -> bool:
        now = time.time()
        if self.lock_path.exists():
            try:
                data = json.loads(self.lock_path.read_text(encoding="utf-8"))
                lock_pid = int(data.get("pid", 0))
                lock_time = float(data.get("timestamp", 0))
                age = now - lock_time

                if _is_pid_alive(lock_pid) and age < self.timeout:
                    return False
                else:
                    print(
                        f"[INGESTION LOCK] Breaking stale lock from PID {lock_pid} "
                        f"(age: {int(age)}s, alive: {_is_pid_alive(lock_pid)}).",
                        file=sys.stderr,
                    )
            except Exception:
                pass

        lock_info = {
            "pid": os.getpid(),
            "timestamp": now,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        }
        try:
            self.lock_path.write_text(json.dumps(lock_info, indent=2), encoding="utf-8")
            self.acquired = True
            atexit.register(self.release)
            return True
        except Exception as e:
            print(f"[INGESTION LOCK ERROR] Could not create lock file: {e}", file=sys.stderr)
            return False

    def release(self) -> None:
        if self.acquired and self.lock_path.exists():
            try:
                data = json.loads(self.lock_path.read_text(encoding="utf-8"))
                if data.get("pid") == os.getpid():
                    self.lock_path.unlink(missing_ok=True)
            except Exception:
                self.lock_path.unlink(missing_ok=True)
            finally:
                self.acquired = False

    def __enter__(self):
        if not self.acquire():
            raise RuntimeError(
                "[INGESTION LOCK] Another batch ingestion process is currently active."
            )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


# All 14 Official DGCA Domestic Corridors (>65% of Indian Passenger Traffic)
ROUTES = (
    "DEL-BOM",
    "BOM-DEL",
    "DEL-BLR",
    "BLR-DEL",
    "DEL-CCU",
    "CCU-DEL",
    "BOM-BLR",
    "BLR-BOM",
    "DEL-HYD",
    "HYD-DEL",
    "MAA-DEL",
    "DEL-MAA",
    "CCU-BOM",
    "BOM-GOI",
)

# All 5 Mandatory MoSPI / RBI Booking Horizons
ALL_HORIZONS = ("T+1", "T+7", "T+15", "T+30", "T+45")
DEFAULT_DELAY_SECONDS = 2.0


def outbound_date_for_horizon(horizon: str) -> str:
    """Calculates departure ISO date for a given horizon."""
    days = int(horizon.removeprefix("T+"))
    return (date.today() + timedelta(days=days)).isoformat()


def detect_current_shift(dt: datetime | None = None) -> str:
    """Automatically detects the operational shift from current UTC time.

    4 Daily Scheduled Runs (spaced ~5.5 to 6 hours apart):
      - Shift 1: Morning Early Bird (00:20 UTC = 05:50 AM IST)  -> 00:00 - 05:00 UTC
      - Shift 2: Midday Market       (05:40 UTC = 11:10 AM IST) -> 05:00 - 10:00 UTC
      - Shift 3: Evening Surge       (11:20 UTC = 04:50 PM IST) -> 10:00 - 15:30 UTC
      - Shift 4: Night EOD & Index   (16:40 UTC = 10:10 PM IST) -> 15:30 - 24:00 UTC
    """
    if dt is None:
        dt = datetime.now(timezone.utc)
    hour = dt.hour + (dt.minute / 60.0)
    if hour < 5.0:
        return "morning"
    elif hour < 10.0:
        return "midday"
    elif hour < 15.5:
        return "evening"
    else:
        return "night"


def is_serpapi_eligible(shift_name: str, horizon: str) -> bool:
    """Returns True if SerpApi should query for the given shift and horizon.

    Tiered Quota Architecture:
      - 'morning': Spot & Peak surveillance (T+1, T+7 only) -> 28 calls/day
      - 'midday' / 'evening': False (0 calls) -> 100% Scrapling stealth mode
      - 'night' / 'all' / 'custom': True (All 5 horizons) -> 70 calls/day + EOD Index
    Total SerpApi calls = 28 + 0 + 0 + 70 = 98 calls/day (210 calls/month per teammate key).
    """
    if shift_name in ("night", "all", "custom"):
        return True
    elif shift_name == "morning":
        return horizon in ("T+1", "T+7")
    return False


def _run_batch_impl(
    horizons: tuple[str, ...] | None = None,
    shift_name: str = "custom",
    engine: str = "dual",
    sources: tuple[str, ...] | list[str] | None = None,
) -> dict[str, dict[str, int]]:
    keys = get_api_keys()
    if not keys and engine == "serpapi":
        raise RuntimeError("Set SERPAPI_API_KEYS (comma-separated pool) or SERPAPI_API_KEY before running.")
    elif not keys and engine == "dual":
        print("  [NOTICE] No SerpApi keys configured; running exclusively via Scrapling stealth engine.")
        engine = "scrapling"

    if not horizons:
        horizons = ALL_HORIZONS

    serpapi_active_horizons = tuple(h for h in horizons if is_serpapi_eligible(shift_name, h))
    if shift_name in ("night", "all", "custom"):
        serpapi_mode_label = "Official EOD Full Basket (T+1..T+45)"
    elif shift_name == "morning":
        serpapi_mode_label = "Morning Spot & Peak Surveillance (T+1, T+7)"
    else:
        serpapi_mode_label = "OFF (Daytime Quota Saver - 100% Scrapling Mode)"

    print("=" * 80)
    print(f"SkyFare India - 14 DGCA Corridor Dedicated Ingestion Run [{shift_name.upper()} SHIFT]")
    print(f"Ingestion Engine: {engine.upper()} (SerpApi + Scrapling Dual Mode: {'ACTIVE' if engine == 'dual' else 'OFF'})")
    print("=" * 80)
    print(f"Corridors Monitored: {len(ROUTES)} | Horizon Target Pool: {', '.join(horizons)}")
    if engine in ("dual", "serpapi"):
        count_desc = f"{len(serpapi_active_horizons)} horizons" if serpapi_active_horizons else "0 horizons (Sleeping)"
        print(f"  * SerpApi Active Horizons:  {', '.join(serpapi_active_horizons) if serpapi_active_horizons else 'None'} ({count_desc} - {serpapi_mode_label})")
    if engine in ("dual", "scrapling"):
        print(f"  * Scrapling Active Horizons: {', '.join(horizons)} ({len(horizons)} horizons - Stealth Multi-OTA)")
    print(f"Total Planned Pipeline Iterations: {len(ROUTES) * len(horizons)}")
    if engine in ("dual", "serpapi") and keys:
        print("\nCorridor Key Assignments & Teammate Ownership:")
        for idx, r in enumerate(ROUTES, 1):
            info = get_corridor_key_info(r)
            owner = f"{info['member']} ({info['key_slot']})" if info else "Global Pool"
            print(f"  {idx:2d}. {r:7s} -> Assigned Teammate: {owner}")
    print("=" * 80)

    # Database Corruption Protection: Create online snapshot before performing writes
    try:
        from database import backup_database
        backup_path = backup_database()
        if backup_path:
            print(f"  [SAFETY BACKUP] Point-in-time DB snapshot created: backups/{backup_path.name}")
    except Exception as backup_exc:
        print(f"  [BACKUP WARNING] Could not create database backup: {backup_exc}")
    print("=" * 80 + "\n")

    try:
        delay_seconds = max(
            0.5,
            float(os.environ.get("SKYFARE_BATCH_DELAY_SECONDS", DEFAULT_DELAY_SECONDS)),
        )
    except ValueError as error:
        raise RuntimeError("SKYFARE_BATCH_DELAY_SECONDS must be numeric.") from error

    summary: dict[str, dict[str, int]] = {}
    total_requests = len(ROUTES) * len(horizons)

    request_counter = 0
    for route in ROUTES:
        origin, destination = route.split("-", maxsplit=1)
        info = get_corridor_key_info(route)
        owner_desc = f"{info['member']} ({info['key_slot']})" if info else "Pool"

        for horizon in horizons:
            request_counter += 1
            outbound_date = outbound_date_for_horizon(horizon)
            os.environ["SKYFARE_LIVE_ORIGIN"] = origin
            os.environ["SKYFARE_LIVE_DESTINATION"] = destination
            os.environ["SKYFARE_LIVE_OUTBOUND_DATE"] = outbound_date

            serpapi_eligible = is_serpapi_eligible(shift_name, horizon)

            serp_status = "RUN" if (engine in ("dual", "serpapi") and serpapi_eligible) else ("OFF (Quota Saver)" if engine in ("dual", "serpapi") else "OFF")
            scrap_status = "RUN" if engine in ("dual", "scrapling") else "OFF"

            print(
                f"[{request_counter}/{total_requests}] "
                f"Ingesting {route} @ {horizon} ({outbound_date}) "
                f"[SerpApi: {serp_status} | Scrapling: {scrap_status}]..."
            )
            route_summary = summary.setdefault(route, {"accepted": 0, "quarantined": 0})

            # 1. SerpApi Collection (T+1 & T+7 on Morning; OFF on Midday/Evening; All horizons on Night)
            if engine in ("dual", "serpapi"):
                if serpapi_eligible:
                    try:
                        result = fetch_real_flight()
                    except Exception as error:
                        print(f"  [SERPAPI ERROR]: {error}")
                        result = {"accepted": 0, "quarantined": 0}
                    route_summary["accepted"] += result.get("accepted", 0)
                    route_summary["quarantined"] += result.get("quarantined", 0)
                else:
                    reason = "all horizons captured on NIGHT shift" if is_morning_shift else "quota preserved for NIGHT shift (100% Scrapling active)"
                    print(f"  [SERPAPI QUOTA SAVER] Skipping {horizon} on {shift_name.upper()} shift ({reason}).")

            # 2. Scrapling Stealth Collection (ALL horizons on EVERY shift)
            if engine in ("dual", "scrapling"):
                try:
                    s_result = fetch_with_scrapling(route, horizon, outbound_date, sources=sources)
                    route_summary["accepted"] += s_result.get("accepted", 0)
                    route_summary["quarantined"] += s_result.get("quarantined", 0)
                except Exception as s_error:
                    print(f"  [SCRAPLING ERROR]: {s_error}")

            time.sleep(delay_seconds)

    print("\n" + "=" * 80)
    print(f"Batch Ingestion Summary ({shift_name.upper()} SHIFT - Engine: {engine.upper()}):")
    total_acc = sum(v["accepted"] for v in summary.values())
    total_quar = sum(v["quarantined"] for v in summary.values())
    for r, stats in summary.items():
        info = get_corridor_key_info(r)
        owner_name = info['member'] if info else "Pool"
        print(f"  {r:7s} (Owner: {owner_name:7s}): Accepted = {stats['accepted']}, Quarantined = {stats['quarantined']}")
    print(f"Total Accepted: {total_acc} | Total Quarantined: {total_quar}")
    print("=" * 80)

    # Automatically recalculate and persist National Price Indices from live observations
    try:
        from main import calculate_live_index, persist_daily_index
        print("\nRecalculating official National Airfare Indices from newly ingested observations...")
        live_index = calculate_live_index()
        if live_index.get("observations", 0) > 0:
            persist_daily_index(live_index)
            print(f"  [OK] Successfully updated today's National Index to: {live_index['fisher_ideal_index']}")
            print(f"       Laspeyres: {live_index['laspeyres_index']} | Paasche: {live_index['paasche_index']}")
            print(f"       DoD Change: {live_index['dod_change_pct']}% | Average Fare: ₹{live_index['average_live_fare']}")
            print(f"       Methodology: {live_index['methodology']} | Observations: {live_index['observations']}")
            print(f"       Corridors Represented: {live_index['routes']} / 14")
    except Exception as exc:
        print(f"  [NOTICE] Could not update live index automatically: {exc}")

    return summary
 
 
def run_batch(
    horizons: tuple[str, ...] | None = None,
    shift_name: str = "custom",
    engine: str = "dual",
    sources: tuple[str, ...] | list[str] | None = None,
) -> dict[str, dict[str, int]]:
    with IngestionLock():
        return _run_batch_impl(
            horizons=horizons,
            shift_name=shift_name,
            engine=engine,
            sources=sources,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SkyFare India - Dedicated 14-Corridor Ingestion Engine")
    parser.add_argument(
        "--shift",
        choices=["morning", "midday", "afternoon", "evening", "night", "all", "auto"],
        default="auto",
        help="Execution shift: 'auto' (detect by UTC clock), 'morning', 'midday'/'afternoon', 'evening', 'night' (full basket + EOD index), or 'all'",
    )
    parser.add_argument(
        "--horizon",
        type=str,
        default=None,
        help="Specific horizon(s) to fetch, comma-separated (e.g. T+1, or T+1,T+7)",
    )
    parser.add_argument(
        "--all-horizons",
        action="store_true",
        help="Force collection of all 5 horizons (T+1, T+7, T+15, T+30, T+45) regardless of shift setting",
    )
    parser.add_argument(
        "--engine",
        choices=["serpapi", "scrapling", "dual"],
        default="dual",
        help="Scraping engine: 'dual' (both SerpApi + Scrapling), 'scrapling', or 'serpapi'",
    )
    parser.add_argument(
        "--sources",
        type=str,
        default=None,
        help="Comma-separated Scrapling source platforms: google_flights, makemytrip, easemytrip (default: all sources)",
    )
    args = parser.parse_args()

    # Resolve operational shift
    if args.shift == "auto":
        shift = detect_current_shift()
        print(f"  [AUTO SHIFT] Clock-derived operational shift: '{shift.upper()}'")
    elif args.shift == "afternoon":
        shift = "midday"
    else:
        shift = args.shift

    selected_horizons: tuple[str, ...]
    if args.all_horizons:
        selected_horizons = ALL_HORIZONS
    elif args.horizon:
        raw_horizons = tuple(h.strip().upper() for h in args.horizon.split(",") if h.strip())
        for h in raw_horizons:
            if h not in ALL_HORIZONS:
                raise ValueError(f"Invalid horizon '{h}'. Allowed horizons are: {ALL_HORIZONS}")
        selected_horizons = raw_horizons
        shift = "custom"
    else:
        # Default: All 5 horizons are iterated over.
        # Scrapling scrapes all 5 on every shift.
        # SerpApi dynamically filters T+1, T+7 on shifts 1-3, and all 5 on night shift.
        selected_horizons = ALL_HORIZONS

    selected_sources = (
        tuple(s.strip().lower() for s in args.sources.split(",") if s.strip())
        if args.sources
        else None
    )

    try:
        run_batch(
            horizons=selected_horizons,
            shift_name=shift,
            engine=args.engine,
            sources=selected_sources,
        )
    except RuntimeError as e:
        if "[INGESTION LOCK]" in str(e):
            print(f"{e}", file=sys.stderr)
            sys.exit(42)
        raise
