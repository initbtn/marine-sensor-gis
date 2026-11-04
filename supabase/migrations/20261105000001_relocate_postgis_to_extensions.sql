-- ==============================================================================
-- Migration: 20261105000001_relocate_postgis_to_extensions.sql
-- Description: Relocate PostGIS extension from public to extensions schema
-- Resolves: initbtn/marine-sensor-gis#32 (rls_disabled_in_public on spatial_ref_sys)
-- ==============================================================================

-- 1. Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Drop existing postgis extension in public schema and dependent empty buffer structures
DROP EXTENSION IF EXISTS postgis CASCADE;

-- 3. Re-enable postgis in dedicated extensions schema
CREATE EXTENSION postgis SCHEMA extensions;

-- 4. Reconstruct geometry columns and GiST spatial indexes on marine_control tables
ALTER TABLE marine_control.vessels ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_vessels_geom ON marine_control.vessels USING GIST (geom);

ALTER TABLE marine_control.eca_zones ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326) NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eca_zones_geom ON marine_control.eca_zones USING GIST (geom);

-- 5. Restore spatial trigger function and trigger
CREATE OR REPLACE FUNCTION marine_control.update_vessel_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geom = extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.lng, NEW.lat), 4326);
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

-- 6. Grant schema usage to standard API roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
