// components/fleet/FleetDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TruckIcon, SettingsIcon, AlertTriangleIcon, TrendingUpIcon } from 'lucide-react';
import { FleetService, VehiclePerformance, ProviderMetrics } from '../../services/fleetService';
import { VehiclePerformanceChart } from './VehiclePerformanceChart';
import { ProviderScorecard } from './ProviderScorecard';
import { MaintenanceScheduler } from './MaintenanceScheduler';

export const FleetDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehiclePerformance[]>([]);
  const [providers, setProviders] = useState<ProviderMetrics[]>([]);
  const [fleetReport, setFleetReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'providers' | 'maintenance'>('overview');

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      const [vehicleData, providerData, report] = await Promise.all([
        FleetService.getVehiclePerformance(),
        FleetService.getProviderMetrics(),
        FleetService.generateFleetOptimizationReport()
      ]);

      setVehicles(vehicleData);
      setProviders(providerData);
      setFleetReport(report);
    } catch (error) {
      console.error('Error loading fleet data:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <Button onClick={loadFleetData}>
          Refresh Data
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TruckIcon },
            { id: 'vehicles', label: 'Vehicles', icon: TruckIcon },
            { id: 'providers', label: 'Providers', icon: TrendingUpIcon },
            { id: 'maintenance', label: 'Maintenance', icon: SettingsIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Fleet Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TruckIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{fleetReport?.fleet_summary.total_vehicles}</div>
                    <div className="text-sm text-gray-500">Active Vehicles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUpIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(fleetReport?.fleet_summary.avg_utilization * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Avg Utilization</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {fleetReport?.fleet_summary.vehicles_needing_maintenance}
                    </div>
                    <div className="text-sm text-gray-500">Need Maintenance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{providers.length}</div>
                    <div className="text-sm text-gray-500">Service Providers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {fleetReport?.recommendations && fleetReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangleIcon className="mr-2 h-5 w-5 text-orange-500" />
                  Fleet Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {fleetReport.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fleetReport?.fleet_summary.top_performers?.slice(0, 5).map((vehicle: VehiclePerformance, index: number) => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Vehicle {vehicle.vehicle_id}</div>
                        <div className="text-sm text-gray-500">
                          {vehicle.total_collections} collections • {vehicle.total_gallons} gallons
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {vehicle.efficiency_score}
                        </div>
                        <div className="text-xs text-gray-500">Efficiency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Service Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fleetReport?.provider_summary.top_providers?.slice(0, 5).map((provider: ProviderMetrics, index: number) => (
                    <div key={provider.provider_name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{provider.provider_name}</div>
                        <div className="text-sm text-gray-500">
                          {provider.vehicle_count} vehicles • {provider.total_collections} collections
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {provider.service_quality_score}
                        </div>
                        <div className="text-xs text-gray-500">Quality Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <VehiclePerformanceChart vehicles={vehicles} />
      )}

      {activeTab === 'providers' && (
        <ProviderScorecard providers={providers} />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceScheduler vehicles={vehicles.filter(v => v.maintenance_due)} />
      )}
    </div>
  );
};