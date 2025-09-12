// services/dubaiGeographyService.ts
import type { Zone, Area, MapBounds, CollectionPoint } from '../types/database.types';

export interface DubaiDistrict {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  boundaries?: number[][]; // Polygon boundary points
  zone_type: 'commercial' | 'residential' | 'mixed' | 'industrial';
  color: string;
}

// Actual Dubai zones and areas from database with real coordinates
export const DUBAI_ZONES: Record<string, DubaiDistrict> = {
  'Al Quoz': {
    name: 'Al Quoz',
    coordinates: [25.1174, 55.2094],
    zone_type: 'mixed',
    color: '#FF6B6B',
    boundaries: [
      [25.1000, 55.1950],
      [25.1350, 55.1950],
      [25.1350, 55.2250],
      [25.1000, 55.2250],
      [25.1000, 55.1950]
    ]
  },
  'Al Qusais': {
    name: 'Al Qusais',
    coordinates: [25.2932, 55.3937],
    zone_type: 'residential',
    color: '#4ECDC4',
    boundaries: [
      [25.2700, 55.3700],
      [25.3200, 55.3700],
      [25.3200, 55.4200],
      [25.2700, 55.4200],
      [25.2700, 55.3700]
    ]
  },
  'Bur Dubai': {
    name: 'Bur Dubai',
    coordinates: [25.2532, 55.2972],
    zone_type: 'mixed',
    color: '#45B7D1',
    boundaries: [
      [25.2300, 55.2750],
      [25.2800, 55.2750],
      [25.2800, 55.3200],
      [25.2300, 55.3200],
      [25.2300, 55.2750]
    ]
  },
  'Deira': {
    name: 'Deira',
    coordinates: [25.2697, 55.3095],
    zone_type: 'commercial',
    color: '#96CEB4',
    boundaries: [
      [25.2500, 55.2900],
      [25.2900, 55.2900],
      [25.2900, 55.3300],
      [25.2500, 55.3300],
      [25.2500, 55.2900]
    ]
  },
  'Jebel Ali': {
    name: 'Jebel Ali',
    coordinates: [25.0345, 55.0266],
    zone_type: 'industrial',
    color: '#FFEAA7',
    boundaries: [
      [24.9800, 54.9800],
      [25.0900, 54.9800],
      [25.0900, 55.0800],
      [24.9800, 55.0800],
      [24.9800, 54.9800]
    ]
  },
  'Jumeirah': {
    name: 'Jumeirah',
    coordinates: [25.2048, 55.2382],
    zone_type: 'residential',
    color: '#DDA0DD',
    boundaries: [
      [25.1800, 55.2200],
      [25.2300, 55.2200],
      [25.2300, 55.2600],
      [25.1800, 55.2600],
      [25.1800, 55.2200]
    ]
  },
  'Ras Al Khor': {
    name: 'Ras Al Khor',
    coordinates: [25.1804, 55.3483],
    zone_type: 'mixed',
    color: '#74B9FF',
    boundaries: [
      [25.1400, 55.3200],
      [25.2200, 55.3200],
      [25.2200, 55.3800],
      [25.1400, 55.3800],
      [25.1400, 55.3200]
    ]
  }
};

// Areas within each zone with specific coordinates
export const DUBAI_AREAS: Record<string, DubaiDistrict & { parent_zone: string }> = {
  // Al Quoz Zone Areas
  'Al Barsha': {
    name: 'Al Barsha',
    coordinates: [25.1137, 55.2009],
    zone_type: 'residential',
    color: '#FFB3B3',
    parent_zone: 'Al Quoz',
    boundaries: [
      [25.1050, 55.1920],
      [25.1225, 55.1920],
      [25.1225, 55.2100],
      [25.1050, 55.2100],
      [25.1050, 55.1920]
    ]
  },
  'Al Quoz': {
    name: 'Al Quoz',
    coordinates: [25.1211, 55.2179],
    zone_type: 'industrial',
    color: '#FF8A8A',
    parent_zone: 'Al Quoz',
    boundaries: [
      [25.1125, 55.2090],
      [25.1300, 55.2090],
      [25.1300, 55.2270],
      [25.1125, 55.2270],
      [25.1125, 55.2090]
    ]
  },
  
  // Al Qusais Zone Areas
  'Al Mizhar': {
    name: 'Al Mizhar',
    coordinates: [25.2894, 55.3862],
    zone_type: 'residential',
    color: '#7DDDD9',
    parent_zone: 'Al Qusais',
    boundaries: [
      [25.2800, 55.3770],
      [25.2990, 55.3770],
      [25.2990, 55.3955],
      [25.2800, 55.3955],
      [25.2800, 55.3770]
    ]
  },
  'Al Nahda': {
    name: 'Al Nahda',
    coordinates: [25.2970, 55.4012],
    zone_type: 'residential',
    color: '#B3E6E4',
    parent_zone: 'Al Qusais',
    boundaries: [
      [25.2880, 55.3920],
      [25.3060, 55.3920],
      [25.3060, 55.4105],
      [25.2880, 55.4105],
      [25.2880, 55.3920]
    ]
  },
  
  // Bur Dubai Zone Areas
  'Al Bada': {
    name: 'Al Bada',
    coordinates: [25.2456, 55.2854],
    zone_type: 'residential',
    color: '#7DCDFF',
    parent_zone: 'Bur Dubai',
    boundaries: [
      [25.2370, 55.2765],
      [25.2545, 55.2765],
      [25.2545, 55.2945],
      [25.2370, 55.2945],
      [25.2370, 55.2765]
    ]
  },
  'Al Jaddaf': {
    name: 'Al Jaddaf',
    coordinates: [25.2343, 55.3156],
    zone_type: 'mixed',
    color: '#B3DDFF',
    parent_zone: 'Bur Dubai',
    boundaries: [
      [25.2255, 55.3065],
      [25.2432, 55.3065],
      [25.2432, 55.3248],
      [25.2255, 55.3248],
      [25.2255, 55.3065]
    ]
  },
  'Al Jafiliya': {
    name: 'Al Jafiliya',
    coordinates: [25.2423, 55.2967],
    zone_type: 'commercial',
    color: '#A6D8FF',
    parent_zone: 'Bur Dubai',
    boundaries: [
      [25.2335, 55.2878],
      [25.2512, 55.2878],
      [25.2512, 55.3057],
      [25.2335, 55.3057],
      [25.2335, 55.2878]
    ]
  },
  'Al Karama': {
    name: 'Al Karama',
    coordinates: [25.2545, 55.3034],
    zone_type: 'residential',
    color: '#99D1FF',
    parent_zone: 'Bur Dubai',
    boundaries: [
      [25.2457, 55.2945],
      [25.2634, 55.2945],
      [25.2634, 55.3124],
      [25.2457, 55.3124],
      [25.2457, 55.2945]
    ]
  },
  'Al Mankhool': {
    name: 'Al Mankhool',
    coordinates: [25.2378, 55.2889],
    zone_type: 'residential',
    color: '#8CCCFF',
    parent_zone: 'Bur Dubai',
    boundaries: [
      [25.2290, 55.2800],
      [25.2467, 55.2800],
      [25.2467, 55.2979],
      [25.2290, 55.2979],
      [25.2290, 55.2800]
    ]
  },
  
  // Deira Zone Areas
  'Abu Hail': {
    name: 'Abu Hail',
    coordinates: [25.2834, 55.3267],
    zone_type: 'residential',
    color: '#C9E8C9',
    parent_zone: 'Deira',
    boundaries: [
      [25.2745, 55.3178],
      [25.2924, 55.3178],
      [25.2924, 55.3357],
      [25.2745, 55.3357],
      [25.2745, 55.3178]
    ]
  },
  'Al Baraha': {
    name: 'Al Baraha',
    coordinates: [25.2723, 55.3178],
    zone_type: 'mixed',
    color: '#BDE5BD',
    parent_zone: 'Deira',
    boundaries: [
      [25.2634, 55.3089],
      [25.2813, 55.3089],
      [25.2813, 55.3268],
      [25.2634, 55.3268],
      [25.2634, 55.3089]
    ]
  },
  'Al Garhoud': {
    name: 'Al Garhoud',
    coordinates: [25.2467, 55.3423],
    zone_type: 'mixed',
    color: '#B1E2B1',
    parent_zone: 'Deira',
    boundaries: [
      [25.2378, 55.3334],
      [25.2557, 55.3334],
      [25.2557, 55.3513],
      [25.2378, 55.3513],
      [25.2378, 55.3334]
    ]
  },
  'Al Khabisi': {
    name: 'Al Khabisi',
    coordinates: [25.2589, 55.2956],
    zone_type: 'residential',
    color: '#A5DFA5',
    parent_zone: 'Deira',
    boundaries: [
      [25.2500, 55.2867],
      [25.2679, 55.2867],
      [25.2679, 55.3046],
      [25.2500, 55.3046],
      [25.2500, 55.2867]
    ]
  },
  'Al Mamzar': {
    name: 'Al Mamzar',
    coordinates: [25.2890, 55.3534],
    zone_type: 'residential',
    color: '#99DC99',
    parent_zone: 'Deira',
    boundaries: [
      [25.2801, 55.3445],
      [25.2980, 55.3445],
      [25.2980, 55.3624],
      [25.2801, 55.3624],
      [25.2801, 55.3445]
    ]
  },
  
  // Jebel Ali Zone Areas
  'Al Furjan': {
    name: 'Al Furjan',
    coordinates: [25.0567, 55.0923],
    zone_type: 'residential',
    color: '#FFEDAA',
    parent_zone: 'Jebel Ali',
    boundaries: [
      [25.0478, 55.0834],
      [25.0657, 55.0834],
      [25.0657, 55.1013],
      [25.0478, 55.1013],
      [25.0478, 55.0834]
    ]
  },
  'Al Marmoom': {
    name: 'Al Marmoom',
    coordinates: [24.9923, 55.0178],
    zone_type: 'mixed',
    color: '#FFE599',
    parent_zone: 'Jebel Ali',
    boundaries: [
      [24.9834, 55.0089],
      [25.0013, 55.0089],
      [25.0013, 55.0268],
      [24.9834, 55.0268],
      [24.9834, 55.0089]
    ]
  },
  'Al Qudra': {
    name: 'Al Qudra',
    coordinates: [24.9734, 55.0445],
    zone_type: 'mixed',
    color: '#FFDF88',
    parent_zone: 'Jebel Ali',
    boundaries: [
      [24.9645, 55.0356],
      [24.9824, 55.0356],
      [24.9824, 55.0535],
      [24.9645, 55.0535],
      [24.9645, 55.0356]
    ]
  },
  
  // Jumeirah Zone Areas
  'Al Manara': {
    name: 'Al Manara',
    coordinates: [25.2123, 55.2467],
    zone_type: 'residential',
    color: '#E8CCFF',
    parent_zone: 'Jumeirah',
    boundaries: [
      [25.2034, 55.2378],
      [25.2213, 55.2378],
      [25.2213, 55.2557],
      [25.2034, 55.2557],
      [25.2034, 55.2378]
    ]
  },
  
  // Ras Al Khor Zone Areas
  'Academic City': {
    name: 'Academic City',
    coordinates: [25.1456, 55.3612],
    zone_type: 'mixed',
    color: '#A7C8FF',
    parent_zone: 'Ras Al Khor',
    boundaries: [
      [25.1367, 55.3523],
      [25.1546, 55.3523],
      [25.1546, 55.3702],
      [25.1367, 55.3702],
      [25.1367, 55.3523]
    ]
  },
  'Al Aweer': {
    name: 'Al Aweer',
    coordinates: [25.1623, 55.3701],
    zone_type: 'industrial',
    color: '#99BEFF',
    parent_zone: 'Ras Al Khor',
    boundaries: [
      [25.1534, 55.3612],
      [25.1713, 55.3612],
      [25.1713, 55.3791],
      [25.1534, 55.3791],
      [25.1534, 55.3612]
    ]
  },
  'Al Warqa': {
    name: 'Al Warqa',
    coordinates: [25.1979, 55.3445],
    zone_type: 'residential',
    color: '#8CB4FF',
    parent_zone: 'Ras Al Khor',
    boundaries: [
      [25.1890, 55.3356],
      [25.2069, 55.3356],
      [25.2069, 55.3535],
      [25.1890, 55.3535],
      [25.1890, 55.3356]
    ]
  },
  'Al Khawaneej': {
    name: 'Al Khawaneej',
    coordinates: [25.2134, 55.3723],
    zone_type: 'residential',
    color: '#7FAAFF',
    parent_zone: 'Ras Al Khor',
    boundaries: [
      [25.2045, 55.3634],
      [25.2224, 55.3634],
      [25.2224, 55.3813],
      [25.2045, 55.3813],
      [25.2045, 55.3634]
    ]
  },
  'Al Lisaili': {
    name: 'Al Lisaili',
    coordinates: [25.1712, 55.3289],
    zone_type: 'mixed',
    color: '#73A0FF',
    parent_zone: 'Ras Al Khor',
    boundaries: [
      [25.1623, 55.3200],
      [25.1802, 55.3200],
      [25.1802, 55.3379],
      [25.1623, 55.3379],
      [25.1623, 55.3200]
    ]
  }
};

export class DubaiGeographyService {
  // Dubai map bounds
  static readonly DUBAI_BOUNDS: MapBounds = {
    north: 25.4,
    south: 24.8,
    east: 55.6,
    west: 54.9
  };

  // Al Quoz as the main business center/depot for route optimization
  static readonly BUSINESS_CENTER: [number, number] = [25.1174, 55.2094]; // Al Quoz coordinates
  static readonly DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

  /**
   * Get all Dubai zones
   */
  static getDubaiZones(): DubaiDistrict[] {
    return Object.values(DUBAI_ZONES);
  }

  /**
   * Get all Dubai areas
   */
  static getDubaiAreas(): (DubaiDistrict & { parent_zone: string })[] {
    return Object.values(DUBAI_AREAS);
  }

  /**
   * Find zone by name (exact match)
   */
  static findZoneByName(name: string): DubaiDistrict | null {
    return DUBAI_ZONES[name] || null;
  }

  /**
   * Find area by name (exact match)
   */
  static findAreaByName(name: string): (DubaiDistrict & { parent_zone: string }) | null {
    return DUBAI_AREAS[name] || null;
  }

  /**
   * Map database zone names to Dubai zones (exact match)
   */
  static mapZoneToDistrict(zoneName: string): DubaiDistrict | null {
    return this.findZoneByName(zoneName);
  }

  /**
   * Map database area names to Dubai areas (exact match)
   */
  static mapAreaToDistrict(areaName: string): (DubaiDistrict & { parent_zone: string }) | null {
    return this.findAreaByName(areaName);
  }

  /**
   * Generate zone data with Dubai coordinates
   */
  static generateZoneData(databaseZones: Zone[]): Zone[] {
    return databaseZones.map(zone => {
      const district = this.mapZoneToDistrict(zone.zone_name);
      
      if (district) {
        return {
          ...zone,
          latitude: district.coordinates[0],
          longitude: district.coordinates[1],
          boundary_coordinates: district.boundaries,
          color: district.color
        };
      }

      // Default coordinates for unmapped zones (central Dubai)
      return {
        ...zone,
        latitude: this.DUBAI_CENTER[0],
        longitude: this.DUBAI_CENTER[1],
        color: '#95A5A6' // Gray for unmapped zones
      };
    });
  }

  /**
   * Generate area data within zones
   */
  static generateAreaData(databaseAreas: Area[], zonesWithCoords: Zone[]): Area[] {
    return databaseAreas.map(area => {
      const parentZone = zonesWithCoords.find(z => z.zone_id === area.zone_id);
      
      if (parentZone && parentZone.latitude && parentZone.longitude) {
        // Generate area coordinates slightly offset from zone center
        const offsetLat = (Math.random() - 0.5) * 0.02; // Small random offset
        const offsetLng = (Math.random() - 0.5) * 0.02;
        
        return {
          ...area,
          latitude: parentZone.latitude + offsetLat,
          longitude: parentZone.longitude + offsetLng,
          color: this.lightenColor(parentZone.color || '#95A5A6', 0.3)
        };
      }

      // Default coordinates for areas without parent zones
      return {
        ...area,
        latitude: this.DUBAI_CENTER[0],
        longitude: this.DUBAI_CENTER[1],
        color: '#BDC3C7' // Light gray for unmapped areas
      };
    });
  }

  /**
   * Check if coordinates are within Dubai bounds
   */
  static isWithinDubaiBounds(lat: number, lng: number): boolean {
    return lat >= this.DUBAI_BOUNDS.south &&
           lat <= this.DUBAI_BOUNDS.north &&
           lng >= this.DUBAI_BOUNDS.west &&
           lng <= this.DUBAI_BOUNDS.east;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Lighten a hex color by a factor (0-1)
   */
  private static lightenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r + (255 - r) * factor);
    const newG = Math.round(g + (255 - g) * factor);
    const newB = Math.round(b + (255 - b) * factor);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate random coordinates within a zone for demo purposes
   */
  static generateRandomCoordinatesInZone(zone: Zone): [number, number] {
    if (!zone.latitude || !zone.longitude) {
      return this.DUBAI_CENTER;
    }

    // Generate coordinates within ±0.01 degrees of zone center
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;
    
    return [zone.latitude + offsetLat, zone.longitude + offsetLng];
  }

  /**
   * Get priority color for collection points
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#E74C3C'; // Red
      case 'high': return '#F39C12'; // Orange
      case 'medium': return '#F1C40F'; // Yellow
      case 'low': return '#27AE60'; // Green
      default: return '#95A5A6'; // Gray
    }
  }
}