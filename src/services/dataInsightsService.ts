// services/dataInsightsService.ts
import type { 
  DashboardGeographic, 
  DashboardCategory, 
  DashboardVolume, 
  DashboardProvider 
} from '../types/database.types';

interface DataInsightsJSON {
  summary: {
    overview: {
      total_records: number;
      date_range: {
        start: string;
        end: string;
        duration_days: number;
      };
      total_gallons: string;
      average_gallons_per_collection: number;
      unique_entities: number;
      unique_service_reports: number;
      unique_service_providers: number;
      unique_vehicles: number;
      unique_areas: number;
      unique_zones: number;
      unique_categories: number;
    };
  };
  geographic: {
    areas: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Avg_Gallons: number;
      Unique_Entities: number;
      Service_Providers: number;
      Vehicles: number;
      Percentage: number;
    }>;
  };
  categories: {
    categories: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Avg_Gallons: number;
      Median_Gallons: number;
      Std_Gallons: number;
      Unique_Entities: number;
      Areas_Served: number;
      Service_Providers: number;
      Percentage: number;
    }>;
  };
  providers: {
    providers: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Avg_Gallons: number;
      Unique_Entities: number;
      Areas_Served: number;
      Zones_Served: number;
      Vehicles_Used: number;
      Avg_Turnaround_Days: number;
      Market_Share: number;
      Collections_Per_Vehicle: number;
    }>;
  };
  volumes: {
    distribution: Record<string, {
      count: string;
      percentage: number;
      total_gallons: string;
      avg_gallons: number;
    }>;
  };
  temporal: {
    monthly: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Unique_Entities: number;
      Active_Providers: number;
    }>;
    day_of_week: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Avg_Gallons: number;
      Percentage: number;
    }>;
  };
  efficiency: {
    vehicles: Record<string, {
      Collections: number;
      Total_Gallons: number;
      Avg_Gallons: number;
      Areas_Served: number;
      Entities_Served: number;
      Service_Provider: string;
    }>;
  };
  insights: {
    key_findings: string[];
    operational_insights: string[];
    geographic_insights: string[];
    performance_insights: string[];
    recommendations: string[];
  };
}

class DataInsightsService {
  private static dataCache: DataInsightsJSON | null = null;
  private static lastLoaded: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async loadDataInsights(): Promise<DataInsightsJSON> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.dataCache && (now - this.lastLoaded) < this.CACHE_DURATION) {
      console.log('📊 Using cached data insights');
      return this.dataCache;
    }

    try {
      console.log('📊 Loading data insights from JSON file...');
      const response = await fetch('/data_insights_q1_2023.json');
      console.log('📊 Fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to load data insights: ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      this.dataCache = jsonData as DataInsightsJSON;
      this.lastLoaded = now;
      
      console.log('📊 Data insights loaded successfully:', {
        totalRecords: this.dataCache.summary.overview.total_records,
        areas: Object.keys(this.dataCache.geographic.areas).length,
        categories: Object.keys(this.dataCache.categories.categories).length,
        providers: Object.keys(this.dataCache.providers.providers).length
      });
      
      return this.dataCache;
    } catch (error) {
      console.error('❌ Error loading data insights:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  static async getGeographicData(): Promise<DashboardGeographic[]> {
    const data = await this.loadDataInsights();
    
    const result = Object.entries(data.geographic.areas).map(([areaName, areaData]) => ({
      area: areaName,
      zone: this.mapAreaToZone(areaName),
      collection_count: areaData.Collections,
      total_gallons: areaData.Total_Gallons,
      unique_locations: areaData.Unique_Entities,
      avg_gallons: areaData.Avg_Gallons,
      provider_count: areaData.Service_Providers,
      vehicle_count: areaData.Vehicles,
      percentage: areaData.Percentage
    }));
    
    console.log('📍 Geographic data transformed:', result.length, 'areas');
    
    return result;
  }

  static async getCategoryData(): Promise<DashboardCategory[]> {
    const data = await this.loadDataInsights();
    
    const result = Object.entries(data.categories.categories).map(([categoryName, categoryData]) => ({
      category: categoryName,
      collection_count: categoryData.Collections,
      total_gallons: categoryData.Total_Gallons,
      avg_gallons: categoryData.Avg_Gallons,
      median_gallons: categoryData.Median_Gallons,
      std_gallons: categoryData.Std_Gallons,
      unique_locations: categoryData.Unique_Entities,
      areas_served: categoryData.Areas_Served,
      service_providers: categoryData.Service_Providers,
      percentage: categoryData.Percentage
    }));
    
    console.log('🏢 Category data transformed:', result.length, 'categories');
    
    return result;
  }

  static async getProviderData(): Promise<DashboardProvider[]> {
    const data = await this.loadDataInsights();
    
    return Object.entries(data.providers.providers).map(([providerName, providerData]) => ({
      service_provider: providerName,
      collection_count: providerData.Collections,
      total_gallons: providerData.Total_Gallons,
      avg_gallons: providerData.Avg_Gallons,
      unique_entities: providerData.Unique_Entities,
      areas_served: providerData.Areas_Served,
      zones_served: providerData.Zones_Served,
      vehicles_used: providerData.Vehicles_Used,
      avg_turnaround_days: providerData.Avg_Turnaround_Days,
      market_share: providerData.Market_Share,
      collections_per_vehicle: providerData.Collections_Per_Vehicle
    }));
  }

  static async getVolumeData(): Promise<DashboardVolume[]> {
    const data = await this.loadDataInsights();
    
    return Object.entries(data.volumes.distribution).map(([range, volumeData]) => {
      // Extract gallon range (e.g., "26-50" -> 38 as midpoint, "1000+" -> 1000)
      const gallons_collected = this.parseVolumeRange(range);
      
      return {
        gallons_collected,
        volume_range: range,
        frequency: parseInt(volumeData.count),
        percentage: volumeData.percentage,
        total_gallons: parseInt(volumeData.total_gallons),
        avg_gallons: volumeData.avg_gallons
      };
    }).filter(item => item.frequency > 0); // Remove empty ranges
  }

  static async getKPIData() {
    const data = await this.loadDataInsights();
    const overview = data.summary.overview;
    
    return {
      totalGallons: parseInt(overview.total_gallons),
      uniqueLocations: overview.unique_entities,
      uniqueVehicles: overview.unique_vehicles,
      uniqueProviders: overview.unique_service_providers,
      avgDailyGallons: Math.round(parseInt(overview.total_gallons) / overview.duration_days),
      avgCollectionSize: overview.average_gallons_per_collection,
      totalCollections: overview.total_records,
      uniqueAreas: overview.unique_areas,
      uniqueZones: overview.unique_zones,
      uniqueCategories: overview.unique_categories,
      dateRange: overview.date_range
    };
  }

  static async getTemporalData() {
    const data = await this.loadDataInsights();
    return {
      monthly: data.temporal.monthly,
      dayOfWeek: data.temporal.day_of_week
    };
  }

  static async getEfficiencyData() {
    const data = await this.loadDataInsights();
    return {
      vehicles: data.efficiency.vehicles
    };
  }

  static async getInsights() {
    const data = await this.loadDataInsights();
    return data.insights;
  }

  // Helper function to map areas to zones (based on Dubai geography)
  private static mapAreaToZone(areaName: string): string {
    const zoneMapping: Record<string, string> = {
      'Al Quoz': 'Central',
      'Al Brsh': 'South',
      'Al Krm': 'East',
      'Al Grhoud': 'Central',
      'Al Nhd': 'North',
      'Al Khwneej': 'North',
      'Al jddf': 'Central',
      'Al Bd': 'Central',
      'Al Mn': 'South',
      'Al Qudr': 'South',
      'Al Awr': 'East',
      'Al Mzhr': 'East',
      'Abu Hl': 'South',
      'Al Mmzr': 'Central',
      'Al Brh': 'North',
      'Al Frdn': 'South',
      'Al Mnn': 'North',
      'Al Qss': 'Central',
      'Al Wd': 'East',
      'Al Sff': 'North',
      'Al jflya': 'Central',
      'Al Khbrh': 'South',
      'UNSPECIFIED': 'Unknown'
    };
    
    return zoneMapping[areaName] || 'Unknown';
  }

  // Helper function to parse volume ranges
  private static parseVolumeRange(range: string): number {
    if (range.includes('+')) {
      // Handle "1000+" case
      return parseInt(range.replace('+', ''));
    }
    
    if (range.includes('-')) {
      // Handle "26-50" case - return midpoint
      const [min, max] = range.split('-').map(Number);
      return Math.round((min + max) / 2);
    }
    
    // Handle single number or unknown format
    return parseInt(range) || 0;
  }
}

export { DataInsightsService };
export type { DataInsightsJSON };