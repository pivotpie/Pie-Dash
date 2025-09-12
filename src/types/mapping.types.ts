// types/mapping.types.ts
export interface LocationPoint {
  entity_id: string;
  latitude: number;
  longitude: number;
  area: string;
  category: string;
  gallons_collected: number;
  outlet_name: string;
  last_collection: string;
}

export interface MapFilter {
  area?: string;
  category?: string;
  volumeRange?: [number, number];
  dateRange?: { start: string; end: string };
}

export interface ClusterData {
  center: [number, number];
  points: LocationPoint[];
  totalGallons: number;
  averageGallons: number;
}