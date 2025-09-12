// components/routing/RouteVisualizer.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { OptimizedRoute } from '../../services/routingService';

interface RouteVisualizerProps {
  routes: OptimizedRoute[];
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ routes }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routes.slice(0, 5).map((route, index) => (
            <div key={route.vehicle_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Vehicle {route.vehicle_id}</h4>
                <span className="text-sm text-gray-500">
                  {route.points.length} stops
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Distance:</span>
                  <div className="font-medium">{route.total_distance.toFixed(1)} km</div>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <div className="font-medium">{route.total_time.toFixed(1)} hrs</div>
                </div>
                <div>
                  <span className="text-gray-500">Gallons:</span>
                  <div className="font-medium">{route.total_gallons}</div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Route Preview:</div>
                <div className="text-sm">
                  {route.points.slice(0, 3).map(p => p.outlet_name).join(' → ')}
                  {route.points.length > 3 && ` → ... (+${route.points.length - 3} more)`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};