// components/routing/RouteOptimizer.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TruckIcon, ClockIcon, MapPinIcon, FuelIcon } from 'lucide-react';
import { RoutingService, RoutePoint, OptimizedRoute } from '../../services/routingService';
import { RouteVisualizer } from './RouteVisualizer';
import { VehicleAssignment } from './VehicleAssignment';
import { supabase } from '../../services/supabaseClient';

export const RouteOptimizer: React.FC = () => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleCount, setVehicleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadRoutePoints();
  }, [selectedDate]);

  // FIXED: Moved estimateGallons to standalone function
  const estimateGallons = (category: string, daysSince: number): number => {
    const baseRates = {
      'Restaurant': 2.5,
      'Accommodation': 1.8,
      'Cafeteria': 2.0,
      'Supermarket': 1.5
    };
    const rate = baseRates[category as keyof typeof baseRates] || 1.5;
    return Math.round(rate * daysSince);
  };

  const loadRoutePoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('location_patterns')
        .select(`
          entity_id,
          category,
          area,
          outlet_name,
          days_since_last,
          avg_interval_days,
          delay_status
        `)
        .in('delay_status', ['CRITICAL', 'WARNING'])
        .limit(200);

      if (error) throw error;

      const points: RoutePoint[] = data.map(item => ({
        entity_id: item.entity_id,
        latitude: 25.2048 + (Math.random() - 0.5) * 0.1,
        longitude: 55.2708 + (Math.random() - 0.5) * 0.1,
        gallons_expected: estimateGallons(item.category, item.days_since_last),
        category: item.category,
        area: item.area,
        outlet_name: item.outlet_name,
        priority: item.delay_status === 'CRITICAL' ? 'high' : 'medium'
      }));

      setRoutePoints(points);
    } catch (error) {
      console.error('Error loading route points:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoutes = async () => {
    if (routePoints.length === 0) return;

    setOptimizing(true);
    try {
      const routes = await RoutingService.generateOptimalRoutes(routePoints, vehicleCount);
      setOptimizedRoutes(routes);
    } catch (error) {
      console.error('Error optimizing routes:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const totalStats = optimizedRoutes.reduce(
    (acc, route) => ({
      distance: acc.distance + route.total_distance,
      time: acc.time + route.total_time,
      gallons: acc.gallons + route.total_gallons,
      points: acc.points + route.points.length
    }),
    { distance: 0, time: 0, gallons: 0, points: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
        
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicles
            </label>
            <input
              type="number"
              value={vehicleCount}
              onChange={(e) => setVehicleCount(parseInt(e.target.value) || 10)}
              min="1"
              max="50"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <Button
            onClick={optimizeRoutes}
            disabled={loading || optimizing || routePoints.length === 0}
            className="mt-6"
          >
            {optimizing ? 'Optimizing...' : 'Optimize Routes'}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalStats.points}</div>
                <div className="text-sm text-gray-500">Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{optimizedRoutes.length}</div>
                <div className="text-sm text-gray-500">Routes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FuelIcon className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(totalStats.distance)}</div>
                <div className="text-sm text-gray-500">Total KM</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(totalStats.time)}</div>
                <div className="text-sm text-gray-500">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Visualization */}
      {optimizedRoutes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RouteVisualizer routes={optimizedRoutes} />
          <VehicleAssignment routes={optimizedRoutes} />
        </div>
      )}

      {/* Route Details */}
      {optimizedRoutes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Route Details</h3>
          <div className="grid gap-4">
            {optimizedRoutes.map((route, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Vehicle {route.vehicle_id}</span>
                    <span className="text-sm font-normal text-gray-500">
                      Efficiency Score: {route.efficiency_score.toFixed(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Stops</div>
                      <div className="font-semibold">{route.points.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Distance</div>
                      <div className="font-semibold">{route.total_distance.toFixed(1)} km</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Time</div>
                      <div className="font-semibold">{route.total_time.toFixed(1)} hrs</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Gallons</div>
                      <div className="font-semibold">{route.total_gallons}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-2">Route Stops:</div>
                    <div className="text-gray-600">
                      {route.points.slice(0, 5).map(p => p.outlet_name).join(' → ')}
                      {route.points.length > 5 && ` → ... (${route.points.length - 5} more)`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};