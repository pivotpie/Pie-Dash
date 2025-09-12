// services/routeOptimizationService.ts
import { CollectionPoint, VehicleLocation } from '../types/database.types';
import { OptimizedRoute, RoutePoint } from '../types/routing.types';
import { DubaiGeographyService } from './dubaiGeographyService';

export interface RouteOptimizationOptions {
  maxVehicles?: number;
  maxPointsPerRoute?: number;
  prioritizeUrgent?: boolean;
  startFromBusinessCenter?: boolean;
  maxRouteDistance?: number; // in kilometers
  maxRouteTime?: number; // in hours
}

export interface RouteOptimizationResult {
  routes: OptimizedRoute[];
  unassignedPoints: CollectionPoint[];
  totalDistance: number;
  totalTime: number;
  efficiencyScore: number;
  optimizationTime: number;
}

export class RouteOptimizationService {
  private static readonly BUSINESS_CENTER = DubaiGeographyService.BUSINESS_CENTER;
  private static readonly AVERAGE_SPEED_KMH = 30; // Average speed in Dubai traffic
  private static readonly SERVICE_TIME_MINUTES = 15; // Average service time per collection point

  /**
   * Optimize routes for a given set of collection points and vehicles
   */
  static async optimizeRoutes(
    collectionPoints: CollectionPoint[],
    vehicles: VehicleLocation[],
    options: RouteOptimizationOptions = {}
  ): Promise<RouteOptimizationResult> {
    const startTime = Date.now();
    
    const {
      maxVehicles = vehicles.length,
      maxPointsPerRoute = 15,
      prioritizeUrgent = true,
      startFromBusinessCenter = true,
      maxRouteDistance = 50,
      maxRouteTime = 8
    } = options;

    console.log('Starting route optimization...', {
      collectionPoints: collectionPoints.length,
      vehicles: vehicles.length,
      options
    });

    // Filter and sort collection points by priority
    let sortedPoints = [...collectionPoints];
    if (prioritizeUrgent) {
      const priorityWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      
      sortedPoints.sort((a, b) => {
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Secondary sort by days overdue
        return b.days_overdue - a.days_overdue;
      });
    }

    // Select available vehicles (active and idle)
    const availableVehicles = vehicles
      .filter(v => v.status === 'active' || v.status === 'idle')
      .slice(0, maxVehicles);

    if (availableVehicles.length === 0) {
      return {
        routes: [],
        unassignedPoints: collectionPoints,
        totalDistance: 0,
        totalTime: 0,
        efficiencyScore: 0,
        optimizationTime: Date.now() - startTime
      };
    }

    // Group points by zone for initial clustering
    const pointsByZone = this.groupPointsByZone(sortedPoints);
    
    // Assign vehicles to zones based on their current location
    const vehicleZoneAssignments = this.assignVehiclesToZones(availableVehicles, pointsByZone);
    
    // Generate optimized routes with multiple passes to assign all points
    const routes: OptimizedRoute[] = [];
    let unassignedPoints: CollectionPoint[] = [];
    let allZonePoints = { ...pointsByZone };
    
    // First pass: Assign optimal loads to each vehicle
    for (const vehicle of availableVehicles) {
      const assignedZone = vehicleZoneAssignments.get(vehicle.vehicle_id);
      if (!assignedZone || !allZonePoints[assignedZone] || allZonePoints[assignedZone].length === 0) continue;
      
      const zonePoints = allZonePoints[assignedZone];
      
      // Take points for this vehicle
      const selectedPoints = zonePoints.slice(0, maxPointsPerRoute);
      allZonePoints[assignedZone] = zonePoints.slice(maxPointsPerRoute);
      
      if (selectedPoints.length > 0) {
        const optimizedRoute = this.createOptimizedRoute(
          vehicle,
          selectedPoints,
          startFromBusinessCenter
        );
        
        // Check route constraints
        if (optimizedRoute.total_distance <= maxRouteDistance && 
            optimizedRoute.total_time <= maxRouteTime) {
          routes.push(optimizedRoute);
        } else {
          // Route too long, split it
          const splitRoutes = this.splitLongRoute(
            vehicle,
            selectedPoints,
            maxRouteDistance,
            maxRouteTime,
            startFromBusinessCenter
          );
          routes.push(...splitRoutes);
        }
      }
    }
    
    // Second pass: Create additional routes for remaining points using available vehicles
    const remainingPointsFlat = Object.values(allZonePoints).flat();
    if (remainingPointsFlat.length > 0) {
      let vehicleIndex = 0;
      
      while (remainingPointsFlat.length > 0 && vehicleIndex < availableVehicles.length * 3) { // Allow up to 3 routes per vehicle
        const vehicle = availableVehicles[vehicleIndex % availableVehicles.length];
        
        // Take next batch of points
        const batchSize = Math.min(maxPointsPerRoute, remainingPointsFlat.length);
        const batchPoints = remainingPointsFlat.splice(0, batchSize);
        
        if (batchPoints.length > 0) {
          // Create additional route with modified vehicle ID
          const modifiedVehicle = {
            ...vehicle,
            vehicle_id: vehicle.vehicle_id * 1000 + Math.floor(vehicleIndex / availableVehicles.length) + 2
          };
          
          const optimizedRoute = this.createOptimizedRoute(
            modifiedVehicle,
            batchPoints,
            startFromBusinessCenter
          );
          
          // Check if route meets constraints
          if (optimizedRoute.total_distance <= maxRouteDistance && 
              optimizedRoute.total_time <= maxRouteTime) {
            routes.push(optimizedRoute);
          } else {
            // Try to split the route
            const splitRoutes = this.splitLongRoute(
              modifiedVehicle,
              batchPoints,
              maxRouteDistance,
              maxRouteTime,
              startFromBusinessCenter
            );
            
            if (splitRoutes.length > 0) {
              routes.push(...splitRoutes);
            } else {
              // If we can't split it, add points back to unassigned
              unassignedPoints.push(...batchPoints);
            }
          }
        }
        
        vehicleIndex++;
      }
      
      // Add any remaining points to unassigned
      unassignedPoints.push(...remainingPointsFlat);
    }

    // Calculate overall statistics
    const totalDistance = routes.reduce((sum, route) => sum + route.total_distance, 0);
    const totalTime = routes.reduce((sum, route) => sum + route.total_time, 0);
    const totalAssignedPoints = routes.reduce((sum, route) => sum + route.points.length, 0);
    const efficiencyScore = this.calculateEfficiencyScore(
      totalAssignedPoints,
      collectionPoints.length,
      totalDistance,
      totalTime
    );

    const result = {
      routes,
      unassignedPoints,
      totalDistance,
      totalTime,
      efficiencyScore,
      optimizationTime: Date.now() - startTime
    };

    console.log('Route optimization completed:', {
      routesGenerated: routes.length,
      pointsAssigned: totalAssignedPoints,
      pointsUnassigned: unassignedPoints.length,
      totalDistance: totalDistance.toFixed(2) + ' km',
      totalTime: totalTime.toFixed(2) + ' hours',
      efficiencyScore: efficiencyScore.toFixed(2),
      optimizationTime: result.optimizationTime + ' ms'
    });

    return result;
  }

  /**
   * Group collection points by zone
   */
  private static groupPointsByZone(points: CollectionPoint[]): Record<string, CollectionPoint[]> {
    const groups: Record<string, CollectionPoint[]> = {};
    
    points.forEach(point => {
      if (!groups[point.zone]) {
        groups[point.zone] = [];
      }
      groups[point.zone].push(point);
    });
    
    return groups;
  }

  /**
   * Assign vehicles to zones based on proximity
   */
  private static assignVehiclesToZones(
    vehicles: VehicleLocation[],
    pointsByZone: Record<string, CollectionPoint[]>
  ): Map<number, string> {
    const assignments = new Map<number, string>();
    const zonePriorities = Object.entries(pointsByZone)
      .map(([zone, points]) => ({
        zone,
        priority: points.reduce((sum, p) => {
          const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
          return sum + priorityWeight[p.priority];
        }, 0),
        pointCount: points.length
      }))
      .sort((a, b) => b.priority - a.priority);

    // Assign vehicles to zones based on priority and proximity
    vehicles.forEach(vehicle => {
      let bestZone = vehicle.assigned_zone;
      
      // If vehicle's assigned zone has no points, find the nearest zone with points
      if (!pointsByZone[vehicle.assigned_zone] || pointsByZone[vehicle.assigned_zone].length === 0) {
        let minDistance = Infinity;
        
        for (const { zone } of zonePriorities) {
          if (pointsByZone[zone].length > 0) {
            const zoneCenter = DubaiGeographyService.findZoneByName(zone);
            if (zoneCenter) {
              const distance = DubaiGeographyService.calculateDistance(
                vehicle.latitude,
                vehicle.longitude,
                zoneCenter.coordinates[0],
                zoneCenter.coordinates[1]
              );
              
              if (distance < minDistance) {
                minDistance = distance;
                bestZone = zone;
              }
            }
          }
        }
      }
      
      assignments.set(vehicle.vehicle_id, bestZone);
    });
    
    return assignments;
  }

  /**
   * Create an optimized route for a vehicle and collection points
   */
  private static createOptimizedRoute(
    vehicle: VehicleLocation,
    points: CollectionPoint[],
    startFromBusinessCenter: boolean
  ): OptimizedRoute {
    // Convert collection points to route points
    const routePoints: RoutePoint[] = points.map(point => ({
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

    // Optimize the order using nearest neighbor algorithm
    const optimizedPoints = this.optimizePointOrder(
      startFromBusinessCenter ? this.BUSINESS_CENTER : [vehicle.latitude, vehicle.longitude],
      routePoints,
      startFromBusinessCenter
    );

    // Calculate route metrics
    const { distance, time } = this.calculateRouteMetrics(
      startFromBusinessCenter ? this.BUSINESS_CENTER : [vehicle.latitude, vehicle.longitude],
      optimizedPoints,
      startFromBusinessCenter
    );

    const totalGallons = optimizedPoints.reduce((sum, point) => sum + point.gallons_expected, 0);
    const efficiencyScore = this.calculateRouteEfficiencyScore(
      optimizedPoints.length,
      distance,
      time,
      totalGallons
    );

    // Generate route color based on zone
    const routeColor = this.getRouteColor(vehicle.assigned_zone || 'default');

    return {
      vehicle_id: vehicle.vehicle_id,
      points: optimizedPoints,
      total_distance: distance,
      total_time: time,
      total_gallons: totalGallons,
      efficiency_score: efficiencyScore,
      assigned_zone: vehicle.assigned_zone,
      route_color: routeColor
    };
  }

  /**
   * Optimize the order of points using nearest neighbor algorithm
   */
  private static optimizePointOrder(
    startPoint: [number, number],
    points: RoutePoint[],
    returnToStart: boolean
  ): RoutePoint[] {
    if (points.length === 0) return [];
    
    const optimized: RoutePoint[] = [];
    const remaining = [...points];
    let currentPoint = startPoint;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remaining.forEach((point, index) => {
        const distance = DubaiGeographyService.calculateDistance(
          currentPoint[0],
          currentPoint[1],
          point.latitude,
          point.longitude
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nextPoint = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nextPoint);
      currentPoint = [nextPoint.latitude, nextPoint.longitude];
    }

    return optimized;
  }

  /**
   * Calculate route distance and time
   */
  private static calculateRouteMetrics(
    startPoint: [number, number],
    points: RoutePoint[],
    returnToStart: boolean
  ): { distance: number; time: number } {
    let totalDistance = 0;
    let currentPoint = startPoint;

    // Calculate distance between consecutive points
    points.forEach(point => {
      const distance = DubaiGeographyService.calculateDistance(
        currentPoint[0],
        currentPoint[1],
        point.latitude,
        point.longitude
      );
      totalDistance += distance;
      currentPoint = [point.latitude, point.longitude];
    });

    // Return to start if required
    if (returnToStart && points.length > 0) {
      const returnDistance = DubaiGeographyService.calculateDistance(
        currentPoint[0],
        currentPoint[1],
        startPoint[0],
        startPoint[1]
      );
      totalDistance += returnDistance;
    }

    // Calculate time (driving time + service time)
    const drivingTime = totalDistance / this.AVERAGE_SPEED_KMH;
    const serviceTime = (points.length * this.SERVICE_TIME_MINUTES) / 60; // Convert to hours
    const totalTime = drivingTime + serviceTime;

    return { distance: totalDistance, time: totalTime };
  }

  /**
   * Split a long route into multiple shorter routes
   */
  private static splitLongRoute(
    vehicle: VehicleLocation,
    points: CollectionPoint[],
    maxDistance: number,
    maxTime: number,
    startFromBusinessCenter: boolean
  ): OptimizedRoute[] {
    const routes: OptimizedRoute[] = [];
    const remainingPoints = [...points];
    let routeIndex = 1;

    while (remainingPoints.length > 0) {
      let currentRoutePoints: CollectionPoint[] = [];
      let currentDistance = 0;
      let currentTime = 0;

      // Add points until we reach the limits
      while (remainingPoints.length > 0) {
        const nextPoint = remainingPoints[0];
        
        // Create temporary route to test
        const testPoints = [...currentRoutePoints, nextPoint];
        const { distance, time } = this.calculateRouteMetrics(
          startFromBusinessCenter ? this.BUSINESS_CENTER : [vehicle.latitude, vehicle.longitude],
          testPoints.map(p => ({
            entity_id: p.entity_id,
            latitude: p.latitude,
            longitude: p.longitude,
            gallons_expected: p.expected_gallons,
            category: p.category,
            area: p.area,
            zone: p.zone,
            outlet_name: p.outlet_name,
            priority: p.priority,
            days_overdue: p.days_overdue
          })),
          startFromBusinessCenter
        );

        // Check if adding this point would exceed limits
        if (distance <= maxDistance && time <= maxTime) {
          currentRoutePoints.push(remainingPoints.shift()!);
          currentDistance = distance;
          currentTime = time;
        } else {
          break;
        }
      }

      // Create route if we have points
      if (currentRoutePoints.length > 0) {
        const route = this.createOptimizedRoute(
          {
            ...vehicle,
            vehicle_id: vehicle.vehicle_id * 1000 + routeIndex // Unique ID for sub-routes
          },
          currentRoutePoints,
          startFromBusinessCenter
        );
        routes.push(route);
        routeIndex++;
      } else {
        // If we can't fit even one point, skip it
        remainingPoints.shift();
      }
    }

    return routes;
  }

  /**
   * Calculate efficiency score for the entire optimization
   */
  private static calculateEfficiencyScore(
    assignedPoints: number,
    totalPoints: number,
    totalDistance: number,
    totalTime: number
  ): number {
    const assignmentRatio = assignedPoints / totalPoints;
    const distanceEfficiency = Math.max(0, 1 - (totalDistance / (assignedPoints * 5))); // Penalize excessive distance
    const timeEfficiency = Math.max(0, 1 - (totalTime / (assignedPoints * 0.5))); // Penalize excessive time
    
    return (assignmentRatio * 0.5 + distanceEfficiency * 0.3 + timeEfficiency * 0.2) * 100;
  }

  /**
   * Calculate efficiency score for a single route
   */
  private static calculateRouteEfficiencyScore(
    pointCount: number,
    distance: number,
    time: number,
    gallons: number
  ): number {
    const pointEfficiency = Math.min(1, pointCount / 10); // Optimal around 10 points
    const distanceEfficiency = Math.max(0, 1 - (distance / (pointCount * 3))); // ~3km per point is efficient
    const timeEfficiency = Math.max(0, 1 - (time / (pointCount * 0.3))); // ~18 minutes per point
    const volumeEfficiency = Math.min(1, gallons / (pointCount * 50)); // Good volume utilization
    
    return (pointEfficiency * 0.3 + distanceEfficiency * 0.3 + timeEfficiency * 0.2 + volumeEfficiency * 0.2) * 100;
  }

  /**
   * Get route color based on zone
   */
  private static getRouteColor(zone: string): string {
    const zoneColors: Record<string, string> = {
      'Al Quoz': '#FF6B6B',
      'Al Qusais': '#4ECDC4',
      'Bur Dubai': '#45B7D1',
      'Deira': '#96CEB4',
      'Jebel Ali': '#FFEAA7',
      'Jumeirah': '#DDA0DD',
      'Ras Al Khor': '#74B9FF',
      'default': '#95A5A6'
    };
    
    return zoneColors[zone] || zoneColors.default;
  }
}