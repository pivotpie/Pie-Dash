-- QUICK SETUP: Minimal script to establish foreign key relationships
-- Run this if you want a simple connection without table structure changes

-- 1. Insert missing zones from services table
INSERT INTO zones (zone_id, zone_name)
SELECT DISTINCT zone, zone
FROM services 
WHERE zone IS NOT NULL 
AND zone NOT IN (SELECT zone_id FROM zones)
ON CONFLICT DO NOTHING;

-- 2. Insert missing areas from services table  
INSERT INTO areas (area_id, area_name)
SELECT DISTINCT area, area
FROM services 
WHERE area IS NOT NULL 
AND area NOT IN (SELECT area_id FROM areas)
ON CONFLICT DO NOTHING;

-- 3. Add foreign key constraints
ALTER TABLE services 
ADD CONSTRAINT fk_services_zone 
FOREIGN KEY (zone) REFERENCES zones(zone_id);

ALTER TABLE services 
ADD CONSTRAINT fk_services_area 
FOREIGN KEY (area) REFERENCES areas(area_id);

-- 4. Add basic indexes
CREATE INDEX idx_services_zone ON services(zone);
CREATE INDEX idx_services_area ON services(area);
CREATE INDEX idx_zones_name ON zones(zone_name);
CREATE INDEX idx_areas_name ON areas(area_name);