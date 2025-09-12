-- Dubai Mapping Schema Updates
-- This script adds geographical support for Dubai fleet management system

-- Add coordinate columns to zones table
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS boundary_coordinates JSON,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3498DB';

-- Add coordinate columns to areas table  
ALTER TABLE areas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS boundary_coordinates JSON,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#BDC3C7';

-- Add coordinate columns to services table if not exists
ALTER TABLE services
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create vehicle_locations table for real-time tracking
CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'maintenance')),
    assigned_zone VARCHAR(100),
    assigned_area VARCHAR(100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Add indexes for performance
    INDEX idx_vehicle_locations_vehicle_id (vehicle_id),
    INDEX idx_vehicle_locations_status (status),
    INDEX idx_vehicle_locations_zone (assigned_zone),
    INDEX idx_vehicle_locations_updated (last_updated)
);

-- Create optimized_routes table for storing route optimization results
CREATE TABLE IF NOT EXISTS optimized_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    vehicle_id INTEGER NOT NULL,
    assigned_zone VARCHAR(100),
    route_color VARCHAR(7),
    total_distance DECIMAL(10, 2),
    total_time DECIMAL(8, 2),
    total_gallons INTEGER,
    efficiency_score DECIMAL(8, 2),
    points_count INTEGER,
    route_data JSON, -- Store the complete route points
    optimization_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Add indexes
    INDEX idx_optimized_routes_vehicle (vehicle_id),
    INDEX idx_optimized_routes_zone (assigned_zone),
    INDEX idx_optimized_routes_timestamp (optimization_timestamp)
);

-- Create route_points table for storing individual route points
CREATE TABLE IF NOT EXISTS route_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    sequence_order INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    outlet_name VARCHAR(255),
    category VARCHAR(100),
    area VARCHAR(100),
    zone VARCHAR(100),
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    gallons_expected INTEGER,
    days_overdue INTEGER DEFAULT 0,
    estimated_service_time DECIMAL(6, 2), -- in hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Add indexes
    INDEX idx_route_points_route (route_id),
    INDEX idx_route_points_entity (entity_id),
    INDEX idx_route_points_sequence (route_id, sequence_order),
    INDEX idx_route_points_priority (priority),
    INDEX idx_route_points_zone (zone),
    
    -- Foreign key constraint
    FOREIGN KEY (route_id) REFERENCES optimized_routes(route_id) ON DELETE CASCADE
);

-- Update existing zones with geographical coordinates based on actual database zones
-- Note: This script assumes zones table already exists with zone names as in your data

-- Update Al Quoz zone
UPDATE zones 
SET latitude = 25.1174, 
    longitude = 55.2094, 
    color = '#FF6B6B',
    boundary_coordinates = '[[25.1000, 55.1950], [25.1350, 55.1950], [25.1350, 55.2250], [25.1000, 55.2250], [25.1000, 55.1950]]'
WHERE zone_name = 'Al Quoz';

-- Update Al Qusais zone  
UPDATE zones 
SET latitude = 25.2932, 
    longitude = 55.3937, 
    color = '#4ECDC4',
    boundary_coordinates = '[[25.2700, 55.3700], [25.3200, 55.3700], [25.3200, 55.4200], [25.2700, 55.4200], [25.2700, 55.3700]]'
WHERE zone_name = 'Al Qusais';

-- Update Bur Dubai zone
UPDATE zones 
SET latitude = 25.2532, 
    longitude = 55.2972, 
    color = '#45B7D1',
    boundary_coordinates = '[[25.2300, 55.2750], [25.2800, 55.2750], [25.2800, 55.3200], [25.2300, 55.3200], [25.2300, 55.2750]]'
WHERE zone_name = 'Bur Dubai';

-- Update Deira zone
UPDATE zones 
SET latitude = 25.2697, 
    longitude = 55.3095, 
    color = '#96CEB4',
    boundary_coordinates = '[[25.2500, 55.2900], [25.2900, 55.2900], [25.2900, 55.3300], [25.2500, 55.3300], [25.2500, 55.2900]]'
WHERE zone_name = 'Deira';

-- Update Jebel Ali zone
UPDATE zones 
SET latitude = 25.0345, 
    longitude = 55.0266, 
    color = '#FFEAA7',
    boundary_coordinates = '[[24.9800, 54.9800], [25.0900, 54.9800], [25.0900, 55.0800], [24.9800, 55.0800], [24.9800, 54.9800]]'
WHERE zone_name = 'Jebel Ali';

-- Update Jumeirah zone
UPDATE zones 
SET latitude = 25.2048, 
    longitude = 55.2382, 
    color = '#DDA0DD',
    boundary_coordinates = '[[25.1800, 55.2200], [25.2300, 55.2200], [25.2300, 55.2600], [25.1800, 55.2600], [25.1800, 55.2200]]'
WHERE zone_name = 'Jumeirah';

-- Update Ras Al Khor zone
UPDATE zones 
SET latitude = 25.1804, 
    longitude = 55.3483, 
    color = '#74B9FF',
    boundary_coordinates = '[[25.1400, 55.3200], [25.2200, 55.3200], [25.2200, 55.3800], [25.1400, 55.3800], [25.1400, 55.3200]]'
WHERE zone_name = 'Ras Al Khor';

-- Update areas with geographical coordinates
-- Al Quoz zone areas
UPDATE areas 
SET latitude = 25.1137, longitude = 55.2009, color = '#FFB3B3',
    boundary_coordinates = '[[25.1050, 55.1920], [25.1225, 55.1920], [25.1225, 55.2100], [25.1050, 55.2100], [25.1050, 55.1920]]'
WHERE area_name = 'Al Barsha';

UPDATE areas 
SET latitude = 25.1211, longitude = 55.2179, color = '#FF8A8A',
    boundary_coordinates = '[[25.1125, 55.2090], [25.1300, 55.2090], [25.1300, 55.2270], [25.1125, 55.2270], [25.1125, 55.2090]]'
WHERE area_name = 'Al Quoz';

-- Al Qusais zone areas
UPDATE areas 
SET latitude = 25.2894, longitude = 55.3862, color = '#7DDDD9',
    boundary_coordinates = '[[25.2800, 55.3770], [25.2990, 55.3770], [25.2990, 55.3955], [25.2800, 55.3955], [25.2800, 55.3770]]'
WHERE area_name = 'Al Mizhar';

UPDATE areas 
SET latitude = 25.2970, longitude = 55.4012, color = '#B3E6E4',
    boundary_coordinates = '[[25.2880, 55.3920], [25.3060, 55.3920], [25.3060, 55.4105], [25.2880, 55.4105], [25.2880, 55.3920]]'
WHERE area_name = 'Al Nahda';

-- Bur Dubai zone areas
UPDATE areas 
SET latitude = 25.2456, longitude = 55.2854, color = '#7DCDFF',
    boundary_coordinates = '[[25.2370, 55.2765], [25.2545, 55.2765], [25.2545, 55.2945], [25.2370, 55.2945], [25.2370, 55.2765]]'
WHERE area_name = 'Al Bada';

UPDATE areas 
SET latitude = 25.2343, longitude = 55.3156, color = '#B3DDFF',
    boundary_coordinates = '[[25.2255, 55.3065], [25.2432, 55.3065], [25.2432, 55.3248], [25.2255, 55.3248], [25.2255, 55.3065]]'
WHERE area_name = 'Al Jaddaf';

UPDATE areas 
SET latitude = 25.2423, longitude = 55.2967, color = '#A6D8FF',
    boundary_coordinates = '[[25.2335, 55.2878], [25.2512, 55.2878], [25.2512, 55.3057], [25.2335, 55.3057], [25.2335, 55.2878]]'
WHERE area_name = 'Al Jafiliya';

UPDATE areas 
SET latitude = 25.2545, longitude = 55.3034, color = '#99D1FF',
    boundary_coordinates = '[[25.2457, 55.2945], [25.2634, 55.2945], [25.2634, 55.3124], [25.2457, 55.3124], [25.2457, 55.2945]]'
WHERE area_name = 'Al Karama';

UPDATE areas 
SET latitude = 25.2378, longitude = 55.2889, color = '#8CCCFF',
    boundary_coordinates = '[[25.2290, 55.2800], [25.2467, 55.2800], [25.2467, 55.2979], [25.2290, 55.2979], [25.2290, 55.2800]]'
WHERE area_name = 'Al Mankhool';

-- Deira zone areas
UPDATE areas 
SET latitude = 25.2834, longitude = 55.3267, color = '#C9E8C9',
    boundary_coordinates = '[[25.2745, 55.3178], [25.2924, 55.3178], [25.2924, 55.3357], [25.2745, 55.3357], [25.2745, 55.3178]]'
WHERE area_name = 'Abu Hail';

UPDATE areas 
SET latitude = 25.2723, longitude = 55.3178, color = '#BDE5BD',
    boundary_coordinates = '[[25.2634, 55.3089], [25.2813, 55.3089], [25.2813, 55.3268], [25.2634, 55.3268], [25.2634, 55.3089]]'
WHERE area_name = 'Al Baraha';

UPDATE areas 
SET latitude = 25.2467, longitude = 55.3423, color = '#B1E2B1',
    boundary_coordinates = '[[25.2378, 55.3334], [25.2557, 55.3334], [25.2557, 55.3513], [25.2378, 55.3513], [25.2378, 55.3334]]'
WHERE area_name = 'Al Garhoud';

UPDATE areas 
SET latitude = 25.2589, longitude = 55.2956, color = '#A5DFA5',
    boundary_coordinates = '[[25.2500, 55.2867], [25.2679, 55.2867], [25.2679, 55.3046], [25.2500, 55.3046], [25.2500, 55.2867]]'
WHERE area_name = 'Al Khabisi';

UPDATE areas 
SET latitude = 25.2890, longitude = 55.3534, color = '#99DC99',
    boundary_coordinates = '[[25.2801, 55.3445], [25.2980, 55.3445], [25.2980, 55.3624], [25.2801, 55.3624], [25.2801, 55.3445]]'
WHERE area_name = 'Al Mamzar';

-- Jebel Ali zone areas
UPDATE areas 
SET latitude = 25.0567, longitude = 55.0923, color = '#FFEDAA',
    boundary_coordinates = '[[25.0478, 55.0834], [25.0657, 55.0834], [25.0657, 55.1013], [25.0478, 55.1013], [25.0478, 55.0834]]'
WHERE area_name = 'Al Furjan';

UPDATE areas 
SET latitude = 24.9923, longitude = 55.0178, color = '#FFE599',
    boundary_coordinates = '[[24.9834, 55.0089], [25.0013, 55.0089], [25.0013, 55.0268], [24.9834, 55.0268], [24.9834, 55.0089]]'
WHERE area_name = 'Al Marmoom';

UPDATE areas 
SET latitude = 24.9734, longitude = 55.0445, color = '#FFDF88',
    boundary_coordinates = '[[24.9645, 55.0356], [24.9824, 55.0356], [24.9824, 55.0535], [24.9645, 55.0535], [24.9645, 55.0356]]'
WHERE area_name = 'Al Qudra';

-- Jumeirah zone areas
UPDATE areas 
SET latitude = 25.2123, longitude = 55.2467, color = '#E8CCFF',
    boundary_coordinates = '[[25.2034, 55.2378], [25.2213, 55.2378], [25.2213, 55.2557], [25.2034, 55.2557], [25.2034, 55.2378]]'
WHERE area_name = 'Al Manara';

-- Ras Al Khor zone areas
UPDATE areas 
SET latitude = 25.1456, longitude = 55.3612, color = '#A7C8FF',
    boundary_coordinates = '[[25.1367, 55.3523], [25.1546, 55.3523], [25.1546, 55.3702], [25.1367, 55.3702], [25.1367, 55.3523]]'
WHERE area_name = 'Academic City';

UPDATE areas 
SET latitude = 25.1623, longitude = 55.3701, color = '#99BEFF',
    boundary_coordinates = '[[25.1534, 55.3612], [25.1713, 55.3612], [25.1713, 55.3791], [25.1534, 55.3791], [25.1534, 55.3612]]'
WHERE area_name = 'Al Aweer';

UPDATE areas 
SET latitude = 25.1979, longitude = 55.3445, color = '#8CB4FF',
    boundary_coordinates = '[[25.1890, 55.3356], [25.2069, 55.3356], [25.2069, 55.3535], [25.1890, 55.3535], [25.1890, 55.3356]]'
WHERE area_name = 'Al Warqa';

UPDATE areas 
SET latitude = 25.2134, longitude = 55.3723, color = '#7FAAFF',
    boundary_coordinates = '[[25.2045, 55.3634], [25.2224, 55.3634], [25.2224, 55.3813], [25.2045, 55.3813], [25.2045, 55.3634]]'
WHERE area_name = 'Al Khawaneej';

UPDATE areas 
SET latitude = 25.1712, longitude = 55.3289, color = '#73A0FF',
    boundary_coordinates = '[[25.1623, 55.3200], [25.1802, 55.3200], [25.1802, 55.3379], [25.1623, 55.3379], [25.1623, 55.3200]]'
WHERE area_name = 'Al Lisaili';

-- Insert sample vehicle location data using actual zones
INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, status, assigned_zone) VALUES
(1, 25.1174, 55.2094, 'active', 'Al Quoz'),
(2, 25.2932, 55.3937, 'active', 'Al Qusais'),
(3, 25.2532, 55.2972, 'idle', 'Bur Dubai'),
(4, 25.2697, 55.3095, 'active', 'Deira'),
(5, 25.0345, 55.0266, 'maintenance', 'Jebel Ali'),
(6, 25.2048, 55.2382, 'active', 'Jumeirah'),
(7, 25.1804, 55.3483, 'idle', 'Ras Al Khor'),
(8, 25.1174, 55.2094, 'active', 'Al Quoz'),
(9, 25.2932, 55.3937, 'active', 'Al Qusais'),
(10, 25.2532, 55.2972, 'idle', 'Bur Dubai'),
(11, 25.2697, 55.3095, 'active', 'Deira'),
(12, 25.0345, 55.0266, 'maintenance', 'Jebel Ali'),
(13, 25.2048, 55.2382, 'idle', 'Jumeirah'),
(14, 25.1804, 55.3483, 'active', 'Ras Al Khor'),
(15, 25.1174, 55.2094, 'active', 'Al Quoz')
ON CONFLICT DO NOTHING;

-- Create view for services with location data
CREATE OR REPLACE VIEW services_with_location AS
SELECT 
    s.*,
    z.zone_name,
    z.latitude as zone_latitude,
    z.longitude as zone_longitude,
    z.color as zone_color,
    a.area_name,
    a.latitude as area_latitude,
    a.longitude as area_longitude,
    COALESCE(s.latitude, a.latitude, z.latitude) as effective_latitude,
    COALESCE(s.longitude, a.longitude, z.longitude) as effective_longitude
FROM services s
LEFT JOIN zones z ON s.zone = z.zone_name
LEFT JOIN areas a ON s.area = a.area_name;

-- Create view for fleet performance analysis
CREATE OR REPLACE VIEW fleet_performance_analysis AS
SELECT 
    vl.vehicle_id,
    vl.status,
    vl.assigned_zone,
    vl.assigned_area,
    vl.last_updated,
    COUNT(s.id) as total_services,
    SUM(s.gallons_collected) as total_gallons_collected,
    AVG(s.gallons_collected) as avg_gallons_per_service,
    MAX(s.collected_date) as last_service_date,
    EXTRACT(days FROM (CURRENT_DATE - MAX(s.collected_date::date))) as days_since_last_service
FROM vehicle_locations vl
LEFT JOIN services s ON s.assigned_vehicle = vl.vehicle_id
GROUP BY vl.vehicle_id, vl.status, vl.assigned_zone, vl.assigned_area, vl.last_updated;

-- Create view for zone coverage analysis
CREATE OR REPLACE VIEW zone_coverage_analysis AS
SELECT 
    z.zone_name,
    z.color as zone_color,
    COUNT(DISTINCT vl.vehicle_id) as assigned_vehicles,
    COUNT(DISTINCT s.entity_id) as collection_points,
    COUNT(DISTINCT CASE WHEN lp.delay_status = 'CRITICAL' THEN s.entity_id END) as critical_points,
    COUNT(DISTINCT CASE WHEN lp.delay_status = 'WARNING' THEN s.entity_id END) as warning_points,
    SUM(s.gallons_collected) as total_gallons_collected,
    AVG(lp.days_since_last) as avg_days_since_collection,
    AVG(CASE WHEN vl.vehicle_id IS NOT NULL THEN 100.0 ELSE 0.0 END) as vehicle_coverage_percentage
FROM zones z
LEFT JOIN services s ON s.zone = z.zone_name
LEFT JOIN vehicle_locations vl ON vl.assigned_zone = z.zone_name
LEFT JOIN location_patterns lp ON lp.entity_id = s.entity_id
GROUP BY z.zone_name, z.color;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_coordinates ON services(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_zone_area ON services(zone, area);
CREATE INDEX IF NOT EXISTS idx_zones_coordinates ON zones(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_areas_coordinates ON areas(latitude, longitude);

-- Sample services data with trade license numbers for demonstration
-- This would typically be done through a data migration process
INSERT INTO services (entity_id, outlet_name, zone, area, category, trade_license_number, collected_date, gallons_collected) VALUES
-- Al Quoz Zone samples
('TL123001', 'Al Barsha Restaurant', 'Al Quoz', 'Al Barsha', 'Restaurant', 123001, CURRENT_DATE - INTERVAL '5 days', 45),
('TL123002', 'Al Quoz Industrial Kitchen', 'Al Quoz', 'Al Quoz', 'Commercial Kitchen', 123002, CURRENT_DATE - INTERVAL '2 days', 78),
('TL123003', 'Al Barsha Hotel', 'Al Quoz', 'Al Barsha', 'Hotel', 123003, CURRENT_DATE - INTERVAL '9 days', 120),

-- Al Qusais Zone samples
('TL234001', 'Al Mizhar Cafe', 'Al Qusais', 'Al Mizhar', 'Cafe', 234001, CURRENT_DATE - INTERVAL '3 days', 32),
('TL234002', 'Al Nahda Shopping Center', 'Al Qusais', 'Al Nahda', 'Shopping Center', 234002, CURRENT_DATE - INTERVAL '1 day', 156),
('TL234003', 'Al Mizhar Restaurant Chain', 'Al Qusais', 'Al Mizhar', 'Restaurant', 234003, CURRENT_DATE - INTERVAL '8 days', 89),

-- Bur Dubai Zone samples
('TL345001', 'Al Bada Traditional Restaurant', 'Bur Dubai', 'Al Bada', 'Restaurant', 345001, CURRENT_DATE - INTERVAL '4 days', 67),
('TL345002', 'Al Jaddaf Corporate Kitchen', 'Bur Dubai', 'Al Jaddaf', 'Commercial Kitchen', 345002, CURRENT_DATE - INTERVAL '6 days', 134),
('TL345003', 'Al Karama Food Court', 'Bur Dubai', 'Al Karama', 'Food Court', 345003, CURRENT_DATE - INTERVAL '2 days', 98),
('TL345004', 'Al Mankhool Hotel', 'Bur Dubai', 'Al Mankhool', 'Hotel', 345004, CURRENT_DATE - INTERVAL '7 days', 178),

-- Deira Zone samples
('TL456001', 'Abu Hail Market Kitchen', 'Deira', 'Abu Hail', 'Market', 456001, CURRENT_DATE - INTERVAL '3 days', 87),
('TL456002', 'Al Baraha Restaurant', 'Deira', 'Al Baraha', 'Restaurant', 456002, CURRENT_DATE - INTERVAL '10 days', 156),
('TL456003', 'Al Garhoud Hotel', 'Deira', 'Al Garhoud', 'Hotel', 456003, CURRENT_DATE - INTERVAL '1 day', 234),
('TL456004', 'Al Mamzar Beach Resort', 'Deira', 'Al Mamzar', 'Resort', 456004, CURRENT_DATE - INTERVAL '5 days', 345),

-- Jebel Ali Zone samples
('TL567001', 'Al Furjan Industrial Kitchen', 'Jebel Ali', 'Al Furjan', 'Industrial Kitchen', 567001, CURRENT_DATE - INTERVAL '4 days', 289),
('TL567002', 'Al Qudra Desert Resort', 'Jebel Ali', 'Al Qudra', 'Resort', 567002, CURRENT_DATE - INTERVAL '8 days', 167),

-- Jumeirah Zone samples
('TL678001', 'Al Manara Luxury Restaurant', 'Jumeirah', 'Al Manara', 'Fine Dining', 678001, CURRENT_DATE - INTERVAL '2 days', 234),

-- Ras Al Khor Zone samples
('TL789001', 'Academic City Cafeteria', 'Ras Al Khor', 'Academic City', 'Cafeteria', 789001, CURRENT_DATE - INTERVAL '6 days', 78),
('TL789002', 'Al Aweer Food Processing', 'Ras Al Khor', 'Al Aweer', 'Food Processing', 789002, CURRENT_DATE - INTERVAL '3 days', 456),
('TL789003', 'Al Warqa Family Restaurant', 'Ras Al Khor', 'Al Warqa', 'Restaurant', 789003, CURRENT_DATE - INTERVAL '9 days', 123),
('TL789004', 'Al Khawaneej Hotel', 'Ras Al Khor', 'Al Khawaneej', 'Hotel', 789004, CURRENT_DATE - INTERVAL '4 days', 267)
ON CONFLICT (entity_id) DO NOTHING;

-- Add comments to tables for documentation
COMMENT ON TABLE vehicle_locations IS 'Real-time vehicle tracking data for fleet management';
COMMENT ON TABLE optimized_routes IS 'Generated route optimization results with efficiency metrics';
COMMENT ON TABLE route_points IS 'Individual collection points within optimized routes';
COMMENT ON VIEW services_with_location IS 'Services data enriched with geographical coordinates';
COMMENT ON VIEW fleet_performance_analysis IS 'Comprehensive fleet performance metrics by vehicle';
COMMENT ON VIEW zone_coverage_analysis IS 'Zone-based coverage and performance analysis';

-- Create function to update vehicle location
CREATE OR REPLACE FUNCTION update_vehicle_location(
    p_vehicle_id INTEGER,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_status VARCHAR DEFAULT NULL,
    p_assigned_zone VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, status, assigned_zone)
    VALUES (p_vehicle_id, p_latitude, p_longitude, COALESCE(p_status, 'active'), p_assigned_zone)
    ON CONFLICT (vehicle_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = COALESCE(EXCLUDED.status, vehicle_locations.status),
        assigned_zone = COALESCE(EXCLUDED.assigned_zone, vehicle_locations.assigned_zone),
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;