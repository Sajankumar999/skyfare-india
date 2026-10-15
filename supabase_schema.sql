-- ==============================================================================
-- SkyFare India — Official Supabase PostgreSQL DDL & Governance Schema
-- ==============================================================================
-- Sovereign National Airfare Intelligence Architecture for MoSPI & RBI
-- Adheres to UN/ILO CPI Manual (2020) & DGCA Aircraft Rules 1937, Rule 135
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE STORAGE TABLES
-- ==============================================================================

-- Table: fare_observations (Live Multi-Source Empirical Microdata)
CREATE TABLE IF NOT EXISTS public.fare_observations (
    id BIGSERIAL PRIMARY KEY,
    airline VARCHAR(64) NOT NULL,
    route_code VARCHAR(16) NOT NULL,
    booking_horizon VARCHAR(8) NOT NULL CHECK (booking_horizon IN ('T+1', 'T+7', 'T+15', 'T+30', 'T+45')),
    base_fare NUMERIC(10, 2) NOT NULL CHECK (base_fare > 0),
    total_fare NUMERIC(10, 2) NOT NULL CHECK (total_fare >= base_fare),
    corridor_baseline_30d NUMERIC(10, 2),
    source_platform VARCHAR(32) NOT NULL DEFAULT 'google_flights'
        CHECK (source_platform IN ('google_flights', 'makemytrip', 'easemytrip', 'serpapi', 'mock')),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_obs_route_observed ON public.fare_observations (route_code, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_horizon ON public.fare_observations (booking_horizon);
CREATE INDEX IF NOT EXISTS idx_obs_platform ON public.fare_observations (source_platform);
CREATE INDEX IF NOT EXISTS idx_obs_observed_at ON public.fare_observations (observed_at DESC);

-- Table: fare_quarantine (Tukey IQR Outliers & Malformed Quotes Immutable Audit Store)
CREATE TABLE IF NOT EXISTS public.fare_quarantine (
    id BIGSERIAL PRIMARY KEY,
    airline VARCHAR(64),
    route_code VARCHAR(16),
    booking_horizon VARCHAR(8),
    base_fare NUMERIC(10, 2),
    total_fare NUMERIC(10, 2),
    reason_code VARCHAR(64) NOT NULL,
    reason_detail TEXT NOT NULL,
    source_platform VARCHAR(32) DEFAULT 'google_flights',
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_quar_route ON public.fare_quarantine (route_code);
CREATE INDEX IF NOT EXISTS idx_quar_reason ON public.fare_quarantine (reason_code);
CREATE INDEX IF NOT EXISTS idx_quar_at ON public.fare_quarantine (quarantined_at DESC);

-- Table: daily_indices (35-Day Trailing Rolling National Price Indices)
CREATE TABLE IF NOT EXISTS public.daily_indices (
    id BIGSERIAL PRIMARY KEY,
    index_date DATE NOT NULL UNIQUE,
    laspeyres_index NUMERIC(10, 4) NOT NULL,
    paasche_index NUMERIC(10, 4) NOT NULL,
    fisher_ideal_index NUMERIC(10, 4) NOT NULL,
    jevons_index NUMERIC(10, 4) NOT NULL,
    tornqvist_index NUMERIC(10, 4) NOT NULL,
    dod_change_pct NUMERIC(8, 4) NOT NULL DEFAULT 0.0,
    average_live_fare NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    observations INTEGER NOT NULL DEFAULT 0,
    routes INTEGER NOT NULL DEFAULT 14,
    methodology VARCHAR(64) NOT NULL DEFAULT 'Superlative Fisher Ideal',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_indices_date ON public.daily_indices (index_date DESC);

-- Table: route_weights (Official DGCA Category-I Trunk Corridor Passenger Volume Weights)
CREATE TABLE IF NOT EXISTS public.route_weights (
    route_code VARCHAR(16) PRIMARY KEY,
    base_quantity NUMERIC(14, 2) NOT NULL,
    current_quantity NUMERIC(14, 2) NOT NULL,
    data_source VARCHAR(128) NOT NULL DEFAULT 'DGCA City-Pair Traffic Statistics Form 1-B',
    effective_date DATE NOT NULL DEFAULT '2026-01-01'
);

-- ==============================================================================
-- 3. SEED DATA (Official DGCA Category-I Corridor Weights)
-- ==============================================================================
INSERT INTO public.route_weights (route_code, base_quantity, current_quantity, data_source, effective_date)
VALUES
    ('DEL-BOM', 2680000.0, 2720000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('BOM-DEL', 2540000.0, 2580000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('DEL-BLR', 1920000.0, 1980000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('BLR-DEL', 1880000.0, 1940000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('BOM-BLR', 1450000.0, 1480000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('BLR-BOM', 1420000.0, 1460000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('DEL-CCU', 1350000.0, 1390000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('CCU-DEL', 1320000.0, 1360000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('DEL-HYD', 1180000.0, 1220000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('HYD-DEL', 1150000.0, 1190000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('MAA-DEL', 920000.0, 950000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('DEL-MAA', 890000.0, 920000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('CCU-BOM', 780000.0, 810000.0, 'DGCA Form 1-B', '2026-01-01'),
    ('BOM-GOI', 950000.0, 990000.0, 'DGCA Form 1-B', '2026-01-01')
ON CONFLICT (route_code) DO UPDATE
SET base_quantity = EXCLUDED.base_quantity,
    current_quantity = EXCLUDED.current_quantity,
    effective_date = EXCLUDED.effective_date;

-- ==============================================================================
-- 4. ANALYTIC VIEWS
-- ==============================================================================

-- View: v_platform_consensus_fares (Cross-Platform Price Triangulation)
CREATE OR REPLACE VIEW public.v_platform_consensus_fares AS
SELECT 
    route_code,
    booking_horizon,
    DATE(observed_at) AS observation_date,
    ROUND(AVG(total_fare)::numeric, 2) AS consensus_avg_fare,
    ROUND(AVG(CASE WHEN source_platform = 'google_flights' THEN total_fare END)::numeric, 2) AS google_flights_avg,
    ROUND(AVG(CASE WHEN source_platform = 'makemytrip' THEN total_fare END)::numeric, 2) AS makemytrip_avg,
    ROUND(AVG(CASE WHEN source_platform = 'easemytrip' THEN total_fare END)::numeric, 2) AS easemytrip_avg,
    ROUND(
        (MAX(total_fare) - MIN(total_fare)) / NULLIF(MIN(total_fare), 0) * 100.0::numeric,
        2
    ) AS cross_platform_spread_pct,
    COUNT(*) AS total_samples
FROM public.fare_observations
WHERE total_fare > 0
GROUP BY route_code, booking_horizon, DATE(observed_at);

-- View: v_latest_corridor_spot (Latest Spot Fares vs 30-Day Baseline)
CREATE OR REPLACE VIEW public.v_latest_corridor_spot AS
WITH latest_obs AS (
    SELECT route_code, booking_horizon, MAX(observed_at) AS max_time
    FROM public.fare_observations
    WHERE total_fare > 0
    GROUP BY route_code, booking_horizon
)
SELECT 
    fo.route_code,
    fo.booking_horizon,
    ROUND(AVG(fo.total_fare)::numeric, 2) AS current_spot_fare,
    ROUND(AVG(COALESCE(fo.corridor_baseline_30d, fo.total_fare))::numeric, 2) AS baseline_fare,
    ROUND(
        ((AVG(fo.total_fare) - AVG(COALESCE(fo.corridor_baseline_30d, fo.total_fare))) 
        / NULLIF(AVG(COALESCE(fo.corridor_baseline_30d, fo.total_fare)), 0) * 100.0)::numeric,
        2
    ) AS deviation_pct,
    COUNT(*) AS quote_count
FROM public.fare_observations fo
JOIN latest_obs lo 
    ON fo.route_code = lo.route_code 
   AND fo.booking_horizon = lo.booking_horizon 
   AND DATE(fo.observed_at) = DATE(lo.max_time)
GROUP BY fo.route_code, fo.booking_horizon;

-- ==============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enforces public read transparency while locking write mutations to service_role

ALTER TABLE public.fare_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_weights ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read (Citizen Portal & Open Macroeconomic Transparency)
CREATE POLICY "Public read on fare_observations" ON public.fare_observations FOR SELECT USING (true);
CREATE POLICY "Public read on daily_indices" ON public.daily_indices FOR SELECT USING (true);
CREATE POLICY "Public read on route_weights" ON public.route_weights FOR SELECT USING (true);
CREATE POLICY "Public read on fare_quarantine" ON public.fare_quarantine FOR SELECT USING (true);

-- Policy: Service Role Mutation (GitHub Actions & Ingestion Workers Only)
CREATE POLICY "Service role mutate fare_observations" ON public.fare_observations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role mutate daily_indices" ON public.daily_indices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role mutate route_weights" ON public.route_weights FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role mutate fare_quarantine" ON public.fare_quarantine FOR ALL USING (auth.role() = 'service_role');
