// components/dashboard/overview/ServiceProviderCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { ExpandIcon, TrendingUpIcon, CheckCircleIcon, AlertTriangleIcon, BarChart3Icon, TruckIcon, StarIcon } from 'lucide-react';
import { ServiceProviderChart } from '../charts/ServiceProviderChart';
import { useNavigate } from 'react-router-dom';

interface ServiceProviderCardProps {
  onExpand: (path: string) => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({ onExpand }) => {
  const [chartView, setChartView] = useState<'horizontal-bar' | 'performance-grid' | 'efficiency-line'>('horizontal-bar');
  const navigate = useNavigate();

  const providerData = [
    {
      provider: 'EcoWaste Dubai',
      collections: 4933,
      market_share: 32.1,
      total_gallons: 246650,
      efficiency_score: 96,
      avg_response_time: 1.2,
      service_areas: 18,
      rating: 4.8,
      vehicles: 12
    },
    {
      provider: 'CleanTech Services',
      collections: 3814,
      market_share: 24.8,
      total_gallons: 190700,
      efficiency_score: 92,
      avg_response_time: 1.5,
      service_areas: 15,
      rating: 4.6,
      vehicles: 10
    },
    {
      provider: 'GreenCycle Solutions',
      collections: 2769,
      market_share: 18.0,
      total_gallons: 138450,
      efficiency_score: 89,
      avg_response_time: 1.8,
      service_areas: 12,
      rating: 4.4,
      vehicles: 8
    },
    {
      provider: 'WasteAway Emirates',
      collections: 2000,
      market_share: 13.0,
      total_gallons: 100000,
      efficiency_score: 87,
      avg_response_time: 2.1,
      service_areas: 10,
      rating: 4.2,
      vehicles: 6
    },
    {
      provider: 'Dubai Environmental',
      collections: 1231,
      market_share: 8.0,
      total_gallons: 61550,
      efficiency_score: 85,
      avg_response_time: 2.4,
      service_areas: 8,
      rating: 4.1,
      vehicles: 5
    },
    {
      provider: 'Pure Waste Management',
      collections: 615,
      market_share: 4.0,
      total_gallons: 30750,
      efficiency_score: 83,
      avg_response_time: 2.8,
      service_areas: 5,
      rating: 3.9,
      vehicles: 3
    }
  ];

  const stats = {
    total: providerData.length,
    trend: 5.7,
    status: 'good',
    metric: 'Providers',
    avgEfficiency: Math.round(providerData.reduce((sum, p) => sum + p.efficiency_score, 0) / providerData.length),
    totalVehicles: providerData.reduce((sum, p) => sum + p.vehicles, 0),
    totalAreas: providerData.reduce((sum, p) => sum + p.service_areas, 0)
  };

  const theme = {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50/50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    accent: 'text-orange-600'
  };

  const handleProviderClick = (provider: any) => {
    console.log('Provider clicked:', provider);
    // You can add navigation or drill-down functionality here
  };

  const getChartTitle = () => {
    switch (chartView) {
      case 'performance-grid':
        return 'Live Performance Grid';
      case 'efficiency-line':
        return 'Efficiency Trends';
      default:
        return 'Collection Volume';
    }
  };

  const getSecondaryTitle = () => {
    switch (chartView) {
      case 'performance-grid':
        return 'Market Distribution';
      case 'efficiency-line':
        return 'Response Times';
      default:
        return 'Service Coverage';
    }
  };

  return (
    <Card className={`${theme.bg} ${theme.border} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 min-h-[550px]`}>
      <CardHeader className="relative pb-4">
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} rounded-t-3xl`}></div>
        
        <div className="flex items-start justify-between pt-2">
          <div className="flex-1">
            <CardTitle className={`text-xl font-bold ${theme.text} mb-2`}>
              Service Provider Performance
            </CardTitle>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Top Performers: EcoWaste Dubai (32.1%), CleanTech Services (24.8%)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExpand('/dashboard/providers');
            }}
            className="h-10 w-10 p-0 hover:bg-white/50"
          >
            <ExpandIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme.accent}`}>
              {stats.total}
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">
              {stats.metric}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold flex items-center justify-center text-green-600`}>
              <TrendingUpIcon className="h-4 w-4 mr-1" />
              {Math.abs(stats.trend)}%
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">
              Growth
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide mt-1">
              Status
            </div>
          </div>
        </div>

        {/* Chart View Selector */}
        <div className="flex items-center justify-center mt-4">
          <div className="flex bg-white/60 rounded-lg p-1 border border-white/40">
            <button
              onClick={() => setChartView('horizontal-bar')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                chartView === 'horizontal-bar' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setChartView('performance-grid')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                chartView === 'performance-grid' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setChartView('efficiency-line')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                chartView === 'efficiency-line' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Trends
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Chart */}
        <div className="bg-white/60 rounded-2xl p-4 border border-white/40">
          <h4 className={`text-sm font-semibold ${theme.text} mb-3`}>
            {getChartTitle()}
          </h4>
          <div className="h-48">
            <ServiceProviderChart
              data={providerData}
              height={192}
              chartType={chartView}
              color="orange"
              interactive={true}
              onProviderClick={handleProviderClick}
            />
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Avg Efficiency</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
                    style={{ width: `${stats.avgEfficiency}%` }}
                  ></div>
                </div>
                <span className={`font-medium ${theme.accent} text-xs`}>
                  {stats.avgEfficiency}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Fleet Size</span>
              <div className="flex items-center space-x-1">
                <TruckIcon className="h-3 w-3 text-orange-500" />
                <span className={`font-medium ${theme.accent}`}>{stats.totalVehicles} vehicles</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Coverage</span>
              <span className={`font-medium ${theme.accent}`}>{stats.totalAreas} areas</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Top Rating</span>
              <div className="flex items-center space-x-1">
                <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-yellow-600">4.8/5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
            <span className="text-sm font-medium text-orange-800">Service Provider Network</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            {providerData.length} active providers • 
            {stats.totalVehicles} vehicles deployed • 
            {stats.totalAreas} areas covered • 
            Avg efficiency: {stats.avgEfficiency}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceProviderCard;