-- Pie Dash Database Schema
-- Grease Trap Collection Management System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For future geospatial features

-- Main services table (exact match to CSV structure)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_report VARCHAR(50) UNIQUE NOT NULL, -- "RN 176975"
  entity_id VARCHAR(20) NOT NULL, -- "E-1559"
  service_provider VARCHAR(100) NOT NULL, -- "Service Provider 37"
  collected_date DATE NOT NULL,
  discharged_date DATE NOT NULL,
  initiated_date DATE NOT NULL,
  area VARCHAR(50) NOT NULL, -- "Abu Hl", "Al Quoz", etc.
  assigned_vehicle INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL, -- "Restaurant", "Accommodation"
  discharge_txn VARCHAR(50) NOT NULL, -- "DT051864"
  outlet_name VARCHAR(200) NOT NULL, -- "Facility 1559"
  gallons_collected INTEGER NOT NULL CHECK (gallons_collected > 0),
  initiator VARCHAR(50) NOT NULL, -- "Org's System", "Munci's System"
  trap_count INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'Discharged',
  sub_area VARCHAR(50),
  sub_category VARCHAR(50),
  trade_license_number INTEGER,
  trap_label VARCHAR(50),
  trap_type VARCHAR(10), -- "AG2", "AG1", "B", etc.
  zone VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8), -- For Phase 2 mapping
  longitude DECIMAL(11, 8), -- For Phase 2 mapping
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service providers table
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  license_number VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number INTEGER UNIQUE NOT NULL,
  license_plate VARCHAR(20),
  type VARCHAR(50) DEFAULT 'Grease Truck',
  capacity INTEGER, -- in gallons
  service_provider_id UUID REFERENCES service_providers(id),
  status VARCHAR(20) DEFAULT 'active',
  last_maintenance DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Areas and zones reference table
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_name VARCHAR(50) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  sub_area VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(area_name, zone)
);

-- Business categories table
CREATE TABLE business_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) UNIQUE NOT NULL,
  sub_category VARCHAR(50),
  description TEXT,
  frequency_days INTEGER DEFAULT 30, -- Default collection frequency
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Entities (businesses/outlets) table
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id VARCHAR(20) UNIQUE NOT NULL, -- "E-1559"
  outlet_name VARCHAR(200) NOT NULL,
  trade_license_number INTEGER,
  category_id UUID REFERENCES business_categories(id),
  area_id UUID REFERENCES areas(id),
  address TEXT,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  trap_count INTEGER DEFAULT 1,
  trap_type VARCHAR(10),
  trap_label VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_services_entity_id ON services(entity_id);
CREATE INDEX idx_services_area ON services(area);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_collected_date ON services(collected_date);
CREATE INDEX idx_services_zone ON services(zone);
CREATE INDEX idx_services_provider ON services(service_provider);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_date_range ON services(collected_date, discharged_date);

-- Composite indexes for analytics
CREATE INDEX idx_services_area_date ON services(area, collected_date);
CREATE INDEX idx_services_category_date ON services(category, collected_date);
CREATE INDEX idx_services_provider_date ON services(service_provider, collected_date);

-- Dashboard analytics views
CREATE VIEW dashboard_geographic AS
SELECT 
  area,
  zone,
  COUNT(*) as collection_count,
  SUM(gallons_collected) as total_gallons,
  AVG(gallons_collected)::DECIMAL(10,2) as avg_gallons,
  COUNT(DISTINCT entity_id) as unique_locations,
  COUNT(DISTINCT service_provider) as provider_count,
  MIN(collected_date) as first_collection,
  MAX(collected_date) as last_collection
FROM services 
GROUP BY area, zone
ORDER BY total_gallons DESC;

CREATE VIEW dashboard_categories AS
SELECT 
  category,
  COUNT(*) as collection_count,
  SUM(gallons_collected) as total_gallons,
  AVG(gallons_collected)::DECIMAL(10,2) as avg_gallons,
  COUNT(DISTINCT entity_id) as unique_locations,
  COUNT(DISTINCT area) as area_count,
  ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM services) * 100), 2) as percentage
FROM services 
GROUP BY category
ORDER BY collection_count DESC;

CREATE VIEW dashboard_volumes AS
SELECT 
  DATE_TRUNC('month', collected_date) as month,
  COUNT(*) as collection_count,
  SUM(gallons_collected) as total_gallons,
  AVG(gallons_collected)::DECIMAL(10,2) as avg_gallons,
  MIN(gallons_collected) as min_gallons,
  MAX(gallons_collected) as max_gallons,
  COUNT(DISTINCT entity_id) as unique_locations,
  COUNT(DISTINCT service_provider) as active_providers
FROM services 
GROUP BY DATE_TRUNC('month', collected_date)
ORDER BY month;

CREATE VIEW dashboard_performance AS
SELECT 
  service_provider,
  COUNT(*) as total_collections,
  SUM(gallons_collected) as total_gallons,
  AVG(gallons_collected)::DECIMAL(10,2) as avg_gallons_per_collection,
  COUNT(DISTINCT entity_id) as unique_customers,
  COUNT(DISTINCT area) as areas_covered,
  MIN(collected_date) as first_service,
  MAX(collected_date) as last_service,
  AVG(discharged_date - collected_date)::DECIMAL(10,2) as avg_processing_days
FROM services 
GROUP BY service_provider
ORDER BY total_collections DESC;

CREATE VIEW dashboard_delays AS
SELECT 
  service_report,
  entity_id,
  outlet_name,
  service_provider,
  area,
  zone,
  collected_date,
  discharged_date,
  initiated_date,
  (discharged_date - collected_date) as processing_days,
  (collected_date - initiated_date) as response_days,
  gallons_collected,
  category,
  CASE 
    WHEN (discharged_date - collected_date) > 3 THEN 'High'
    WHEN (discharged_date - collected_date) > 1 THEN 'Medium'
    ELSE 'Normal'
  END as processing_priority,
  CASE 
    WHEN (collected_date - initiated_date) > 7 THEN 'Delayed'
    WHEN (collected_date - initiated_date) > 3 THEN 'Warning'
    ELSE 'On Time'
  END as response_status
FROM services 
WHERE status = 'Discharged'
ORDER BY processing_days DESC, response_days DESC;

-- KPI calculation view
CREATE VIEW dashboard_kpis AS
SELECT 
  COUNT(*) as total_collections,
  SUM(gallons_collected) as total_gallons,
  AVG(gallons_collected)::DECIMAL(10,2) as avg_gallons,
  COUNT(DISTINCT entity_id) as unique_locations,
  COUNT(DISTINCT service_provider) as active_providers,
  COUNT(DISTINCT area) as areas_served,
  AVG(discharged_date - collected_date)::DECIMAL(10,2) as avg_processing_time,
  AVG(collected_date - initiated_date)::DECIMAL(10,2) as avg_response_time,
  ROUND((COUNT(CASE WHEN (collected_date - initiated_date) <= 3 THEN 1 END)::DECIMAL / COUNT(*) * 100), 2) as on_time_response_rate,
  ROUND((COUNT(CASE WHEN (discharged_date - collected_date) <= 1 THEN 1 END)::DECIMAL / COUNT(*) * 100), 2) as fast_processing_rate
FROM services 
WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days';

-- Recent activity view
CREATE VIEW recent_activity AS
SELECT 
  id,
  service_report,
  entity_id,
  outlet_name,
  service_provider,
  area,
  gallons_collected,
  collected_date,
  status,
  created_at,
  'service_collection' as activity_type
FROM services 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Monthly trends view
CREATE VIEW monthly_trends AS
SELECT 
  DATE_TRUNC('month', collected_date) as month,
  area,
  category,
  COUNT(*) as collections,
  SUM(gallons_collected) as total_gallons,
  COUNT(DISTINCT entity_id) as unique_locations
FROM services 
WHERE collected_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', collected_date), area, category
ORDER BY month DESC, total_gallons DESC;

-- Update trigger for services table
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_modtime 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

-- RLS (Row Level Security) policies for multi-tenancy if needed
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Default policy to allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON service_providers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON vehicles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON entities
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO business_categories (category, sub_category, description) VALUES
('Restaurant', 'Fast Food', 'Quick service restaurants'),
('Restaurant', 'Fine Dining', 'Full service restaurants'),
('Accommodation', 'Hotel', 'Hotels and resorts'),
('Accommodation', 'Apartment', 'Residential buildings'),
('Commercial', 'Office', 'Office buildings'),
('Commercial', 'Retail', 'Shopping centers and stores');

INSERT INTO service_providers (name, contact_person, phone, email) VALUES
('Service Provider 37', 'John Smith', '+971-50-123-4567', 'john@provider37.com'),
('Service Provider 15', 'Ahmed Ali', '+971-50-234-5678', 'ahmed@provider15.com'),
('Service Provider 22', 'Sarah Johnson', '+971-50-345-6789', 'sarah@provider22.com');

-- Insert sample areas
INSERT INTO areas (area_name, zone, sub_area) VALUES
('Abu Hl', 'Zone A', 'Abu Hl North'),
('Al Quoz', 'Zone B', 'Al Quoz Industrial'),
('Dubai Marina', 'Zone C', 'Marina Walk'),
('Downtown', 'Zone A', 'DIFC'),
('Jumeirah', 'Zone D', 'Jumeirah Beach');

-- Comments for documentation
COMMENT ON TABLE services IS 'Main grease trap collection services table';
COMMENT ON COLUMN services.service_report IS 'Unique service report number (e.g., RN 176975)';
COMMENT ON COLUMN services.entity_id IS 'Business entity identifier (e.g., E-1559)';
COMMENT ON COLUMN services.gallons_collected IS 'Amount of grease collected in gallons';
COMMENT ON COLUMN services.trap_type IS 'Type of grease trap (AG1, AG2, B, etc.)';

COMMENT ON VIEW dashboard_geographic IS 'Geographic analysis of collections by area and zone';
COMMENT ON VIEW dashboard_categories IS 'Business category analysis of collections';
COMMENT ON VIEW dashboard_volumes IS 'Monthly volume trends and statistics';
COMMENT ON VIEW dashboard_performance IS 'Service provider performance metrics';
COMMENT ON VIEW dashboard_delays IS 'Analysis of processing and response delays';