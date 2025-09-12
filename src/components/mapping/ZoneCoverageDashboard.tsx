// components/mapping/ZoneCoverageDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Zone, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { RoutingService } from '../../services/routingService';
import { AnalyticsService } from '../../services/supabaseClient';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';
import { 
  MapIcon, 
  TruckIcon, 
  TargetIcon, 
  AlertTriangleIcon, 
  TrendingUpIcon,
  ClockIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';

interface ZoneAnalysis {
  zone_name: string;
  zone_color: string;
  assigned_vehicles: number;
  recommended_vehicles: number;
  collection_points: number;
  critical_points: number;
  high_priority_points: number;
  total_gallons_expected: number;
  coverage_percentage: number;
  efficiency_score: number;
  avg_delay_days: number;
  workload_distribution: number;
  status: 'optimal' | 'overloaded' | 'underutilized' | 'critical';
}

interface CoverageMetrics {
  total_zones: number;
  optimal_zones: number;
  overloaded_zones: number;
  underutilized_zones: number;
  critical_zones: number;
  overall_efficiency: number;
  total_vehicles: number;
  unassigned_vehicles: number;
}

export const ZoneCoverageDashboard: React.FC = () => {
  const [zoneAnalyses, setZoneAnalyses] = useState<ZoneAnalysis[]>([]);
  const [coverageMetrics, setCoverageMetrics] = useState<CoverageMetrics | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    loadCoverageData();
  }, []);

  const loadCoverageData = async () => {
    try {
      setLoading(true);
      
      const [zones, vehicles, collectionPoints] = await Promise.all([
        AnalyticsService.getZonesWithCoordinates(),
        AnalyticsService.getVehicleLocations(),
        AnalyticsService.getCollectionPoints()
      ]);

      const analyses = analyzeZoneCoverage(zones, vehicles, collectionPoints);
      const metrics = calculateCoverageMetrics(analyses, vehicles);

      setZoneAnalyses(analyses);
      setCoverageMetrics(metrics);

    } catch (error) {
      console.error('Error loading coverage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeZoneCoverage = (
    zones: Zone[], 
    vehicles: VehicleLocation[], 
    collectionPoints: CollectionPoint[]
  ): ZoneAnalysis[] => {
    return zones.map(zone => {
      const zonePoints = collectionPoints.filter(p => p.zone === zone.zone_name);
      const zoneVehicles = vehicles.filter(v => v.assigned_zone === zone.zone_name);
      
      const criticalPoints = zonePoints.filter(p => p.priority === 'critical').length;
      const highPriorityPoints = zonePoints.filter(p => p.priority === 'high').length;
      const totalGallons = zonePoints.reduce((sum, p) => sum + p.expected_gallons, 0);
      
      // Calculate recommended vehicles based on workload
      const workloadScore = zonePoints.length + (criticalPoints * 3) + (highPriorityPoints * 2);
      const recommendedVehicles = Math.max(1, Math.ceil(workloadScore / 12)); // 12 points per vehicle
      
      // Calculate coverage percentage
      const vehicleCapacity = zoneVehicles.length * 500; // 500 gallons per vehicle
      const coveragePercentage = Math.min(100, (vehicleCapacity / (totalGallons || 1)) * 100);
      
      // Calculate average delay
      const avgDelayDays = zonePoints.reduce((sum, p) => sum + (p.days_overdue || 0), 0) / (zonePoints.length || 1);
      
      // Calculate efficiency score
      const vehicleUtilization = zoneVehicles.length / recommendedVehicles;
      const priorityHandling = 100 - (criticalPoints * 10 + highPriorityPoints * 5);
      const efficiencyScore = (vehicleUtilization * 50) + (priorityHandling * 0.5);
      
      // Determine zone status
      let status: ZoneAnalysis['status'] = 'optimal';
      if (criticalPoints > 3 || avgDelayDays > 5) {
        status = 'critical';
      } else if (zoneVehicles.length > recommendedVehicles * 1.5) {
        status = 'overloaded';
      } else if (zoneVehicles.length < recommendedVehicles * 0.7) {
        status = 'underutilized';
      }

      return {
        zone_name: zone.zone_name,
        zone_color: zone.color || '#95A5A6',
        assigned_vehicles: zoneVehicles.length,
        recommended_vehicles: recommendedVehicles,
        collection_points: zonePoints.length,
        critical_points: criticalPoints,
        high_priority_points: highPriorityPoints,
        total_gallons_expected: totalGallons,
        coverage_percentage: Math.round(coveragePercentage),
        efficiency_score: Math.round(efficiencyScore),
        avg_delay_days: Math.round(avgDelayDays * 10) / 10,
        workload_distribution: workloadScore,
        status
      };
    });
  };

  const calculateCoverageMetrics = (analyses: ZoneAnalysis[], vehicles: VehicleLocation[]): CoverageMetrics => {
    const unassignedVehicles = vehicles.filter(v => !v.assigned_zone || v.assigned_zone === 'Unassigned').length;
    const overallEfficiency = analyses.reduce((sum, a) => sum + a.efficiency_score, 0) / analyses.length;

    return {
      total_zones: analyses.length,
      optimal_zones: analyses.filter(a => a.status === 'optimal').length,
      overloaded_zones: analyses.filter(a => a.status === 'overloaded').length,
      underutilized_zones: analyses.filter(a => a.status === 'underutilized').length,
      critical_zones: analyses.filter(a => a.status === 'critical').length,
      overall_efficiency: Math.round(overallEfficiency),
      total_vehicles: vehicles.length,
      unassigned_vehicles
    };
  };

  const generateOptimizedCoverage = async () => {
    try {
      setIsOptimizing(true);
      
      const routes = await RoutingService.generateZoneOptimizedRoutes(true);
      setOptimizedRoutes(routes);
      
      // Analyze the optimization results
      const analysis = RoutingService.analyzeZoneCoverage(routes);
      console.log('Zone Coverage Analysis:', analysis);

    } catch (error) {
      console.error('Error generating optimized coverage:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusColor = (status: ZoneAnalysis['status']) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'overloaded': return 'text-red-600 bg-red-50 border-red-200';
      case 'underutilized': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'critical': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: ZoneAnalysis['status']) => {
    switch (status) {
      case 'optimal': return <CheckCircleIcon className="h-4 w-4" />;
      case 'overloaded': return <XCircleIcon className="h-4 w-4" />;
      case 'underutilized': return <TrendingUpIcon className="h-4 w-4" />;
      case 'critical': return <AlertTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MapIcon className="h-8 w-8" />
          Zone Coverage Analysis
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={generateOptimizedCoverage}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            {isOptimizing ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TargetIcon className="h-4 w-4" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Optimize Coverage'}
          </Button>
          <Button
            onClick={loadCoverageData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Coverage Metrics Summary */}
      {coverageMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.total_zones}</div>
                  <div className="text-xs text-gray-500">Total Zones</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.optimal_zones}</div>
                  <div className="text-xs text-gray-500">Optimal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircleIcon className="h-6 w-6 text-red-500" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.overloaded_zones}</div>
                  <div className="text-xs text-gray-500">Overloaded</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.underutilized_zones}</div>
                  <div className="text-xs text-gray-500">Underutilized</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="h-6 w-6 text-purple-500" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.critical_zones}</div>
                  <div className="text-xs text-gray-500">Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.total_vehicles}</div>
                  <div className="text-xs text-gray-500">Total Vehicles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{coverageMetrics.overall_efficiency}</span>
                </div>
                <div>
                  <div className="text-xl font-bold">{coverageMetrics.overall_efficiency}%</div>
                  <div className="text-xs text-gray-500">Efficiency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Zone Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Coverage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Zone</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-center p-2">Vehicles</th>
                  <th className="text-center p-2">Points</th>
                  <th className="text-center p-2">Critical</th>
                  <th className="text-center p-2">Coverage</th>
                  <th className="text-center p-2">Efficiency</th>
                  <th className="text-center p-2">Avg Delay</th>
                  <th className="text-center p-2">Gallons</th>
                </tr>
              </thead>
              <tbody>
                {zoneAnalyses.map(analysis => (
                  <tr 
                    key={analysis.zone_name}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      selectedZone === analysis.zone_name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedZone(
                      selectedZone === analysis.zone_name ? null : analysis.zone_name
                    )}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: analysis.zone_color }}
                        ></div>
                        <span className="font-medium">{analysis.zone_name}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(analysis.status)}`}>
                        {getStatusIcon(analysis.status)}
                        {analysis.status}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${
                        analysis.assigned_vehicles < analysis.recommended_vehicles ? 'text-red-600' :
                        analysis.assigned_vehicles > analysis.recommended_vehicles ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {analysis.assigned_vehicles}
                      </span>
                      <span className="text-gray-500">/{analysis.recommended_vehicles}</span>
                    </td>
                    <td className="text-center p-2">{analysis.collection_points}</td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${
                        analysis.critical_points > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analysis.critical_points}
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${
                        analysis.coverage_percentage < 70 ? 'text-red-600' :
                        analysis.coverage_percentage < 90 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {analysis.coverage_percentage}%
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${
                        analysis.efficiency_score < 60 ? 'text-red-600' :
                        analysis.efficiency_score < 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {analysis.efficiency_score}
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${
                        analysis.avg_delay_days > 3 ? 'text-red-600' :
                        analysis.avg_delay_days > 1 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {analysis.avg_delay_days}d
                      </span>
                    </td>
                    <td className="text-center p-2 text-sm">{analysis.total_gallons_expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Selected Zone Details */}
      {selectedZone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5" />
              {selectedZone} - Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const analysis = zoneAnalyses.find(a => a.zone_name === selectedZone);
              if (!analysis) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Resource Allocation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Assigned Vehicles:</span>
                        <span className="font-medium">{analysis.assigned_vehicles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommended:</span>
                        <span className="font-medium">{analysis.recommended_vehicles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workload Score:</span>
                        <span className="font-medium">{analysis.workload_distribution}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Collection Points</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Points:</span>
                        <span className="font-medium">{analysis.collection_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Priority:</span>
                        <span className="font-medium text-red-600">{analysis.critical_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Priority:</span>
                        <span className="font-medium text-orange-600">{analysis.high_priority_points}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coverage:</span>
                        <span className="font-medium">{analysis.coverage_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency:</span>
                        <span className="font-medium">{analysis.efficiency_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Delay:</span>
                        <span className="font-medium">{analysis.avg_delay_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Optimization Results */}
      {optimizedRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {optimizedRoutes.slice(0, 8).map(route => (
                <div key={route.vehicle_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Vehicle {route.vehicle_id}</span>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: route.route_color }}
                    ></div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Zone: <span className="font-medium">{route.assigned_zone}</span></div>
                    <div>Points: {route.points.length}</div>
                    <div>Distance: {route.total_distance.toFixed(1)} km</div>
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