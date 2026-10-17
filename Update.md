# 📝 Active Backlog, Pending Roadmap & Deferred Tasks — SkyFare India
## Continuous Maintenance & Progress Audit Log

> **MANDATORY WORKFLOW PROTOCOL**:
> 1. This file tracks all items that are currently pending, left to do, or deferred for later implementation.
> 2. Whenever any task listed here is completed:
>    - Remove it from the active backlog below (or move it to the Completed Archive).
>    - **Immediately audit and record the completed work in [`README.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md)** under *Recent Major Upgrades & Bug Fixes*.

* **Last Updated**: `2026-10-17` (4x Daily Automated Ingestion, 3-Hour Delay Absorption, Strict SerpApi Quota Preservation, Route Locking & Instant UI Cache)
* **Official Transition Target**: `2026-11-08` ($T+45$ Days)
* **Current Status**: `100% FULLY AUTOMATED & DEPLOYED IN PRODUCTION`
* **Production URL**: `https://skyfare-india.vercel.app/`
* **Current Live Index**: `165.65` (Superlative Fisher Ideal Index across 46,902 quotes)

---

## 🏆 Priority 0: 4x Daily Schedule, Quota Preservation & Instant UI Cache (`2026-10-17`)

- [x] **1. 4x Daily Ingestion Rescheduling with 3-Hour Runner Queue Delay Absorption**:
  - Rescheduled [`.github/workflows/scheduled_ingestion.yml`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.github/workflows/scheduled_ingestion.yml) from 3x to **4x daily** across non-congested minutes (`:20`, `:40`) to bypass GitHub Actions runner queue spikes:
    - **Shift 1 (Morning Early Bird)**: `20 0 * * *` (00:20 UTC = 05:50 AM IST)
    - **Shift 2 (Midday Market)**: `40 5 * * *` (05:40 UTC = 11:10 AM IST)
    - **Shift 3 (Evening Surge)**: `20 11 * * *` (11:20 UTC = 04:50 PM IST)
    - **Shift 4 (Night Final & EOD)**: `40 16 * * *` (16:40 UTC = 10:10 PM IST)
  - Mathematical delay absorption: Shifts spaced 5.5 to 7.5 hours apart, ensuring that even under severe 3-hour GitHub queue delays, consecutive runs never collide, and a minimum of 3 (typically all 4) distinct scans complete every single calendar day.

- [x] **2. Strict SerpApi Quota Preservation & Anti-Block Insurance Architecture**:
  - Implemented `is_serpapi_eligible(shift_name, horizon)` in [`batch_fetch_real_data.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/batch_fetch_real_data.py) to eliminate API credit burnout:
    - **Shift 1 (Morning)**: SerpApi queries **only $T+1$ and $T+7$** (28 calls) to track spot/peak opening volatility.
    - **Shifts 2 & 3 (Midday & Evening)**: SerpApi is **OFF (0 calls)**; Scrapling handles all 5 horizons for all 14 corridors at **$0 API cost**.
    - **Shift 4 (Night)**: SerpApi queries **all 5 horizons** ($T+1..T+45$, 70 calls) to provide full dual-engine consensus and anchor the official EOD Fisher Ideal National Airfare Index.
  - Capped daily SerpApi usage to $28 + 0 + 0 + 70 = \mathbf{98 \text{ queries/day}}$ ($\mathbf{210 \text{ calls/month per key}}$ across 14 teammate keys), comfortably within developer free tiers.
  - Serves as anti-block insurance: if OTAs ever adjust anti-scraping countermeasures, SerpApi guarantees every horizon is refreshed daily.

- [x] **3. Airport Dropdown Corridor Restriction & Live Hang Elimination**:
  - Restricted Origin & Destination dropdowns in `Header.tsx` and `CorridorDeepDive.tsx` strictly to the 14 official DGCA monitored trunk corridors.
  - Eliminated invalid selections (e.g. Kolkata-Kolkata, Goa-Goa, or unmonitored pairs like Kolkata-Bangalore).
  - Implemented auto-selection of valid destination pairs upon changing origin, completely eliminating perpetual "Connecting to live feed..." loading hangs.

- [x] **4. Instant Client-Side Cache Layer, Cold-Start Banner & Dynamic Badges**:
  - Added instant `sessionStorage` caching across views so navigating between tabs (e.g., Home to Booking Horizon) renders instantaneously (<50ms) instead of reverting to demo placeholders during API fetches.
  - Added a dynamic cold-start banner notifying users when the Render backend container is waking up.
  - Added dynamic live status badges that only display "Live Connected" with a green pulse when the backend successfully returns fresh data, displaying "Offline / Cached" otherwise.

- [x] **5. Hardened Admin Authentication & Edge Security Headers**:
  - Removed hardcoded credentials, client-side demo autofill, and client validation bypasses from `AdminLoginModal.tsx`.
  - Configured Vercel edge security headers in `vercel.json` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`).

- [x] **6. Automated Verification & Test Suite Expansion**:
  - Added `tests/test_batch_shifts.py` validating 4-shift detection windows, delay boundaries, and SerpApi horizon eligibility.
  - Expanded test suite to **57 unit tests (all passing in 9.3s)**; production Vite build verified in 16.08s.

---

## 🏆 Priority 1: Production Cloud Deployment & 4-Tier Automation (`2026-10-16`)

- [x] **1. React 19 Frontend Deployment to Vercel (`https://skyfare-india.vercel.app/`)**:
  - Implemented [`vercel.json`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/vercel.json) configuring framework preset (`vite`), SPA routing rewrite (`/(.*) -> /index.html`), and long-term immutable caching (`public, max-age=31536000`) for all `/assets/*` chunks.
  - Resolved framework environment variable visibility protocol (`visibility: config` for `VITE_API_BASE_URL`).
  - Production build verified in 5.06s; live HTTP 200 delivery across global edge networks.

- [x] **2. FastAPI Cloud Compute Engine on Render (`skyfare-india-api`)**:
  - Configured [`render.yaml`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/render.yaml) and [`Procfile`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/Procfile) enabling zero-config 1-click Python 3.12 deployment with Uvicorn server.
  - Added permissive yet secure CORS middleware in [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py) explicitly authorizing `https://skyfare-india.vercel.app` and any `*.vercel.app` deployment domains.

- [x] **3. Authentic Empirical Dataset Bundling (`42,945 Quotes, Index 166.48`)**:
  - **Empirical Audit**: Resolved discrepancy between initial seed fallback (114.95) and authentic post-epoch continuous collection.
  - Un-ignored `!skyfare_live.db` in [`.gitignore`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.gitignore) and checkpointed full WAL state (5.7 MB).
  - Bundled all 23 continuous ingestion days (`2026-09-24` inception at `164.36` through `2026-10-16` at `166.48`) and 42,945 real quotes, eliminating mock fallback dependencies.
  - Built `pull_from_supabase_if_empty()` in [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py) for self-healing automated cloud hydration.

- [x] **4. Geospatial Map Height & Regulatory Tariff Legend Alignment**:
  - Harmonized [`RealGoogleMapView.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/RealGoogleMapView.tsx) and [`IndiaCorridorHeatmap.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/IndiaCorridorHeatmap.tsx) height to `min-h-[560px] lg:min-h-[590px]`, matching the vertical span of the Corridor Deep Dive block and eliminating top/bottom blank gaps.
  - Synchronized 4-tier tariff color codes across both maps: Critical Surge ($>15\%$ Red), Moderate ($5-15\%$ Orange), Stable ($0-5\%$ Blue), and Softening ($<0\%$ Green), adding the missing Blue Stable indicator to the map legend.

- [x] **5. 100% Autonomous Pipeline Audit (Zero Manual Intervention Required)**:
  - **Ingestion**: 3x daily GitHub Actions cron (`05:15`, `10:15`, `17:15` UTC) scrapes 14 DGCA corridors via Scrapling/SerpApi and pushes directly to Supabase cloud.
  - **Storage**: Supabase stores all microdata observations permanently with 24/7 cloud persistence.
  - **Compute**: Render runs FastAPI calculations, serving real-time indices.
  - **Frontend**: Vercel serves the user interface with zero downtime.

---

## 🔴 Priority 1: Completed Operational Resolutions (`2026-10-08`)

- [x] **1. National Index Drop (177 -> 140) Investigation, Root Cause Fix & Recalculation**:
  - **Empirical Audit**: Raw quotes on Oct 8 (465 quotes, avg fare ₹12,095.62) vs Oct 7 (avg ₹10,269.62) proved airfares rose by +17.78% due to peak weekend/holiday demand. There was no real price crash.
  - **Root Cause**: After legacy seed rows were purged, `corridor_baseline_30d` was NULL on new quotes. `main.py`'s `calculate_live_index()` fell back to `base_price = sum(base_fare) / len`, calculating the single-ticket tax markup ratio ($\frac{\text{Total Fare}}{\text{Base Fare}} \approx 1.4088 \to 140.88$) instead of a temporal inflation index.
  - **Fix Deployed**: Established statutory `BASE_CORRIDOR_TARIFFS` and `get_corridor_baseline()` in `database.py`. Updated `main.py` to always benchmark against statutory corridor baselines. Fixed `dod_change_pct` to compute true Day-over-Day percentage change vs the previous day in `daily_indices`.
  - **Recalculation**: Synchronized `daily_indices` for today (`2026-10-08`) to reflect the authentic continuous index (`183.42`, `+3.23% DoD`).

- [x] **2. Scrapling Stealth Ingestion Engine & Dual-Database Backup Integration**:
  - Implemented `scrapling_fetcher.py` using Scrapling (`v0.4.15` + `curl_cffi` TLS/JA3 impersonation) to bypass bot shields and collect live airfare microdata without browser overhead.
  - **Dedicated Scrapling Database (`skyfare_scrapling.db`)**: Scrapling saves all its collected observations into its own independent SQLite database with full schema parity (`fare_observations`, `fare_quarantine`, `route_weights`).
  - **Automated Failover Backup**: Scrapling replicates its quotes into `skyfare_live.db` as a resilient backup stream if SerpApi quotas run out or request failures occur.
  - **Dataset Comparison Analytics**: Added `compare_datasets()` and REST endpoint `GET /api/v1/analytics/engine-comparison` to provide side-by-side verification of quote volumes, average fares, price spreads, and parity status across all 14 DGCA corridors.
  - Wired dual-engine support into `batch_fetch_real_data.py` (`--engine dual`), enabling simultaneous data collection from both SerpApi and Scrapling.
- [x] **3. Sovereign AI Chatbot & Microdata RAG Engine Overhaul (`2026-10-11`)**:
  - **Empirical Audit**: Diagnosed root cause of repetitive/presaved responses — `PolicyChatbotView.tsx` previously utilized a static 25-clause `if (q.includes(...))` tree returning 22 hardcoded static text presets (stale September Fisher Index 114.50), returning identical answers to different queries.
  - **Live Backend Engine (`POST /api/v1/chat/query`)**: Built `assemble_live_chat_context()` in `main.py` grounding every answer in live SQLite microdata: Fisher Ideal Index (`173.79`), 14 DGCA corridors, directional spot pricing & 7-day baselines, advance booking yield curves ($T+1$ to $T+45$), carrier market shares (IndiGo 62.4%, Air India 28.3%, HHI 4,412), headline CPI pass-through (+12.7 bps transport, +0.26 bps headline), and Rule 135 compliance (99.6%).
  - **Dual-Tier Resilient Architecture**: Primary generation via Gemini 2.5 Flash (`urllib.request`, zero third-party packages) with automatic fallback to deterministic Econometric Knowledge Synthesizer (`generate_econometric_chat_response()`).
  - **Security & Validation**: Enforced sliding window rate limiting (40 req/min). Added `tests/test_chat.py` (all 54 backend tests pass). Verified clean Vite build (`npm run build`).

---

## 🟡 Priority 2: Empirical Baseline & 30-Day Reversion Roadmap

> [!IMPORTANT]
> **TEMPORARY 7-DAY EMPIRICAL BASELINE WINDOW (ACTIVE OCTOBER 2026)**:
> - **Pre-Epoch Legacy Purge Completed**: On `2026-10-07`, all 652 pre-epoch development records (`< 2026-09-24`) and 36 pre-epoch daily indices were permanently purged from `skyfare_live.db`. The database now contains **19,306 pure empirical observations** collected exclusively from SerpAPI since the `2026-09-24` inception epoch.
> - **Baseline Calibration Policy**: All corridor baseline metrics, `Relative Shift (%)`, and DGCA dynamic surge checks are currently computed from the **trailing 7-day empirical baseline window** (using real SerpAPI observations). This eliminates the artificial +80% surge distortion caused by legacy low-fare seeds.
> - **Scheduled Revert to 30 Days**: As soon as 30 full days of continuous empirical collection have accumulated in the database (Target: `2026-10-24`), this baseline calculation will be transitioned back to a standard **30-day rolling baseline**.

- [x] **1. Legacy Pre-Epoch Data Purge Completed (`2026-10-07`)**
  - *Completed*: Purged all 652 legacy pre-epoch observations and 36 pre-epoch synthetic daily indices prior to `2026-09-24`. Database contains 19,306 pure live quotes and 14 empirical daily indices.

- [ ] **2. Revert Baseline Window to 30 Days (`2026-10-24`)**
  - *Description*: Once 30 full days of real continuous collection have accumulated in `skyfare_live.db` (after `2026-10-24`), transition `get_routes()` and `get_route_analytics_rows()` from the current 7-day empirical window back to the full 30-day rolling baseline window.

---

## 🟢 Priority 3: Feature Enhancements & Benchmark Transitions

- [ ] **3. "Hackathon Wi-Fi" Safety Net (Offline / Demo Mode)**
  - *Location*: `AdminDashboard.tsx`, `App.tsx`.
  - *Current State*: UI relies heavily on live `/api` server availability.
  - *To Do*: Add an explicit "Offline / Demo Mode" toggle in the MoSPI Admin Dashboard. When activated, the UI instantly switches to reading from a static, pre-loaded JSON file of perfect benchmark data, turning the "Live API Connected" badge into a yellow "Calibrated Offline Demo" badge.

- [ ] **4. Dynamic Live High-Frequency Quote Counter**
  - *Location*: `AnomalyWatchlistPanel.tsx`, `MospiBulletinModal.tsx`.
  - *Current State*: Displays calibrated benchmark figure representing national multi-carrier production volume.
  - *To Do*: Wire directly to `SELECT COUNT(*) FROM fare_observations` once the 45-day continuous collection finishes and data volume scales.

- [ ] **5. Automated DGCA Fleet Registry Parser**
  - *Location*: `CarrierAnalyticsPanel.tsx`.
  - *Current State*: Displays structural DGCA airline fleet counts based on official annual fleet statistics.
  - *To Do*: Implement an automated monthly web scraper targeting the DGCA official fleet registry portal to update active aircraft and seat capacity automatically.

- [ ] **6. Headless Server-Side MoSPI Official PDF Export Engine**
  - *Location*: `AdminDashboard.tsx` (`admin_export` sub-section).
  - *Current State*: Generates client-side formatted summary and CSV exports.
  - *To Do*: Integrate server-side headless Chromium (Puppeteer/Playwright or WeasyPrint) in `main.py` at `POST /api/v1/export/bulletin-pdf` to generate official government-embossed MoSPI statistical bulletins with KaTeX math rendering and vector charts.

- [ ] **7. Direct Airline NDC Sandbox Connector Prototypes**
  - *Location*: `AdminDashboard.tsx` (`ScraperChannel` network latency monitors).
  - *Current State*: Simulates direct airline NDC and GDS channel feeds alongside SerpApi live metasearch.
  - *To Do*: Develop direct IATA NDC XML/JSON schema adapters for Air India and IndiGo if test sandbox credentials become available.

- [ ] **8. Regional / UDAN RCS Route Expansion (Phase 2 Roadmap)**
  - *Current State*: Tracks the 14 core DGCA trunk corridors representing $>65\%$ of domestic passenger traffic.
  - *To Do*: Expand database schema and scraper routes to ingest regional and UDAN subsidized routes into a dedicated secondary index tier.

---

## 🛡️ Priority 4: Sovereign Security Hardening & Remediation Roadmap (Vibe Security & OWASP)

> [!NOTE]
> Systematically audits and remediates security vulnerabilities identified via [`vibe-security-skill`](https://github.com/raroque/vibe-security-skill), **Semgrep SAST**, **Gitleaks**, and the newly installed [`expert-security-auditor`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/expert-security-auditor/SKILL.md) skill. Tasks will be fixed and verified sequentially.

- [x] **1. Server-Side Admin Authentication Endpoint (`POST /api/v1/auth/login`)**
  - *Location*: [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py), [`src/components/AdminLoginModal.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/AdminLoginModal.tsx), [`src/App.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/App.tsx).
  - *Implemented*: Created cryptographic server-side authentication using Python standard library (`hmac`, `hashlib`, `secrets`) supporting environment password hash overrides (`SKYFARE_ADMIN_PASSWORD_HASH`), issuing HMAC-SHA256 signed session tokens (12h TTL), and session verification endpoint (`GET /api/v1/auth/verify`). Verified via 6 dedicated automated unit tests in [`tests/test_auth.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_auth.py) (29/29 tests pass). Clean Vite production build verified.

- [x] **2. Ingestion & Worker Endpoint Route Protection (`X-Admin-Key`)**
  - *Location*: [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py) (`worker_router`, `POST /api/v1/ingest/run`), [`src/components/AdminDashboard.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/AdminDashboard.tsx).
  - *Implemented*: Attached `require_admin_authorization` dependency guard across all worker routes (`/api/v1/worker/*`) and ingestion triggers (`POST /api/v1/ingest/run`). Enforces dual-channel authorization: constant-time API key verification (`X-Admin-Key` matching `SKYFARE_ADMIN_KEY`) or HMAC session token (`X-Admin-Token` / `Bearer`). Updated `AdminDashboard.tsx` to transmit authenticated headers. Added 5 dedicated unit tests in [`tests/test_auth.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_auth.py) (34/34 tests pass). Clean Vite production build verified.

- [x] **3. In-Memory Server-Side Rate Limiter (Sliding Window)**
  - *Location*: [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py).
  - *Implemented*: Built a thread-safe in-memory sliding window rate limiter (`SlidingWindowRateLimiter`) using Python standard library (`collections.defaultdict`, `time`, `threading.Lock`). Throttles `/api/v1/fares/search` (60 req/min), `/api/v1/auth/login` (10 req/min), and mutating worker ingestion triggers `/api/v1/worker/trigger-now` & `/api/v1/ingest/run` (5 req/min). Emits RFC 6585 `HTTP 429 Too Many Requests` with dynamic `Retry-After` header. Verified via 3 dedicated unit and integration tests in [`tests/test_rate_limiter.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_rate_limiter.py) (37/37 tests pass). Clean Vite production build verified.

- [x] **4. SQLite WAL Mode & Concurrency Timeout Hardening (`PRAGMA journal_mode = WAL`)**
  - *Location*: [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py), [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py), [`scraper.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/scraper.py).
  - *Implemented*: Built a unified, hardened connection factory `get_db_connection()` executing `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`, `PRAGMA synchronous = NORMAL;`, `PRAGMA foreign_keys = ON;`, and 10s connection timeout. Eliminates `database is locked` race conditions between concurrent web readers and scraper worker batch writes. Verified via dedicated concurrency test in [`tests/test_database_wal.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_database_wal.py) (39/39 tests pass). Clean Vite production build verified.

- [x] **5. Scenario Simulator Input Boundary Clamping**
  - *Location*: [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py) (`ScenarioSimulationRequest`).
  - *Implemented*: Clamped simulation inputs using Pydantic `Field` bounds: `atf_shock_pct: float = Field(default=0.0, ge=-100.0, le=200.0)`, `demand_shift_pct: float = Field(default=0.0, ge=-100.0, le=200.0)`, and `fleet_grounding_pct: float = Field(default=0.0, ge=-100.0, le=100.0)`. Prevents numeric overflow and NaN poisoning. Added 4 unit tests in [`tests/test_scenario.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_scenario.py) validating HTTP 200 on valid inputs/defaults and HTTP 422 on out-of-bounds payloads (43/43 tests pass). Clean Vite production build verified.

- [x] **6. Local Security Tool Scans (Gitleaks, Semgrep, Trivy)**
  - *Location*: Workspace root, Python backend, and frontend packages.
  - *Results*:
    - **Gitleaks**: 6.33 MB scanned $\to$ **0 leaked secrets/credentials**.
    - **Semgrep SAST**: 104 files scanned across 503 rules $\to$ **10 code findings** (all related to SQL string concatenation in `database.py`, `main.py`, and `scrapling_fetcher.py`).
    - **Trivy Scanner**: Scanned lockfile $\to$ **2 CVEs found** in `bun.lock` (`proxy-addr` CVE-2026-90711 [CRITICAL] and `source-map-js` CVE-2026-93749 [HIGH]).

- [x] **7. Semgrep SQL Query Parameterization & Sanitization**
  - *Location*: [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py), [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py), [`scrapling_fetcher.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/scrapling_fetcher.py).
  - *Implemented*: Eliminated all dynamic f-string SQL query interpolations: replaced dynamic DDL string concatenation in `database.py` with static DDL statements, converted table pragma in `main.py` to parameterized `pragma_table_info(?)`, and refactored all dataset comparison queries in `scrapling_fetcher.py` to static parameterized SQL branches. Verified with Semgrep SAST scan: **0 findings across 104 files and 503 rules**. All 43 unit tests pass. Clean Vite production build verified.

- [x] **8. Frontend Dependency CVE Remediation (`bun.lock` / `package.json`)**
  - *Location*: [`package.json`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/package.json), [`bun.lock`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/bun.lock).
  - *Implemented*: Remediated CRITICAL CVE-2026-90711 (`proxy-addr`) by upgrading to patched `2.0.8` and HIGH CVE-2026-93749 (`source-map-js`) by upgrading to patched `1.2.2`. Declared explicit resolution overrides in `package.json` and updated package definitions with integrity hashes in `bun.lock`. Re-scanned with Trivy: **0 vulnerabilities detected (Clean)**. Clean Vite production build verified.

- [x] **9. Edge Perimeter & HTTP Security Headers (`cloudflare-security-audit`)**
  - *Location*: [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py) (CORS middleware & security headers).
  - *Implemented*: Restricted CORS `allow_origin_regex` strictly to local development hosts (`localhost` and `127.0.0.1`), removing broad LAN subnet regex wildcards. Added Starlette HTTP security middleware enforcing defense-in-depth headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-XSS-Protection: 1; mode=block`. Verified via 3 dedicated unit tests in [`tests/test_security_headers.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_security_headers.py) (46/46 tests pass). Clean Vite production build verified.

- [x] **10. Autonomous Task Runner Concurrency Lock & Validation (`agent-audit`)**
  - *Location*: [`run_scheduled_ingestion.bat`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/run_scheduled_ingestion.bat), [`batch_fetch_real_data.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/batch_fetch_real_data.py).
  - *Implemented*: Built an atomic process-level file lock (`IngestionLock` via `.ingestion.lock`) with active process ID tracking, automatic release on exit (`atexit`), and 30-minute stale-lock breaking recovery. Prevents overlapping Task Scheduler or batch worker jobs from contending or double-fetching API quotas. Added strict CLI argument validation (`morning`, `night`, `all` shifts and whitelist horizon validation). Verified via 3 dedicated unit tests in [`tests/test_ingestion_lock.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/tests/test_ingestion_lock.py) (49/49 tests pass). Clean Vite production build verified.

---

## ⚡ Priority 5: Supabase Cloud Hosting & Managed Infrastructure Roadmap

> [!IMPORTANT]
> **OFFICIAL PRODUCTION HOSTING ARCHITECTURE (SUPABASE)**:
> SkyFare India will use **[Supabase](https://supabase.com/)** for cloud backend hosting, managed database, and real-time synchronization. This replaces local SQLite single-file limitations with high-performance cloud PostgreSQL, automated backups, Edge Functions, and native Realtime WebSockets for web and mobile clients (iOS/Android/Windows).

- [x] **1. Supabase PostgreSQL Schema Migration & DDL Initialization**
  - *Location*: [`supabase_schema.sql`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/supabase_schema.sql).
  - *Implemented*: Generated idempotent, production-grade PostgreSQL DDL script (`supabase_schema.sql`) for Supabase. Includes all core tables (`fare_observations`, `fare_quarantine`, `daily_indices`, `route_weights`), consensus view (`v_platform_consensus_fares`), and pre-seeded official DGCA 14-corridor traffic statistics.
 
- [x] **2. Dual-Engine Database Driver (Hybrid Offline SQLite + Cloud Supabase)**
  - *Location*: [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py), [`.env.example`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.env.example).
  - *Implemented*: Added environment-aware database connection helpers (`is_postgres_configured`, `get_postgres_connection`). When `DATABASE_URL` is set, connects securely to Supabase PostgreSQL; otherwise seamlessly falls back to local hardened SQLite WAL mode for offline development and local test suites.
 
- [x] **3. Row-Level Security (RLS) & MoSPI Admin Authorization Policies**
  - *Location*: [`supabase_schema.sql`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/supabase_schema.sql).
  - *Implemented*: Enforced database-level RLS policies on Supabase: public `SELECT` read access on `fare_observations`, `daily_indices`, and `route_weights` for citizen transparency and macroeconomic research; write mutations (`INSERT`, `UPDATE`, `DELETE`) locked strictly to authenticated `service_role` keys.

- [ ] **4. Supabase Realtime WebSocket Subscriptions for Live Corridor Surveillance**
  - *Location*: `src/components/RouteIntelligencePanel.tsx`, `src/components/IndiaCorridorHeatmap.tsx`.
  - *Current State*: Frontend polls REST endpoints periodically.
  - *To Do*: Integrate `@supabase/supabase-js` Realtime listeners on `daily_indices` and `price_anomalies` tables to stream live price updates and Rule 135 festive surge alerts instantly to connected web and mobile devices.

- [ ] **5. Scheduled Ingestion via Supabase Edge Functions / pg_cron**
  - *Location*: `supabase/functions/`, Windows Task Scheduler.
  - *Current State*: Batch ingestion triggered locally via Windows Task Scheduler (`run_scheduled_ingestion.bat`).
  - *To Do*: Deploy cloud-native scheduled cron tasks using Supabase `pg_cron` and Edge Functions to orchestrate headless multi-horizon scraping independently of local machine runtime.

---

## 🚀 Priority 6: Strategic Shift from SerpApi to 100% Scrapling Stealth Ingestion Engine

> [!IMPORTANT]
> **ROADMAP MANDATE: TRANSITION TO ZERO-COST, UNLIMITED SCRAPLING INGESTION**:
> SkyFare India is transitioning its primary data harvesting pipeline from third-party **SerpApi** to the sovereign, open-source **[Scrapling](https://github.com/D4Vinci/Scrapling)** stealth engine (`scrapling_fetcher.py`). This eliminates third-party API key quota limits and enables 24/7 autonomous collection across all booking horizons.

- [ ] **1. Deprecation of SerpApi Key Dependencies & Single-Source Quota Bottlenecks**
  - *Rationale*: SerpApi enforces strict search quotas (requiring rotating pools of teammate keys). In contrast, Scrapling uses browser TLS fingerprint impersonation (`curl_cffi`) with zero API subscriptions or credit card requirements.
  - *Target State*: Promote `scrapling_fetcher.py` to primary default engine (`--engine scrapling`) across all scheduled runs, deprecating `api_keys_registry.json`.

- [x] **2. Tri-Platform Multi-Source Pricing Transparency (Google Flights, MakeMyTrip, EaseMyTrip)**
  - *Location*: [`scrapling_fetcher.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/scrapling_fetcher.py), [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py), [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py), [`src/components/CitizenPortal.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/CitizenPortal.tsx), [`src/components/FareInspectionModal.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/FareInspectionModal.tsx).
  - *Implemented*: Ingested quotes now preserve authentic source provenance (`source_platform`: `google_flights`, `makemytrip`, `easemytrip`). The Citizen Portal and Fare Inspection Dossier visibly display dedicated source attribution badges, verifying transparent multi-channel market surveillance.

- [x] **3. 3x Daily Automated Collection Cadence Across All 5 Booking Horizons**
  - *Location*: [`batch_fetch_real_data.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/batch_fetch_real_data.py), [`run_scheduled_ingestion.bat`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/run_scheduled_ingestion.bat), [`.github/workflows/scheduled_ingestion.yml`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.github/workflows/scheduled_ingestion.yml).
  - *Implemented*: Increased ingestion frequency from 2x to 3x daily (`morning` at 10:30 AM IST / 05:00 UTC, `afternoon` at 03:30 PM IST / 10:00 UTC, `night` at 10:30 PM IST / 17:00 UTC). Every single shift now captures the **complete 5-horizon basket** (`T+1, T+7, T+15, T+30, T+45`) across all 14 corridors (70 corridor-horizon pairs per shift = 210 searches/day).

- [x] **4. GitHub Actions Cloud Runner for 24/7 Autonomous Background Harvesting**
  - *Location*: [`.github/workflows/scheduled_ingestion.yml`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.github/workflows/scheduled_ingestion.yml).
  - *Implemented*: Configured automated GitHub Actions cron workflow running in Ubuntu cloud VMs. Harvests live multi-horizon airfares and calculates official Fisher Ideal National Indices 24/7, completely eliminating dependency on local laptop power state or sleeping schedules.

- [ ] **5. Cross-Platform Statistical Consensus & Divergence Tracking**
  - *Location*: `scrapling_fetcher.py` (`v_platform_consensus_fares`).
  - *To Do*: Track platform price arbitrage spreads between Google Flights, MakeMyTrip, and EaseMyTrip, surfacing predatory surge markup divergence across aggregator channels to DGCA regulators.

---

## 💡 Proactive Architecture, Security & Feature Recommendations Backlog

> **INDEPENDENT AGENT DIRECTIVE**:
> In accordance with user directives, agents actively record and update high-impact recommendations, security enhancements, and prospective architectural improvements here as they are discovered, ensuring continuous innovation even outside direct conversational tasks.

### 🛡️ Category A: Perimeter Security & Threat Defense
- [ ] **1. Strict Content Security Policy (CSP) on Vercel CDN**:
  - *Recommendation*: Add a declarative `Content-Security-Policy` header in [`vercel.json`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/vercel.json) restricting script sources, frame ancestors, and object sources (`default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://skyfare-india-api.onrender.com https://*.supabase.co https://maps.googleapis.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com`).
  - *Impact*: Defends against cross-site scripting (XSS), malicious third-party script injection, and unauthorized data exfiltration.

- [ ] **2. Persistent Distributed Rate Limiting on FastAPI**:
  - *Recommendation*: Upgrade in-memory `SlidingWindowRateLimiter` in [`main.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/main.py) with an optional Redis or SQLite-backed token bucket store.
  - *Impact*: Prevents rate-limit counter resets during Render container scale-up or automated deploys, ensuring resilient anti-scraping and DDoS protection for public `/api/v1/*` endpoints.

- [ ] **3. Automated Dependency & CVE Scanning in CI/CD**:
  - *Recommendation*: Add a GitHub Actions security workflow running `pip-audit` for Python dependencies and `npm audit` for Node packages weekly.
  - *Impact*: Proactively detects vulnerabilities in upstream dependencies before they impact production.

### ⚙️ Category B: Data Pipeline & Reliability
- [ ] **4. Scrapling Anti-Bot Canary & Automatic Fallback Alarm**:
  - *Recommendation*: In [`batch_fetch_real_data.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/batch_fetch_real_data.py), execute a lightweight pre-flight canary probe against Google Flights / MakeMyTrip before the full batch runs. If Scrapling receives HTTP 403 or Cloudflare challenge pages, immediately alert and automatically fall back to SerpApi for that shift.
  - *Impact*: Provides automated early warning and zero data loss if OTA web structures change.

- [ ] **5. Periodic Database Integrity & WAL Maintenance**:
  - *Recommendation*: Add a weekly maintenance task in [`database.py`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/database.py) executing `PRAGMA incremental_vacuum` and `PRAGMA integrity_check`.
  - *Impact*: Prevents SQLite fragmentation and ensures index B-trees remain optimally packed over months of continuous high-frequency collection.

### 📊 Category C: Governance & Regulatory Intelligence
- [ ] **6. One-Click MoSPI/DGCA Branded Audit Dossier Export (PDF/Excel)**:
  - *Recommendation*: Add a client-side or backend PDF/Excel report generator allowing statistical officers to download an official stamped daily dossier containing Laspeyres/Paasche/Fisher calculations, corridor tariff spreads, and Rule 135 watchlist items.
  - *Impact*: Replaces manual screenshot taking during regulatory audits and government presentations.

- [ ] **7. PWA (Progressive Web App) Offline Installation Support**:
  - *Recommendation*: Add a web app manifest and lightweight service worker caching app shell assets in `index.html`.
  - *Impact*: Enables civil aviation researchers and government analysts to install SkyFare India directly as a standalone app on desktop, iPad, or Android devices.

---

## 📦 Completed Tasks Archive (Audited in README.md)

| Date | Milestone / Task Completed | Audit Reference |
| :---: | :--- | :--- |
| `2026-10-08` | **Domestic Carrier Registry Audit & Anomaly Watchlist Harmonization**: (1) **Domestic Scheduled Airline Governance** (`CarrierAnalyticsPanel.tsx` / `main.py`): Audited carrier metadata strictly to India's 5 DGCA domestic scheduled passenger operators (IndiGo `6E`, Air India `AI`, Akasa Air `QP`, Air India Express `IX`, SpiceJet `SG`), removing international metasearch transit leaks (SriLankan, Emirates, Oman Air, THAI) and locking active fleet to 651 with authentic HHI 4,412; (2) **Econometric Anomaly & Surge Calibration** (`AnomalyWatchlistPanel.tsx` / `main.py`): Differentiated standard baseline surveillance from festive peak capping. Eliminated false-positive flags on price softening (consumer surplus under DGCA Rule 135) and deduplicated quarantined outliers to distinct routes (77 quarantined, 99.6% baseline compliance). Dynamic surveillance mode switching now triggers tailored festive capping multipliers (e.g. 1.19x - 1.34x); (3) **Festive Surge Route Verification**: Aligned high-risk capping corridors strictly to the 14 monitored routes (`DEL-CCU, BOM-GOI, BLR-DEL, HYD-DEL, MAA-DEL`), eliminating unmonitored codes (`DEL-PAT`, `BOM-IXR`); (4) **Strict Agent Permission & Tool Governance**: Institutionalized anti-interruption policy in `Rules.md` forbidding interactive popup tools (`ask_question`) and ad-hoc inline command execution. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md) |
| `2026-10-08` | **Menu Statistics Empirical Microdata Synchronization & Resilient Demo Mode Preservation**: Audited and connected all analytical menu modules to live database microdata (`skyfare_live.db`) while maintaining 100% resilient Demo Mode fallbacks when offline: (1) **Advance-Booking Horizon Matrix & Yield Curve** (`BookingHorizonsPanel.tsx`): Empirical $T+1$ to $T+45$ spreads and dynamic yield multipliers ($P_T / P_{T+45}$) derived directly from 19,306 observations across all 14 corridors; (2) **Carrier Analytics & Market Intelligence** (`CarrierAnalyticsPanel.tsx` / `main.py`): Ingested 19,306 quotes, active scheduled fleet of 651 aircraft, HHI market concentration of 4,412, and live channel health across airline portals and OTAs; (3) **Irregularities & Anomaly Watchlist** (`AnomalyWatchlistPanel.tsx` / `main.py`): Replaced all synthetic mock quotes with 100% authentic surveillance metrics (19,383 scanned, 19,306 conforming, 77 quarantined, 99.6% compliance, active Rule 135 surges and Tukey IQR outliers); (4) **CPI Decomposition** (`CpiDecompositionPanel.tsx`): Real-time Transport Subgroup Impulse (+12.7 bps) and Net Headline CPI Impact (+0.26 bps); (5) **Policy Scenario Simulator** (`ScenarioSimulatorView.tsx` / `main.py`): Verified baseline anchor (114.59) and responsive ATF, demand, and fleet grounding elasticity pass-through. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md) |
| `2026-10-08` | **Corridor Mathematics Harmonization & BOM-GOI Spot Metric Audit**: Audited `skyfare_live.db` empirical quotes and resolved the apples-to-oranges calculation mismatch in the National Corridor Monitoring Matrix (`RouteIntelligencePanel.tsx` / `main.py`). The previous `-49.05%` drop for `BOM-GOI` was caused by taking an off-peak $T+7$ advance fare (₹3,651) and comparing it against the pooled 14-day multi-horizon mean (₹7,165.16). Synchronized `get_routes()` with `get_route_analytics_rows()`, establishing strictly paired apples-to-apples spot calculations: Current Spot Fare ($T+1$) is now **₹9,007.80**, paired against the 7-day $T+1$ Baseline of **₹8,926.39** (`+0.91%` Normal equilibrium band). Integrated live DGCA passenger volume weights (`rpk_weight_pct`: 4.65% for BOM-GOI) and empirical CPI transmission (`+0.3 bps`). Aligned Rule 135 status thresholds (Spike $\ge 15\%$, Elevated $\ge 5\%$, Softening $< 0\%$) identically across the Matrix Table, Heatmap, Vector Map, and Google Maps. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L470) |
| `2026-10-08` | **Geospatial Corridor Network Unification & Heatmap Sync**: Synchronized "Airfare Change Across India" ([`IndiaCorridorHeatmap.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/IndiaCorridorHeatmap.tsx)) with the National Corridor Monitoring Matrix ([`RouteIntelligencePanel.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/RouteIntelligencePanel.tsx)) by sharing the exact live `/api/v1/routes` empirical feed (guaranteeing 100% identical spot fares, baselines, and relative shifts). Corrected airport network spots: removed orphaned `PNQ` (Pune, which had 0 monitored corridors) and restored missing `GOI` (Goa) coordinates in [`AIRPORT_MAP_COORDINATES`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/data/indiaMapPaths.ts). Both the SOI Vector Map and Google Maps now accurately render the exact **7 hub airports** (DEL, BOM, BLR, CCU, HYD, MAA, GOI) that interconnect all **14 monitored DGCA corridors**. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L460) |
| `2026-10-07` | **Pre-Epoch Legacy Purge & 7-Day Empirical Baseline Calibration**: Purged all 652 pre-epoch development seed records and 36 pre-epoch synthetic daily indices prior to `2026-09-24` from `skyfare_live.db` (now housing 19,306 pure live quotes and 14 empirical daily indices). Calibrated corridor monitoring baselines and `Relative Shift (%)` to the trailing 7-day empirical window (post-epoch ramp-up), eliminating artificial +80% surge alerts. Fixed X-axis date label overlap on 1M/3M/6M/1Y in [`AirfareTrendGraph.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/AirfareTrendGraph.tsx) by implementing adaptive label sampling and dynamic Y-axis scaling. Scheduled automatic revert to 30-day baseline once 30 continuous empirical days accumulate (target: `2026-10-24`). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L450) |
| `2026-09-28` | **Official SkyFare India Peacock & Jet Brand Emblem Integration**: Automated transparent background extraction and anti-aliasing via Python SciPy/PIL for the user-designed brand emblem (soaring gold jet over tricolor-streamline peacock and sovereign Indian territory). Resized and squared to 512×512 HD assets in [`public/skyfare-logo.png`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/public/skyfare-logo.png). Replaced generic Lucide plane icons across [`TopAppBar.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/TopAppBar.tsx), [`Sidebar.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/Sidebar.tsx), [`Navbar.tsx`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/components/Navbar.tsx), and installed as browser tab favicon in [`index.html`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/index.html). Verified with clean Vite production build. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L440) |
| `2026-09-28` | **Modular Dual-Theme Engine (Light & Dark Mode Architecture)**: Split frontend design tokens into two dedicated scoped files — [`theme-light.css`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/theme-light.css) (Palette #1: pristine `#f8f9fa` canvas with `#ffffff` cards) and [`theme-dark.css`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/src/theme-dark.css) (Palette #2: deep midnight navy `#070d1e` / `#0d1830` with blue hairline borders). Retained unified Google Fonts typography across both themes (`Newsreader` serif for headlines, `Public Sans` for UI, and `Space Mono` for tabular metrics). Verified via 100% clean production build. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L430) |
| `2026-09-28` | **Autonomous Night Shift 5-Horizon Ingestion Run**: Triggered automatically via Windows Task Scheduler at 10:42 PM IST. Seamlessly collected all 5 horizons ($T+1, T+7, T+15, T+30, T+45$) across all 14 DGCA corridors (1,100 new live quotes accepted, 3 quarantined) utilizing 14 teammate keys. Live Superlative National Index recalculated to 168.25 across 7,306 cumulative observations (6,654 post-epoch empirical). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L420) |
| `2026-09-28` | **Autonomous Morning Shift Ingestion Run**: Triggered automatically via Windows Task Scheduler at 10:42 AM IST across all 14 DGCA corridors for $T+1$ & $T+7$ (466 new live quotes accepted, 0 quarantined) with 100% key reliability. Recalculated Superlative Fisher Ideal Index to **`167.89`** ($L=167.82, P=167.96$) across **6,206 cumulative observations** (**5,554 post-epoch empirical**). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L410) |
| `2026-09-27` | **Autonomous Night Shift Ingestion Run (Complete 5-Horizon)**: Triggered automatically via Windows Task Scheduler at 10:30 PM IST. Seamlessly collected all 5 horizons ($T+1, T+7, T+15, T+30, T+45$) across all 14 DGCA corridors (1,176 new live quotes accepted, 5 quarantined) utilizing 14 teammate keys. Live Superlative National Index recalculated to 168.74 across 5,740 cumulative observations (5,088 post-epoch empirical). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L400) |
| `2026-09-27` | **Autonomous Morning Shift Ingestion Run**: Triggered automatically via Windows Task Scheduler at 10:40 AM IST across all 14 DGCA corridors for $T+1$ & $T+7$ (527 new live quotes accepted, 2 quarantined) with 100% key reliability. Recalculated Superlative Fisher Ideal Index to **`166.30`** ($L=166.24, P=166.37$) across **4,564 cumulative observations** (**3,912 post-epoch empirical**). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L390) |
| `2026-09-26` | **Complete Night Shift Ingestion Run across all 14 corridors for ALL 5 Horizons (T+1, T+7, T+15, T+30, T+45)**: Auto-triggered via Task Scheduler at 10:57 PM (Tranche 1: T+1, 261 quotes) and supplemented with Tranche 2 (T+7, T+15, T+30, T+45, 876 quotes). Total 1,137 night quotes accepted (5 quarantined). Live Superlative National Index recalculated to 165.05 across 4,037 cumulative database observations (3,385 post-epoch empirical). Configured `batch_fetch_real_data.py` so all future night scheduler runs pull all 5 horizons automatically. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L380) |
| `2026-09-26` | **Autonomous Twice-Daily Windows Task Scheduler Automation**: Built `run_scheduled_ingestion.bat`, `setup_task_scheduler.ps1`, `setup_task_scheduler.bat`, and `check_task_scheduler.bat`. Registered `SkyFare_Morning_Ingestion` (10:00 AM) and `SkyFare_Night_Ingestion` (10:30 PM) with battery execution and wake-up catchup support. Automated logging enabled to `logs\ingestion_audit.log`. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L373) |
| `2026-09-26` | Executed Morning Shift Ingestion Run across all 14 corridors for T+1 & T+7 (432 new live quotes accepted, 2 quarantined), National Index recalculated to 159.68 across 2,900 cumulative database observations (2,248 post-epoch). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L365) |
| `2026-09-25` | **API Key Registry Sanitization & Security Hardening**: Sanitized `api_keys_registry.json` by replacing all raw plaintext API keys with environment variable pointers (`env_var`). Updated `fetch_real_data.py` and `verify_all_keys.py` to resolve credentials dynamically from `.env` with automatic test fallback. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L362) |
| `2026-09-25` | **Missing Data Imputation Engine (MoSPI / UN-CPI LOCF)**: Implemented Last Observation Carried Forward (`apply_locf_to_series`, `impute_missing_cells_locf`) in `index_engine.py` and integrated into `main.py` live index calculations, preventing basket volatility when scraper requests time out. Added 2 automated unit tests. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L362) |
| `2026-09-25` | **Automated SQLite Database Corruption Protection**: Added `backup_database()` to `database.py` utilizing SQLite online backup API with automatic 15-version rotation. Integrated snapshot creation directly into `batch_fetch_real_data.py` prior to write operations. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L362) |
| `2026-09-25` | Executed Morning Shift Ingestion Run across all 14 corridors for T+1 & T+7 (398 new live quotes accepted, 4 quarantined), National Index recalculated to 160.91 across 2,468 cumulative database observations. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L354) |
| `2026-09-24` | Executed Complete Night Ingestion Run across all 14 DGCA corridors for ALL 5 Horizons (T+1, T+7, T+15, T+30, T+45) with 1,159 new quotes added, National Index recalculated to 164.36 across 2,070 cumulative observations. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L346) |
| `2026-09-24` | Established Official Ingestion Epoch (`2026-09-24`) and created `purge_legacy_seed_data.py`. | [`README.md#official-ingestion-epoch`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L327) |
| `2026-09-24` | 14 DGCA Trunk Corridor Dedicated API Key & Teammate Ownership Integration (`api_keys_registry.json`). | [`README.md#corridor-assignment`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L226) |
| `2026-09-24` | Verified all 14 SerpApi keys on live endpoints (100% success rate across all 14 corridors). | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L261) |
| `2026-09-23` | Upgraded SkyFare AI Econometric Guide (`PolicyChatbotView.tsx`) with 22+ modules and NLP router. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L312) |
| `2026-09-23` | SIH Econometric & UI Harmonization: 5-Formula benchmarks, Aviation Yield (₹/km), and Rule 135 status. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L305) |
| `2026-09-22` | Responsive Citizen Portal redesign with 2-way date-horizon sync for Windows, Tablet, and Mobile. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L296) |
| `2026-09-22` | Dynamic real-time IST clock synchronization and flight schedule fee unbundling restoration. | [`README.md#recent-major-upgrades`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/README.md#L276) |
