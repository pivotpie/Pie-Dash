// services/csvDataService.ts
import { CollectionPoint, VehicleLocation } from '../types/database.types';
import { CollectionPatternService } from './collectionPatternService';

export interface CSVServiceRecord {
  serviceReport: string;
  entityId: string;
  serviceProvider: string;
  collectedDate: string;
  dischargedDate: string;
  initiatedDate: string;
  area: string;
  assignedVehicle: string;
  category: string;
  dischargeTxn: string;
  outlet: string;
  gallonsCollected: number;
  initiator: string;
  numberOfTraps: number;
  status: string;
  subArea: string;
  subCategory: string;
  tradeLicenseNumber: number;
  trapLabel: string;
  trapType: string;
  zone: string;
}

export class CSVDataService {
  private static csvData: CSVServiceRecord[] = [];
  private static isLoaded = false;

  /**
   * Load and parse CSV data
   */
  static async loadCSVData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/Blue Data Analysis.csv');
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      this.csvData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = this.parseCSVLine(line);
          return {
            serviceReport: values[0] || '',
            entityId: values[1] || '',
            serviceProvider: values[2] || '',
            collectedDate: values[3] || '',
            dischargedDate: values[4] || '',
            initiatedDate: values[5] || '',
            area: values[6] || '',
            assignedVehicle: values[7] || '',
            category: values[8] || '',
            dischargeTxn: values[9] || '',
            outlet: values[10] || '',
            gallonsCollected: parseInt(values[11]) || 0,
            initiator: values[12] || '',
            numberOfTraps: parseInt(values[13]) || 0,
            status: values[14] || '',
            subArea: values[15] || '',
            subCategory: values[16] || '',
            tradeLicenseNumber: parseInt(values[17]) || 0,
            trapLabel: values[18] || '',
            trapType: values[19] || '',
            zone: values[20] || ''
          };
        });

      this.isLoaded = true;
      console.log(`Loaded ${this.csvData.length} service records from CSV`);
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      this.csvData = [];
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current.trim());
    }
    
    return result;
  }

  /**
   * Get all unique vehicles from CSV data
   */
  static async getVehicleList(): Promise<VehicleLocation[]> {
    await this.loadCSVData();
    
    const vehicleMap = new Map<string, {
      zone: string;
      area: string;
      lastSeen: Date;
      serviceCount: number;
    }>();

    // Process all records to get vehicle assignments
    this.csvData.forEach(record => {
      const vehicle = record.assignedVehicle;
      if (!vehicle) return;

      const collectedDate = new Date(record.collectedDate);
      
      if (!vehicleMap.has(vehicle) || vehicleMap.get(vehicle)!.lastSeen < collectedDate) {
        vehicleMap.set(vehicle, {
          zone: record.zone,
          area: record.area,
          lastSeen: collectedDate,
          serviceCount: (vehicleMap.get(vehicle)?.serviceCount || 0) + 1
        });
      }
    });

    // Convert to VehicleLocation array
    const vehicles: VehicleLocation[] = [];
    let vehicleCounter = 1;

    vehicleMap.forEach((data, vehicleId) => {
      // Generate coordinates for the vehicle's area
      const [lat, lng] = CollectionPatternService.generateAreaCoordinates(
        data.area,
        data.zone,
        vehicleCounter * 1000 // Use counter as seed for consistency
      );

      // Determine status based on activity
      let status: 'active' | 'idle' | 'maintenance';
      const daysSinceLastSeen = Math.floor(
        (CollectionPatternService.CURRENT_DATE.getTime() - data.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastSeen <= 1) {
        status = 'active';
      } else if (daysSinceLastSeen <= 7) {
        status = 'idle';
      } else {
        status = 'maintenance';
      }

      vehicles.push({
        vehicle_id: vehicleCounter,
        latitude: lat,
        longitude: lng,
        status,
        assigned_zone: data.zone,
        assigned_area: data.area,
        last_updated: data.lastSeen.toISOString()
      });

      vehicleCounter++;
    });

    console.log(`Generated ${vehicles.length} vehicles from CSV data`);
    return vehicles;
  }

  /**
   * Get all collection points from CSV data
   */
  static async getCollectionPoints(): Promise<CollectionPoint[]> {
    await this.loadCSVData();
    
    const entityMap = new Map<string, {
      outlet: string;
      area: string;
      zone: string;
      category: string;
      tradeLicenseNumber: number;
      lastCollected: Date;
      totalGallons: number;
      collections: number;
      avgGallons: number;
    }>();

    // Process all records to get entity information
    this.csvData.forEach(record => {
      const entityId = record.entityId;
      if (!entityId) return;

      const collectedDate = new Date(record.collectedDate);
      
      if (!entityMap.has(entityId)) {
        entityMap.set(entityId, {
          outlet: record.outlet,
          area: record.area,
          zone: record.zone,
          category: record.category,
          tradeLicenseNumber: record.tradeLicenseNumber,
          lastCollected: collectedDate,
          totalGallons: record.gallonsCollected,
          collections: 1,
          avgGallons: record.gallonsCollected
        });
      } else {
        const existing = entityMap.get(entityId)!;
        if (collectedDate > existing.lastCollected) {
          existing.lastCollected = collectedDate;
        }
        existing.totalGallons += record.gallonsCollected;
        existing.collections += 1;
        existing.avgGallons = Math.round(existing.totalGallons / existing.collections);
      }
    });

    // Convert to CollectionPoint array
    const points: CollectionPoint[] = [];

    entityMap.forEach((data, entityId) => {
      // Generate coordinates for the entity's area
      const [lat, lng] = CollectionPatternService.generateAreaCoordinates(
        data.area,
        data.zone,
        data.tradeLicenseNumber
      );

      // Create collection pattern for realistic delay calculation
      const pattern = CollectionPatternService.generateCollectionPattern(
        entityId,
        data.tradeLicenseNumber,
        data.category,
        data.area,
        data.zone,
        data.avgGallons,
        data.lastCollected.toISOString()
      );

      const point = CollectionPatternService.patternToCollectionPoint(
        pattern,
        [lat, lng],
        data.outlet
      );

      points.push(point);
    });

    console.log(`Generated ${points.length} collection points from CSV data`);
    return points;
  }

  /**
   * Get vehicle statistics
   */
  static async getVehicleStats(): Promise<{
    total: number;
    active: number;
    idle: number;
    maintenance: number;
    byZone: Record<string, number>;
  }> {
    const vehicles = await this.getVehicleList();
    
    const stats = {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      byZone: {} as Record<string, number>
    };

    vehicles.forEach(vehicle => {
      if (vehicle.assigned_zone) {
        stats.byZone[vehicle.assigned_zone] = (stats.byZone[vehicle.assigned_zone] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Get collection point statistics
   */
  static async getCollectionStats(): Promise<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byZone: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const points = await this.getCollectionPoints();
    
    const stats = {
      total: points.length,
      critical: points.filter(p => p.priority === 'critical').length,
      high: points.filter(p => p.priority === 'high').length,
      medium: points.filter(p => p.priority === 'medium').length,
      low: points.filter(p => p.priority === 'low').length,
      byZone: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    points.forEach(point => {
      if (point.zone) {
        stats.byZone[point.zone] = (stats.byZone[point.zone] || 0) + 1;
      }
      if (point.category) {
        stats.byCategory[point.category] = (stats.byCategory[point.category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Get raw CSV data for advanced analysis
   */
  static async getRawData(): Promise<CSVServiceRecord[]> {
    await this.loadCSVData();
    return [...this.csvData];
  }
}