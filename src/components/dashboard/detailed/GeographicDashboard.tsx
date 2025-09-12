// components/dashboard/detailed/GeographicDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, MapIcon, TrendingUpIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon, InfoIcon } from 'lucide-react';
import { InteractiveChart } from '../components/InteractiveChart';
import { DataTable } from '../../ui/DataTable';
import { FilterControls } from '../components/FilterControls';
import { ExportButtons } from '../components/ExportButtons';
import { AnalyticsService } from '../../../services/supabaseClient';

interface DashboardGeographic {
  area: string;
  zone: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  unique_locations: number;
  provider_count: number;
  vehicle_count: number;
  percentage: number;
}

interface GeographicDashboardProps {
  onBack: () => void;
}

export const GeographicDashboard: React.FC<GeographicDashboardProps> = ({ onBack }) => {
  const [geographicData, setGeographicData] = useState<DashboardGeographic[]>([]);
  const [filteredData, setFilteredData] = useState<DashboardGeographic[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      const data = await AnalyticsService.getGeographicData();
      setGeographicData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error loading geographic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleAreaClick = (area: string | any) => {
    const areaName = typeof area === 'string' ? area : area.name || area.area;
    const areaDetails = filteredData.find(item => item.area === areaName);
    
    if (areaDetails) {
      setDrillDownData({
        area: areaDetails.area,
        zone: areaDetails.zone,
        collections: areaDetails.collection_count,
        gallons: areaDetails.total_gallons,
        locations: areaDetails.unique_locations,
        avgGallons: areaDetails.avg_gallons,
        efficiency: Math.round(areaDetails.total_gallons / areaDetails.unique_locations)
      });
      setShowDrillDown(true);
    }
  };

  const closeDrillDown = () => {
    setShowDrillDown(false);
    setDrillDownData(null);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...geographicData];
    
    if (filters.zone) {
      filtered = filtered.filter(item => item.zone === filters.zone);
    }
    
    if (filters.minCollections) {
      filtered = filtered.filter(item => item.collection_count >= filters.minCollections);
    }
    
    setFilteredData(filtered);
  };

  const chartData = filteredData.map(item => ({
    name: item.area,
    collections: item.collection_count,
    gallons: item.total_gallons,
    locations: item.unique_locations,
    avgGallons: item.avg_gallons
  }));

  const tableColumns = [
    { key: 'area', title: 'Area', sortable: true },
    { key: 'zone', title: 'Zone', sortable: true },
    { key: 'collection_count', title: 'Collections', sortable: true },
    { key: 'total_gallons', title: 'Total Gallons', sortable: true },
    { key: 'avg_gallons', title: 'Avg Gallons', sortable: true },
    { key: 'unique_locations', title: 'Locations', sortable: true },
    { key: 'provider_count', title: 'Providers', sortable: true },
    { key: 'vehicle_count', title: 'Vehicles', sortable: true },
    { key: 'percentage', title: 'Market %', sortable: true }
  ];

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
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-3 py-2">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <ExportButtons data={filteredData} filename="geographic-analysis" />
          <Button>
            <MapIcon className="mr-2 h-4 w-4" />
            View on Map
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <FilterControls onFilter={handleFilter} />

      {/* Main Layout - 70/30 split */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
              <div className="text-2xl font-bold text-blue-900">
                {filteredData.reduce((sum, item) => sum + item.collection_count, 0).toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total Collections</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
              <div className="text-2xl font-bold text-green-900">
                {Math.round(filteredData.reduce((sum, item) => sum + item.total_gallons, 0) / 1000)}K
              </div>
              <div className="text-sm text-green-600">Total Gallons</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-l-purple-500">
              <div className="text-2xl font-bold text-purple-900">
                {filteredData.reduce((sum, item) => sum + item.unique_locations, 0)}
              </div>
              <div className="text-sm text-purple-600">Service Locations</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-l-orange-500">
              <div className="text-2xl font-bold text-orange-900">
                {new Set(filteredData.map(item => item.zone)).size}
              </div>
              <div className="text-sm text-orange-600">Active Zones</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveChart
              title="Collections by Area"
              type="bar"
              data={chartData}
              xKey="name"
              yKey="collections"
              height={300}
              onDrillDown={handleAreaClick}
            />
            
            <InteractiveChart
              title="Gallons Distribution"
              type="treemap"
              data={chartData}
              xKey="name"
              yKey="gallons"
              height={300}
              onDrillDown={handleAreaClick}
            />
          </div>

          {/* Detailed Table */}
          <DataTable
            title="Area Performance Details"
            columns={tableColumns}
            data={filteredData}
            onRowClick={(row) => handleAreaClick(row.area)}
            pagination={true}
            pageSize={15}
            enableColumnFilters={true}
          />

          {/* Zone Analysis */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Zone Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(
                filteredData.reduce((zones: Record<string, {areas: number, collections: number, gallons: number}>, item) => {
                  if (!zones[item.zone]) {
                    zones[item.zone] = { areas: 0, collections: 0, gallons: 0 };
                  }
                  zones[item.zone].areas += 1;
                  zones[item.zone].collections += item.collection_count;
                  zones[item.zone].gallons += item.total_gallons;
                  return zones;
                }, {})
              ).map(([zone, stats]) => (
                <div key={zone} className="bg-white p-4 rounded border">
                  <h4 className="font-semibold text-gray-900">{zone}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{stats.areas} areas</div>
                    <div>{stats.collections.toLocaleString()} collections</div>
                    <div>{Math.round(stats.gallons / 1000)}K gallons</div>
                  </div>
                </div>
              ))}
            </div>
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
                <p className="font-medium">Coverage Analysis</p>
                <p>Operating across {new Set(filteredData.map(item => item.zone)).size} zones with {filteredData.length} distinct areas. Total service coverage includes {filteredData.reduce((sum, item) => sum + item.unique_locations, 0)} unique locations.</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">Performance Metrics</p>
                <p>Average {Math.round(filteredData.reduce((sum, item) => sum + item.avg_gallons, 0) / (filteredData.length || 1))} gallons per collection. Top performing zone: {Object.entries(filteredData.reduce((zones: Record<string, number>, item) => { zones[item.zone] = (zones[item.zone] || 0) + item.collection_count; return zones; }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</p>
              </div>
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
                  <p className="font-medium text-green-800">High Performance Areas</p>
                  <p className="text-green-700">{filteredData.filter(item => item.avg_gallons > 50).length} areas showing above-average collection efficiency</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Optimization Opportunities</p>
                  <p className="text-yellow-700">Zone coverage could be optimized for better resource allocation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Growth Potential</p>
                  <p className="text-blue-700">Identified {Math.ceil(filteredData.length * 0.3)} areas with expansion opportunities</p>
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
              <div className="flex items-center space-x-3 p-3 border-l-4 border-red-400 bg-red-50">
                <div className="text-sm">
                  <p className="font-medium text-red-800">High Priority</p>
                  <p className="text-red-700">Review low-performing areas for route optimization</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Analyze zone boundary efficiency</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
                <div className="text-sm">
                  <p className="font-medium text-green-800">Low Priority</p>
                  <p className="text-green-700">Explore expansion opportunities in high-growth areas</p>
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
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-red-800">Urgent: Route Review</p>
                  <p className="text-red-600">Due in 2 days</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Weekly Report</p>
                  <p className="text-orange-600">Due in 5 days</p>
                </div>
                <Button size="sm" variant="outline">
                  Prepare
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Zone Optimization Review</p>
                  <p className="text-blue-600">Scheduled for next week</p>
                </div>
                <Button size="sm" variant="ghost">
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Down Modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Area Details: {drillDownData.area}</h3>
              <Button variant="ghost" size="sm" onClick={closeDrillDown}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900">{drillDownData.area}</h4>
                <p className="text-sm text-blue-700">Zone: {drillDownData.zone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.collections.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Collections</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(drillDownData.gallons / 1000)}K</div>
                  <div className="text-sm text-gray-600">Total Gallons</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.locations}</div>
                  <div className="text-sm text-gray-600">Locations</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.efficiency}</div>
                  <div className="text-sm text-gray-600">Gal/Location</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  This area in {drillDownData.zone} zone handles {drillDownData.collections.toLocaleString()} collections 
                  across {drillDownData.locations} locations with an average of {drillDownData.avgGallons} gallons per collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};