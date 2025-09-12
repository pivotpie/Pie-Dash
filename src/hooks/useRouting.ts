// hooks/useRouting.ts
import { useState } from 'react';
import { RoutingService, RoutePoint, OptimizedRoute } from '../services/routingService';

export const useRouting = () => {
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoutes = async (points: RoutePoint[], vehicleCount: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const optimizedRoutes = await RoutingService.generateOptimalRoutes(points, vehicleCount);
      setRoutes(optimizedRoutes);
      
    } catch (err) {
      setError('Failed to optimize routes');
      console.error('Route optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async (from: [number, number], to: [number, number]) => {
    try {
      return await RoutingService.calculateDistance(from, to);
    } catch (err) {
      console.error('Distance calculation error:', err);
      return 0;
    }
  };

  return {
    routes,
    loading,
    error,
    optimizeRoutes,
    calculateDistance
  };
};