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
from datetime import date, timedelta
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

    print("=" * 80)
    print(f"SkyFare India - 14 DGCA Corridor Dedicated Ingestion Run [{shift_name.upper()} SHIFT]")
    print(f"Ingestion Engine: {engine.upper()} (SerpApi + Scrapling Dual Mode: {'ACTIVE' if engine == 'dual' else 'OFF'})")
    print("=" * 80)
    print(f"Corridors Monitored: {len(ROUTES)} | Target Horizons: {', '.join(horizons)}")
    print(f"Total Planned Searches: {len(ROUTES) * len(horizons)} (across {engine} engine)")
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

            print(
                f"[{request_counter}/{total_requests}] "
                f"Ingesting {route} @ {horizon} ({outbound_date}) [{engine.upper()}]..."
            )
            route_summary = summary.setdefault(route, {"accepted": 0, "quarantined": 0})

            # 1. SerpApi Collection
            if engine in ("dual", "serpapi"):
                try:
                    result = fetch_real_flight()
                except Exception as error:
                    print(f"  [SERPAPI ERROR]: {error}")
                    result = {"accepted": 0, "quarantined": 0}
                route_summary["accepted"] += result.get("accepted", 0)
                route_summary["quarantined"] += result.get("quarantined", 0)

            # 2. Scrapling Stealth Collection
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
        choices=["morning", "afternoon", "night", "all"],
        default="night",
        help="Execution shift: 'morning' (all horizons T+1 to T+45), 'afternoon' (all horizons), 'night' (all horizons), or 'all' (all horizons)",
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

    selected_horizons: tuple[str, ...]
    if args.all_horizons:
        selected_horizons = ALL_HORIZONS
        shift = args.shift
    elif args.horizon:
        raw_horizons = tuple(h.strip().upper() for h in args.horizon.split(",") if h.strip())
        for h in raw_horizons:
            if h not in ALL_HORIZONS:
                raise ValueError(f"Invalid horizon '{h}'. Allowed horizons are: {ALL_HORIZONS}")
        selected_horizons = raw_horizons
        shift = "custom"
    elif args.shift in ("morning", "afternoon", "night", "all"):
        # 3x daily schedule (morning, afternoon, night) captures full 5-horizon basket
        selected_horizons = ALL_HORIZONS
        shift = args.shift
    else:
        selected_horizons = ALL_HORIZONS
        shift = "all"

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
