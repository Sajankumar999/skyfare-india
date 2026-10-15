# 📜 Project Rules, Constraints & Best Practices — SkyFare India

## Smart India Hackathon (SIH) Compliance, Engineering Protocols & Quality Mandates

- **Document**: SkyFare India Governance, SIH Protocols & Engineering Guidelines
- **Version**: `1.0.0`
- **Effective Date**: `2026-09-24`

---

## 1. 🏆 Smart India Hackathon (SIH) Competition Guidelines

### 1.1 Problem Statement Fidelity

- **Ministry / Agency Alignment**:
  - Primary: **Ministry of Statistics and Programme Implementation (MoSPI) / National Statistical Office (NSO)** — Price Statistics Division.
  - Secondary: **Directorate General of Civil Aviation (DGCA)** — Tariff Monitoring & Rule 135 Watchdog.
  - Key Consumer: **Reserve Bank of India (RBI)** — Monetary Policy Committee (MPC).
- **Core Mandate**: Replace 30-day manual physical counter airfare sampling with an automated, high-frequency, algorithmic airfare intelligence system that accurately measures Transport and Headline CPI inflation impulses.
- **Methodological Compliance**: All index calculations MUST comply with the **United Nations (UN) / ILO Consumer Price Index Manual (2020)** and IMF standards. Arithmetic averages must NOT be used for microdata; Jevons geometric aggregates and Superlative Fisher Ideal indices are mandatory.

### 1.2 Originality, Integrity & Ethical Scraping

- **Ethical Data Harvesting**:
  - Scraping operations must respect carrier and metasearch rate limits, include randomized delays, and use legitimate user-agent headers.
  - Personal identifiable information (PII) of passengers is NEVER scraped or stored.
- **Auditability & Provenance**:
  - Every price quote stored in the database must be cryptographically hashed (SHA-256) and traceable to an ingested batch root to prove data integrity to judges.
- **Real Data Demonstration vs. Fallback Resilience**:
  - Real live data from the 14-key pool must be demonstrated during evaluation.
  - If network outages or external API rate limits occur during the live judging pitch, the application MUST seamlessly fall back to calibrated high-fidelity benchmarks without crashing, displaying a clear `[FALLBACK BENCHMARK]` status indicator.

---

## 2. ✅ Mandatory Engineering Protocols (DO's)

### 2.1 Documentation & Project Tracking Mandates

1. **The README & Update Law**:
   - Whenever any major feature, architectural change, or bug fix is implemented, **`README.md` MUST be updated immediately** with an audit summary.
   - Any pending, deferred, or future items MUST be logged in **`Update.md`**. Once completed, remove them from `Update.md` and document the completion in `README.md`.
2. **System Ingestion Epoch Discipline**:
   - Respect `2026-09-24` as the official start epoch of continuous twice-daily data collection.
   - Maintain the 45-day observation countdown towards the `2026-11-08` transition target.

### 2.2 Frontend & Responsive Design Rules

3. **Multi-Device Responsiveness (Mobile, Tablet, Windows)**:
   - The web dashboard is designed for sovereign use across mobile devices ($320\text{px} - 480\text{px}$), tablets ($768\text{px} - 1024\text{px}$), and widescreen desktops.
   - **Never delete or hide buttons to fix responsive issues**. Rearrange them using responsive grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), flex wraps, or scrollable horizontal bars.
   - Enforce a minimum touch target size of **$\ge 44\text{px} \times 44\text{px}$** for all clickable mobile elements.
   - Guard against horizontal page overflow by ensuring top-level wrappers feature `overflow-x-hidden`, and tables/bars use `overflow-x-auto no-scrollbar`.
4. **Dynamic Real-Time IST Date Synchronization**:
   - NEVER hardcode static date strings (e.g. `'15 Sept 2026'`). All dates must be dynamically derived from the real system date and synchronized to Indian Standard Time (IST).
5. **Two-Way Date & Horizon Binding**:
   - When a citizen selects a departure date, the search console must automatically snap to the corresponding advance horizon ($T+1, T+7, T+15, T+30, T+45$).
   - When an advance horizon pill is clicked, the calendar date must automatically snap to the calculated target date.

### 2.3 Backend & Windows System Compatibility

6. **Windows Console & PowerShell Encoding Safety**:
   - The primary development OS is Windows. Standard PowerShell consoles default to `cp1252` encoding.
   - In Python scripts, always reconfigure `sys.stdout` to UTF-8 (`sys.stdout.reconfigure(encoding="utf-8", errors="replace")`).
   - Use standard ASCII bracket tags (`[OK]`, `[FAIL]`, `[NOTICE]`, `[KEY ALERT]`) instead of raw Unicode emojis in console outputs to prevent `UnicodeEncodeError`.
7. **Strict Test Coverage & Type Checking**:
   - Before committing or delivering changes, run `python -m unittest discover tests` (all 18 tests must pass).
   - Run `npm run build` (0 TypeScript / Vite compilation errors required).

### 2.4 Autonomous Execution & User Disruption Prevention (POPUP / CONFIRMATION BAN & AUTO-ACCEPT EDITS)

8. **Strict Ban on Interactive Questions & Confirmation Prompts**:
   - **NEVER** use interactive prompt tools (`ask_question`). Execution must be completely autonomous without interrupting the user.
   - **Auto-Accept All File Changes**:
     - **NEVER** ask the user to review, confirm, or accept changes in edited files.
     - Automatically accept and apply all file modifications, diffs, and creations immediately.
     - Never output statements like "Please accept these changes" or wait for manual acceptance in the IDE.
     - Tool calls and artifact creations must NOT request user confirmation or feedback modals (`RequestFeedback: false`). All edits are strictly pre-authorized and auto-applied.
   - **NEVER** execute novel ad-hoc inline commands or PowerShell pipelines that trigger the IDE's execution permission dialog:
     - DO NOT run `Select-String -Path ...`
     - DO NOT run `Get-ChildItem -Recurse ... | Select-Object ...`
     - DO NOT run inline Python evaluation snippets (`python -c "..."`)
   - All code inspection and data checks must be performed using standard inspection tools (`view_file`, `read_url_content`) or pre-approved standard commands (`npm run build`, `python -m unittest discover tests`, `graft build`).
   - **Mandatory Option 4 Auto-Selection**: If user preferences, execution dialogs, or prompt options arise, **ALWAYS automatically select Option 4 (Always Allow / Auto-Approve / Production Default)** autonomously without prompting the user. No permission popups are permitted.

### 2.5 Graft Codebase Map & Knowledge Graph Mandate

9. **Mandatory Use of Graft Repo Map (`graft`)**:
   - The repository integrates **Graft** (`https://github.com/trailhq/Graft`) as the single source of truth for repository structure, wiring, symbol relationships, and call graphs.
   - **AI Agents MUST strictly consult Graft before modifying codebase structure**:
     - **Symbol & File Navigation**: Check [`graft/INDEX.md`](<file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/graft/INDEX.md>) and [`graft/*.md`](<file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/graft/>) wiring cards to pinpoint exact functions, types, and route definitions (`file:line`) before opening large files.
     - **Callers & Blast Radius**: Use `graft callers <symbol>` or `graft blast` to trace caller/callee dependencies before refactoring core models, API contracts, or state stores.
     - **Natural Language Symbol Search**: Query `graft ask "<task/symbol>"` for ranked node suggestions across both backend and frontend.
     - **Repo Freshness**: After significant architectural modifications, run `graft build` to keep the wiring graph in sync with the codebase.

### 2.6 Ponytail (Lazy Senior Dev & YAGNI Mandate)

10. **Strict Adherence to the Ponytail Ladder (`.agents/skills/ponytail/SKILL.md`)**:
    - **Rung 1 (YAGNI)**: Does this need to exist at all? If speculative, delete or skip it.
    - **Rung 2 (Reuse)**: Look before writing. Check Graft and existing files for existing helpers, types, or utilities before writing new ones.
    - **Rung 3 (Standard Library)**: Python/Node stdlib over third-party packages.
    - **Rung 4 (Native Platform)**: Native HTML5, CSS, browser APIs, or database constraints over heavy libraries.
    - **Rung 5 (Installed Dependencies)**: Use already-installed dependencies. Never add new npm/pip dependencies without absolute necessity.
    - **Rung 6 (Minimalist Code)**: Can it be one line? One line. Shortest working diff wins.
    - **Rung 7 (Root Cause Fixes)**: Fix root causes at the shared function where all callers route through, rather than slapping defensive guards across multiple consumer files.
    - **Safety Boundaries**: Never simplify away input sanitization, error boundaries, security parameters, or automated tests.

### 2.7 Mandatory Token Economy Accounting (Graft & Ponytail Law)

11. **Mandatory Token Savings Reporting After Every Output**:
    - After EVERY output, the AI assistant MUST explicitly calculate and report how many tokens were saved during that turn by employing Graft Map and Ponytail.
    - **Graft Map Savings**: Sum of tokens saved across all `graft` operations (e.g. `graft callers <symbol>`, `graft blast`, `graft/INDEX.md` card lookups) by accessing targeted `file:line` spans instead of reading entire source files.
    - **Ponytail Savings**: Tokens saved through YAGNI discipline, minimal diffs (shortest working diff), zero speculative boilerplate, and component/primitive reuse.
    - **Mandatory Reporting Format**:
      At the very end of EVERY reply, include:

      ```markdown
      ---

      🌱 **Token Savings This Turn**:

      - **Graft Map**: ~N tokens saved (targeted symbol/caller lookups vs reading whole files)
      - **Ponytail (YAGNI / Minimal Diff)**: ~N tokens saved (minimal diff, zero boilerplate, primitive reuse)
      - **Total Saved**: ~N tokens
      ```

---

## 3. 🚫 Prohibited Practices (DON'Ts)

1. **DO NOT delete pre-epoch seed data prematurely**:
   - Pre-epoch data prior to `2026-09-24` is temporarily necessary to preserve multi-horizon yield curves and 35-day historical graphs for hackathon evaluation.
   - Running `purge_legacy_seed_data.py` without `--force` before `2026-11-08` is strictly blocked by automated safeguards.
2. **DO NOT expose API credentials in client-side code**:
   - SerpApi keys and admin secrets must remain confined to `.env` and `api_keys_registry.json`. They must NEVER be sent in client-side bundles or frontend network payloads.
3. **DO NOT mix test and production key quotas**:
   - `SERPAPI_TEST_KEY` (`0519...aa8d`) is strictly reserved for developer staging tests, health checks, and emergency fallback. It must never be consumed by regular scheduled batch runs.
4. **DO NOT use arithmetic averages for microdata price relatives**:
   - Computing an arithmetic mean $\frac{1}{n}\sum \frac{p_t}{p_0}$ violates the UN CPI manual and introduces Carli upward bias. Always use Jevons geometric means.
5. **DO NOT break the 14-Corridor DGCA trunk basket**:
   - The 14 corridors represent over 65% of scheduled Indian traffic. Do not drop routes or change baseline passenger volume weights ($q_0$) arbitrarily.

---

## 4. 🎤 SIH Pitching & Judge Presentation Strategy

When demonstrating SkyFare India to hackathon evaluators, follow this authoritative four-pillar narrative:

```
[Pillar 1: MoSPI Statistical Sovereign Modernization]
Show the 5-Formula International Benchmark (Laspeyres, Paasche, Superlative Fisher Ideal).
Highlight how Fisher eliminates the 0.22 pt substitution bias gap.

[Pillar 2: High-Frequency RBI Monetary Intelligence]
Show the CPI Decomposition waterfall chart and Scenario Simulator.
Demonstrate how a +10% ATF shock translates to +42.4 bps Transport CPI shock within seconds.

[Pillar 3: DGCA Regulatory Tariff Enforcement (Rule 135)]
Navigate to Irregularities Watchlist.
Toggle "Festive Peak Surge Mode" (Diwali/Chhath Puja) to show real-time price cap alerts.

[Pillar 4: Citizen Fair-Fare Transparency & Data Vault]
Search a live route (e.g. DEL -> BOM at T+1).
Inspect the 5-tier unbundled fee breakdown (Base, ATF, UDF, PSF/ASF, GST) and SHA-256 Merkle trust seal.
```
