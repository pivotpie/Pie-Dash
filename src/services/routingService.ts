// services/routingService.ts
import { DubaiGeographyService } from './dubaiGeographyService';
import { DelayDetectionService, DelayAlert } from './delayDetectionService';
import { AnalyticsService } from './supabaseClient';
import { RoutePoint, OptimizedRoute } from '../types/routing.types';


export class RoutingService {
  private static readonly OSRM_BASE_URL = 'https://router.project-osrm.org';
  private static readonly VEHICLE_CAPACITY = 500; // gallons

  static async calculateDistance(from: [number, number], to: [number, number]): Promise<number> {
    try {
      const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
      const response = await fetch(
        `${this.OSRM_BASE_URL}/route/v1/driving/${coords}?overview=false`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].distance / 1000; // Convert to kilometers
      }
      return 0;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  }

  static async optimizeRoute(points: RoutePoint[]): Promise<RoutePoint[]> {
    if (points.length <= 2) return points;

    try {
      const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';');
      const response = await fetch(
        `${this.OSRM_BASE_URL}/trip/v1/driving/${coords}?source=first&destination=last&roundtrip=false`
      );
      const data = await response.json();

      if (data.trips && data.trips.length > 0) {
        const trip = data.trips[0];
        const waypoint_order = trip.legs.map((leg: any, index: number) => index);
        return waypoint_order.map((index: number) => points[index]);
      }
      
      return points;
    } catch (error) {
      console.error('Error optimizing route:', error);
      return this.fallbackOptimization(points);
    }
  }

  private static fallbackOptimization(points: RoutePoint[]): RoutePoint[] {
    // Simple nearest neighbor algorithm as fallback
    if (points.length <= 1) return points;

    const optimized = [points[0]];
    const remaining = points.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Number.MAX_VALUE;

      remaining.forEach((point, index) => {
        const distance = this.haversineDistance(
          [current.latitude, current.longitude],
          [point.latitude, point.longitude]
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  static haversineDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(coord2[0] - coord1[0]);
    const dLng = this.toRad(coord2[1] - coord1[1]);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1[0])) * Math.cos(this.toRad(coord2[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  static async generateOptimalRoutes(
    allPoints: RoutePoint[], 
    vehicleCount: number = 10
  ): Promise<OptimizedRoute[]> {
    // Use zone-aware clustering for better efficiency
    const clusters = await this.clusterPointsByZone(allPoints, vehicleCount);
    const routes: OptimizedRoute[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const optimizedPoints = await this.optimizeRoute(cluster);
      
      // Determine the primary zone for this route
      const zoneCounts = cluster.reduce((acc, point) => {
        if (point.zone) {
          acc[point.zone] = (acc[point.zone] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const primaryZone = Object.keys(zoneCounts).reduce((a, b) => 
        zoneCounts[a] > zoneCounts[b] ? a : b, Object.keys(zoneCounts)[0]
      );

      const route: OptimizedRoute = {
        vehicle_id: i + 1,
        points: optimizedPoints,
        total_distance: await this.calculateTotalDistance(optimizedPoints),
        total_time: await this.calculateTotalTime(optimizedPoints),
        total_gallons: optimizedPoints.reduce((sum, p) => sum + p.gallons_expected, 0),
        efficiency_score: 0,
        assigned_zone: primaryZone,
        route_color: this.getRouteColor(i)
      };

      route.efficiency_score = this.calculateZoneAwareEfficiencyScore(route);
      routes.push(route);
    }

    return routes.sort((a, b) => b.efficiency_score - a.efficiency_score);
  }

  // Enhanced zone-aware route generation with delay integration
  static async generateZoneOptimizedRoutes(
    includeDelayPriority: boolean = true
  ): Promise<OptimizedRoute[]> {
    try {
      // Get collection points from database
      const collectionPoints = await AnalyticsService.getCollectionPoints();
      
      // Convert to route points
      let routePoints: RoutePoint[] = collectionPoints.map(point => ({
        entity_id: point.entity_id,
        latitude: point.latitude,
        longitude: point.longitude,
        gallons_expected: point.expected_gallons,
        category: point.category,
        area: point.area,
        zone: point.zone,
        outlet_name: point.outlet_name,
        priority: point.priority,
        days_overdue: point.days_overdue
      }));

      // If delay priority is enabled, integrate delay detection
      if (includeDelayPriority) {
        const delays = await DelayDetectionService.getCurrentDelays();
        routePoints = this.integrateDelayPriority(routePoints, delays);
      }

      // Generate optimal routes using zone-aware clustering
      return await this.generateOptimalRoutes(routePoints, 12); // Assume 12 vehicles
    } catch (error) {
      console.error('Error generating zone-optimized routes:', error);
      return [];
    }
  }

  // New zone-aware clustering method
  private static async clusterPointsByZone(points: RoutePoint[], clusterCount: number): Promise<RoutePoint[][]> {
    // Sort points by priority first (critical points get processed first)
    const sortedPoints = [...points].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Group by zone first for geographical efficiency
    const zoneGroups = sortedPoints.reduce((groups, point) => {
      const zone = point.zone || 'Unknown';
      if (!groups[zone]) groups[zone] = [];
      groups[zone].push(point);
      return groups;
    }, {} as Record<string, RoutePoint[]>);

    const clusters: RoutePoint[][] = Array(clusterCount).fill(null).map(() => []);
    const zones = Object.keys(zoneGroups);

    // Smart zone distribution to minimize cross-zone travel
    zones.forEach((zone, index) => {
      const zonePoints = zoneGroups[zone];
      const baseClusterIndex = index % clusterCount;
      
      // Try to keep zone points together, but balance capacity
      let currentCluster = baseClusterIndex;
      
      for (const point of zonePoints) {
        // Find the best cluster (prefer same zone, check capacity)
        let bestCluster = currentCluster;
        let minCrossZonePoints = Infinity;
        
        for (let i = 0; i < clusterCount; i++) {
          const cluster = clusters[i];
          const clusterCapacity = cluster.reduce((sum, p) => sum + p.gallons_expected, 0);
          
          if (clusterCapacity + point.gallons_expected <= this.VEHICLE_CAPACITY) {
            const crossZonePoints = cluster.filter(p => p.zone !== zone).length;
            if (crossZonePoints < minCrossZonePoints) {
              minCrossZonePoints = crossZonePoints;
              bestCluster = i;
            }
          }
        }
        
        clusters[bestCluster].push(point);
        currentCluster = bestCluster;
      }
    });

    // Balance clusters and ensure no empty clusters
    return this.balanceZoneClusters(clusters);
  }

  private static clusterPointsByArea(points: RoutePoint[], clusterCount: number): RoutePoint[][] {
    // Legacy method - group by area first, then balance clusters
    const areaGroups = points.reduce((groups, point) => {
      if (!groups[point.area]) groups[point.area] = [];
      groups[point.area].push(point);
      return groups;
    }, {} as Record<string, RoutePoint[]>);

    const clusters: RoutePoint[][] = Array(clusterCount).fill(null).map(() => []);
    const areas = Object.keys(areaGroups);

    // Distribute areas across clusters
    areas.forEach((area, index) => {
      const clusterIndex = index % clusterCount;
      clusters[clusterIndex].push(...areaGroups[area]);
    });

    // Balance cluster sizes and capacity
    return this.balanceClusters(clusters);
  }

  private static balanceClusters(clusters: RoutePoint[][]): RoutePoint[][] {
    const maxCapacity = this.VEHICLE_CAPACITY;
    const balanced: RoutePoint[][] = [];

    clusters.forEach(cluster => {
      let currentCluster: RoutePoint[] = [];
      let currentCapacity = 0;

      cluster.forEach(point => {
        if (currentCapacity + point.gallons_expected > maxCapacity) {
          if (currentCluster.length > 0) {
            balanced.push(currentCluster);
          }
          currentCluster = [point];
          currentCapacity = point.gallons_expected;
        } else {
          currentCluster.push(point);
          currentCapacity += point.gallons_expected;
        }
      });

      if (currentCluster.length > 0) {
        balanced.push(currentCluster);
      }
    });

    return balanced;
  }

  private static async calculateTotalDistance(points: RoutePoint[]): Promise<number> {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const distance = await this.calculateDistance(
        [points[i].latitude, points[i].longitude],
        [points[i + 1].latitude, points[i + 1].longitude]
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  private static async calculateTotalTime(points: RoutePoint[]): Promise<number> {
    // Estimate time: driving time + service time
    const distance = await this.calculateTotalDistance(points);
    const drivingTime = distance / 30; // Assume 30 km/h average speed
    const serviceTime = points.length * 0.25; // 15 minutes per stop
    return drivingTime + serviceTime;
  }

  private static calculateEfficiencyScore(route: OptimizedRoute): number {
    // Score based on gallons per km and time efficiency
    const gallonsPerKm = route.total_gallons / (route.total_distance || 1);
    const pointsPerHour = route.points.length / (route.total_time || 1);
    return (gallonsPerKm * 10) + (pointsPerHour * 5);
  }

  // Enhanced efficiency calculation considering zone constraints
  private static calculateZoneAwareEfficiencyScore(route: OptimizedRoute): number {
    const baseScore = this.calculateEfficiencyScore(route);
    
    // Bonus for zone consistency (fewer cross-zone travels)
    const zoneConsistencyBonus = this.calculateZoneConsistencyBonus(route);
    
    // Bonus for priority handling (critical points processed early)
    const priorityBonus = this.calculatePriorityBonus(route);
    
    return baseScore + zoneConsistencyBonus + priorityBonus;
  }

  private static calculateZoneConsistencyBonus(route: OptimizedRoute): number {
    if (route.points.length <= 1) return 0;
    
    const zones = new Set(route.points.map(p => p.zone));
    const zoneChanges = route.points.slice(1).reduce((changes, point, index) => {
      return changes + (point.zone !== route.points[index].zone ? 1 : 0);
    }, 0);
    
    // Fewer zone changes = higher bonus
    const maxPossibleChanges = route.points.length - 1;
    const consistency = 1 - (zoneChanges / maxPossibleChanges);
    return consistency * 20; // Up to 20 point bonus
  }

  private static calculatePriorityBonus(route: OptimizedRoute): number {
    let bonus = 0;
    const totalPoints = route.points.length;
    
    route.points.forEach((point, index) => {
      const positionFactor = (totalPoints - index) / totalPoints;
      
      switch (point.priority) {
        case 'critical':
          bonus += positionFactor * 15; // Critical points early = high bonus
          break;
        case 'high':
          bonus += positionFactor * 10;
          break;
        case 'medium':
          bonus += positionFactor * 5;
          break;
        default:
          bonus += positionFactor * 1;
      }
    });
    
    return bonus / totalPoints; // Normalize by route size
  }

  // Enhanced cluster balancing for zone-aware routing
  private static balanceZoneClusters(clusters: RoutePoint[][]): RoutePoint[][] {
    const maxCapacity = this.VEHICLE_CAPACITY;
    const balanced: RoutePoint[][] = [];

    clusters.forEach(cluster => {
      if (cluster.length === 0) return;
      
      let currentCluster: RoutePoint[] = [];
      let currentCapacity = 0;

      // Sort cluster by priority and zone for optimal ordering
      const sortedCluster = cluster.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Secondary sort by zone to keep zones together
        return (a.zone || '').localeCompare(b.zone || '');
      });

      sortedCluster.forEach(point => {
        if (currentCapacity + point.gallons_expected > maxCapacity) {
          if (currentCluster.length > 0) {
            balanced.push(currentCluster);
          }
          currentCluster = [point];
          currentCapacity = point.gallons_expected;
        } else {
          currentCluster.push(point);
          currentCapacity += point.gallons_expected;
        }
      });

      if (currentCluster.length > 0) {
        balanced.push(currentCluster);
      }
    });

    return balanced.filter(cluster => cluster.length > 0);
  }

  // Integrate delay priority into route points
  private static integrateDelayPriority(routePoints: RoutePoint[], delays: DelayAlert[]): RoutePoint[] {
    return routePoints.map(point => {
      const delayInfo = delays.find(delay => delay.entity_id === point.entity_id);
      
      if (delayInfo) {
        return {
          ...point,
          priority: delayInfo.priority,
          days_overdue: delayInfo.days_overdue,
          gallons_expected: Math.max(point.gallons_expected, delayInfo.expected_gallons)
        };
      }
      
      return point;
    });
  }

  // Get route color for visualization
  private static getRouteColor(routeIndex: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#FD79A8', '#74B9FF', '#A29BFE',
      '#00B894', '#FDCB6E', '#6C5CE7', '#FF7675', '#55A3FF'
    ];
    return colors[routeIndex % colors.length];
  }

  // Analyze route coverage by zone
  static analyzeZoneCoverage(routes: OptimizedRoute[]): Record<string, any> {
    const zoneStats: Record<string, {
      routes: number;
      points: number;
      gallons: number;
      avgEfficiency: number;
    }> = {};

    routes.forEach(route => {
      const zone = route.assigned_zone || 'Unknown';
      
      if (!zoneStats[zone]) {
        zoneStats[zone] = {
          routes: 0,
          points: 0,
          gallons: 0,
          avgEfficiency: 0
        };
      }
      
      zoneStats[zone].routes += 1;
      zoneStats[zone].points += route.points.length;
      zoneStats[zone].gallons += route.total_gallons;
      zoneStats[zone].avgEfficiency += route.efficiency_score;
    });

    // Calculate averages
    Object.keys(zoneStats).forEach(zone => {
      zoneStats[zone].avgEfficiency /= zoneStats[zone].routes;
    });

    return {
      zoneStats,
      totalZones: Object.keys(zoneStats).length,
      totalRoutes: routes.length,
      avgRoutesPerZone: routes.length / Object.keys(zoneStats).length
    };
  }
}