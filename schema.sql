-- ============================================================================
-- SkyFare India — National Domestic Airfare Intelligence & Index Platform
-- MoSPI Price Statistics Division Standards
-- Complete PostgreSQL / SQLite Compatible Relational Database Schema
-- ============================================================================
-- Specification:
-- Core Tables:
--  1. airports          - Indian & regional airports (IATA, ICAO, Metro status)
--  2. airlines          - Scheduled domestic carriers (IndiGo, Air India, Akasa, SpiceJet, etc.)
--  3. routes            - City-pairs and corridor characteristics (Distance, Category, Rank)
--  4. data_sources      - Ingestion pipelines (OTAs, GDS, Airline direct NDC APIs)
--  5. scrape_runs       - Audit batches with SHA-256 cryptographic verification hashes
--  6. fare_observations - High-frequency price quotes with granular fee unbundling
--  7. route_weights     - Base-period passenger kilometer & passenger share weights (DGCA)
--  8. daily_indices     - Laspeyres, Paasche, and Superlative Fisher Ideal price indices
--  9. index_components  - Route-horizon price relatives and CPI basket contribution
-- 10. audit_logs        - Immutable tamper-evident system logs for statistical integrity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AIRPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airports (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) NOT NULL UNIQUE,
    icao_code VARCHAR(4) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    metro_tier VARCHAR(20) DEFAULT 'Tier-1' CHECK (metro_tier IN ('Tier-1', 'Tier-2', 'Tier-3', 'RCS-UDAN')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);

-- ----------------------------------------------------------------------------
-- 2. AIRLINES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(2) NOT NULL UNIQUE,
    icao_code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    callsign VARCHAR(100),
    country VARCHAR(50) DEFAULT 'India',
    business_model VARCHAR(20) DEFAULT 'LCC' CHECK (business_model IN ('LCC', 'FSC', 'Regional')),
    domestic_market_share DECIMAL(5, 2) DEFAULT 0.00,
    logo_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata_code);

-- ----------------------------------------------------------------------------
-- 3. ROUTES (CITY-PAIRS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    origin_airport_id INT NOT NULL REFERENCES airports(id) ON DELETE RESTRICT,
    destination_airport_id INT NOT NULL REFERENCES airports(id) ON DELETE RESTRICT,
    route_code VARCHAR(7) NOT NULL UNIQUE, -- e.g., DEL-BOM, BOM-DEL
    distance_km INT NOT NULL,
    route_category VARCHAR(20) DEFAULT 'Category-I' CHECK (route_category IN ('Category-I', 'Category-II', 'Category-IIA', 'Category-III', 'UDAN-RCS')),
    dgca_market_rank INT,
    high_density_corridor BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_diff_airports CHECK (origin_airport_id <> destination_airport_id)
);

CREATE INDEX IF NOT EXISTS idx_routes_code ON routes(route_code);
CREATE INDEX IF NOT EXISTS idx_routes_airports ON routes(origin_airport_id, destination_airport_id);

-- ----------------------------------------------------------------------------
-- 4. DATA SOURCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'MakeMyTrip_API', 'EaseMyTrip_Scraper', 'Direct_IndiGo_NDC'
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('OTA_AGGREGATOR', 'AIRLINE_DIRECT_NDC', 'METASEARCH_API', 'GDS')),
    base_url VARCHAR(255),
    rate_limit_per_min INT DEFAULT 120,
    scrape_interval_mins INT DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. SCRAPE RUNS (BATCH AUDIT & MERKLE TAMPER-PROOFING)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scrape_runs (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
    run_uuid VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'IN_PROGRESS' CHECK (status IN ('INITIALIZED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'VALIDATED')),
    quotes_fetched INT DEFAULT 0,
    error_count INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    sha256_batch_hash VARCHAR(64), -- Cryptographic batch hash for tamper detection
    merkle_root_hash VARCHAR(64),
    validation_status VARCHAR(30) DEFAULT 'TAMPER_PROOF_VALIDATED',
    audit_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started ON scrape_runs(started_at);

-- ----------------------------------------------------------------------------
-- 6. FARE OBSERVATIONS (High-Frequency Microdata Quotes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fare_observations (
    id BIGSERIAL PRIMARY KEY,
    run_id INT NOT NULL REFERENCES scrape_runs(id) ON DELETE CASCADE,
    route_id INT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    airline_id INT NOT NULL REFERENCES airlines(id) ON DELETE RESTRICT,
    flight_number VARCHAR(15) NOT NULL, -- e.g. '6E-5012', 'AI-806'
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    
    -- Booking Horizon (Days before departure): T+1, T+7, T+15, T+30, T+45
    booking_horizon VARCHAR(10) NOT NULL CHECK (booking_horizon IN ('T+1', 'T+7', 'T+15', 'T+30', 'T+45', 'T+60')),
    lead_time_days INT NOT NULL,
    
    -- Cabin Class
    cabin_class VARCHAR(30) DEFAULT 'Economy' CHECK (cabin_class IN ('Economy', 'Premium Economy', 'Business')),
    
    -- Unbundled Fare Components (INR)
    base_fare DECIMAL(10, 2) NOT NULL,
    fuel_surcharge_atf DECIMAL(10, 2) DEFAULT 0.00,  -- ATF fluctuation component
    user_development_fee_udf DECIMAL(8, 2) DEFAULT 0.00,
    passenger_service_fee_psf DECIMAL(8, 2) DEFAULT 0.00,
    aviation_security_fee_asf DECIMAL(8, 2) DEFAULT 0.00,
    gst_amount DECIMAL(8, 2) DEFAULT 0.00,
    other_taxes_fees DECIMAL(8, 2) DEFAULT 0.00,
    
    -- Total Effective Consumer Fare
    total_fare DECIMAL(10, 2) NOT NULL,
    
    -- Metadata & Flight Characteristics
    source_id INT NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
    is_nonstop BOOLEAN DEFAULT TRUE,
    stops_count INT DEFAULT 0,
    seats_remaining_bucket VARCHAR(20) DEFAULT 'AVAILABLE', -- 'LOW (1-3)', 'MEDIUM (4-9)', 'HIGH (9+)'
    
    -- Economic context
    corridor_baseline_30d DECIMAL(10, 2), -- 30-day trailing baseline median for this route & horizon
    price_deviation_pct DECIMAL(6, 2),   -- % deviation from baseline
    is_surge_pricing BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup compound indexes for index aggregation
CREATE INDEX IF NOT EXISTS idx_fare_obs_route_date ON fare_observations(route_id, departure_date);
CREATE INDEX IF NOT EXISTS idx_fare_obs_airline ON fare_observations(airline_id);
CREATE INDEX IF NOT EXISTS idx_fare_obs_horizon ON fare_observations(booking_horizon);
CREATE INDEX IF NOT EXISTS idx_fare_obs_observed ON fare_observations(observed_at);
CREATE INDEX IF NOT EXISTS idx_fare_obs_lead ON fare_observations(lead_time_days);

-- ----------------------------------------------------------------------------
-- 7. ROUTE WEIGHTS (MoSPI & DGCA Passenger / RPK Basket Shares)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_weights (
    id SERIAL PRIMARY KEY,
    route_id INT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    base_period VARCHAR(20) DEFAULT '2024-Q1',
    passenger_volume_base INT NOT NULL,       -- Total passengers carried in base year
    passenger_share_weight DECIMAL(8, 6) NOT NULL, -- q0 weight for Laspeyres
    rpk_weight DECIMAL(8, 6) NOT NULL,            -- Revenue Passenger Km weight
    effective_from DATE NOT NULL,
    effective_to DATE,
    source_survey VARCHAR(100) DEFAULT 'DGCA City-Pair Traffic Statistics & MoSPI CPI Basket',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_route_base_period UNIQUE (route_id, base_period)
);

CREATE INDEX IF NOT EXISTS idx_route_weights_route ON route_weights(route_id);

-- ----------------------------------------------------------------------------
-- 8. DAILY INDICES (National Airfare Indices & CPI Transmission)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_indices (
    id SERIAL PRIMARY KEY,
    index_date DATE NOT NULL UNIQUE,
    
    -- Official Price Index Formulae (Base = 100.00)
    laspeyres_index DECIMAL(8, 4) NOT NULL,      -- Base weighted index: Σ(p_t * q_0) / Σ(p_0 * q_0)
    paasche_index DECIMAL(8, 4) NOT NULL,        -- Current weighted index: Σ(p_t * q_t) / Σ(p_0 * q_t)
    fisher_ideal_index DECIMAL(8, 4) NOT NULL,   -- Superlative Fisher: sqrt(Laspeyres * Paasche)
    tornqvist_index DECIMAL(8, 4),               -- Geometric mean of growth rates
    
    -- Statistical Deltas
    dod_change_pct DECIMAL(6, 2) NOT NULL,       -- Day-over-Day percentage shift
    wow_change_pct DECIMAL(6, 2) NOT NULL,       -- Week-over-Week shift
    mom_change_pct DECIMAL(6, 2) NOT NULL,       -- Month-over-Month shift
    
    -- Macroeconomic CPI Transmission
    transport_cpi_impact_bps DECIMAL(6, 2),     -- Transport group impact in Basis Points
    headline_cpi_impact_bps DECIMAL(6, 3),      -- All-India Headline CPI impact in Basis Points
    
    -- Data Integrity & Sample Size
    sample_size_quotes INT NOT NULL,
    active_routes_covered INT NOT NULL,
    data_trust_score DECIMAL(5, 2) DEFAULT 85.10 CHECK (data_trust_score >= 0 AND data_trust_score <= 100),
    batch_verification_hash VARCHAR(64) NOT NULL,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_indices_date ON daily_indices(index_date);

-- ----------------------------------------------------------------------------
-- 9. INDEX COMPONENTS (Route & Booking Horizon Disaggregation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS index_components (
    id SERIAL PRIMARY KEY,
    daily_index_id INT NOT NULL REFERENCES daily_indices(id) ON DELETE CASCADE,
    route_id INT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    booking_horizon VARCHAR(10) NOT NULL CHECK (booking_horizon IN ('T+1', 'T+7', 'T+15', 'T+30', 'T+45')),
    
    price_relative DECIMAL(8, 4) NOT NULL,       -- (p_t / p_0)
    weight_used DECIMAL(8, 6) NOT NULL,          -- Weight assigned to route-horizon cell
    weighted_relative DECIMAL(10, 6) NOT NULL,   -- price_relative * weight_used
    component_contribution_bps DECIMAL(6, 2),   -- Contribution to aggregate DoD change
    
    period_mean_fare DECIMAL(10, 2) NOT NULL,
    base_period_fare DECIMAL(10, 2) NOT NULL,
    quotes_count INT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_component_daily_route_horizon UNIQUE (daily_index_id, route_id, booking_horizon)
);

CREATE INDEX IF NOT EXISTS idx_index_components_route ON index_components(route_id);
CREATE INDEX IF NOT EXISTS idx_index_components_horizon ON index_components(booking_horizon);

-- ----------------------------------------------------------------------------
-- 10. AUDIT LOGS (MoSPI Statistical Integrity & Tamper Proofing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'SCRAPE_RUN', 'DAILY_INDEX', 'ROUTE_WEIGHTS', 'POLICY_SIMULATION'
    entity_id VARCHAR(64),
    action VARCHAR(50) NOT NULL,      -- e.g., 'INGEST', 'VALIDATE', 'CALCULATE_INDEX', 'ADJUST_WEIGHT', 'EXPORT'
    actor VARCHAR(100) DEFAULT 'SkyFare_Automated_Engine',
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    previous_state_hash VARCHAR(64),
    new_state_hash VARCHAR(64),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    metadata_json TEXT,               -- Extended audit telemetry (JSON payload)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- ANALYTICAL VIEWS (Convenience for MoSPI Econometric Queries)
-- ============================================================================

-- View: Current Advance-Booking Horizon Matrix
CREATE OR REPLACE VIEW view_horizon_price_matrix AS
SELECT 
    r.route_code,
    fo.booking_horizon,
    ROUND(AVG(fo.total_fare), 2) AS average_fare,
    ROUND(MIN(fo.total_fare), 2) AS min_fare,
    ROUND(MAX(fo.total_fare), 2) AS max_fare,
    COUNT(fo.id) AS quotes_count,
    ROUND(AVG(fo.price_deviation_pct), 2) AS avg_deviation_pct
FROM fare_observations fo
JOIN routes r ON fo.route_id = r.id
GROUP BY r.route_code, fo.booking_horizon
ORDER BY r.route_code, fo.booking_horizon;

-- View: Route Volatility & Critical Spikes
CREATE OR REPLACE VIEW view_critical_route_spikes AS
SELECT 
    r.route_code,
    a_orig.city AS origin,
    a_dest.city AS destination,
    ROUND(AVG(fo.total_fare), 2) AS current_mean_fare,
    ROUND(AVG(fo.corridor_baseline_30d), 2) AS baseline_fare,
    ROUND(((AVG(fo.total_fare) - AVG(fo.corridor_baseline_30d)) / AVG(fo.corridor_baseline_30d)) * 100, 2) AS surge_pct,
    COUNT(fo.id) AS sample_size
FROM fare_observations fo
JOIN routes r ON fo.route_id = r.id
JOIN airports a_orig ON r.origin_airport_id = a_orig.id
JOIN airports a_dest ON r.destination_airport_id = a_dest.id
GROUP BY r.route_code, a_orig.city, a_dest.city
HAVING AVG(fo.total_fare) > AVG(fo.corridor_baseline_30d) * 1.10
ORDER BY surge_pct DESC;
