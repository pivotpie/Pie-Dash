// components/mapping/RouteOptimizationPage.tsx
import React, { useState, useEffect } from 'react';
import { FastDubaiMap } from './FastDubaiMap';
import { RouteOptimizationPanel } from './RouteOptimizationPanel';
import { RouteVisualization } from './RouteVisualization';
import { Zone, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { AnalyticsService } from '../../services/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RouteIcon, MapIcon, ArrowLeftIcon, TruckIcon, TargetIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export const RouteOptimizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [allOptimizedRoutes, setAllOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await loadMapData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      console.log('Loading route optimization data...');
      
      const [vehiclesData, collectionPointsData] = await Promise.all([
        AnalyticsService.getVehicleLocations(),
        AnalyticsService.getCollectionPoints()
      ]);

      console.log('Route optimization data loaded:', {
        vehicles: vehiclesData?.length || 0,
        collectionPoints: collectionPointsData?.length || 0
      });

      setVehicles(vehiclesData || []);
      setCollectionPoints(collectionPointsData || []);
    } catch (error) {
      console.error('Error loading route optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: OptimizedRoute) => {
    setSelectedRoute(route);
  };

  const handleOptimizationComplete = (routes: OptimizedRoute[]) => {
    setAllOptimizedRoutes(routes);
    if (routes.length > 0) {
      setSelectedRoute(routes[0]);
    }
  };

  const toggleShowAllRoutes = () => {
    setShowAllRoutes(!showAllRoutes);
  };

  // Calculate summary statistics
  const totalActiveVehicles = vehicles.filter(v => v.status === 'active' || v.status === 'idle').length;
  const totalRoutesGenerated = allOptimizedRoutes.length;
  const totalPointsAssigned = allOptimizedRoutes.reduce((sum, route) => sum + route.points.length, 0);
  const totalDistance = allOptimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0);
  const averageEfficiency = allOptimizedRoutes.length > 0 
    ? allOptimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / allOptimizedRoutes.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading route optimization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/fleet-map')}
              variant="outline"
              size="sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Map
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <RouteIcon className="h-8 w-8 text-purple-600" />
              Route Optimization
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {allOptimizedRoutes.length > 0 && (
              <Button
                onClick={toggleShowAllRoutes}
                variant={showAllRoutes ? "primary" : "outline"}
                size="sm"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {showAllRoutes ? 'Hide All Routes' : 'Show All Routes'}
              </Button>
            )}
            <button
              onClick={loadMapData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
        
        <div className="text-gray-600 text-sm">
          Optimize collection routes using advanced algorithms to maximize efficiency and minimize travel time.
        </div>
      </div>

      {/* Summary Statistics */}
      {allOptimizedRoutes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalActiveVehicles}</div>
              <div className="text-sm text-gray-600">Available Vehicles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalRoutesGenerated}</div>
              <div className="text-sm text-gray-600">Routes Generated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{totalPointsAssigned}</div>
              <div className="text-sm text-gray-600">Points Assigned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{totalDistance.toFixed(1)} km</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${
                averageEfficiency >= 80 ? 'text-green-600' :
                averageEfficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {averageEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Efficiency</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Optimization Panel */}
        <div className="lg:col-span-1">
          <RouteOptimizationPanel
            vehicles={vehicles}
            collectionPoints={collectionPoints}
            onRouteSelect={handleRouteSelect}
            onOptimizationComplete={handleOptimizationComplete}
          />
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Route Visualization
                {selectedRoute && (
                  <span className="text-sm font-normal text-gray-600">
                    - Vehicle {selectedRoute.vehicle_id} ({selectedRoute.assigned_zone})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FastDubaiMap
                height="600px"
                showZones={true}
                showVehicles={false}
                showCollectionPoints={!showAllRoutes} // Hide collection points when showing all routes
                zones={zones}
                vehicles={vehicles}
                collectionPoints={collectionPoints}
                maxMarkers={300} // Optimized for route optimization
              >
                {/* Show all routes or just selected route */}
                {showAllRoutes 
                  ? allOptimizedRoutes.map((route, index) => (
                      <RouteVisualization
                        key={`route-${route.vehicle_id}-${index}`}
                        route={route}
                        showStartEnd={index === 0} // Only show start/end for first route to avoid clutter
                        showWaypoints={false} // Hide waypoints when showing all routes
                        opacity={route.vehicle_id === selectedRoute?.vehicle_id ? 1.0 : 0.6}
                      />
                    ))
                  : selectedRoute && (
                      <RouteVisualization
                        route={selectedRoute}
                        showStartEnd={true}
                        showWaypoints={true}
                        opacity={1.0}
                      />
                    )
                }
              </FastDubaiMap>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Route Details */}
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Route Details - Vehicle {selectedRoute.vehicle_id}
              <div
                className="w-4 h-4 rounded-full border border-white"
                style={{ backgroundColor: selectedRoute.route_color }}
              ></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Route Summary */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Route Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Zone</div>
                    <div className="text-lg font-semibold">{selectedRoute.assigned_zone}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Collection Stops</div>
                    <div className="text-lg font-semibold">{selectedRoute.points.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total Distance</div>
                    <div className="text-lg font-semibold">{selectedRoute.total_distance.toFixed(1)} km</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Estimated Time</div>
                    <div className="text-lg font-semibold">
                      {Math.floor(selectedRoute.total_time)}h {Math.floor((selectedRoute.total_time % 1) * 60)}m
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total Volume</div>
                    <div className="text-lg font-semibold">{selectedRoute.total_gallons.toLocaleString()} gallons</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Efficiency Score</div>
                    <div className={`text-lg font-semibold ${
                      selectedRoute.efficiency_score >= 80 ? 'text-green-600' :
                      selectedRoute.efficiency_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedRoute.efficiency_score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection Points List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Collection Schedule ({selectedRoute.points.length} stops)</h4>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {selectedRoute.points.map((point, index) => (
                    <div key={point.entity_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{point.outlet_name}</div>
                          <div className="text-sm text-gray-600">{point.area} • {point.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{point.gallons_expected} gallons</div>
                        <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          point.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          point.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {point.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};