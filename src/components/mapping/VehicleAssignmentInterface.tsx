// components/mapping/VehicleAssignmentInterface.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { VehicleLocation, Zone } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { RoutingService } from '../../services/routingService';
import { AnalyticsService } from '../../services/supabaseClient';
import { TruckIcon, MapPinIcon, AlertTriangleIcon, CheckCircleIcon, RefreshCwIcon } from 'lucide-react';

interface VehicleAssignmentInterfaceProps {
  onVehicleAssignmentChange?: (assignments: VehicleAssignment[]) => void;
  onRouteGenerated?: (routes: OptimizedRoute[]) => void;
}

interface VehicleAssignment {
  vehicle_id: number;
  assigned_zone: string;
  status: 'active' | 'idle' | 'maintenance';
  current_route?: OptimizedRoute;
}

interface ZoneCapacity {
  zone_name: string;
  assigned_vehicles: number;
  max_capacity: number;
  collection_points: number;
  priority_points: number;
  workload_score: number;
}

export const VehicleAssignmentInterface: React.FC<VehicleAssignmentInterfaceProps> = ({
  onVehicleAssignmentChange,
  onRouteGenerated
}) => {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [zoneCapacities, setZoneCapacities] = useState<ZoneCapacity[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedVehicle, setDraggedVehicle] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [vehicleData, zoneData, collectionPoints] = await Promise.all([
        AnalyticsService.getVehicleLocations(),
        AnalyticsService.getZonesWithCoordinates(),
        AnalyticsService.getCollectionPoints()
      ]);

      setVehicles(vehicleData);
      setZones(zoneData);

      // Initialize assignments from current vehicle data
      const initialAssignments: VehicleAssignment[] = vehicleData.map(vehicle => ({
        vehicle_id: vehicle.vehicle_id,
        assigned_zone: vehicle.assigned_zone || 'Unassigned',
        status: vehicle.status
      }));
      setAssignments(initialAssignments);

      // Calculate zone capacities and workload
      const capacities = calculateZoneCapacities(zoneData, collectionPoints, initialAssignments);
      setZoneCapacities(capacities);

    } catch (error) {
      console.error('Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateZoneCapacities = (zones: Zone[], collectionPoints: any[], assignments: VehicleAssignment[]): ZoneCapacity[] => {
    return zones.map(zone => {
      const zonePoints = collectionPoints.filter(p => p.zone === zone.zone_name);
      const priorityPoints = zonePoints.filter(p => p.priority === 'critical' || p.priority === 'high').length;
      const assignedVehicles = assignments.filter(a => a.assigned_zone === zone.zone_name).length;
      
      // Calculate workload score based on points and priority
      const workloadScore = zonePoints.length + (priorityPoints * 2);
      const recommendedVehicles = Math.ceil(workloadScore / 10); // Rough estimate: 10 points per vehicle

      return {
        zone_name: zone.zone_name,
        assigned_vehicles: assignedVehicles,
        max_capacity: recommendedVehicles,
        collection_points: zonePoints.length,
        priority_points: priorityPoints,
        workload_score
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, vehicleId: number) => {
    setDraggedVehicle(vehicleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    
    if (draggedVehicle) {
      const updatedAssignments = assignments.map(assignment => 
        assignment.vehicle_id === draggedVehicle
          ? { ...assignment, assigned_zone: targetZone }
          : assignment
      );
      
      setAssignments(updatedAssignments);
      onVehicleAssignmentChange?.(updatedAssignments);
      
      // Recalculate zone capacities
      const collectionPoints = []; // Would need to get this from state or props
      const updatedCapacities = calculateZoneCapacities(zones, collectionPoints, updatedAssignments);
      setZoneCapacities(updatedCapacities);
    }
    
    setDraggedVehicle(null);
  };

  const optimizeAssignments = async () => {
    try {
      setIsOptimizing(true);
      
      // Generate zone-optimized routes
      const routes = await RoutingService.generateZoneOptimizedRoutes(true);
      setOptimizedRoutes(routes);
      onRouteGenerated?.(routes);
      
      // Update assignments based on optimized routes
      const optimizedAssignments = assignments.map(assignment => {
        const route = routes.find(r => r.vehicle_id === assignment.vehicle_id);
        return {
          ...assignment,
          assigned_zone: route?.assigned_zone || assignment.assigned_zone,
          current_route: route
        };
      });
      
      setAssignments(optimizedAssignments);
      onVehicleAssignmentChange?.(optimizedAssignments);

    } catch (error) {
      console.error('Error optimizing assignments:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getZoneStatusColor = (capacity: ZoneCapacity): string => {
    const utilizationRatio = capacity.assigned_vehicles / capacity.max_capacity;
    
    if (utilizationRatio > 1.2) return 'text-red-600 bg-red-50';
    if (utilizationRatio > 0.8) return 'text-yellow-600 bg-yellow-50';
    if (utilizationRatio < 0.5) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getVehiclesByZone = (zoneName: string) => {
    return assignments.filter(a => a.assigned_zone === zoneName);
  };

  const unassignedVehicles = assignments.filter(a => a.assigned_zone === 'Unassigned');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TruckIcon className="h-6 w-6" />
          Vehicle Assignment
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={optimizeAssignments}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            {isOptimizing ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Auto-Optimize'}
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{vehicles.length}</div>
                <div className="text-sm text-gray-500">Total Vehicles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{zones.length}</div>
                <div className="text-sm text-gray-500">Active Zones</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{unassignedVehicles.length}</div>
                <div className="text-sm text-gray-500">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{optimizedRoutes.length}</div>
                <div className="text-sm text-gray-500">Optimized Routes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Assignment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Unassigned Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Unassigned Vehicles</span>
              <span className="text-sm text-gray-500">({unassignedVehicles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[100px]">
              {unassignedVehicles.map(assignment => {
                const vehicle = vehicles.find(v => v.vehicle_id === assignment.vehicle_id);
                return (
                  <div
                    key={assignment.vehicle_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, assignment.vehicle_id)}
                    className="p-2 bg-gray-100 rounded-md cursor-move hover:bg-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Vehicle {assignment.vehicle_id}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                );
              })}
              {unassignedVehicles.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  All vehicles assigned
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zone Assignment Cards */}
        {zoneCapacities.map(capacity => {
          const zoneVehicles = getVehiclesByZone(capacity.zone_name);
          
          return (
            <Card
              key={capacity.zone_name}
              className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, capacity.zone_name)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm">{capacity.zone_name}</span>
                  <div className={`px-2 py-1 text-xs rounded-full ${getZoneStatusColor(capacity)}`}>
                    {capacity.assigned_vehicles}/{capacity.max_capacity}
                  </div>
                </CardTitle>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Collection Points: {capacity.collection_points}</div>
                  <div>Priority Points: {capacity.priority_points}</div>
                  <div>Workload Score: {capacity.workload_score}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 min-h-[80px]">
                  {zoneVehicles.map(assignment => {
                    const vehicle = vehicles.find(v => v.vehicle_id === assignment.vehicle_id);
                    return (
                      <div
                        key={assignment.vehicle_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, assignment.vehicle_id)}
                        className="p-2 bg-blue-100 rounded-md cursor-move hover:bg-blue-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Vehicle {assignment.vehicle_id}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                    );
                  })}
                  {zoneVehicles.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4 border-2 border-dashed border-gray-200 rounded">
                      Drop vehicles here
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Route Optimization Results */}
      {optimizedRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimizedRoutes.slice(0, 6).map(route => (
                <div key={route.vehicle_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Vehicle {route.vehicle_id}</span>
                    <span className="text-sm text-gray-500">{route.assigned_zone}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Points: {route.points.length}</div>
                    <div>Distance: {route.total_distance.toFixed(1)} km</div>
                    <div>Time: {route.total_time.toFixed(1)} hrs</div>
                    <div>Efficiency: {route.efficiency_score.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};