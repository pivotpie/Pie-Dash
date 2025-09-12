// components/dashboard/detailed/VolumeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, BarChart3Icon, InfoIcon, TrendingUpIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon } from 'lucide-react';
import { InteractiveChart } from '../components/InteractiveChart';
import { DataTable } from '../../ui/DataTable';
import { AnalyticsService } from '../../../services/supabaseClient';

interface DashboardVolume {
  gallons_collected: number;
  volume_range: string;
  frequency: number;
  percentage: number;
  total_gallons: number;
  avg_gallons: number;
}

interface VolumeDashboardProps {
  onBack: () => void;
}

export const VolumeDashboard: React.FC<VolumeDashboardProps> = ({ onBack }) => {
  const [volumeData, setVolumeData] = useState<DashboardVolume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AnalyticsService.getVolumeData();
      setVolumeData(data);
    } catch (error) {
      console.error('Error loading volume data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = volumeData.map(item => ({
    volume: item.volume_range,
    frequency: item.frequency,
    percentage: item.percentage,
    total_gallons: item.total_gallons,
    avg_gallons: item.avg_gallons
  }));

  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleDrillDown = (item: any) => {
    const volumeDetails = {
      volume: item.volume || item.name,
      frequency: item.frequency,
      percentage: item.percentage,
      locations: item.locations,
      relatedData: volumeData.filter(v => v.gallons_collected === parseInt(item.volume?.replace(' gal', '') || '0'))
    };
    setDrillDownData(volumeDetails);
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
        </div>
      </div>

      {/* 70/30 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveChart
              title="Collection Volume Distribution"
              type="bar"
              data={chartData}
              xKey="volume"
              yKey="frequency"
              height={350}
              onDrillDown={handleDrillDown}
            />
            
            <InteractiveChart
              title="Volume vs Locations"
              type="line"
              data={chartData}
              xKey="volume"
              yKey="locations"
              height={350}
              onDrillDown={handleDrillDown}
            />
          </div>

          <DataTable
            title="Volume Analysis Details"
            columns={[
              { key: 'volume_range', title: 'Volume Range', sortable: true },
              { key: 'frequency', title: 'Collections', sortable: true },
              { key: 'percentage', title: 'Percentage (%)', sortable: true },
              { key: 'total_gallons', title: 'Total Gallons', sortable: true },
              { key: 'avg_gallons', title: 'Avg per Collection', sortable: true }
            ]}
            data={volumeData}
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
                <p className="font-medium">Volume Distribution</p>
                <p>Processing {volumeData.reduce((sum, item) => sum + item.frequency, 0).toLocaleString()} total collections across {volumeData.reduce((sum, item) => sum + item.unique_locations, 0)} service locations with an average volume per collection of {Math.round(volumeData.reduce((sum, item) => sum + item.gallons_collected * item.frequency, 0) / volumeData.reduce((sum, item) => sum + item.frequency, 0))} gallons.</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">Efficiency Metrics</p>
                <p>Peak collection volume: {Math.max(...volumeData.map(item => item.gallons_collected))} gallons. Total throughput: {Math.round(volumeData.reduce((sum, item) => sum + item.gallons_collected * item.frequency, 0) / 1000)}K gallons processed.</p>
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
                  <p className="font-medium text-green-800">High-Volume Collections</p>
                  <p className="text-green-700">{volumeData.filter(item => item.gallons_collected > 50).length} volume ranges show optimal collection efficiency</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Volume Optimization</p>
                  <p className="text-yellow-700">Focus on high-frequency volumes ({volumeData.slice(0, 3).map(v => v.gallons_collected).join(', ')} gal ranges) for maximum efficiency</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Capacity Planning</p>
                  <p className="text-blue-700">Current capacity utilization indicates potential for {Math.ceil(volumeData.length * 0.2)} additional volume tiers</p>
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
                  <p className="text-red-700">Optimize collection routes for high-volume ranges</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Analyze low-frequency volume patterns for consolidation opportunities</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
                <div className="text-sm">
                  <p className="font-medium text-green-800">Low Priority</p>
                  <p className="text-green-700">Review capacity planning for seasonal volume variations</p>
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
                  <p className="font-medium text-red-800">Volume Analysis Report</p>
                  <p className="text-red-600">Due in 1 day</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Capacity Planning Review</p>
                  <p className="text-orange-600">Due in 4 days</p>
                </div>
                <Button size="sm" variant="outline">
                  Prepare
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Volume Optimization Workshop</p>
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Volume Details: {drillDownData.volume}</h3>
              <Button variant="ghost" size="sm" onClick={closeDrillDown}>×</Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium">{drillDownData.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Percentage:</span>
                <span className="font-medium">{drillDownData.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Locations:</span>
                <span className="font-medium">{drillDownData.locations}</span>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  This volume range represents {drillDownData.percentage}% of total collections 
                  across {drillDownData.locations} service locations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};