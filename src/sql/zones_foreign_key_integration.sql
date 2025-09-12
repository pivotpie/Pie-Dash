-- Optional: Add foreign key constraint to services table to reference zones
-- This ensures data integrity between services.zone and zones.zone_id

-- First, ensure all existing zone values in services table exist in zones table
-- Run this query to check for any orphaned zones:
SELECT DISTINCT s.zone 
FROM services s 
LEFT JOIN zones z ON s.zone = z.zone_id 
WHERE z.zone_id IS NULL;

-- If the above query returns results, you'll need to:
-- 1. Insert missing zones into the zones table, OR
-- 2. Update/clean the services.zone data

-- Once data is clean, add the foreign key constraint:
ALTER TABLE services 
ADD CONSTRAINT fk_services_zone 
FOREIGN KEY (zone) REFERENCES zones(zone_id);

-- Add index for performance
CREATE INDEX idx_services_zone ON services(zone);