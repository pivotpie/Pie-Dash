// services/collectionPatternService.ts
import { CollectionPoint } from '../types/database.types';

export interface CollectionPattern {
  entityId: string;
  tradeLicenseNumber: number;
  category: string;
  area: string;
  zone: string;
  gallonSize: number;
  averageFrequencyDays: number;
  lastCollectionDate: string;
  predictedNextCollection: string;
  daysOverdue: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export class CollectionPatternService {
  // Current date for calculations: January 15th, 2025
  static readonly CURRENT_DATE = new Date('2025-01-15');
  static readonly LAST_COLLECTION_CUTOFF = new Date('2024-12-31');

  /**
   * Analyze collection patterns based on category and gallon size
   */
  static getCollectionFrequency(category: string, gallonSize: number): number {
    // Collection frequency patterns based on business type and tank size
    const patterns: Record<string, { baseFrequency: number; sizeMultiplier: number }> = {
      'Restaurant': { baseFrequency: 7, sizeMultiplier: 0.1 }, // Weekly for restaurants
      'Hotel': { baseFrequency: 5, sizeMultiplier: 0.08 }, // More frequent for hotels
      'Coffee Shop': { baseFrequency: 10, sizeMultiplier: 0.15 }, // Less frequent for coffee shops
      'Bakery': { baseFrequency: 8, sizeMultiplier: 0.12 }, // Moderate for bakeries
      'Cafe': { baseFrequency: 9, sizeMultiplier: 0.14 }, // Similar to coffee shops
      'Commercial Kitchen': { baseFrequency: 4, sizeMultiplier: 0.06 }, // Very frequent for commercial kitchens
      'Food Court': { baseFrequency: 3, sizeMultiplier: 0.05 }, // Most frequent for food courts
      'Shopping Center': { baseFrequency: 14, sizeMultiplier: 0.2 }, // Bi-weekly for shopping centers
      'Market': { baseFrequency: 6, sizeMultiplier: 0.1 }, // Frequent for markets
      'Resort': { baseFrequency: 4, sizeMultiplier: 0.08 }, // Frequent for resorts
      'Fine Dining': { baseFrequency: 5, sizeMultiplier: 0.08 }, // Frequent for fine dining
      'Industrial Kitchen': { baseFrequency: 2, sizeMultiplier: 0.04 }, // Very frequent for industrial
      'Food Processing': { baseFrequency: 1, sizeMultiplier: 0.02 }, // Daily for food processing
      'Cafeteria': { baseFrequency: 7, sizeMultiplier: 0.1 } // Weekly for cafeterias
    };

    const pattern = patterns[category] || patterns['Restaurant']; // Default to restaurant pattern
    
    // Calculate frequency based on gallon size (larger tanks = less frequent collection)
    const sizeAdjustment = gallonSize * pattern.sizeMultiplier;
    return Math.max(1, Math.round(pattern.baseFrequency + sizeAdjustment));
  }

  /**
   * Calculate priority based on days overdue and business category
   */
  static calculatePriority(daysOverdue: number, category: string): 'critical' | 'high' | 'medium' | 'low' {
    // Critical categories that need immediate attention
    const criticalCategories = ['Food Processing', 'Industrial Kitchen', 'Commercial Kitchen'];
    const highCategories = ['Hotel', 'Resort', 'Fine Dining', 'Food Court'];
    
    if (criticalCategories.includes(category)) {
      if (daysOverdue > 2) return 'critical';
      if (daysOverdue > 1) return 'high';
      return 'medium';
    } else if (highCategories.includes(category)) {
      if (daysOverdue > 5) return 'critical';
      if (daysOverdue > 3) return 'high';
      if (daysOverdue > 1) return 'medium';
      return 'low';
    } else {
      // Standard categories (Restaurant, Cafe, Bakery, etc.)
      if (daysOverdue > 7) return 'critical';
      if (daysOverdue > 4) return 'high';
      if (daysOverdue > 2) return 'medium';
      return 'low';
    }
  }

  /**
   * Generate collection pattern for an entity
   */
  static generateCollectionPattern(
    entityId: string,
    tradeLicenseNumber: number,
    category: string,
    area: string,
    zone: string,
    gallonSize: number,
    lastCollectionDate?: string
  ): CollectionPattern {
    const frequency = this.getCollectionFrequency(category, gallonSize);
    
    // Use last collection date or assume last collection was on Dec 31, 2024
    const lastCollection = lastCollectionDate 
      ? new Date(lastCollectionDate)
      : this.LAST_COLLECTION_CUTOFF;
    
    // Calculate next collection date
    const nextCollection = new Date(lastCollection);
    nextCollection.setDate(nextCollection.getDate() + frequency);
    
    // Calculate days overdue (negative if not due yet)
    const daysDiff = Math.floor(
      (this.CURRENT_DATE.getTime() - nextCollection.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysOverdue = Math.max(0, daysDiff);
    
    const priority = this.calculatePriority(daysOverdue, category);

    return {
      entityId,
      tradeLicenseNumber,
      category,
      area,
      zone,
      gallonSize,
      averageFrequencyDays: frequency,
      lastCollectionDate: lastCollection.toISOString(),
      predictedNextCollection: nextCollection.toISOString(),
      daysOverdue,
      priority
    };
  }

  /**
   * Convert collection pattern to collection point for mapping
   */
  static patternToCollectionPoint(
    pattern: CollectionPattern,
    coordinates: [number, number],
    outletName: string
  ): CollectionPoint {
    // Calculate expected gallons based on days overdue and tank size
    const baseAccumulation = pattern.gallonSize * 0.8; // Assume 80% capacity usage per cycle
    const overdueMultiplier = Math.max(1, pattern.daysOverdue / pattern.averageFrequencyDays);
    const expectedGallons = Math.round(baseAccumulation * overdueMultiplier);

    return {
      entity_id: pattern.entityId,
      outlet_name: outletName,
      latitude: coordinates[0],
      longitude: coordinates[1],
      area: pattern.area,
      zone: pattern.zone,
      category: pattern.category,
      priority: pattern.priority,
      days_overdue: pattern.daysOverdue,
      expected_gallons: expectedGallons,
      last_collection: pattern.lastCollectionDate
    };
  }

  /**
   * Get all areas grouped by zone for better organization
   */
  static getAreasByZone(): Record<string, string[]> {
    return {
      'Al Quoz': ['Al Barsha', 'Al Quoz'],
      'Al Qusais': ['Al Mizhar', 'Al Nahda'],
      'Bur Dubai': ['Al Bada', 'Al Jaddaf', 'Al Jafiliya', 'Al Karama', 'Al Mankhool'],
      'Deira': ['Abu Hail', 'Al Baraha', 'Al Garhoud', 'Al Khabisi', 'Al Mamzar'],
      'Jebel Ali': ['Al Furjan', 'Al Marmoom', 'Al Qudra'],
      'Jumeirah': ['Al Manara'],
      'Ras Al Khor': ['Academic City', 'Al Aweer', 'Al Warqa', 'Al Khawaneej', 'Al Lisaili']
    };
  }

  /**
   * Generate realistic collection points based on patterns
   */
  static generateRealisticCollectionPoints(): CollectionPoint[] {
    const points: CollectionPoint[] = [];
    const areasByZone = this.getAreasByZone();
    
    // Categories with their typical gallon sizes
    const businessTypes = [
      { category: 'Restaurant', gallons: [25, 40, 60, 100] },
      { category: 'Hotel', gallons: [100, 200, 300, 500] },
      { category: 'Coffee Shop', gallons: [15, 25, 40] },
      { category: 'Bakery', gallons: [15, 25, 40] },
      { category: 'Cafe', gallons: [15, 25, 40] },
      { category: 'Commercial Kitchen', gallons: [100, 200, 300] },
      { category: 'Food Court', gallons: [200, 300, 500] },
      { category: 'Shopping Center', gallons: [300, 500, 750] },
      { category: 'Market', gallons: [60, 100, 150] }
    ];

    let entityCounter = 1;
    let tradeLicenseBase = 100000;

    Object.entries(areasByZone).forEach(([zone, areas]) => {
      areas.forEach(area => {
        // Generate 3-5 points per area
        const pointsPerArea = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < pointsPerArea; i++) {
          const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
          const gallonSize = businessType.gallons[Math.floor(Math.random() * businessType.gallons.length)];
          const tradeLicense = tradeLicenseBase + entityCounter;
          const entityId = `E-${entityCounter}`;
          const outletName = `${area} ${businessType.category} ${i + 1}`;
          
          // Generate coordinates for this area
          const coordinates = this.generateAreaCoordinates(area, zone, tradeLicense);
          
          // Create collection pattern
          const pattern = this.generateCollectionPattern(
            entityId,
            tradeLicense,
            businessType.category,
            area,
            zone,
            gallonSize
          );
          
          // Convert to collection point
          const point = this.patternToCollectionPoint(pattern, coordinates, outletName);
          points.push(point);
          
          entityCounter++;
        }
      });
    });

    return points;
  }

  /**
   * Generate area-specific coordinates with proper distribution
   */
  static generateAreaCoordinates(area: string, zone: string, tradeLicense: number): [number, number] {
    // Area-specific coordinate centers (more precise than zone-level)
    const areaCoordinates: Record<string, [number, number]> = {
      // Al Quoz Zone
      'Al Barsha': [25.1137, 55.2009],
      'Al Quoz': [25.1211, 55.2179],
      
      // Al Qusais Zone  
      'Al Mizhar': [25.2894, 55.3862],
      'Al Nahda': [25.2970, 55.4012],
      
      // Bur Dubai Zone
      'Al Bada': [25.2456, 55.2854],
      'Al Jaddaf': [25.2343, 55.3156],
      'Al Jafiliya': [25.2423, 55.2967],
      'Al Karama': [25.2545, 55.3034],
      'Al Mankhool': [25.2378, 55.2889],
      
      // Deira Zone
      'Abu Hail': [25.2834, 55.3267],
      'Al Baraha': [25.2723, 55.3178],
      'Al Garhoud': [25.2467, 55.3423],
      'Al Khabisi': [25.2589, 55.2956],
      'Al Mamzar': [25.2890, 55.3534],
      
      // Jebel Ali Zone
      'Al Furjan': [25.0567, 55.0923],
      'Al Marmoom': [24.9923, 55.0178],
      'Al Qudra': [24.9734, 55.0445],
      
      // Jumeirah Zone
      'Al Manara': [25.2123, 55.2467],
      
      // Ras Al Khor Zone
      'Academic City': [25.1456, 55.3612],
      'Al Aweer': [25.1623, 55.3701],
      'Al Warqa': [25.1979, 55.3445],
      'Al Khawaneej': [25.2134, 55.3723],
      'Al Lisaili': [25.1712, 55.3289]
    };

    const baseCoords = areaCoordinates[area] || areaCoordinates['Al Quoz']; // Fallback to Al Quoz
    
    // Use trade license for consistent coordinate generation
    const seed = tradeLicense;
    const random = (s: number) => ((s * 1664525 + 1013904223) % Math.pow(2, 32)) / Math.pow(2, 32);
    
    // Smaller offset for area-level precision (500m radius)
    const offsetRange = 0.005; 
    const latOffset = (random(seed) - 0.5) * offsetRange;
    const lngOffset = (random(seed + 1000) - 0.5) * offsetRange;
    
    return [baseCoords[0] + latOffset, baseCoords[1] + lngOffset];
  }
}