// components/dashboard/detailed/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, TrendingUpIcon, InfoIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon } from 'lucide-react';
import { InteractiveChart } from '../components/InteractiveChart';
import { DataTable } from '../../ui/DataTable';
import { AnalyticsService } from '../../../services/supabaseClient';

interface DashboardProvider {
  service_provider: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  unique_entities: number;
  areas_served: number;
  zones_served: number;
  vehicles_used: number;
  avg_turnaround_days: number;
  market_share: number;
  collections_per_vehicle: number;
}

interface PerformanceDashboardProps {
  onBack: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onBack }) => {
  const [providerData, setProviderData] = useState<DashboardProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AnalyticsService.getProviderData();
      setProviderData(data);
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = providerData.map(item => ({
    name: item.service_provider.replace('Service Provider ', 'SP-'),
    collections: item.collection_count,
    gallons: item.total_gallons,
    efficiency: item.avg_gallons,
    marketShare: item.market_share
  }));

  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleDrillDown = (item: any) => {
    const providerName = item.name?.replace('SP-', 'Service Provider ') || item.service_provider;
    const providerDetails = providerData.find(p => p.service_provider === providerName || p.service_provider.includes(providerName));
    
    if (providerDetails) {
      setDrillDownData({
        provider: providerDetails.service_provider,
        collections: providerDetails.collection_count,
        gallons: providerDetails.total_gallons,
        avgGallons: providerDetails.avg_gallons,
        marketShare: providerDetails.market_share,
        efficiency: Math.round(providerDetails.total_gallons / providerDetails.collection_count)
      });
      setShowDrillDown(true);
    }
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
        </div>
      </div>

      {/* 70/30 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveChart
              title="Market Share Distribution"
              type="pie"
              data={chartData.slice(0, 10)}
              xKey="name"
              yKey="marketShare"
              height={350}
              onDrillDown={handleDrillDown}
            />
            
            <InteractiveChart
              title="Provider Efficiency"
              type="bar"
              data={chartData.slice(0, 15)}
              xKey="name"
              yKey="efficiency"
              height={350}
              onDrillDown={handleDrillDown}
            />
          </div>

          <DataTable
            title="Provider Performance Details"
            columns={[
              { key: 'service_provider', title: 'Provider', sortable: true },
              { key: 'collection_count', title: 'Collections', sortable: true },
              { key: 'total_gallons', title: 'Total Gallons', sortable: true },
              { key: 'avg_gallons', title: 'Avg Gallons', sortable: true },
              { key: 'unique_entities', title: 'Entities', sortable: true },
              { key: 'areas_served', title: 'Areas', sortable: true },
              { key: 'zones_served', title: 'Zones', sortable: true },
              { key: 'vehicles_used', title: 'Vehicles', sortable: true },
              { key: 'collections_per_vehicle', title: 'Collections/Vehicle', sortable: true },
              { key: 'market_share', title: 'Market Share (%)', sortable: true }
            ]}
            data={providerData}
            pagination={true}
            pageSize={15}
          />
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
                <p className="font-medium">Provider Network</p>
                <p>{providerData.length} active service providers operating with {Math.round(providerData.reduce((sum, p) => sum + p.market_share, 0))}% total market coverage. Combined collections: {providerData.reduce((sum, p) => sum + p.collection_count, 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">Performance Distribution</p>
                <p>Market leader: {providerData[0]?.service_provider} ({providerData[0]?.market_share}% share). Average efficiency: {Math.round(providerData.reduce((sum, p) => sum + p.avg_gallons, 0) / providerData.length)} gallons per collection.</p>
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
                  <p className="font-medium text-green-800">Market Leadership</p>
                  <p className="text-green-700">{providerData.filter(p => p.market_share > 10).length} providers show strong market dominance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Competition Analysis</p>
                  <p className="text-yellow-700">Healthy competition with {providerData.filter(p => p.market_share >= 5 && p.market_share <= 15).length} mid-tier providers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Growth Potential</p>
                  <p className="text-blue-700">Efficiency improvements could increase total market capture by 15-20%</p>
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
                  <p className="text-red-700">Review underperforming provider contracts and efficiency metrics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Analyze market share trends for strategic partnerships</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
                <div className="text-sm">
                  <p className="font-medium text-green-800">Low Priority</p>
                  <p className="text-green-700">Explore new provider onboarding for market expansion</p>
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
                  <p className="font-medium text-red-800">Provider Performance Review</p>
                  <p className="text-red-600">Due in 2 days</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Quarterly Performance Report</p>
                  <p className="text-orange-600">Due in 6 days</p>
                </div>
                <Button size="sm" variant="outline">
                  Prepare
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Contract Renewal Meeting</p>
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
              <h3 className="text-lg font-semibold">Provider Details</h3>
              <Button variant="ghost" size="sm" onClick={closeDrillDown}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900">{drillDownData.provider}</h4>
                <p className="text-sm text-blue-700">{drillDownData.marketShare}% Market Share</p>
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
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.avgGallons}</div>
                  <div className="text-sm text-gray-600">Avg/Collection</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.efficiency}</div>
                  <div className="text-sm text-gray-600">Efficiency Score</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  This provider handles {drillDownData.marketShare}% of total market operations with 
                  an average collection size of {drillDownData.avgGallons} gallons.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};