// types/routing.types.ts
export interface RoutePoint {
  entity_id: string;
  latitude: number;
  longitude: number;
  gallons_expected: number;
  category: string;
  area: string;
  zone: string;
  outlet_name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  days_overdue: number;
}

export interface OptimizedRoute {
  vehicle_id: number;
  points: RoutePoint[];
  total_distance: number;
  total_time: number;
  total_gallons: number;
  efficiency_score: number;
  assigned_zone: string;
  route_color: string;
}

export interface VehicleCapacity {
  vehicle_id: number;
  max_gallons: number;
  current_load: number;
  available_capacity: number;
}

export interface RouteSegment {
  from: [number, number];
  to: [number, number];
  distance: number;
  time: number;
}

export interface RouteStatistics {
  totalRoutes: number;
  totalDistance: number;
  totalTime: number;
  totalGallons: number;
  averageEfficiency: number;
  vehiclesUsed: number;
  pointsAssigned: number;
  pointsUnassigned: number;
}

export interface RouteVisualization {
  route: OptimizedRoute;
  polylineCoordinates: [number, number][];
  waypoints: RoutePoint[];
  startPoint: [number, number];
  endPoint: [number, number];
}