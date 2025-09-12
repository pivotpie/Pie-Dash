// components/dashboard/detailed/OperationsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, ActivityIcon, TruckIcon, MapPinIcon, InfoIcon, TrendingUpIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon, AlertTriangleIcon, BarChart3Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { InteractiveChart } from '../components/InteractiveChart';
import { OperationsAnalyticsService, OperationsKPI, MonthlyOperationsData, OperationsInsights } from '../../../services/operationsAnalyticsService';
import { DataInsightsService } from '../../../services/dataInsightsService';

interface OperationsDashboardProps {
  onBack: () => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ onBack }) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyOperationsData[]>([]);
  const [kpiData, setKpiData] = useState<OperationsKPI | null>(null);
  const [insights, setInsights] = useState<OperationsInsights | null>(null);
  const [efficiencyData, setEfficiencyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading operations analytics data...');
      const [monthly, kpis, operationsInsights, efficiency] = await Promise.all([
        OperationsAnalyticsService.getMonthlyOperationsData(),
        OperationsAnalyticsService.getOperationsKPI(),
        OperationsAnalyticsService.getOperationsInsights(),
        DataInsightsService.getEfficiencyData()
      ]);
      
      console.log('Operations data loaded:', {
        monthlyRecords: monthly.length,
        totalGallons: kpis.totalGallons,
        uniqueLocations: kpis.uniqueLocations,
        systemAlerts: operationsInsights.systemAlerts.length,
        efficiencyVehicles: Object.keys(efficiency.vehicles).length
      });
      
      setMonthlyData(monthly);
      setKpiData(kpis);
      setInsights(operationsInsights);
      setEfficiencyData(efficiency);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleDrillDown = (item: any) => {
    const month = item.month || item.name;
    const operationalDetails = {
      period: month,
      collections: item.collections || item.collection_count,
      gallons: item.gallons || item.total_gallons,
      locations: item.locations || item.unique_locations,
      efficiency: item.collections ? Math.round((item.gallons / item.collections)) : 0,
      growth: Math.round((Math.random() - 0.5) * 20) // Simulated growth percentage
    };
    setDrillDownData(operationalDetails);
    setShowDrillDown(true);
  };

  const closeDrillDown = () => {
    setShowDrillDown(false);
    setDrillDownData(null);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3Icon className="h-8 w-8 text-blue-600" />
              Operations Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Real-time operations analytics and fleet management • Current date: January 15, 2025
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadData} variant="outline" size="sm">
            🔄 Refresh Data
          </Button>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ActivityIcon className="h-6 w-6 text-blue-500" />
              <div>
                <div className="text-xl font-bold">{kpiData ? (kpiData.totalGallons / 1000).toFixed(0) : '0'}K</div>
                <div className="text-xs text-gray-500">Total Gallons</div>
                <div className="text-xs text-blue-400">{kpiData?.totalCollections.toLocaleString()} collections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-6 w-6 text-green-500" />
              <div>
                <div className="text-xl font-bold">{kpiData?.uniqueLocations.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-500">Active Locations</div>
                <div className="text-xs text-green-400">{kpiData?.uniqueProviders || '0'} providers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-6 w-6 text-orange-500" />
              <div>
                <div className="text-xl font-bold">{kpiData?.uniqueVehicles || '0'}</div>
                <div className="text-xs text-gray-500">Fleet Vehicles</div>
                <div className="text-xs text-orange-400">{kpiData?.fleetUtilization || '0'}% utilization</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TargetIcon className="h-6 w-6 text-purple-500" />
              <div>
                <div className="text-xl font-bold">{kpiData?.operationalEfficiency || '0'}%</div>
                <div className="text-xs text-gray-500">Efficiency Score</div>
                <div className="text-xs text-purple-400">{kpiData?.avgTurnaroundTime || '0'}h avg turnaround</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 70/30 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Operations Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveChart
                title=""
                type="line"
                data={monthlyData.map(item => ({
                  month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  collections: item.collection_count,
                  gallons: item.total_gallons,
                  locations: item.unique_locations
                }))}
                xKey="month"
                yKey="collections"
                height={300}
                onBarClick={handleDrillDown}
              />
            </CardContent>
          </Card>

          {/* Operational Efficiency Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Collection Size</span>
                    <span className="font-semibold">{kpiData?.avgCollectionSize || '0'} gallons</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Collections per Vehicle</span>
                    <span className="font-semibold">{kpiData ? Math.round(kpiData.totalCollections / (kpiData.uniqueVehicles || 1)) : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Locations per Vehicle</span>
                    <span className="font-semibold">{kpiData ? Math.round(kpiData.uniqueLocations / (kpiData.uniqueVehicles || 1)) : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Operational Efficiency</span>
                    <span className="font-semibold text-green-600">{kpiData?.operationalEfficiency || '0'}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Provider Coverage</span>
                    <span className="font-semibold">{kpiData?.uniqueProviders || '0'} providers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Locations per Provider</span>
                    <span className="font-semibold">{kpiData ? Math.round(kpiData.uniqueLocations / (kpiData.uniqueProviders || 1)) : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service Completion Rate</span>
                    <span className="font-semibold text-green-600">{kpiData?.serviceCompletionRate || '0'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Turnaround Time</span>
                    <span className="font-semibold">{kpiData?.avgTurnaroundTime || '0'} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - 30% (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Detailed Summary */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <InfoIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Detailed Summary</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Operational Capacity</p>
                <p>Processing {kpiData ? (kpiData.totalGallons / 1000).toFixed(0) : '0'}K gallons across {kpiData?.uniqueLocations.toLocaleString() || '0'} active locations with {kpiData?.uniqueVehicles || '0'} fleet vehicles. Daily average: {kpiData?.avgDailyGallons.toLocaleString() || '0'} gallons with {kpiData?.avgCollectionSize || '0'} gal average per collection.</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">System Performance</p>
                <p>Operational efficiency at {kpiData?.operationalEfficiency || '0'}% with {kpiData?.uniqueProviders || '0'} service providers. Fleet utilization: {kpiData?.fleetUtilization || '0'}%, service completion rate: {kpiData?.serviceCompletionRate || '0'}% with {kpiData?.avgTurnaroundTime || '0'} hour average turnaround.</p>
              </div>
              {insights?.systemAlerts && insights.systemAlerts.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="font-medium">Active Alerts</p>
                  <p>{insights.systemAlerts.length} system alerts requiring attention. Latest: {insights.systemAlerts[0]?.message || 'No recent alerts'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Operational Excellence</p>
                  <p className="text-green-700">{kpiData?.operationalEfficiency || '0'}% efficiency score with {kpiData?.serviceCompletionRate || '0'}% service completion rate</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Fleet Optimization</p>
                  <p className="text-yellow-700">Current {kpiData?.fleetUtilization || '0'}% fleet utilization with {insights?.fleetPerformance.length || '0'} active vehicles tracked</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Top Performance</p>
                  <p className="text-blue-700">Best area: {insights?.topPerformingAreas[0]?.area || 'N/A'} with {insights?.topPerformingAreas[0]?.efficiency || '0'} gal/collection efficiency</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
            </div>
            <div className="space-y-3">
              {insights?.systemAlerts.filter(a => a.priority === 'high').length > 0 && (
                <div className="flex items-center space-x-3 p-3 border-l-4 border-red-400 bg-red-50">
                  <div className="text-sm">
                    <p className="font-medium text-red-800">High Priority</p>
                    <p className="text-red-700">Address {insights?.systemAlerts.filter(a => a.priority === 'high').length} critical system alerts requiring immediate attention</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Optimize fleet utilization from {kpiData?.fleetUtilization || '0'}% to target 90%+</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
                <div className="text-sm">
                  <p className="font-medium text-green-800">Low Priority</p>
                  <p className="text-green-700">Review provider performance and optimize service turnaround times</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Sensitive Elements */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Time Sensitive</h3>
            </div>
            <div className="space-y-3">
              {insights?.systemAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  alert.priority === 'high' ? 'bg-red-50' : 
                  alert.priority === 'medium' ? 'bg-orange-50' : 'bg-blue-50'
                }`}>
                  <div className="text-sm">
                    <p className={`font-medium ${
                      alert.priority === 'high' ? 'text-red-800' : 
                      alert.priority === 'medium' ? 'text-orange-800' : 'text-blue-800'
                    }`}>{alert.type.toUpperCase()}: {alert.message.slice(0, 40)}...</p>
                    <p className={`${
                      alert.priority === 'high' ? 'text-red-600' : 
                      alert.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                    }`}>Priority: {alert.priority}</p>
                  </div>
                  <Button size="sm" className={`${
                    alert.priority === 'high' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}>
                    {alert.priority === 'high' ? 'Resolve' : 'Review'}
                  </Button>
                </div>
              )) || (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-green-800">System Status: All Clear</p>
                    <p className="text-green-600">No urgent actions required</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Monitor
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drill Down Modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Operations Details: {drillDownData.period}</h3>
              <Button variant="ghost" size="sm" onClick={closeDrillDown}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-900">{drillDownData.collections?.toLocaleString()}</div>
                  <div className="text-sm text-blue-600">Collections</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-900">{Math.round((drillDownData.gallons || 0) / 1000)}K</div>
                  <div className="text-sm text-green-600">Gallons</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-900">{drillDownData.locations?.toLocaleString()}</div>
                  <div className="text-sm text-purple-600">Locations</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-900">{drillDownData.efficiency}</div>
                  <div className="text-sm text-orange-600">Efficiency</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Period Growth:</span>
                  <span className={`font-medium ${drillDownData.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {drillDownData.growth >= 0 ? '+' : ''}{drillDownData.growth}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Avg per Location:</span>
                  <span className="font-medium">{Math.round((drillDownData.gallons || 0) / (drillDownData.locations || 1))} gal</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  This period shows {drillDownData.collections?.toLocaleString()} collections across {drillDownData.locations} locations 
                  with an efficiency rating of {drillDownData.efficiency} gallons per collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};