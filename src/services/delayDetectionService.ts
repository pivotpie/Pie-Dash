// services/delayDetectionService.ts
import { supabase } from './supabaseClient';
import { CSVDataService } from './csvDataService';
import { CollectionPatternService } from './collectionPatternService';
import type { CollectionPoint } from '../types/database.types';

export interface DelayAlert {
  entity_id: string;
  outlet_name: string;
  category: string;
  area: string;
  zone: string;
  days_overdue: number;
  expected_gallons: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommended_action: string;
  last_collection_date: string;
  expected_frequency: number;
  tank_size: number;
  overflow_risk: boolean;
}

export class DelayDetectionService {
  private static readonly CURRENT_DATE = new Date('2025-01-15'); // Using January 15, 2025 as current date

  static async getCurrentDelays(): Promise<DelayAlert[]> {
    try {
      console.log('Loading delays from CSV data...');
      
      // Load collection points from CSV
      const collectionPoints = await CSVDataService.getCollectionPoints();
      
      if (collectionPoints.length === 0) {
        console.warn('No collection points available for delay analysis');
        return [];
      }

      console.log(`Analyzing delays for ${collectionPoints.length} collection points`);
      
      // Filter only points that are overdue
      const overduePoints = collectionPoints.filter(point => point.days_overdue > 0);
      
      console.log(`Found ${overduePoints.length} overdue collection points`);
      
      return overduePoints.map(point => this.mapToDelayAlert(point));
    } catch (error) {
      console.error('Error fetching delays:', error);
      // Fallback to database if CSV fails
      return this.getFallbackDelays();
    }
  }

  private static async getFallbackDelays(): Promise<DelayAlert[]> {
    try {
      const { data, error } = await supabase
        .from('location_patterns')
        .select('*')
        .in('delay_status', ['CRITICAL', 'WARNING'])
        .order('days_since_last', { ascending: false });

      if (error) throw error;

      return data.map(item => this.mapLegacyToDelayAlert(item));
    } catch (error) {
      console.error('Error fetching fallback delays:', error);
      return [];
    }
  }

  private static mapToDelayAlert(point: CollectionPoint): DelayAlert {
    const expectedFrequency = CollectionPatternService.getCollectionFrequency(point.category, point.expected_gallons);
    const overflowRisk = this.calculateOverflowRisk(point.days_overdue, expectedFrequency, point.expected_gallons);
    
    return {
      entity_id: point.entity_id,
      outlet_name: point.outlet_name,
      category: point.category,
      area: point.area,
      zone: point.zone,
      days_overdue: point.days_overdue,
      expected_gallons: point.expected_gallons,
      priority: point.priority,
      recommended_action: this.getRecommendedAction(point.days_overdue, point.category, overflowRisk),
      last_collection_date: point.last_collection_date || 'Unknown',
      expected_frequency: expectedFrequency,
      tank_size: point.expected_gallons,
      overflow_risk: overflowRisk
    };
  }

  private static mapLegacyToDelayAlert(item: any): DelayAlert {
    const daysOverdue = item.days_since_last - item.avg_interval_days;
    const expectedFrequency = this.estimateFrequency(item.category);
    const overflowRisk = this.calculateOverflowRisk(daysOverdue, expectedFrequency, item.expected_gallons || 100);
    
    return {
      entity_id: item.entity_id,
      outlet_name: item.outlet_name,
      category: item.category,
      area: item.area,
      zone: item.zone || 'Unknown',
      days_overdue: Math.max(0, daysOverdue),
      expected_gallons: this.estimateGallons(item.category, item.days_since_last),
      priority: this.calculatePriority(daysOverdue, item.category),
      recommended_action: this.getRecommendedAction(daysOverdue, item.category, overflowRisk),
      last_collection_date: item.last_collection_date || 'Unknown',
      expected_frequency: expectedFrequency,
      tank_size: item.expected_gallons || 100,
      overflow_risk: overflowRisk
    };
  }

  private static estimateGallons(category: string, daysSince: number): number {
    const rates: Record<string, number> = {
      'Restaurant': 3.5,
      'Hotel': 2.8,
      'Food Processing': 5.0,
      'Accommodation': 2.2,
      'Cafeteria': 2.5,
      'Supermarket': 1.8,
      'Hospital': 3.0,
      'default': 2.0
    };
    
    const rate = rates[category] || rates['default'];
    return Math.round(rate * daysSince);
  }

  private static estimateFrequency(category: string): number {
    const frequencies: Record<string, number> = {
      'Restaurant': 7,
      'Hotel': 5,
      'Food Processing': 1,
      'Hospital': 3,
      'Supermarket': 10,
      'default': 7
    };
    
    return frequencies[category] || frequencies['default'];
  }

  private static calculatePriority(daysOverdue: number, category: string): 'critical' | 'high' | 'medium' | 'low' {
    // Use business-specific thresholds
    const criticalThreshold = category === 'Food Processing' ? 2 : 
                             category === 'Restaurant' ? 10 : 
                             category === 'Hotel' ? 8 : 14;
    
    const highThreshold = Math.ceil(criticalThreshold * 0.7);
    const mediumThreshold = Math.ceil(criticalThreshold * 0.4);

    if (daysOverdue >= criticalThreshold) return 'critical';
    if (daysOverdue >= highThreshold) return 'high';
    if (daysOverdue >= mediumThreshold) return 'medium';
    return 'low';
  }

  private static calculateOverflowRisk(daysOverdue: number, expectedFrequency: number, tankSize: number): boolean {
    // High risk if overdue more than 150% of expected frequency or tank is large and overdue
    const riskThreshold = expectedFrequency * 1.5;
    const largeThankThreshold = 500; // gallons
    
    return daysOverdue > riskThreshold || (tankSize > largeThankThreshold && daysOverdue > expectedFrequency);
  }

  private static getRecommendedAction(daysOverdue: number, category: string, overflowRisk: boolean): string {
    if (overflowRisk || daysOverdue > 14) {
      return `URGENT: Emergency collection required - High overflow risk for ${category}`;
    }
    
    if (daysOverdue > 10) {
      return `High priority collection needed within 24 hours - ${category} standards`;
    }
    
    if (daysOverdue > 7) {
      return `Schedule priority collection within 48 hours - Service level at risk`;
    }
    
    if (daysOverdue > 3) {
      return `Include in next scheduled route - Monitor for escalation`;
    }
    
    return `Normal scheduling - Within acceptable service window`;
  }

  static async getDelaysByArea(): Promise<Record<string, DelayAlert[]>> {
    const delays = await this.getCurrentDelays();
    
    return delays.reduce((areas, delay) => {
      if (!areas[delay.area]) areas[delay.area] = [];
      areas[delay.area].push(delay);
      return areas;
    }, {} as Record<string, DelayAlert[]>);
  }

  static async getDelaysByZone(): Promise<Record<string, DelayAlert[]>> {
    const delays = await this.getCurrentDelays();
    
    return delays.reduce((zones, delay) => {
      if (!zones[delay.zone]) zones[delay.zone] = [];
      zones[delay.zone].push(delay);
      return zones;
    }, {} as Record<string, DelayAlert[]>);
  }

  static async getDelaysByCategory(): Promise<Record<string, DelayAlert[]>> {
    const delays = await this.getCurrentDelays();
    
    return delays.reduce((categories, delay) => {
      if (!categories[delay.category]) categories[delay.category] = [];
      categories[delay.category].push(delay);
      return categories;
    }, {} as Record<string, DelayAlert[]>);
  }

  static async getDelayStats(): Promise<{
    totalDelays: number;
    criticalDelays: number;
    highPriorityDelays: number;
    overflowRiskCount: number;
    totalAffectedGallons: number;
    averageDaysOverdue: number;
    mostAffectedArea: string;
    mostAffectedZone: string;
    mostAffectedCategory: string;
  }> {
    const delays = await this.getCurrentDelays();
    
    if (delays.length === 0) {
      return {
        totalDelays: 0,
        criticalDelays: 0,
        highPriorityDelays: 0,
        overflowRiskCount: 0,
        totalAffectedGallons: 0,
        averageDaysOverdue: 0,
        mostAffectedArea: 'None',
        mostAffectedZone: 'None',
        mostAffectedCategory: 'None'
      };
    }

    const criticalDelays = delays.filter(d => d.priority === 'critical').length;
    const highPriorityDelays = delays.filter(d => d.priority === 'high').length;
    const overflowRiskCount = delays.filter(d => d.overflow_risk).length;
    const totalAffectedGallons = delays.reduce((sum, d) => sum + d.expected_gallons, 0);
    const averageDaysOverdue = delays.reduce((sum, d) => sum + d.days_overdue, 0) / delays.length;

    // Find most affected area, zone, and category
    const areaDelays = await this.getDelaysByArea();
    const zoneDelays = await this.getDelaysByZone();
    const categoryDelays = await this.getDelaysByCategory();

    const mostAffectedArea = Object.entries(areaDelays)
      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'None';
    
    const mostAffectedZone = Object.entries(zoneDelays)
      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'None';

    const mostAffectedCategory = Object.entries(categoryDelays)
      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'None';

    return {
      totalDelays: delays.length,
      criticalDelays,
      highPriorityDelays,
      overflowRiskCount,
      totalAffectedGallons,
      averageDaysOverdue: Math.round(averageDaysOverdue * 10) / 10,
      mostAffectedArea,
      mostAffectedZone,
      mostAffectedCategory
    };
  }

  static async getDelayTrends(days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_delay_trends', { days_back: days });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching delay trends:', error);
      // Return simulated trend data based on current delays
      return this.generateTrendData(days);
    }
  }

  private static async generateTrendData(days: number): Promise<any[]> {
    const delays = await this.getCurrentDelays();
    const trend = [];
    const today = this.CURRENT_DATE;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate trend based on current delay patterns
      const dayDelays = Math.floor(delays.length * (0.7 + Math.random() * 0.6));
      
      trend.push({
        date: date.toISOString().split('T')[0],
        total_delays: dayDelays,
        critical_delays: Math.floor(dayDelays * 0.15),
        high_delays: Math.floor(dayDelays * 0.25),
        medium_delays: Math.floor(dayDelays * 0.35),
        low_delays: Math.floor(dayDelays * 0.25)
      });
    }
    
    return trend;
  }
}