// services/fleetService.ts
import { supabase } from './supabaseClient';

export interface VehiclePerformance {
  vehicle_id: number;
  total_collections: number;
  total_gallons: number;
  total_distance: number;
  efficiency_score: number;
  utilization_rate: number;
  service_areas: string[];
  assigned_provider: string;
  last_service_date: string;
  maintenance_due: boolean;
}

export interface ProviderMetrics {
  provider_name: string;
  vehicle_count: number;
  total_collections: number;
  total_gallons: number;
  avg_efficiency: number;
  service_quality_score: number;
  coverage_areas: string[];
  delay_rate: number;
}

export class FleetService {
  static async getVehiclePerformance(): Promise<VehiclePerformance[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          assigned_vehicle,
          gallons_collected,
          service_provider,
          area,
          collected_date
        `)
        .not('assigned_vehicle', 'is', null);

      if (error) throw error;

      // Group by vehicle and calculate metrics
      const vehicleMetrics = this.aggregateVehicleData(data);
      return vehicleMetrics;
    } catch (error) {
      console.error('Error fetching vehicle performance:', error);
      return [];
    }
  }

  private static aggregateVehicleData(data: any[]): VehiclePerformance[] {
    const vehicleGroups: Record<string, any[]> = data.reduce((groups, record) => {
      const vehicleId = record.assigned_vehicle;
      if (!groups[vehicleId]) {
        groups[vehicleId] = [];
      }
      groups[vehicleId].push(record);
      return groups;
    }, {} as Record<string, any[]>);

    return Object.entries(vehicleGroups).map(([vehicleId, records]) => {
      const recordsArray = records as any[];
      const totalCollections = recordsArray.length;
      const totalGallons = recordsArray.reduce((sum: number, r: any) => sum + r.gallons_collected, 0);
      const serviceAreas = Array.from(new Set(recordsArray.map((r: any) => r.area)));
      const provider = recordsArray[0]?.service_provider || '';
      
      // Calculate efficiency metrics
      const avgGallonsPerCollection = totalGallons / totalCollections;
      const areaCount = serviceAreas.length;
      const efficiencyScore = (avgGallonsPerCollection * 0.6) + (areaCount * 0.4);
      
      // Calculate utilization (collections per day over period)
      const dateRange = this.getDateRange(recordsArray.map((r: any) => r.collected_date));
      const utilizationRate = totalCollections / dateRange.days;

      return {
        vehicle_id: parseInt(vehicleId),
        total_collections: totalCollections,
        total_gallons: totalGallons,
        total_distance: 0, // Would need route data
        efficiency_score: Math.round(efficiencyScore * 10) / 10,
        utilization_rate: Math.round(utilizationRate * 100) / 100,
        service_areas: serviceAreas,
        assigned_provider: provider,
        last_service_date: Math.max(...recordsArray.map((r: any) => new Date(r.collected_date).getTime())).toString(),
        maintenance_due: this.checkMaintenanceDue(totalCollections)
      };
    });
  }

  private static getDateRange(dates: string[]): { days: number; start: Date; end: Date } {
    const dateObjects = dates.map(d => new Date(d));
    const start = new Date(Math.min(...dateObjects.map(d => d.getTime())));
    const end = new Date(Math.max(...dateObjects.map(d => d.getTime())));
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { days, start, end };
  }

  private static checkMaintenanceDue(totalCollections: number): boolean {
    // Simple maintenance check - every 200 collections
    return totalCollections % 200 < 10;
  }

  static async getProviderMetrics(): Promise<ProviderMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('dashboard_providers')
        .select('*');

      if (error) throw error;

      // Get delay information for each provider
      const delayData = await this.getProviderDelays();

      return data.map(provider => ({
        provider_name: provider.service_provider,
        vehicle_count: provider.vehicle_count,
        total_collections: provider.collection_count,
        total_gallons: provider.total_gallons,
        avg_efficiency: provider.avg_gallons,
        service_quality_score: this.calculateQualityScore(provider),
        coverage_areas: [], // Would need area mapping
        delay_rate: delayData[provider.service_provider] || 0
      }));
    } catch (error) {
      console.error('Error fetching provider metrics:', error);
      return [];
    }
  }

  private static async getProviderDelays(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('location_patterns')
        .select('entity_id, delay_status')
        .in('delay_status', ['CRITICAL', 'WARNING']);

      if (error) throw error;

      // This would need provider mapping - simplified for now
      return {};
    } catch (error) {
      console.error('Error fetching provider delays:', error);
      return {};
    }
  }

  private static calculateQualityScore(provider: any): number {
    // Quality score based on efficiency and consistency
    const efficiencyScore = Math.min(provider.avg_gallons / 60, 1) * 40; // Max 40 points
    const volumeScore = Math.min(provider.market_share / 15, 1) * 30; // Max 30 points
    const consistencyScore = 30; // Would need more data for real calculation
    
    return Math.round(efficiencyScore + volumeScore + consistencyScore);
  }

  static async generateFleetOptimizationReport(): Promise<any> {
    const [vehicles, providers] = await Promise.all([
      this.getVehiclePerformance(),
      this.getProviderMetrics()
    ]);

    return {
      fleet_summary: {
        total_vehicles: vehicles.length,
        avg_utilization: vehicles.reduce((sum, v) => sum + v.utilization_rate, 0) / vehicles.length,
        vehicles_needing_maintenance: vehicles.filter(v => v.maintenance_due).length,
        top_performers: vehicles.sort((a, b) => b.efficiency_score - a.efficiency_score).slice(0, 5)
      },
      provider_summary: {
        total_providers: providers.length,
        avg_quality_score: providers.reduce((sum, p) => sum + p.service_quality_score, 0) / providers.length,
        top_providers: providers.sort((a, b) => b.service_quality_score - a.service_quality_score).slice(0, 5)
      },
      recommendations: this.generateRecommendations(vehicles, providers)
    };
  }

  private static generateRecommendations(vehicles: VehiclePerformance[], providers: ProviderMetrics[]): string[] {
    const recommendations = [];

    // Vehicle recommendations
    const lowUtilization = vehicles.filter(v => v.utilization_rate < 0.5);
    if (lowUtilization.length > 0) {
      recommendations.push(`${lowUtilization.length} vehicles have low utilization (<50%). Consider route redistribution.`);
    }

    const maintenanceDue = vehicles.filter(v => v.maintenance_due);
    if (maintenanceDue.length > 0) {
      recommendations.push(`${maintenanceDue.length} vehicles need maintenance scheduling.`);
    }

    // Provider recommendations
    const lowPerformingProviders = providers.filter(p => p.service_quality_score < 60);
    if (lowPerformingProviders.length > 0) {
      recommendations.push(`${lowPerformingProviders.length} providers have quality scores below 60. Review performance.`);
    }

    return recommendations;
  }
}