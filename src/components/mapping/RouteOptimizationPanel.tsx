// components/mapping/RouteOptimizationPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RouteOptimizationService, RouteOptimizationOptions, RouteOptimizationResult } from '../../services/routeOptimizationService';
import { VehicleLocation, CollectionPoint } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { RouteIcon, TruckIcon, TargetIcon, ClockIcon, MapPinIcon, AlertCircleIcon, PlayIcon, SettingsIcon } from 'lucide-react';

interface RouteOptimizationPanelProps {
  vehicles: VehicleLocation[];
  collectionPoints: CollectionPoint[];
  onRouteSelect?: (route: OptimizedRoute) => void;
  onOptimizationComplete?: (routes: OptimizedRoute[]) => void;
}

export const RouteOptimizationPanel: React.FC<RouteOptimizationPanelProps> = ({
  vehicles,
  collectionPoints,
  onRouteSelect,
  onOptimizationComplete
}) => {
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Optimization options
  const [options, setOptions] = useState<RouteOptimizationOptions>({
    maxVehicles: vehicles.length,
    maxPointsPerRoute: 15,
    prioritizeUrgent: true,
    startFromBusinessCenter: true,
    maxRouteDistance: 50,
    maxRouteTime: 8
  });

  const handleOptimizeRoutes = async () => {
    if (vehicles.length === 0 || collectionPoints.length === 0) {
      alert('No vehicles or collection points available for optimization');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await RouteOptimizationService.optimizeRoutes(
        collectionPoints,
        vehicles,
        options
      );
      setOptimizationResult(result);
      
      // Auto-select first route if available
      if (result.routes.length > 0) {
        setSelectedRoute(result.routes[0]);
        onRouteSelect?.(result.routes[0]);
      }
      
      // Notify parent component of optimization completion
      onOptimizationComplete?.(result.routes);
    } catch (error) {
      console.error('Route optimization failed:', error);
      alert('Route optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRouteClick = (route: OptimizedRoute) => {
    setSelectedRoute(route);
    onRouteSelect?.(route);
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Route Optimization
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Points per Route</label>
                  <input
                    type="number"
                    value={options.maxPointsPerRoute}
                    onChange={(e) => setOptions({...options, maxPointsPerRoute: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-1 border rounded text-sm"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Distance (km)</label>
                  <input
                    type="number"
                    value={options.maxRouteDistance}
                    onChange={(e) => setOptions({...options, maxRouteDistance: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-1 border rounded text-sm"
                    min="10"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Time (hours)</label>
                  <input
                    type="number"
                    value={options.maxRouteTime}
                    onChange={(e) => setOptions({...options, maxRouteTime: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-1 border rounded text-sm"
                    min="2"
                    max="12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Vehicles</label>
                  <input
                    type="number"
                    value={options.maxVehicles}
                    onChange={(e) => setOptions({...options, maxVehicles: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-1 border rounded text-sm"
                    min="1"
                    max={vehicles.length}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.prioritizeUrgent}
                    onChange={(e) => setOptions({...options, prioritizeUrgent: e.target.checked})}
                  />
                  Prioritize Urgent Collections
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.startFromBusinessCenter}
                    onChange={(e) => setOptions({...options, startFromBusinessCenter: e.target.checked})}
                  />
                  Start from Business Center
                </label>
              </div>
            </div>
          )}

          {/* Optimization Button */}
          <Button
            onClick={handleOptimizeRoutes}
            disabled={isOptimizing}
            className="w-full"
            size="lg"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Optimizing Routes...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Optimize Routes
              </>
            )}
          </Button>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
              <div className="text-gray-600">Available Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{collectionPoints.length}</div>
              <div className="text-gray-600">Collection Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lg font-bold text-green-600">{optimizationResult.routes.length}</div>
                <div className="text-gray-600">Routes Generated</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {optimizationResult.routes.reduce((sum, r) => sum + r.points.length, 0)}
                </div>
                <div className="text-gray-600">Points Assigned</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {optimizationResult.totalDistance.toFixed(1)} km
                </div>
                <div className="text-gray-600">Total Distance</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {formatTime(optimizationResult.totalTime)}
                </div>
                <div className="text-gray-600">Total Time</div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
              <span className="text-sm font-medium">Efficiency Score:</span>
              <span className={`text-lg font-bold ${
                optimizationResult.efficiencyScore >= 80 ? 'text-green-600' :
                optimizationResult.efficiencyScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {optimizationResult.efficiencyScore.toFixed(1)}%
              </span>
            </div>

            {optimizationResult.unassignedPoints.length > 0 && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <div className="text-sm text-red-800">
                  <strong>{optimizationResult.unassignedPoints.length}</strong> collection points could not be assigned to routes
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Route List */}
      {optimizationResult && optimizationResult.routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Optimized Routes ({optimizationResult.routes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {optimizationResult.routes.map((route, index) => (
              <div
                key={route.vehicle_id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRoute?.vehicle_id === route.vehicle_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleRouteClick(route)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: route.route_color }}
                    ></div>
                    <span className="font-medium">Vehicle {route.vehicle_id}</span>
                    <span className="text-sm text-gray-600">({route.assigned_zone})</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    route.efficiency_score >= 80 ? 'bg-green-100 text-green-800' :
                    route.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {route.efficiency_score.toFixed(0)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <TargetIcon className="h-3 w-3 text-gray-500" />
                    <span>{route.points.length} stops</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3 text-gray-500" />
                    <span>{route.total_distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-gray-500" />
                    <span>{formatTime(route.total_time)}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  {route.total_gallons} gallons • Priority stops: {route.points.filter(p => p.priority === 'critical' || p.priority === 'high').length}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Route Details */}
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Route Details - Vehicle {selectedRoute.vehicle_id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Zone:</span> {selectedRoute.assigned_zone}
                </div>
                <div>
                  <span className="font-medium">Stops:</span> {selectedRoute.points.length}
                </div>
                <div>
                  <span className="font-medium">Distance:</span> {selectedRoute.total_distance.toFixed(1)} km
                </div>
                <div>
                  <span className="font-medium">Time:</span> {formatTime(selectedRoute.total_time)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Collection Points ({selectedRoute.points.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedRoute.points.map((point, index) => (
                  <div key={point.entity_id} className="flex items-center justify-between text-sm border-l-4 pl-3" style={{ borderLeftColor: selectedRoute.route_color }}>
                    <div>
                      <span className="font-medium">#{index + 1}</span> {point.outlet_name}
                      <div className="text-xs text-gray-600">{point.area} • {point.gallons_expected} gallons</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      point.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      point.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {point.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};