-- SQL Script to Connect Zones and Areas Tables to Services Table
-- This script establishes proper foreign key relationships and data integrity

-- ============================================================================
-- STEP 1: IMPROVE TABLE STRUCTURES (Optional but Recommended)
-- ============================================================================

-- Fix zones table structure
ALTER TABLE zones DROP CONSTRAINT zones_pkey;
ALTER TABLE zones ADD CONSTRAINT zones_pkey PRIMARY KEY (zone_id);
ALTER TABLE zones ADD CONSTRAINT zones_id_unique UNIQUE (id);
ALTER TABLE zones ALTER COLUMN zone_name SET NOT NULL;
ALTER TABLE zones ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Fix areas table structure  
ALTER TABLE areas DROP CONSTRAINT areas_pkey;
ALTER TABLE areas ADD CONSTRAINT areas_pkey PRIMARY KEY (area_id);
ALTER TABLE areas ADD CONSTRAINT areas_id_unique UNIQUE (id);
ALTER TABLE areas ALTER COLUMN area_name SET NOT NULL;
ALTER TABLE areas ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Add zone_id foreign key to areas table (areas belong to zones)
ALTER TABLE areas ADD COLUMN zone_id text;

-- ============================================================================
-- STEP 2: DATA VALIDATION & PREPARATION
-- ============================================================================

-- Check for orphaned zones in services table
SELECT 'Orphaned Zones in Services' as check_type, COUNT(*) as count
FROM (
    SELECT DISTINCT s.zone 
    FROM services s 
    LEFT JOIN zones z ON s.zone = z.zone_id 
    WHERE z.zone_id IS NULL AND s.zone IS NOT NULL
) orphaned_zones;

-- Check for orphaned areas in services table
SELECT 'Orphaned Areas in Services' as check_type, COUNT(*) as count
FROM (
    SELECT DISTINCT s.area 
    FROM services s 
    LEFT JOIN areas a ON s.area = a.area_id 
    WHERE a.area_id IS NULL AND s.area IS NOT NULL
) orphaned_areas;

-- List all unique zones that need to be inserted
SELECT DISTINCT zone as missing_zone_id, zone as suggested_zone_name
FROM services 
WHERE zone NOT IN (SELECT zone_id FROM zones) 
AND zone IS NOT NULL
ORDER BY zone;

-- List all unique areas that need to be inserted
SELECT DISTINCT area as missing_area_id, area as suggested_area_name
FROM services 
WHERE area NOT IN (SELECT area_id FROM areas) 
AND area IS NOT NULL
ORDER BY area;

-- ============================================================================
-- STEP 3: INSERT MISSING REFERENCE DATA
-- ============================================================================

-- Insert missing zones from services table
INSERT INTO zones (zone_id, zone_name)
SELECT DISTINCT s.zone, s.zone
FROM services s
LEFT JOIN zones z ON s.zone = z.zone_id
WHERE z.zone_id IS NULL 
AND s.zone IS NOT NULL
ON CONFLICT (zone_id) DO NOTHING;

-- Insert missing areas from services table
INSERT INTO areas (area_id, area_name)
SELECT DISTINCT s.area, s.area
FROM services s
LEFT JOIN areas a ON s.area = a.area_id
WHERE a.area_id IS NULL 
AND s.area IS NOT NULL
ON CONFLICT (area_id) DO NOTHING;

-- ============================================================================
-- STEP 4: ESTABLISH ZONE-AREA RELATIONSHIPS
-- ============================================================================

-- Update areas with their corresponding zone_id based on services data
UPDATE areas 
SET zone_id = (
    SELECT DISTINCT s.zone 
    FROM services s 
    WHERE s.area = areas.area_id 
    AND s.zone IS NOT NULL
    LIMIT 1
)
WHERE zone_id IS NULL;

-- ============================================================================
-- STEP 5: CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint: areas.zone_id -> zones.zone_id
ALTER TABLE areas 
ADD CONSTRAINT fk_areas_zone 
FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
ON UPDATE CASCADE ON DELETE SET NULL;

-- Add foreign key constraint: services.zone -> zones.zone_id
ALTER TABLE services 
ADD CONSTRAINT fk_services_zone 
FOREIGN KEY (zone) REFERENCES zones(zone_id)
ON UPDATE CASCADE ON DELETE SET NULL;

-- Add foreign key constraint: services.area -> areas.area_id
ALTER TABLE services 
ADD CONSTRAINT fk_services_area 
FOREIGN KEY (area) REFERENCES areas(area_id)
ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for zones table
CREATE INDEX IF NOT EXISTS idx_zones_zone_name ON zones(zone_name);
CREATE INDEX IF NOT EXISTS idx_zones_created_at ON zones(created_at);

-- Indexes for areas table
CREATE INDEX IF NOT EXISTS idx_areas_area_name ON areas(area_name);
CREATE INDEX IF NOT EXISTS idx_areas_zone_id ON areas(zone_id);
CREATE INDEX IF NOT EXISTS idx_areas_created_at ON areas(created_at);

-- Indexes for services table foreign keys
CREATE INDEX IF NOT EXISTS idx_services_zone ON services(zone);
CREATE INDEX IF NOT EXISTS idx_services_area ON services(area);

-- ============================================================================
-- STEP 7: CREATE USEFUL VIEWS
-- ============================================================================

-- View: Services with full zone and area information
CREATE OR REPLACE VIEW services_with_location AS
SELECT 
    s.*,
    z.zone_name,
    a.area_name,
    z.zone_name || ' - ' || a.area_name as full_location
FROM services s
LEFT JOIN zones z ON s.zone = z.zone_id
LEFT JOIN areas a ON s.area = a.area_id;

-- View: Zone and Area summary statistics
CREATE OR REPLACE VIEW location_summary AS
SELECT 
    z.zone_id,
    z.zone_name,
    COUNT(DISTINCT a.area_id) as area_count,
    COUNT(s.id) as total_services,
    SUM(s.gallons_collected) as total_gallons,
    AVG(s.gallons_collected) as avg_gallons_per_service,
    COUNT(DISTINCT s.entity_id) as unique_locations,
    COUNT(DISTINCT s.service_provider) as provider_count
FROM zones z
LEFT JOIN areas a ON z.zone_id = a.zone_id
LEFT JOIN services s ON a.area_id = s.area
GROUP BY z.zone_id, z.zone_name
ORDER BY total_services DESC;

-- ============================================================================
-- STEP 8: VERIFICATION QUERIES
-- ============================================================================

-- Verify foreign key relationships
SELECT 'Foreign Key Integrity Check' as status;

-- Check services -> zones relationship
SELECT COUNT(*) as services_with_valid_zones
FROM services s
JOIN zones z ON s.zone = z.zone_id;

-- Check services -> areas relationship  
SELECT COUNT(*) as services_with_valid_areas
FROM services s
JOIN areas a ON s.area = a.area_id;

-- Check areas -> zones relationship
SELECT COUNT(*) as areas_with_valid_zones
FROM areas a
JOIN zones z ON a.zone_id = z.zone_id;