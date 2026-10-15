"""Verify all 14 teammate SerpApi keys + 1 test key.

Performs 1 live test search per key for its assigned corridor, extracts real flight
quotes, decomposes unbundled taxes/fees, and persists valid records to skyfare_live.db.
"""

import io
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path
import requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fetch_real_data import extract_quotes, unbundle_fare, booking_horizon
from scraper import FareQuote, persist_quotes

REGISTRY_PATH = Path(__file__).resolve().parent / "api_keys_registry.json"
SERPAPI_URL = "https://serpapi.com/search.json"


def test_keys() -> None:
    if not REGISTRY_PATH.exists():
        print(f"Error: Registry file not found at {REGISTRY_PATH}")
        return

    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        registry = json.load(f)

    assignments = registry.get("corridor_assignments", [])
    test_key_info = registry.get("test_key", {})

    test_key_val = (
        os.environ.get(test_key_info.get("env_var", ""))
        or test_key_info.get("key", "")
    )
    print("=" * 85)
    print("SkyFare India - Live Key Verification & Initial Data Ingestion")
    print("=" * 85)
    print(f"Total Dedicated Corridor Keys to Test: {len(assignments)}")
    print(f"Staging / Fallback Key: {test_key_val[:8]}... ({test_key_info.get('status')})")
    print(f"Execution: 1 live search per key on its assigned corridor")
    print("=" * 85 + "\n")

    # Use departure date 7 days from now (T+7 business horizon)
    test_outbound_date = (date.today() + timedelta(days=7)).isoformat()
    horizon = booking_horizon(test_outbound_date)

    results_table = []
    total_quotes_inserted = 0

    for idx, item in enumerate(assignments, 1):
        corridor = item["corridor"]
        origin = item["origin"]
        destination = item["destination"]
        member = item["member"]
        slot = item["key_slot"]
        env_var = item.get("env_var") or f"SERPAPI_KEY_{corridor.replace('-', '_')}"
        api_key = os.environ.get(env_var, "") or item.get("api_key", "")
        masked = api_key[:4] + "..." + api_key[-4:] if len(api_key) > 8 else "***"

        print(f"[{idx:2d}/14] Testing Key #{idx}: {corridor:7s} | Teammate: {member:8s} ({slot}) | Key: {masked}...")

        start_time = time.time()
        try:
            resp = requests.get(
                SERPAPI_URL,
                params={
                    "engine": "google_flights",
                    "departure_id": origin,
                    "arrival_id": destination,
                    "outbound_date": test_outbound_date,
                    "type": "2",
                    "currency": "INR",
                    "hl": "en",
                    "api_key": api_key,
                },
                timeout=35,
            )
            elapsed = round(time.time() - start_time, 2)

            if resp.status_code == 200:
                payload = resp.json()
                if isinstance(payload, dict) and payload.get("error"):
                    err_msg = payload.get("error")
                    print(f"     [FAIL] SerpApi Error -> {err_msg}")
                    results_table.append({
                        "corridor": corridor,
                        "member": member,
                        "slot": slot,
                        "status": "FAILED",
                        "details": str(err_msg)[:40],
                        "quotes": 0
                    })
                else:
                    quotes = extract_quotes(payload, limit=30)
                    fare_objects = []
                    for airline, total_fare in quotes:
                        base_fare, clean_total = unbundle_fare(total_fare, origin)
                        fare_objects.append(
                            FareQuote(
                                airline=airline,
                                route_code=corridor,
                                booking_horizon=horizon,
                                base_fare=base_fare,
                                total_fare=clean_total,
                            )
                        )
                    persisted = persist_quotes(fare_objects)
                    accepted = persisted.get("accepted", 0)
                    total_quotes_inserted += accepted
                    sample_price = f"INR {quotes[0][1]:,.0f} ({quotes[0][0]})" if quotes else "N/A"
                    print(f"     [PASS] SUCCESS ({elapsed}s): Retrieved {len(quotes)} flights | Sample: {sample_price} | {accepted} quotes saved to DB")
                    results_table.append({
                        "corridor": corridor,
                        "member": member,
                        "slot": slot,
                        "status": "ACTIVE / WORKING",
                        "details": f"{len(quotes)} flights ({sample_price})",
                        "quotes": accepted
                    })
            else:
                print(f"     [FAIL] (HTTP {resp.status_code}): {resp.text[:80]}")
                results_table.append({
                    "corridor": corridor,
                    "member": member,
                    "slot": slot,
                    "status": f"HTTP {resp.status_code}",
                    "details": "Check quota/validity with teammate",
                    "quotes": 0
                })

        except Exception as exc:
            print(f"     [FAIL] EXCEPTION: {exc}")
            results_table.append({
                "corridor": corridor,
                "member": member,
                "slot": slot,
                "status": "ERROR",
                "details": str(exc)[:40],
                "quotes": 0
            })

        # Brief delay to respect rate limits
        time.sleep(1.0)

    # Test Staging Test Key
    test_key_val = test_key_info.get("key", "")
    if test_key_val:
        masked_test = test_key_val[:4] + "..." + test_key_val[-4:]
        print(f"\n[Test Key] Testing Fallback Staging Key ({masked_test}) on DEL-BOM...")
        try:
            resp = requests.get(
                SERPAPI_URL,
                params={
                    "engine": "google_flights",
                    "departure_id": "DEL",
                    "arrival_id": "BOM",
                    "outbound_date": test_outbound_date,
                    "type": "2",
                    "currency": "INR",
                    "hl": "en",
                    "api_key": test_key_val,
                },
                timeout=35,
            )
            if resp.status_code == 200 and not resp.json().get("error"):
                print(f"     [PASS] SUCCESS: Staging Test Key is ACTIVE and functional.")
                test_key_status = "ACTIVE / FUNCTIONAL"
            else:
                err_msg = resp.json().get("error") if resp.status_code == 200 else f"HTTP {resp.status_code}"
                print(f"     Note: Staging Test Key status: {err_msg}")
                test_key_status = str(err_msg)[:30]
        except Exception as exc:
            print(f"     Note: Staging Test Key check exception: {exc}")
            test_key_status = "ERROR"
    else:
        test_key_status = "NOT_CONFIGURED"

    # Print Final Verification Table
    print("\n" + "=" * 90)
    print("FINAL API KEY VERIFICATION & INGESTION SUMMARY")
    print("=" * 90)
    print(f"{'#':<3} | {'Corridor':<8} | {'Teammate':<9} | {'Slot':<6} | {'Status':<18} | {'Observations Ingested'}")
    print("-" * 90)

    working_count = 0
    for idx, r in enumerate(results_table, 1):
        is_ok = r["status"] == "ACTIVE / WORKING"
        if is_ok:
            working_count += 1
        icon = "[OK]" if is_ok else "[FAIL]"
        print(f"{idx:<3} | {r['corridor']:<8} | {r['member']:<9} | {r['slot']:<6} | {icon} {r['status']:<15} | {r['details']}")

    print("-" * 90)
    print(f"Teammate Keys Working: {working_count} / {len(assignments)} ({(working_count/len(assignments))*100:.1f}%)")
    print(f"Staging Fallback Key:  {test_key_status}")
    print(f"Total New Real Flight Quotes Added to skyfare_live.db: {total_quotes_inserted}")
    print("=" * 90)

    # Recalculate Live National Price Index
    try:
        from main import calculate_live_index, persist_daily_index
        print("\nRecalculating National Airfare Indices from updated live database observations...")
        live_index = calculate_live_index()
        if live_index.get("observations", 0) > 0:
            persist_daily_index(live_index)
            print(f"  [OK] Updated Today's Fisher Ideal Index: {live_index['fisher_ideal_index']}")
            print(f"       Laspeyres: {live_index['laspeyres_index']} | Paasche: {live_index['paasche_index']}")
            print(f"       Total Live Observations Now in Database: {live_index['observations']}")
            print(f"       Corridors Represented: {live_index['routes']} / 14")
    except Exception as exc:
        print(f"  Note: Index recalculation: {exc}")


if __name__ == "__main__":
    test_keys()
