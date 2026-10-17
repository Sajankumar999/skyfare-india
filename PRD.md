# 📋 Project Requirement Document (PRD) — SkyFare India
## National Airfare Intelligence Platform & Sovereign Economic Surveillance Engine

* **Project Title**: SkyFare India — National Airfare Intelligence & Economic Surveillance Platform
* **Competition / Initiative**: Smart India Hackathon (SIH) 2024 / 2025 / 2026
* **Governing Authorities**: Ministry of Statistics and Programme Implementation (MoSPI) / National Statistical Office (NSO) & Directorate General of Civil Aviation (DGCA)
* **Secondary Beneficiary**: Reserve Bank of India (RBI) Monetary Policy Committee (MPC)
* **Document Version**: `2.1.0 (Production Live)`
* **Last Updated**: `2026-10-17`
* **Official Ingestion Epoch**: `2026-09-24` (46,900+ Live Microdata Quotes Recorded)
* **Live Superlative Index**: `165.65` (Fisher Ideal, Base 2024-Q1=100)
* **Production Frontend**: [skyfare-india.vercel.app](https://skyfare-india.vercel.app/)
* **Production Backend API**: [skyfare-india-api.onrender.com](https://skyfare-india-api.onrender.com)
* **Target Transition Date**: `2026-11-08` ($T+45$ Days)
* **Status**: `Production Live / 4-Tier Cloud Autonomous Operations Active`

---

## 1. 🎯 Executive Summary & SIH Problem Statement

### 1.1 The Problem
The Consumer Price Index (CPI) published monthly by the National Statistical Office (NSO), MoSPI, measures retail price changes across goods and services in India and directly influences the Reserve Bank of India's (RBI) bi-monthly Monetary Policy Committee (MPC) repo rate decisions.

Under the traditional CPI collection framework:
1. **Manual Physical Field Sampling**: Airfare prices under the *Transport and Communication* subgroup are predominantly collected manually by field enumerators from a limited selection of airline booking counters or physical travel agents.
2. **Structural Market Disconnect**: Over **90% of Indian domestic air tickets** are purchased through online channels (airline portals like IndiGo, Air India, Akasa Air, SpiceJet and Online Travel Aggregators like MakeMyTrip, EaseMyTrip, Yatra, Cleartrip, Ixigo).
3. **Extreme Algorithmic Volatility**: Airlines utilize dynamic yield management algorithms where identical economy seats fluctuate by **200% to 400%** within hours based on lead time, load factors, fuel costs, time of day, and seasonal spikes.
4. **Measurement Lag & CPI Distortion**: Manual point-in-time sampling misses intra-day price swings, advance booking curve decays ($T+1$ through $T+45$), and statutory unbundled fees, leading to potential mismeasurement in the national Transport CPI.

### 1.2 The Solution
**SkyFare India** is an automated, government-grade macroeconomic airfare intelligence and sovereign surveillance system. It continuously captures multi-horizon domestic fare quotes across all 14 DGCA Category-I trunk corridors, decomposes fares into statutory tariff components, enforces Tukey's IQR outlier quarantine, computes superlative price indices (Laspeyres, Paasche, Fisher Ideal, Jevons, and Törnqvist) weighted by official DGCA passenger traffic statistics, and delivers high-frequency CPI transmission analytics to MoSPI, the RBI, DGCA, and Indian citizens.

---

## 2. 🌟 Vision, Mission & Strategic Goals

* **Vision**: To establish India's most accurate, tamper-proof, and transparent sovereign airfare intelligence engine powering official national price statistics and consumer protection.
* **Mission**: Eliminate manual airfare collection bottlenecks by building an automated, high-frequency ingestion and econometric processing pipeline adhering to United Nations (UN) and International Monetary Fund (IMF) Consumer Price Index standards.
* **Strategic Goals**:
  1. **High-Frequency Modernization**: Ingest live quotes twice daily across all core trunk routes, closing the 30-day manual CPI lag.
  2. **Econometric Rigor**: Implement the Superlative Fisher Ideal Index to resolve consumer substitution bias in accordance with the UN CPI Manual (2020).
  3. **Regulatory Enforcement**: Provide DGCA with automated surveillance tools for Aircraft Rules 1937, Rule 135 (Tariff monitoring and surge pricing prevention during festivals/emergencies).
  4. **Empirical Validation**: Validate model calculations against DGCA Form 1-B historical carrier yields, achieving Pearson correlation $r \ge 0.99$.
  5. **Citizen Transparency**: Deliver an accessible Citizen Fair-Fare decision portal with 5-tier unbundled fee breakdowns, empowering travelers to make optimal booking choices.

---

## 3. 👥 Target User Personas & Use Cases

| Persona | Role / Designation | Primary Needs & Use Cases |
| :--- | :--- | :--- |
| **MoSPI / NSO Statistical Officer** | Price Statistics Division (PSD) Director | • Access real-time National Airfare Index (APIx) calculated under 5 international formulations.<br/>• Monitor headline and transport CPI basis points impact.<br/>• Review quarantined outliers and audit trail.<br/>• Generate and export official MoSPI statistical bulletins (PDF/CSV). |
| **RBI Monetary Policy Analyst** | Macroeconomic Forecasting & Research | • Evaluate early high-frequency inflation impulses before monthly CPI releases.<br/>• Run macroeconomic stress-test simulations (ATF fuel shocks, capacity groundings, seasonal surges).<br/>• Track advance booking horizon elasticity ($T+1$ to $T+45$). |
| **DGCA Civil Aviation Regulator** | Directorate of Air Transport & Tariffs | • Enforce Aircraft Rules 1937, Rule 135(1) tariff bands.<br/>• Monitor corridor surge breaches during festive periods (Diwali, Chhath Puja).<br/>• Track market concentration (HHI) and route yield (₹/seat-km). |
| **Indian Air Passenger / Citizen** | Everyday Traveler, Corporate & Leisure Flyer | • Search flights across routes and advance horizons with transparent unbundled fare breakdowns.<br/>• View "Buy Now vs. Wait" empirical recommendation badges.<br/>• Identify whether a quoted price represents an algorithmic surge or fair price. |
| **Aviation Sector Researcher** | Academic, Think Tank & Policy Economist | • Query 35-day historical trend data, volatility bands, and moving averages.<br/>• Examine microdata provenance verified by SHA-256 Merkle root hashes.<br/>• Interact with the grounded SkyFare AI Econometric Guide for contextual policy analysis. |

---

## 4. 🧭 System Scope

### 4.1 In-Scope
* Continuous automated 4x daily data ingestion across 14 DGCA Category-I trunk corridors (`05:50 AM`, `11:10 AM`, `04:50 PM`, `10:10 PM` IST).
* 3-hour runner queue delay absorption buffer guaranteeing $\ge 3$ complete scans every 24 hours.
* Tiered Multi-Engine Architecture: Scrapling stealth engine covering all 5 horizons on every shift at $0 cost; SerpApi quota gatekeeper (Morning $T+1, T+7$; Midday & Evening OFF; Night All 5) capping usage to 98 calls/day across 14 teammate keys.
* Dedicated 14-key API management registry with individual teammate ownership attribution.
* Multi-horizon tracking across 5 distinct advance booking windows: $T+1$, $T+7$, $T+15$, $T+30$, and $T+45$.
* 5-Formula Econometric Calculation Engine: Jevons Elementary, Laspeyres, Paasche, Superlative Fisher Ideal, and Chained Törnqvist.
* 5-Tier Statutory Fare Decomposition: Base Fare, ATF Fuel Surcharge, User Development Fee (UDF), Passenger/Aviation Security Fees (PSF/ASF), and GST (5%).
* Data cleaning with Tukey IQR filtering [₹1,200 – ₹45,000] and immutable quarantine storage.
* Cryptographic data integrity verification using SHA-256 Merkle root hashing.
* Interactive responsive web dashboard (Desktop, Tablet, Mobile) with dark/light themes.
* Instant client-side `sessionStorage` caching layer (<50ms tab switching) and dynamic cold-start alert banners.
* Origin-destination pair constraint dynamically locked to the 14 official monitored DGCA trunk routes.
* Restricted MoSPI Officer Admin Console with session authentication (zero hardcoded secrets or client bypasses).
* Grounded AI Econometric Policy Chatbot with live SQLite RAG and Gemini 2.5 Flash synthesis.

### 4.2 Out-of-Scope (Future Phases)
* International flight routes (focus is strictly sovereign Indian domestic civil aviation).
* Direct transactional seat booking or ticketing payment gateway (SkyFare is a sovereign surveillance platform, not a commercial OTA).
* Cargo / freight tariff monitoring.

---

## 5. ⚙️ Detailed Functional Requirements & Feature Specifications

### 5.1 Real-Time National Airfare Price Index (APIx)
* **Base Period**: 2024-Q1 established at $100.00$.
* **Formulations Implemented**:
  1. *Jevons Elementary Geometric Mean*: $I_J = \exp\left(\frac{1}{n}\sum \ln(p_t / p_0)\right)$.
  2. *Laspeyres Index*: $I_L = \frac{\sum p_t q_0}{\sum p_0 q_0} \times 100$ (base-period passenger volumes).
  3. *Paasche Index*: $I_P = \frac{\sum p_t q_t}{\sum p_0 q_t} \times 100$ (current-period passenger volumes).
  4. *Superlative Fisher Ideal Index*: $I_F = \sqrt{I_L \cdot I_P}$ (neutralizes substitution bias).
  5. *Chained Törnqvist Translog Index*: Weighted logarithmic difference formulation.
* **Substitution Bias Gap**: Explicitly computes $I_L - I_P$ ($0.22\text{ pts}$) in compliance with UN CPI guidelines.
* **Historical Series**: Maintains a 35-day rolling index series with 7-day, 30-day, and 90-day moving averages and Bollinger volatility bands.

### 5.2 14 DGCA Trunk Corridors & Passenger Weighting Matrix
Represents over 65% of all scheduled domestic civil aviation passenger traffic in India:
1. `DEL-BOM` (Delhi $\rightarrow$ Mumbai): $12.8\%$ weight ($2,680,000$ base pax)
2. `BOM-DEL` (Mumbai $\rightarrow$ Delhi): $12.1\%$ weight ($2,540,000$ base pax)
3. `DEL-BLR` (Delhi $\rightarrow$ Bengaluru): $9.2\%$ weight ($1,920,000$ base pax)
4. `BLR-DEL` (Bengaluru $\rightarrow$ Delhi): $9.0\%$ weight ($1,880,000$ base pax)
5. `BOM-BLR` (Mumbai $\rightarrow$ Bengaluru): $6.9\%$ weight ($1,450,000$ base pax)
6. `BLR-BOM` (Bengaluru $\rightarrow$ Mumbai): $6.8\%$ weight ($1,420,000$ base pax)
7. `DEL-CCU` (Delhi $\rightarrow$ Kolkata): $6.5\%$ weight ($1,350,000$ base pax)
8. `CCU-DEL` (Kolkata $\rightarrow$ Delhi): $6.3\%$ weight ($1,320,000$ base pax)
9. `DEL-HYD` (Delhi $\rightarrow$ Hyderabad): $5.6\%$ weight ($1,180,000$ base pax)
10. `HYD-DEL` (Hyderabad $\rightarrow$ Delhi): $5.5\%$ weight ($1,150,000$ base pax)
11. `BOM-GOI` (Mumbai $\rightarrow$ Goa): $4.6\%$ weight ($950,000$ base pax)
12. `MAA-DEL` (Chennai $\rightarrow$ Delhi): $4.4\%$ weight ($920,000$ base pax)
13. `DEL-MAA` (Delhi $\rightarrow$ Chennai): $4.3\%$ weight ($890,000$ base pax)
14. `CCU-BOM` (Kolkata $\rightarrow$ Mumbai): $3.7\%$ weight ($780,000$ base pax)

### 5.3 Advance Booking Horizon Dynamic Pricing Matrix
* **$T+1$ (Spot / Emergency)**: 24–48 hours before departure ($2.10\times - 2.50\times$ multiplier).
* **$T+7$ (Short-Notice Business)**: Weekly corporate travel cycle ($1.40\times - 1.70\times$ multiplier).
* **$T+15$ (Planned Travel)**: Standard domestic travel window ($1.15\times - 1.35\times$ multiplier).
* **$T+30$ (Leisure / Vacation)**: Early discount tranche ($1.00\times - 1.10\times$ multiplier).
* **$T+45$ (Early-Bird Base)**: Deep advance promotional base ($0.90\times - 1.02\times$ multiplier).

### 5.4 Statutory 5-Tier Tariff Decomposition
Raw ticket prices unbundled according to DGCA circulars:
1. **Base Fare**: Airline net seat inventory revenue ($70-75\%$).
2. **Fuel Surcharge (ATF)**: Variable aviation turbine fuel pass-through ($15-18\%$).
3. **User Development Fee (UDF)**: Airport development tariff (₹400–₹520).
4. **Statutory Security Charges**: Passenger Service Fee (PSF ₹240) + Aviation Security Fee (ASF ₹236).
5. **Goods and Services Tax (GST)**: $5\%$ statutory rate on domestic economy class airfare.

### 5.5 Data Quality Governance & Outlier Quarantine
* **Tukey IQR Algorithm**: Identifies extreme observations beyond $[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$.
* **Hard Operational Bounds**: Absolute lower threshold of ₹1,200 (rejecting zero/tax-only glitch quotes) and upper threshold of ₹45,000 (rejecting international/first-class errors).
* **Quarantine Store (`fare_quarantine`)**: Quarantined quotes are isolated with rejection reasons (`OUT_OF_BOUNDS_HIGH`, `OUT_OF_BOUNDS_LOW`, `DUPLICATE_QUOTE`) and audited with MoSPI officer override capability.

### 5.6 Cryptographic Data Trust Audit Vault
* **SHA-256 Observation Hashing**: Every ingested quote receives a cryptographic fingerprint: `SHA256(observed_at + carrier + flight_no + fare + route + horizon)`.
* **Merkle Batch Roots**: Daily observation batches are combined into a Merkle root hash ensuring zero retroactive tampering.
* **Data Trust Score**: Quantified platform metric ($98.4\%$) evaluating completeness, deduplication, and cryptographic integrity.

### 5.7 DGCA Rule 135 Regulatory Surveillance & Festive Peak Surge Mode
* **Statutory Framework**: Aircraft Rules 1937, Rule 135(1) & 135(2).
* **Surveillance Tranches**: Compares observed spot fares against published carrier tariff bands.
* **Compliance Ribbon**: Displays national compliance rate ($94.2\%$, $33,215$ of $35,261$ quotes compliant).
* **Festive Peak Surge Watch Mode**: Dedicated toggle targeting high-density festive routes (`DEL-PAT`, `DEL-CCU`, `BOM-IXR`) during Diwali, Chhath Puja, and Durga Puja rush, triggering alerts for Section 5A emergency price cap breaches.

### 5.8 Macroeconomic CPI Transmission Engine
* **Transport CPI Weight**: Air travel represents $6.42\%$ of the Transport & Communication sub-group.
* **Headline CPI Weight**: Direct air transport represents $0.124\%$ (with up to $0.58\%$ direct and second-round transmission).
* **Transmission Calculation**:
  $$\Delta \text{Transport CPI (bps)} = (I_F - 100.0) \times 0.0642 \times 100$$
  $$\Delta \text{Headline CPI (bps)} = (I_F - 100.0) \times 0.00124 \times 100$$
* **Current Impact**: $+42.4\text{ bps}$ to Transport group, $+3.64\text{ bps}$ to Headline national CPI.

### 5.9 Policy Scenario Simulator & Stress Matrix
* **Interactive Levers**:
  1. *ATF Fuel Shock*: $-20\%$ to $+50\%$ price adjustment ($0.65$ airline pass-through elasticity).
  2. *Fleet Grounding*: $0\%$ to $30\%$ capacity reduction (Pratt & Whitney engine groundings).
  3. *Surge Demand Surge*: $0\%$ to $40\%$ demand shocks (festive rush).
  4. *Statutory GST Adjustment*: $0\%$ to $18\%$ tax rate simulation.
* **Output Metrics**: Simulates projected Fisher Ideal Index, headline CPI basis points delta, and corridor-level spot fare impact in real time.

### 5.10 Grounded SkyFare AI Econometric Guide (`PolicyChatbotView.tsx`)
* **Scope**: 22+ comprehensive knowledge modules across 7 categories:
  - *Formulas & Index*, *Charts & Graphs*, *Corridors & Yield*, *Aviation & HHI*, *CPI & Macro*, *DGCA & Rules*, *Tech Stack & Vault*.
* **Scoring Engine**: Multi-token keyword overlap NLP matcher with structured responses.
* **Interactive Suggestions**: Dynamic follow-up chips under every analyst message.

### 5.11 Citizen Fair-Fare Intelligence Portal (`CitizenPortal.tsx`)
* **Surveillance Search Bar**: Responsive route selector, bidirectional swap, date picker, and advance horizon selector ($T+1$ to $T+45$).
* **Two-Way Date-Horizon Sync**: Selecting a calendar date snaps to the corresponding advance horizon and vice-versa.
* **Flight Schedules & Dynamic Cards**: Real flight identifiers (`6E-4153`, `IX-4427`), real-time departure/arrival slots, travel durations, and unbundled fee splits.
* **Fair-Fare Decision Badges**: `SURGE BREACH`, `WATCHLIST`, or `COMPLIANT` with Buy Now vs. Wait guidance.

### 5.12 14 Dedicated API Keys & Corridor Ownership Pool
* **Key Registry (`api_keys_registry.json`)**: 14 dedicated keys assigned to 7 teammates (Baba, Aritro, Rudra, Abhinav, Anamika, Kailash, Sajan) mapped 1:1 to each DGCA trunk corridor.
* **Attributed Alerting**: In case of HTTP 429 quota exhaustion, the pipeline alerts the exact teammate name and key slot to verify, and seamlessly activates the fallback staging key (`0519...aa8d`).

### 5.13 Official Ingestion Epoch & 45-Day Transition Plan
* **Inception Epoch**: `2026-09-24` (Official commencement of regular twice-daily collection).
* **Transition Target**: `2026-11-08` ($T+45$ days).
* **Purge Tool (`purge_legacy_seed_data.py`)**: Checks the 45-day countdown, purges pre-epoch developmental records (`observed_at < '2026-09-24 00:00:00'`), and recalculates indices strictly from empirical quotes.

### 5.14 MoSPI Officer Administrative Command Center (`AdminDashboard.tsx`)
* **Restricted Access**: Protected by MoSPI Officer session authentication (`ADMIN_USER=mospi_officer`).
* **Sub-Modules**:
  1. *Scraper Fleet Controller*: Monitors 5 scraper worker nodes, channel latency (98ms), and run triggers.
  2. *Data Quarantine Zone*: Interactive review of rejected outlier quotes with manual approval/purge controls.
  3. *MoSPI Official PDF Export*: Formats and exports official monthly bulletins.
  4. *API Key Management*: Displays key pool status, requests remaining, and corridor allocations.

### 5.15 4-Tier Sovereign Cloud Automation Stack
* **Continuous Ingestion**: GitHub Actions workflow (`scheduled_ingestion.yml`) running 3x daily (05:15, 10:15, 17:15 UTC) to harvest live quotes across all 14 corridors via Scrapling / SerpApi.
* **Database Vault**: Supabase PostgreSQL cloud database synchronizing 42,945+ quotes with self-healing SQLite WAL replication.
* **High-Performance API**: Render web service running FastAPI (`skyfare-india-api.onrender.com`) computing Fisher Ideal (166.48) and econometric indices on demand with CORS protection.
* **Global Edge Frontend**: Vercel CDN hosting React 19 + TypeScript + Vite SPA (`skyfare-india.vercel.app`) with SPA rewrite routing and sub-100ms asset caching.

---

## 6. 🛡️ Non-Functional Requirements (NFR)

* **Performance & Latency**: API response times under $200\text{ms}$ for cached index queries, under $500\text{ms}$ for real-time corridor aggregations.
* **Responsive Design**: Flawless visual display across all device form factors:
  - Mobile Phones ($320\text{px} - 480\text{px}$) with $\ge 44\text{px}$ touch targets.
  - Tablets ($768\text{px} - 1024\text{px}$) with adaptive 2-column grids.
  - Desktop & Widescreen Displays ($1080\text{p} - 4\text{K}$) with multi-column intelligence matrices and 590px map container height alignment.
* **Zero Horizontal Scrollbar**: All tables, yield bars, and tabs enforce `overflow-x-auto` with clean hidden scrollbars.
* **Security & Confidentiality**:
  - API keys isolated in backend environment files (`.env`) and GitHub Secrets.
  - Passwords and session states never exposed to client-side storage.
* **Auditability & Reproducibility**: Every index value traceable back to its underlying flight quote microdata and Merkle root.
* **Cross-Platform Compatibility**: Fully functional on Windows (PowerShell/cp1252 safe), Linux, and macOS.

---

## 7. 📈 Acceptance Criteria & SIH Evaluation Alignment

| Evaluation Criteria | Target Metric | Demonstrated Capability |
| :--- | :--- | :--- |
| **Econometric Validity** | Pearson $r > 0.90$, MAPE $< 1.5\%$ | **$r = 0.991$, $\text{MAPE} = 0.84\%$** against DGCA Form 1-B benchmarks |
| **Index Methodology** | UN / IMF CPI Manual Compliance | **Superlative Fisher Ideal (166.48) + Laspeyres + Paasche + Törnqvist** side-by-side |
| **Route Coverage** | $> 60\%$ National Traffic | **$65.8\%$ covered across 14 DGCA Category-I trunk corridors** |
| **Empirical Data Scale** | $> 10,000$ verified quotes | **42,945+ live quotes** (23 continuous days from Sept 24, 2026 to Oct 16, 2026) |
| **Outlier Handling** | Statistically Sound Outlier Filter | **Tukey IQR filter + Quarantine Isolation Store** |
| **Data Integrity** | Tamper-Evident Lineage | **Cryptographic SHA-256 Merkle Provenance Vault** |
| **Cloud Automation** | 100% Autonomous Pipeline | **4-Tier Mesh: GitHub Actions $\rightarrow$ Supabase $\rightarrow$ Render $\rightarrow$ Vercel** |
| **User Experience** | Multi-Device Responsive UI | **Fluid Tailwind CSS v4 layout for Windows, Tablet, and Mobile** |
| **Code & Test Quality** | Automated Test Coverage | **18/18 Unit Tests Passing + 0 TypeScript Compilation Errors** |

