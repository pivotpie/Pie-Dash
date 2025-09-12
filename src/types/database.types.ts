// Pie Dash Database Types - Grease Trap Collection System

// Service table - main grease collection records
export interface Service {
  id: string;
  service_report: string;
  entity_id: string;
  service_provider: string;
  collected_date: string;
  discharged_date: string;
  initiated_date: string;
  area: string;
  assigned_vehicle: number;
  category: string;
  discharge_txn: string;
  outlet_name: string;
  gallons_collected: number;
  initiator: string;
  trap_count: number;
  status: string;
  sub_area?: string;
  sub_category?: string;
  trade_license_number?: number;
  trap_label?: string;
  trap_type?: string;
  zone: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}


// Dashboard View Types

// Geographic dashboard data
export interface DashboardGeographic {
  area: string;
  zone: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  unique_locations: number;
  provider_count: number;
  vehicle_count: number;
  percentage: number;
}

// Categories dashboard data
export interface DashboardCategory {
  category: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  median_gallons: number;
  std_gallons: number;
  unique_locations: number;
  areas_served: number;
  service_providers: number;
  percentage: number;
}

// Volume dashboard data
export interface DashboardVolume {
  gallons_collected: number;
  volume_range: string;
  frequency: number;
  percentage: number;
  total_gallons: number;
  avg_gallons: number;
}

// Provider dashboard data
export interface DashboardProvider {
  service_provider: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  unique_entities: number;
  areas_served: number;
  zones_served: number;
  vehicles_used: number;
  avg_turnaround_days: number;
  market_share: number;
  collections_per_vehicle: number;
}

// Location pattern data
export interface LocationPattern {
  entity_id: string;
  category: string;
  area: string;
  avg_interval_days: number;
  last_collection: string;
  days_since_last: number;
  delay_status: 'CRITICAL' | 'WARNING' | 'ON_SCHEDULE';
  outlet_name: string;
}

// Zones table data
export interface Zone {
  id?: string; // UUID, optional if using zone_id as primary key
  zone_id: string;
  zone_name: string;
  latitude?: number; // Zone center coordinates
  longitude?: number;
  boundary_coordinates?: number[][]; // Array of [lat, lng] points for zone boundary
  color?: string; // Hex color for map visualization
  created_at: string;
  updated_at?: string;
}

// Areas table data
export interface Area {
  id?: string; // UUID, optional if using area_id as primary key
  area_id: string;
  area_name: string;
  zone_id?: string; // Foreign key to zones table
  latitude?: number; // Area center coordinates
  longitude?: number;
  boundary_coordinates?: number[][]; // Array of [lat, lng] points for area boundary
  color?: string; // Hex color for map visualization
  created_at: string;
  updated_at?: string;
}

// Mapping-specific types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VehicleLocation {
  vehicle_id: number;
  latitude: number;
  longitude: number;
  status: 'active' | 'idle' | 'maintenance';
  assigned_zone?: string;
  assigned_area?: string;
  last_updated: string;
}

export interface CollectionPoint {
  entity_id: string;
  outlet_name: string;
  latitude: number;
  longitude: number;
  area: string;
  zone: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  days_overdue: number;
  expected_gallons: number;
  last_collection?: string;
}

export interface RouteVisualization {
  route_id: string;
  vehicle_id: number;
  path_coordinates: number[][]; // Array of [lat, lng] points
  collection_points: CollectionPoint[];
  total_distance: number;
  estimated_time: number;
  zone: string;
  color: string;
}