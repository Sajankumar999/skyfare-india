/**
 * SkyFare India — National Airfare Intelligence Database Specification & Seed Model
 * MoSPI Price Statistics Division
 * 
 * Includes table definitions, DDL representation, seed samples, and table metadata
 * for the 10 core required tables.
 */

export interface DbTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  nullable?: boolean;
  description: string;
}

export interface DbTableMeta {
  tableName: string;
  displayName: string;
  category: 'Core Master' | 'Ingestion & Audit' | 'Microdata Observations' | 'Econometric Indices';
  description: string;
  recordCount: number;
  columns: DbTableColumn[];
}

export const DB_TABLES_METADATA: DbTableMeta[] = [
  {
    tableName: 'airports',
    displayName: 'Airports Master',
    category: 'Core Master',
    description: 'Indian and regional airports with IATA/ICAO codes, coordinates, and DGCA Metro classifications.',
    recordCount: 42,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'iata_code', type: 'VARCHAR(3)', nullable: false, description: '3-letter IATA identifier (e.g. DEL, BOM)' },
      { name: 'icao_code', type: 'VARCHAR(4)', nullable: false, description: '4-letter ICAO identifier (e.g. VIDP, VABB)' },
      { name: 'name', type: 'VARCHAR(150)', nullable: false, description: 'Official airport facility name' },
      { name: 'city', type: 'VARCHAR(100)', nullable: false, description: 'Served metropolitan / city area' },
      { name: 'state', type: 'VARCHAR(100)', nullable: false, description: 'State or Union Territory' },
      { name: 'metro_tier', type: 'VARCHAR(20)', description: 'DGCA route classification (Tier-1, Tier-2, RCS-UDAN)' },
      { name: 'active', type: 'BOOLEAN', description: 'Active commercial operation flag' },
    ],
  },
  {
    tableName: 'airlines',
    displayName: 'Airlines Master',
    category: 'Core Master',
    description: 'Scheduled domestic commercial carriers with market share, business model, and operational status.',
    recordCount: 6,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'iata_code', type: 'VARCHAR(2)', nullable: false, description: '2-letter IATA code (e.g. 6E, AI, QP, SG)' },
      { name: 'icao_code', type: 'VARCHAR(3)', nullable: false, description: '3-letter ICAO carrier code' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Airline operating brand name' },
      { name: 'business_model', type: 'VARCHAR(20)', description: 'LCC (Low-Cost Carrier) or FSC (Full Service)' },
      { name: 'domestic_market_share', type: 'DECIMAL(5,2)', description: 'DGCA reported domestic market share %' },
      { name: 'active', type: 'BOOLEAN', description: 'Scheduled operating status flag' },
    ],
  },
  {
    tableName: 'routes',
    displayName: 'City-Pair Corridors',
    category: 'Core Master',
    description: 'Designated origin-destination corridors with nautical distance, DGCA category, and traffic density.',
    recordCount: 14,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'origin_airport_id', type: 'INT', isForeign: true, description: 'Foreign key to airports.id' },
      { name: 'destination_airport_id', type: 'INT', isForeign: true, description: 'Foreign key to airports.id' },
      { name: 'route_code', type: 'VARCHAR(7)', nullable: false, description: 'City-pair descriptor (e.g. DEL-BOM)' },
      { name: 'distance_km', type: 'INT', nullable: false, description: 'Orthodromic flight distance in kilometers' },
      { name: 'route_category', type: 'VARCHAR(20)', description: 'DGCA Route Dispersal Guideline Category (Cat-I, II, III)' },
      { name: 'high_density_corridor', type: 'BOOLEAN', description: 'Flag for high-volume trunk routes' },
    ],
  },
  {
    tableName: 'data_sources',
    displayName: 'Data Pipelines',
    category: 'Ingestion & Audit',
    description: 'Registered API connectors, GDS channels, OTA feeds, and direct airline NDC endpoints.',
    recordCount: 4,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'source_name', type: 'VARCHAR(100)', nullable: false, description: 'Channel name (e.g. OTA_Aggregator_A, Direct_NDC)' },
      { name: 'source_type', type: 'VARCHAR(50)', nullable: false, description: 'Pipeline classification (OTA, NDC, GDS)' },
      { name: 'base_url', type: 'VARCHAR(255)', description: 'Endpoint protocol URI' },
      { name: 'rate_limit_per_min', type: 'INT', description: 'Permitted API queries per minute' },
      { name: 'scrape_interval_mins', type: 'INT', description: 'Sampling frequency in minutes' },
    ],
  },
  {
    tableName: 'scrape_runs',
    displayName: 'Ingestion Scrape Runs',
    category: 'Ingestion & Audit',
    description: 'Execution batch logs storing quotes ingested, error rates, and SHA-256 cryptographic batch integrity hashes.',
    recordCount: 1440,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'source_id', type: 'INT', isForeign: true, description: 'Foreign key to data_sources.id' },
      { name: 'run_uuid', type: 'VARCHAR(64)', nullable: false, description: 'Unique batch execution UUID' },
      { name: 'status', type: 'VARCHAR(30)', description: 'IN_PROGRESS, COMPLETED, VALIDATED' },
      { name: 'quotes_fetched', type: 'INT', description: 'Number of raw quote records parsed' },
      { name: 'sha256_batch_hash', type: 'VARCHAR(64)', description: 'SHA-256 hash of all quote payloads in run' },
      { name: 'validation_status', type: 'VARCHAR(30)', description: 'Cryptographic audit badge status' },
      { name: 'started_at', type: 'TIMESTAMP', description: 'Batch initiation timestamp' },
    ],
  },
  {
    tableName: 'fare_observations',
    displayName: 'Fare Observations (Microdata)',
    category: 'Microdata Observations',
    description: 'High-frequency quotes capturing unbundled base fares, ATF surcharges, UDF/PSF, GST, horizons, and lead times.',
    recordCount: 35261,
    columns: [
      { name: 'id', type: 'BIGSERIAL', isPrimary: true, description: 'Surrogate 64-bit identifier' },
      { name: 'run_id', type: 'INT', isForeign: true, description: 'Foreign key to scrape_runs.id' },
      { name: 'route_id', type: 'INT', isForeign: true, description: 'Foreign key to routes.id' },
      { name: 'airline_id', type: 'INT', isForeign: true, description: 'Foreign key to airlines.id' },
      { name: 'flight_number', type: 'VARCHAR(15)', nullable: false, description: 'Scheduled flight number (e.g. 6E-5012)' },
      { name: 'departure_date', type: 'DATE', nullable: false, description: 'Calendar date of departure' },
      { name: 'booking_horizon', type: 'VARCHAR(10)', nullable: false, description: 'Lead time tier: T+1, T+7, T+15, T+30, T+45' },
      { name: 'lead_time_days', type: 'INT', nullable: false, description: 'Exact days between observation and departure' },
      { name: 'cabin_class', type: 'VARCHAR(30)', description: 'Economy, Premium Economy, Business' },
      { name: 'base_fare', type: 'DECIMAL(10,2)', nullable: false, description: 'Pure airline seat inventory fare' },
      { name: 'fuel_surcharge_atf', type: 'DECIMAL(10,2)', description: 'Aviation Turbine Fuel surcharge component' },
      { name: 'user_development_fee_udf', type: 'DECIMAL(8,2)', description: 'Airport infrastructure UDF' },
      { name: 'passenger_service_fee_psf', type: 'DECIMAL(8,2)', description: 'Security and passenger facilitation fee' },
      { name: 'gst_amount', type: 'DECIMAL(8,2)', description: 'Goods and Services Tax on ticket' },
      { name: 'total_fare', type: 'DECIMAL(10,2)', nullable: false, description: 'All-inclusive final consumer fare paid' },
      { name: 'source_id', type: 'INT', isForeign: true, description: 'Foreign key to data_sources.id' },
      { name: 'observed_at', type: 'TIMESTAMP', description: 'Exact microsecond quote observation timestamp' },
    ],
  },
  {
    tableName: 'route_weights',
    displayName: 'DGCA Passenger Route Weights',
    category: 'Econometric Indices',
    description: 'Fixed-base passenger volume shares and RPK weights used for Laspeyres price index aggregation.',
    recordCount: 14,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'route_id', type: 'INT', isForeign: true, description: 'Foreign key to routes.id' },
      { name: 'base_period', type: 'VARCHAR(20)', description: 'Base survey period (e.g. 2024-Q1)' },
      { name: 'passenger_volume_base', type: 'INT', description: 'Annualized passengers on corridor' },
      { name: 'passenger_share_weight', type: 'DECIMAL(8,6)', description: 'q0 weighting factor in index Σ(p_t*q_0)/Σ(p_0*q_0)' },
      { name: 'rpk_weight', type: 'DECIMAL(8,6)', description: 'Revenue Passenger Kilometer share' },
      { name: 'is_active', type: 'BOOLEAN', description: 'Active in official basket' },
    ],
  },
  {
    tableName: 'daily_indices',
    displayName: 'National Airfare Daily Indices',
    category: 'Econometric Indices',
    description: 'National domestic aggregate indices (Laspeyres, Paasche, Fisher Ideal) and macroeconomic CPI transmissions.',
    recordCount: 365,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'index_date', type: 'DATE', nullable: false, description: 'Index reference calculation date' },
      { name: 'laspeyres_index', type: 'DECIMAL(8,4)', nullable: false, description: 'Base-weighted index: 114.59' },
      { name: 'paasche_index', type: 'DECIMAL(8,4)', nullable: false, description: 'Current-weighted index: 114.41' },
      { name: 'fisher_ideal_index', type: 'DECIMAL(8,4)', nullable: false, description: 'Geometric mean sqrt(L*P): 114.50' },
      { name: 'dod_change_pct', type: 'DECIMAL(6,2)', description: 'Day-over-day price change (+11.0%)' },
      { name: 'transport_cpi_impact_bps', type: 'DECIMAL(6,2)', description: 'Transport subgroup CPI contribution in bps (+42.4)' },
      { name: 'headline_cpi_impact_bps', type: 'DECIMAL(6,3)', description: 'MoSPI All-India Headline CPI contribution (+3.64)' },
      { name: 'sample_size_quotes', type: 'INT', description: 'Number of validated quotes in basket' },
      { name: 'data_trust_score', type: 'DECIMAL(5,2)', description: 'Algorithm trust index (85.1 / 100)' },
      { name: 'batch_verification_hash', type: 'VARCHAR(64)', description: 'Cryptographic SHA-256 seal' },
    ],
  },
  {
    tableName: 'index_components',
    displayName: 'Index Route-Horizon Components',
    category: 'Econometric Indices',
    description: 'Disaggregated price relatives and weighted contributions across each route and booking horizon cell.',
    recordCount: 640,
    columns: [
      { name: 'id', type: 'SERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'daily_index_id', type: 'INT', isForeign: true, description: 'Foreign key to daily_indices.id' },
      { name: 'route_id', type: 'INT', isForeign: true, description: 'Foreign key to routes.id' },
      { name: 'booking_horizon', type: 'VARCHAR(10)', description: 'Horizon cell: T+1, T+7, T+15, T+30, T+45' },
      { name: 'price_relative', type: 'DECIMAL(8,4)', description: 'Price relative (p_t / p_0)' },
      { name: 'weight_used', type: 'DECIMAL(8,6)', description: 'Basket weighting coefficient' },
      { name: 'component_contribution_bps', type: 'DECIMAL(6,2)', description: 'Basis points contributed to total index change' },
      { name: 'period_mean_fare', type: 'DECIMAL(10,2)', description: 'Observed mean fare for cell' },
      { name: 'base_period_fare', type: 'DECIMAL(10,2)', description: 'Base period reference fare' },
    ],
  },
  {
    tableName: 'audit_logs',
    displayName: 'Statistical Audit Trail',
    category: 'Ingestion & Audit',
    description: 'Immutable ledger recording all schema modifications, index calculations, weight adjustments, and data validation.',
    recordCount: 8912,
    columns: [
      { name: 'id', type: 'BIGSERIAL', isPrimary: true, description: 'Surrogate primary key' },
      { name: 'entity_type', type: 'VARCHAR(50)', nullable: false, description: 'Affected entity (SCRAPE_RUN, DAILY_INDEX, etc.)' },
      { name: 'action', type: 'VARCHAR(50)', nullable: false, description: 'Action performed (INGEST, VALIDATE, COMPUTE)' },
      { name: 'actor', type: 'VARCHAR(100)', description: 'System service or authorized user' },
      { name: 'previous_state_hash', type: 'VARCHAR(64)', description: 'SHA-256 pre-state hash' },
      { name: 'new_state_hash', type: 'VARCHAR(64)', description: 'SHA-256 post-state hash' },
      { name: 'status', type: 'VARCHAR(20)', description: 'SUCCESS or FAILED' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Tamper-proof log creation timestamp' },
    ],
  },
];

export const RAW_SQL_SCHEMA = `-- SkyFare India — National Airfare Intelligence Database Schema (MoSPI)
-- Complete PostgreSQL / SQLite Compatible Relational Schema

-- 1. AIRPORTS MASTER
CREATE TABLE airports (
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
    metro_tier VARCHAR(20) DEFAULT 'Tier-1',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AIRLINES MASTER
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(2) NOT NULL UNIQUE,
    icao_code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    callsign VARCHAR(100),
    country VARCHAR(50) DEFAULT 'India',
    business_model VARCHAR(20) DEFAULT 'LCC',
    domestic_market_share DECIMAL(5, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROUTES (CITY-PAIRS)
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    origin_airport_id INT NOT NULL REFERENCES airports(id),
    destination_airport_id INT NOT NULL REFERENCES airports(id),
    route_code VARCHAR(7) NOT NULL UNIQUE,
    distance_km INT NOT NULL,
    route_category VARCHAR(20) DEFAULT 'Category-I',
    dgca_market_rank INT,
    high_density_corridor BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DATA SOURCES
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL,
    base_url VARCHAR(255),
    rate_limit_per_min INT DEFAULT 120,
    scrape_interval_mins INT DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SCRAPE RUNS (BATCH AUDIT)
CREATE TABLE scrape_runs (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES data_sources(id),
    run_uuid VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'IN_PROGRESS',
    quotes_fetched INT DEFAULT 0,
    error_count INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    sha256_batch_hash VARCHAR(64),
    validation_status VARCHAR(30) DEFAULT 'TAMPER_PROOF_VALIDATED',
    audit_notes TEXT
);

-- 6. FARE OBSERVATIONS (MICRODATA)
CREATE TABLE fare_observations (
    id BIGSERIAL PRIMARY KEY,
    run_id INT NOT NULL REFERENCES scrape_runs(id),
    route_id INT NOT NULL REFERENCES routes(id),
    airline_id INT NOT NULL REFERENCES airlines(id),
    flight_number VARCHAR(15) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    booking_horizon VARCHAR(10) NOT NULL, -- T+1, T+7, T+15, T+30, T+45
    lead_time_days INT NOT NULL,
    cabin_class VARCHAR(30) DEFAULT 'Economy',
    base_fare DECIMAL(10, 2) NOT NULL,
    fuel_surcharge_atf DECIMAL(10, 2) DEFAULT 0.00,
    user_development_fee_udf DECIMAL(8, 2) DEFAULT 0.00,
    passenger_service_fee_psf DECIMAL(8, 2) DEFAULT 0.00,
    aviation_security_fee_asf DECIMAL(8, 2) DEFAULT 0.00,
    gst_amount DECIMAL(8, 2) DEFAULT 0.00,
    other_taxes_fees DECIMAL(8, 2) DEFAULT 0.00,
    total_fare DECIMAL(10, 2) NOT NULL,
    source_id INT NOT NULL REFERENCES data_sources(id),
    is_nonstop BOOLEAN DEFAULT TRUE,
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ROUTE WEIGHTS (BASKET SHARES)
CREATE TABLE route_weights (
    id SERIAL PRIMARY KEY,
    route_id INT NOT NULL REFERENCES routes(id),
    base_period VARCHAR(20) DEFAULT '2024-Q1',
    passenger_volume_base INT NOT NULL,
    passenger_share_weight DECIMAL(8, 6) NOT NULL,
    rpk_weight DECIMAL(8, 6) NOT NULL,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. DAILY INDICES (MACROECONOMIC AIRFARE INDEX)
CREATE TABLE daily_indices (
    id SERIAL PRIMARY KEY,
    index_date DATE NOT NULL UNIQUE,
    laspeyres_index DECIMAL(8, 4) NOT NULL,
    paasche_index DECIMAL(8, 4) NOT NULL,
    fisher_ideal_index DECIMAL(8, 4) NOT NULL,
    dod_change_pct DECIMAL(6, 2) NOT NULL,
    transport_cpi_impact_bps DECIMAL(6, 2),
    headline_cpi_impact_bps DECIMAL(6, 3),
    sample_size_quotes INT NOT NULL,
    data_trust_score DECIMAL(5, 2) DEFAULT 85.10,
    batch_verification_hash VARCHAR(64) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDEX COMPONENTS (DISAGGREGATED BASKET)
CREATE TABLE index_components (
    id SERIAL PRIMARY KEY,
    daily_index_id INT NOT NULL REFERENCES daily_indices(id),
    route_id INT NOT NULL REFERENCES routes(id),
    booking_horizon VARCHAR(10) NOT NULL,
    price_relative DECIMAL(8, 4) NOT NULL,
    weight_used DECIMAL(8, 6) NOT NULL,
    component_contribution_bps DECIMAL(6, 2),
    period_mean_fare DECIMAL(10, 2) NOT NULL,
    base_period_fare DECIMAL(10, 2) NOT NULL
);

-- 10. AUDIT LOGS (TAMPER-PROOF LEDGER)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(100) DEFAULT 'SkyFare_Engine',
    previous_state_hash VARCHAR(64),
    new_state_hash VARCHAR(64),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;
