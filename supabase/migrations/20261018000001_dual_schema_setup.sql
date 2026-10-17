-- ==============================================================================
-- Migration: 20261018000001_dual_schema_setup.sql
-- Description: Setup marine_edge and marine_control schemas with PostGIS & Realtime
-- ==============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Dual Schemas
CREATE SCHEMA IF NOT EXISTS marine_edge;
CREATE SCHEMA IF NOT EXISTS marine_control;

-- 3. Schema: marine_edge (Ship-side buffer & store-and-forward queue)
CREATE TABLE IF NOT EXISTS marine_edge.telemetry_buffer (
    id BIGSERIAL PRIMARY KEY,
    vessel_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    scrubber_dp DOUBLE PRECISION,
    scrubber_ph DOUBLE PRECISION,
    scrubber_turbidity DOUBLE PRECISION,
    scrubber_so2_co2_ratio DOUBLE PRECISION,
    bwts_filter_dp DOUBLE PRECISION,
    bwts_uv_intensity DOUBLE PRECISION,
    bwts_tro DOUBLE PRECISION,
    data_integrity_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_buffer_status_vessel
    ON marine_edge.telemetry_buffer (status, vessel_id);

CREATE TABLE IF NOT EXISTS marine_edge.sync_queue (
    id BIGSERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,
    record_count INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'IN_FLIGHT', 'COMPLETED', 'FAILED')),
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marine_edge.active_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id TEXT NOT NULL,
    system_type TEXT NOT NULL CHECK (system_type IN ('SCRUBBER', 'BWTS', 'ENGINE', 'NAVIGATION')),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    message TEXT NOT NULL,
    value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_alarms_ack_vessel
    ON marine_edge.active_alarms (acknowledged, vessel_id);

-- 4. Schema: marine_control (Fleet Command Hub & Analytics)
CREATE TABLE IF NOT EXISTS marine_control.vessels (
    id TEXT PRIMARY KEY,
    imo_number TEXT,
    name TEXT NOT NULL,
    call_sign TEXT,
    vessel_type TEXT,
    flag TEXT,
    gross_tonnage DOUBLE PRECISION,
    length_meters DOUBLE PRECISION,
    beam_meters DOUBLE PRECISION,
    destination TEXT,
    eta TIMESTAMPTZ,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    speed_kts DOUBLE PRECISION,
    heading_deg DOUBLE PRECISION,
    nav_status TEXT,
    last_contact TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessels_geom
    ON marine_control.vessels USING GIST (geom);

CREATE TABLE IF NOT EXISTS marine_control.telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    vessel_id TEXT NOT NULL REFERENCES marine_control.vessels(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    scrubber_dp DOUBLE PRECISION,
    scrubber_ph DOUBLE PRECISION,
    scrubber_turbidity DOUBLE PRECISION,
    scrubber_so2_co2_ratio DOUBLE PRECISION,
    bwts_filter_dp DOUBLE PRECISION,
    bwts_uv_intensity DOUBLE PRECISION,
    bwts_tro DOUBLE PRECISION,
    compliance_status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (compliance_status IN ('NORMAL', 'WARNING', 'VIOLATION')),
    data_integrity_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_logs_vessel_time
    ON marine_control.telemetry_logs (vessel_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS marine_control.compliance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id TEXT NOT NULL REFERENCES marine_control.vessels(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    rule_code TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marine_control.eca_zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    region_type TEXT NOT NULL CHECK (region_type IN ('SOX_ECA', 'NOX_ECA', 'SPECIAL_AREA')),
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_eca_zones_geom
    ON marine_control.eca_zones USING GIST (geom);

-- 5. Trigger: Auto-update geom point in marine_control.vessels when lat/lng are updated
CREATE OR REPLACE FUNCTION marine_control.update_vessel_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_vessel_geom ON marine_control.vessels;
CREATE TRIGGER trg_update_vessel_geom
    BEFORE INSERT OR UPDATE OF lat, lng ON marine_control.vessels
    FOR EACH ROW
    EXECUTE FUNCTION marine_control.update_vessel_geom();

-- 6. Permissions and Role Grants for Supabase API (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA marine_edge, marine_control TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA marine_edge, marine_control TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA marine_edge, marine_control TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marine_edge GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marine_control GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marine_edge GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marine_control GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 7. Realtime Publication Setup
DO $$
BEGIN
    -- Check if publication exists (default supabase_realtime)
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE marine_control.vessels;
        ALTER PUBLICATION supabase_realtime ADD TABLE marine_control.telemetry_logs;
        ALTER PUBLICATION supabase_realtime ADD TABLE marine_edge.active_alarms;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
END;
$$;
