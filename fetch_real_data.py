"""Fetch authorized SerpApi Google Flights quotes with multi-key pool support.

Supports dedicated 14-corridor teammate key assignments, round-robin auto-failover,
and dedicated staging test key fallback.
"""

import json
import os
import sys
from datetime import date
from pathlib import Path
from typing import Any, List
import requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from database import get_corridor_baseline
from scraper import FareQuote, persist_quotes

SERPAPI_URL = "https://serpapi.com/search.json"
DEFAULT_ORIGIN = "DEL"
DEFAULT_DESTINATION = "BOM"
DEFAULT_OUTBOUND_DATE = "2026-09-30"
REGISTRY_PATH = Path(__file__).resolve().parent / "api_keys_registry.json"


def get_corridor_key_info(route_code: str) -> dict[str, str] | None:
    """Retrieves dedicated corridor key and owner info from registry or environment."""
    normalized_route = route_code.upper().strip()
    if REGISTRY_PATH.exists():
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data.get("corridor_assignments", []):
                    if item.get("corridor", "").upper() == normalized_route:
                        env_var = item.get("env_var") or f"SERPAPI_KEY_{normalized_route.replace('-', '_')}"
                        api_key = os.environ.get(env_var, "") or item.get("api_key", "")
                        return {
                            **item,
                            "api_key": api_key.strip(),
                        }
        except Exception:
            pass

    # Fallback to direct environment variable (e.g. SERPAPI_KEY_DEL_BOM)
    env_var_name = f"SERPAPI_KEY_{normalized_route.replace('-', '_')}"
    env_key = os.environ.get(env_var_name)
    if env_key and env_key.strip():
        return {
            "corridor": normalized_route,
            "member": "Dedicated Assignment",
            "key_slot": "Corridor Key",
            "api_key": env_key.strip(),
            "status": "ACTIVE",
        }
    return None


def get_test_key() -> str:
    """Returns the dedicated test/staging fallback key."""
    test_key = (
        os.environ.get("SERPAPI_TEST_KEY")
        or os.environ.get("SERPAPI_CHECKUP_KEY")
        or ""
    ).strip()
    if not test_key and REGISTRY_PATH.exists():
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                t_info = data.get("test_key", {})
                env_v = t_info.get("env_var")
                if env_v and os.environ.get(env_v):
                    test_key = os.environ[env_v].strip()
                elif t_info.get("key"):
                    test_key = t_info["key"].strip()
        except Exception:
            pass
    return test_key or "0519b5e7924d74800f572039145e9f660a1ff79affa7f93deaaa457bccafaa8d"


def get_api_keys() -> List[str]:
    """Retrieves all configured SerpApi keys from environment (comma-separated or single)."""
    raw_keys = os.environ.get("SERPAPI_API_KEYS") or os.environ.get("SERPAPI_API_KEY", "")
    keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
    return keys


# Global round-robin pointer for active key index
_active_key_index = 0


def get_active_key() -> str:
    """Returns currently selected key, or raises RuntimeError if no keys configured."""
    global _active_key_index
    keys = get_api_keys()
    if not keys:
        raise RuntimeError("Set SERPAPI_API_KEYS (comma-separated) or SERPAPI_API_KEY before running.")
    return keys[_active_key_index % len(keys)]


def rotate_to_next_key(reason: str = "quota exhausted") -> str:
    """Rotates to the next key in the pool and logs notification."""
    global _active_key_index
    keys = get_api_keys()
    if not keys:
        raise RuntimeError("No API keys available.")
    _active_key_index = (_active_key_index + 1) % len(keys)
    next_key = keys[_active_key_index]
    masked = next_key[:4] + "..." + next_key[-4:] if len(next_key) > 8 else "***"
    print(f"  [KEY ROTATION] Rotated to Key #{_active_key_index + 1}/{len(keys)} ({masked}) due to: {reason}")
    return next_key


def booking_horizon(outbound_date: str) -> str:
    """Maps departure date to nearest standard horizon: T+1, T+7, T+15, T+30, T+45."""
    days_until_departure = (date.fromisoformat(outbound_date) - date.today()).days
    supported = (1, 7, 15, 30, 45)
    closest = min(supported, key=lambda days: abs(days - days_until_departure))
    return f"T+{closest}"


def unbundle_fare(total_fare: float, origin: str) -> tuple[float, float]:
    """
    Decomposes total domestic ticket price into Base Fare and Statutory Taxes/Fees.
    Compliant with MoSPI / DGCA Tariff Unbundling:
      - Airport UDF (User Development Fee): ₹400 to ₹520
      - PSF + ASF (Passenger & Aviation Security Fee): ₹476
      - GST on Domestic Economy: 5%
      - Fuel Surcharge (ATF): ~18%
    Returns: (base_fare, total_fare)
    """
    udf_by_airport = {
        "DEL": 490.0, "BOM": 520.0, "BLR": 450.0,
        "CCU": 400.0, "HYD": 430.0, "MAA": 410.0,
    }
    udf = udf_by_airport.get(origin.upper(), 400.0)
    statutory_security = 476.0  # PSF (₹240) + ASF (₹236)
    fixed_fees = udf + statutory_security

    if total_fare <= fixed_fees + 500:
        base_fare = round(total_fare * 0.70, 2)
    else:
        taxable_tariff = total_fare - fixed_fees
        tariff_before_gst = taxable_tariff / 1.05  # 5% GST
        base_fare = round(tariff_before_gst * 0.82, 2)  # Exclude ~18% ATF surcharge

    base_fare = max(500.0, min(base_fare, total_fare - 200.0))
    return round(base_fare, 2), round(total_fare, 2)


def extract_quotes(payload: dict[str, Any], limit: int) -> list[tuple[str, float]]:
    """Extracts valid carrier quotes from SerpApi Google Flights response."""
    raw_results = []
    for key in ("best_flights", "other_flights"):
        results = payload.get(key)
        if isinstance(results, list):
            raw_results.extend(results)

    quotes: list[tuple[str, float]] = []
    seen: set[tuple[str, float]] = set()
    for result in raw_results:
        if not isinstance(result, dict):
            continue
        flights = result.get("flights")
        airline = None
        if isinstance(flights, list) and flights and isinstance(flights[0], dict):
            airline = flights[0].get("airline")
        try:
            total_fare = float(result.get("price"))
        except (TypeError, ValueError):
            continue
        if not isinstance(airline, str) or not airline.strip() or total_fare <= 0:
            continue
        quote = (airline.strip(), total_fare)
        if quote not in seen:
            seen.add(quote)
            quotes.append(quote)
        if len(quotes) >= limit:
            break

    if not quotes:
        raise RuntimeError("SerpApi returned no valid flight quotes.")
    return quotes


def fetch_real_flight() -> dict[str, int]:
    """Fetches real flight data using corridor-assigned teammate keys with test fallback."""
    keys = get_api_keys()

    try:
        quote_limit = max(1, min(50, int(os.environ.get("SKYFARE_LIVE_QUOTE_LIMIT", "30"))))
    except ValueError as error:
        raise RuntimeError("SKYFARE_LIVE_QUOTE_LIMIT must be an integer.") from error

    origin = os.environ.get("SKYFARE_LIVE_ORIGIN", DEFAULT_ORIGIN).upper()
    destination = os.environ.get("SKYFARE_LIVE_DESTINATION", DEFAULT_DESTINATION).upper()
    outbound_date = os.environ.get("SKYFARE_LIVE_OUTBOUND_DATE", DEFAULT_OUTBOUND_DATE)
    route_code = f"{origin}-{destination}"

    print(f"Fetching real flight data for {route_code} (Date: {outbound_date})...")

    # Build prioritized candidate key chain:
    # 1. Dedicated corridor key assigned to this specific route (e.g. Baba Key 1 for DEL-BOM)
    # 2. Dedicated staging test key (fallback)
    # 3. Remaining keys from global pool
    candidate_keys: list[tuple[str, str, str]] = []  # (key, label, owner_name)
    corridor_info = get_corridor_key_info(route_code)
    test_key = get_test_key()

    if corridor_info and corridor_info.get("api_key"):
        member = corridor_info.get("member", "Teammate")
        slot = corridor_info.get("key_slot", "Key")
        key = corridor_info["api_key"]
        candidate_keys.append((key, f"{member} ({slot})", member))

    if test_key:
        candidate_keys.append((test_key, "Dedicated Test/Fallback Key", "Test Admin"))

    for k in keys:
        if k not in [ck[0] for ck in candidate_keys]:
            candidate_keys.append((k, "Global Pool Key", "Pool"))

    if not candidate_keys:
        raise RuntimeError("No SerpApi keys configured. Please check .env or api_keys_registry.json.")

    attempts = 0
    max_attempts = len(candidate_keys)
    last_error: Exception | None = None

    while attempts < max_attempts:
        active_key, key_label, owner_name = candidate_keys[attempts]
        masked = active_key[:4] + "..." + active_key[-4:] if len(active_key) > 8 else "***"
        print(f"  [KEY SELECTION] Using key assigned to {key_label} ({masked}) for {route_code}")
        attempts += 1
        try:
            response = requests.get(
                SERPAPI_URL,
                params={
                    "engine": "google_flights",
                    "departure_id": origin,
                    "arrival_id": destination,
                    "outbound_date": outbound_date,
                    "type": "2",
                    "currency": "INR",
                    "hl": "en",
                    "api_key": active_key,
                },
                timeout=30,
            )

            # Check for quota exhaustion / HTTP 429
            if response.status_code in (429, 403):
                print(
                    f"\n  ⚠️  [KEY ALERT] HTTP {response.status_code} on corridor {route_code}!\n"
                    f"     Key Owner: {key_label}\n"
                    f"     Fingerprint: {masked}\n"
                    f"     Action Needed: Please check with {owner_name} regarding this SerpApi key."
                )
                if attempts < max_attempts:
                    print(f"     [FALLBACK] Automatically switching to next candidate key...\n")
                continue

            response.raise_for_status()
            payload = response.json()

            if not isinstance(payload, dict):
                raise RuntimeError("SerpApi returned a non-object response.")

            error_msg = str(payload.get("error", "")).lower()
            if "limit has been reached" in error_msg or "quota" in error_msg or "invalid api key" in error_msg:
                print(
                    f"\n  ⚠️  [KEY ALERT] Quota/Validation issue on corridor {route_code}!\n"
                    f"     Key Owner: {key_label}\n"
                    f"     Fingerprint: {masked}\n"
                    f"     Error Details: {payload.get('error')}\n"
                    f"     Action Needed: Please notify {owner_name} to verify/replace this key."
                )
                if attempts < max_attempts:
                    print(f"     [FALLBACK] Automatically switching to next candidate key...\n")
                continue

            if payload.get("error"):
                raise RuntimeError(f"SerpApi error: {payload['error']}")

            quotes = extract_quotes(payload, quote_limit)
            horizon = booking_horizon(outbound_date)

            corridor_base = get_corridor_baseline(route_code)
            fare_objects = []
            for airline, total_fare in quotes:
                base_fare, clean_total = unbundle_fare(total_fare, origin)
                fare_objects.append(
                    FareQuote(
                        airline=airline,
                        route_code=route_code,
                        booking_horizon=horizon,
                        base_fare=base_fare,
                        total_fare=clean_total,
                        corridor_baseline_30d=corridor_base,
                    )
                )

            result = persist_quotes(fare_objects)
            print(
                f"  SerpApi returned {len(quotes)} valid quotes for {route_code} [{horizon}] "
                f"({result['accepted']} accepted, {result['quarantined']} quarantined)"
            )
            return result

        except requests.RequestException as exc:
            last_error = exc
            print(f"  Request error on key {key_label} ({masked}): {exc}")
            if attempts < max_attempts:
                print(f"  [FALLBACK] Switching to next candidate key...\n")
            continue

    raise RuntimeError(f"All {len(candidate_keys)} SerpApi keys exhausted or failed for {route_code}. Last error: {last_error}")


if __name__ == "__main__":
    fetch_real_flight()