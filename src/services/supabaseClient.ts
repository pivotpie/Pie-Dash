import { createClient } from '@supabase/supabase-js';
import type { DashboardGeographic, DashboardCategory, DashboardVolume, DashboardProvider, Zone, Area, VehicleLocation, CollectionPoint } from '../types/database.types';
import { DubaiGeographyService } from './dubaiGeographyService';
import { CollectionPatternService } from './collectionPatternService';
import { CSVDataService } from './csvDataService';
import { DataInsightsService } from './dataInsightsService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lightweight CRUD wrapper used across services
export const supabaseClient = {
  // Select rows with optional equality filters
  async getTableData<T = any>(table: string, filters?: Record<string, any>): Promise<T[]> {
    let query = supabase.from(table).select('*');

    if (filters && typeof filters === 'object') {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          // Basic support for IN queries when value is an array
          query = query.in(key, value as any);
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value as any);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as T[]) || [];
  },

  // Insert a single row and return it
  async insertData<T = any>(table: string, payload: T): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  },

  // Update a row by id and return it
  async updateData<T = any>(table: string, id: string | number, values: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .update(values as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }
};

// Analytics service
export class AnalyticsService {
  static async getGeographicData(): Promise<DashboardGeographic[]> {
    try {
      return await DataInsightsService.getGeographicData();
    } catch (error) {
      console.error('Failed to load geographic data from JSON, trying fallback:', error);
      // Fallback to database if JSON fails
      const { data, error: dbError } = await supabase
        .from('dashboard_geographic')
        .select('*');
      
      if (dbError) throw dbError;
      return data || [];
    }
  }

  static async getCategoryData(): Promise<DashboardCategory[]> {
    try {
      return await DataInsightsService.getCategoryData();
    } catch (error) {
      console.error('Failed to load category data from JSON, trying fallback:', error);
      // Fallback to database if JSON fails
      const { data, error: dbError } = await supabase
        .from('dashboard_categories')
        .select('*');
      
      if (dbError) throw dbError;
      return data || [];
    }
  }

  static async getVolumeData(): Promise<DashboardVolume[]> {
    try {
      return await DataInsightsService.getVolumeData();
    } catch (error) {
      console.error('Failed to load volume data from JSON, trying fallback:', error);
      // Fallback to database if JSON fails
      const { data, error: dbError } = await supabase
        .from('dashboard_volumes')
        .select('*')
        .limit(20); // Top 20 volume sizes
      
      if (dbError) throw dbError;
      return data || [];
    }
  }

  static async getProviderData(): Promise<DashboardProvider[]> {
    try {
      return await DataInsightsService.getProviderData();
    } catch (error) {
      console.error('Failed to load provider data from JSON, trying fallback:', error);
      // Fallback to database if JSON fails
      const { data, error: dbError } = await supabase
        .from('dashboard_providers')
        .select('*');
      
      if (dbError) throw dbError;
      return data || [];
    }
  }

  static async getMonthlyData(startDate?: string, endDate?: string) {
    try {
      const temporalData = await DataInsightsService.getTemporalData();
      let monthlyData = Object.entries(temporalData.monthly).map(([month, data]) => ({
        month,
        ...data
      }));

      // Apply date filtering if provided
      if (startDate) {
        monthlyData = monthlyData.filter(item => item.month >= startDate);
      }
      if (endDate) {
        monthlyData = monthlyData.filter(item => item.month <= endDate);
      }

      return monthlyData.sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Failed to load monthly data from JSON, trying fallback:', error);
      // Fallback to database
      let query = supabase.from('dashboard_monthly').select('*');
      
      if (startDate) {
        query = query.gte('month', startDate);
      }
      if (endDate) {
        query = query.lte('month', endDate);
      }
      
      const { data, error: dbError } = await query.order('month');
      
      if (dbError) throw dbError;
      return data || [];
    }
  }

  static async getKPIData() {
    try {
      return await DataInsightsService.getKPIData();
    } catch (error) {
      console.error('Failed to load KPI data from JSON, trying fallback:', error);
      // Fallback to database calculation
      const { data: services, error: dbError } = await supabase
        .from('services')
        .select('gallons_collected, entity_id, assigned_vehicle, service_provider')
        .limit(1000); // For KPI calculation
      
      if (dbError) throw dbError;

      const totalGallons = services?.reduce((sum, s) => sum + s.gallons_collected, 0) || 0;
      const uniqueLocations = new Set(services?.map(s => s.entity_id)).size;
      const uniqueVehicles = new Set(services?.map(s => s.assigned_vehicle)).size;
      const uniqueProviders = new Set(services?.map(s => s.service_provider)).size;

      return {
        totalGallons,
        uniqueLocations,
        uniqueVehicles,
        uniqueProviders,
        avgDailyGallons: Math.round(totalGallons / 730), // ~2 years of data
        avgCollectionSize: Math.round(totalGallons / (services?.length || 1))
      };
    }
  }

  // Zones service methods
  static async getZones(): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('zone_name');
    
    if (error) throw error;
    return data || [];
  }

  // Get zones with Dubai geographical coordinates
  static async getZonesWithCoordinates(): Promise<Zone[]> {
    const zones = await this.getZones();
    return DubaiGeographyService.generateZoneData(zones);
  }

  static async getZoneById(zoneId: string): Promise<Zone | null> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('zone_id', zoneId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  static async createZone(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert(zone)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateZone(zoneId: string, updates: Partial<Zone>): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .update(updates)
      .eq('zone_id', zoneId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Areas service methods
  static async getAreas(zoneId?: string): Promise<Area[]> {
    let query = supabase
      .from('areas')
      .select('*')
      .order('area_name');

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get areas with Dubai geographical coordinates
  static async getAreasWithCoordinates(zoneId?: string): Promise<Area[]> {
    const areas = await this.getAreas(zoneId);
    const zonesWithCoords = await this.getZonesWithCoordinates();
    return DubaiGeographyService.generateAreaData(areas, zonesWithCoords);
  }

  static async getAreaById(areaId: string): Promise<Area | null> {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('area_id', areaId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  static async getAreasWithZones(): Promise<(Area & { zone_name?: string })[]> {
    const { data, error } = await supabase
      .from('areas')
      .select(`
        *,
        zones:zone_id (
          zone_name
        )
      `)
      .order('area_name');
    
    if (error) throw error;
    return data?.map(area => ({
      ...area,
      zone_name: (area.zones as any)?.zone_name
    })) || [];
  }

  static async createArea(area: Omit<Area, 'id' | 'created_at'>): Promise<Area> {
    const { data, error } = await supabase
      .from('areas')
      .insert(area)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateArea(areaId: string, updates: Partial<Area>): Promise<Area> {
    const { data, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('area_id', areaId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Location hierarchy methods
  static async getLocationHierarchy() {
    const { data, error } = await supabase
      .from('location_summary')
      .select('*')
      .order('total_services', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getServicesWithLocation(limit = 100) {
    const { data, error } = await supabase
      .from('services_with_location')
      .select('*')
      .limit(limit)
      .order('collected_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }


  // Generate coordinates based on trade license numbers within zones/areas
  static generateCoordinatesFromTradeLicense(
    tradeLicenseNumber: number, 
    zoneName: string, 
    areaName?: string
  ): [number, number] {
    // Use trade license number as seed for consistent coordinate generation
    const seed = tradeLicenseNumber;
    
    // Simple random number generator using trade license as seed
    const random = (seed: number) => {
      const a = 1664525;
      const c = 1013904223;
      const m = Math.pow(2, 32);
      return ((a * seed + c) % m) / m;
    };

    // Get area coordinates if area is provided, otherwise use zone
    let baseCoords: [number, number];
    let boundaries: number[][] | undefined;
    
    if (areaName) {
      const area = DubaiGeographyService.findAreaByName(areaName);
      if (area) {
        baseCoords = area.coordinates;
        boundaries = area.boundaries;
      } else {
        // Fallback to zone if area not found
        const zone = DubaiGeographyService.findZoneByName(zoneName);
        baseCoords = zone ? zone.coordinates : DubaiGeographyService.DUBAI_CENTER;
        boundaries = zone?.boundaries;
      }
    } else {
      const zone = DubaiGeographyService.findZoneByName(zoneName);
      baseCoords = zone ? zone.coordinates : DubaiGeographyService.DUBAI_CENTER;
      boundaries = zone?.boundaries;
    }

    // Generate offset based on trade license number
    const offsetRange = 0.01; // ±0.01 degrees (~1km)
    const latOffset = (random(seed) - 0.5) * offsetRange;
    const lngOffset = (random(seed + 1000) - 0.5) * offsetRange;
    
    let finalLat = baseCoords[0] + latOffset;
    let finalLng = baseCoords[1] + lngOffset;
    
    // Ensure coordinates are within boundaries if available
    if (boundaries && boundaries.length > 0) {
      const minLat = Math.min(...boundaries.map(b => b[0]));
      const maxLat = Math.max(...boundaries.map(b => b[0]));
      const minLng = Math.min(...boundaries.map(b => b[1]));
      const maxLng = Math.max(...boundaries.map(b => b[1]));
      
      finalLat = Math.max(minLat, Math.min(maxLat, finalLat));
      finalLng = Math.max(minLng, Math.min(maxLng, finalLng));
    }
    
    return [finalLat, finalLng];
  }

  // Load collection points from CSV data (3000+ points)
  static async getCollectionPoints(): Promise<CollectionPoint[]> {
    try {
      console.log('Loading collection points from CSV data...');
      // Try to load from CSV first (real data)
      const csvPoints = await CSVDataService.getCollectionPoints();
      if (csvPoints.length > 0) {
        console.log(`Loaded ${csvPoints.length} collection points from CSV`);
        return csvPoints;
      }
    } catch (error) {
      console.warn('Failed to load from CSV, trying database:', error);
    }

    try {
      // Fallback to database
      const { data, error } = await supabase
        .from('services')
        .select(`
          entity_id,
          outlet_name,
          area,
          zone,
          category,
          gallons_collected,
          latitude,
          longitude,
          collected_date,
          trade_license_number
        `)
        .order('collected_date', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} collection points from database`);
        return data.map(service => {
          let lat = service.latitude;
          let lng = service.longitude;
          
          if (!lat || !lng) {
            if (service.trade_license_number && service.area) {
              [lat, lng] = CollectionPatternService.generateAreaCoordinates(
                service.area,
                service.zone,
                service.trade_license_number
              );
            } else {
              const area = DubaiGeographyService.findAreaByName(service.area);
              if (area) {
                [lat, lng] = area.coordinates;
              } else {
                const zone = DubaiGeographyService.findZoneByName(service.zone);
                [lat, lng] = zone ? zone.coordinates : DubaiGeographyService.BUSINESS_CENTER;
              }
            }
          }
          
          const pattern = CollectionPatternService.generateCollectionPattern(
            service.entity_id,
            service.trade_license_number || 100000,
            service.category,
            service.area,
            service.zone,
            service.gallons_collected || 25,
            service.collected_date
          );
          
          return CollectionPatternService.patternToCollectionPoint(
            pattern,
            [lat, lng],
            service.outlet_name || `${service.area} ${service.category}`
          );
        });
      }
    } catch (error) {
      console.warn('Database also failed, using realistic generated data:', error);
    }

    // Final fallback to realistic generated data
    console.log('Using fallback generated data');
    return CollectionPatternService.generateRealisticCollectionPoints();
  }

  // Load vehicle locations from CSV data (167 vehicles)
  static async getVehicleLocations(): Promise<VehicleLocation[]> {
    try {
      console.log('Loading vehicle data from CSV...');
      // Try to load from CSV first (real data)
      const csvVehicles = await CSVDataService.getVehicleList();
      if (csvVehicles.length > 0) {
        console.log(`Loaded ${csvVehicles.length} vehicles from CSV`);
        return csvVehicles;
      }
    } catch (error) {
      console.warn('Failed to load vehicles from CSV, using fallback:', error);
    }

    // Fallback to generated vehicles based on zone distribution
    console.log('Using fallback vehicle data');
    const zones = DubaiGeographyService.getDubaiZones();
    const areasByZone = CollectionPatternService.getAreasByZone();
    const vehicles: VehicleLocation[] = [];
    
    // Generate 167 vehicles distributed across areas
    let vehicleCounter = 1;
    const totalVehicles = 167;
    const vehiclesPerZone = Math.ceil(totalVehicles / zones.length);
    
    Object.entries(areasByZone).forEach(([zoneName, areas]) => {
      for (let i = 0; i < vehiclesPerZone && vehicleCounter <= totalVehicles; i++) {
        const randomArea = areas[i % areas.length];
        const [lat, lng] = CollectionPatternService.generateAreaCoordinates(
          randomArea,
          zoneName,
          100000 + vehicleCounter
        );
        
        // More realistic status distribution
        const statusWeights = [0.75, 0.20, 0.05]; // 75% active, 20% idle, 5% maintenance
        const randomValue = Math.random();
        let status: 'active' | 'idle' | 'maintenance';
        
        if (randomValue < statusWeights[0]) status = 'active';
        else if (randomValue < statusWeights[0] + statusWeights[1]) status = 'idle';
        else status = 'maintenance';
        
        vehicles.push({
          vehicle_id: vehicleCounter,
          latitude: lat,
          longitude: lng,
          status,
          assigned_zone: zoneName,
          assigned_area: randomArea,
          last_updated: new Date().toISOString()
        });
        
        vehicleCounter++;
      }
    });
    
    return vehicles.slice(0, totalVehicles); // Ensure exactly 167 vehicles
  }
}