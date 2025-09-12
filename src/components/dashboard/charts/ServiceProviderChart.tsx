// components/dashboard/charts/ServiceProviderChart.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { TrendingUpIcon, TruckIcon, MapPinIcon, ClockIcon, StarIcon, ChevronRightIcon } from 'lucide-react';

interface ServiceProviderData {
  provider: string;
  collections: number;
  market_share: number;
  total_gallons: number;
  efficiency_score: number;
  avg_response_time: number;
  service_areas: number;
  rating: number;
  vehicles: number;
}

interface ServiceProviderChartProps {
  data?: ServiceProviderData[];
  height?: number;
  showDetails?: boolean;
  chartType?: 'horizontal-bar' | 'performance-grid' | 'efficiency-line';
  color?: string;
  interactive?: boolean;
  onProviderClick?: (provider: ServiceProviderData) => void;
}

const mockProviderData: ServiceProviderData[] = [
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

export const ServiceProviderChart: React.FC<ServiceProviderChartProps> = ({
  data = mockProviderData,
  height = 300,
  showDetails = false,
  chartType = 'horizontal-bar',
  color = 'orange',
  interactive = true,
  onProviderClick
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [animationIndex, setAnimationIndex] = useState(0);

  useEffect(() => {
    if (chartType === 'performance-grid') {
      const timer = setInterval(() => {
        setAnimationIndex(prev => (prev + 1) % data.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [chartType, data.length]);

  const colorSchemes = {
    orange: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      gradient: 'from-orange-500 to-amber-500',
      light: '#fef3c7',
      dark: '#d97706',
      bg: 'bg-orange-50'
    },
    blue: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      gradient: 'from-blue-500 to-cyan-500',
      light: '#dbeafe',
      dark: '#1e40af',
      bg: 'bg-blue-50'
    },
    green: {
      primary: '#10b981',
      secondary: '#34d399',
      gradient: 'from-green-500 to-emerald-500',
      light: '#d1fae5',
      dark: '#047857',
      bg: 'bg-green-50'
    }
  };

  const theme = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.orange;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 95) return 'text-green-600 bg-green-100';
    if (score >= 90) return 'text-blue-600 bg-blue-100';
    if (score >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-3 w-3 fill-yellow-200 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-3 w-3 text-gray-300" />);
    }
    
    return stars;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-64">
          <h4 className="font-bold text-gray-800 mb-2">{data.provider}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Collections:</span>
              <span className="font-medium">{data.collections.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Share:</span>
              <span className="font-medium">{data.market_share}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efficiency:</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${getEfficiencyColor(data.efficiency_score)}`}>
                {data.efficiency_score}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{data.avg_response_time}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rating:</span>
              <div className="flex items-center space-x-1">
                {renderRatingStars(data.rating)}
                <span className="text-xs text-gray-500 ml-1">{data.rating}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleProviderClick = (provider: ServiceProviderData) => {
    setSelectedProvider(provider.provider);
    onProviderClick?.(provider);
  };

  if (chartType === 'performance-grid') {
    return (
      <div className="space-y-4" style={{ height }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Service Provider Performance</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Performance</span>
          </div>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-hidden">
          {data.slice(0, 6).map((provider, index) => (
            <div
              key={provider.provider}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-500 cursor-pointer
                ${selectedProvider === provider.provider 
                  ? 'border-orange-400 bg-orange-50 shadow-lg scale-105' 
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                }
                ${animationIndex === index ? 'ring-2 ring-orange-400 ring-opacity-50' : ''}
              `}
              onClick={() => handleProviderClick(provider)}
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.gradient}`}></div>
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                    {provider.provider.length > 16 ? provider.provider.substring(0, 16) + '...' : provider.provider}
                  </h4>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-gray-800">{formatNumber(provider.collections)}</div>
                  <div className="text-gray-500">Collections</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-xs px-2 py-1 rounded ${getEfficiencyColor(provider.efficiency_score)}`}>
                    {provider.efficiency_score}%
                  </div>
                  <div className="text-gray-500">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-800">{provider.market_share}%</div>
                  <div className="text-gray-500">Market</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {renderRatingStars(provider.rating).slice(0, 3)}
                  </div>
                  <div className="text-gray-500">{provider.rating}</div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <TruckIcon className="h-3 w-3" />
                  <span>{provider.vehicles}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{provider.service_areas}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{provider.avg_response_time}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chartType === 'efficiency-line') {
    const lineData = data.map(provider => ({
      name: provider.provider.split(' ')[0], // Short name
      efficiency: provider.efficiency_score,
      collections: provider.collections,
      response_time: provider.avg_response_time
    }));

    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              domain={[80, 100]}
            />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke={theme.primary}
              strokeWidth={3}
              dot={{ fill: theme.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: theme.dark, strokeWidth: 2 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default horizontal bar chart with enhanced styling
  const chartData = data.map(provider => ({
    ...provider,
    area: provider.provider, // For compatibility with existing chart system
    collection_count: provider.collections
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            tick={{ fontSize: 10 }}
            tickFormatter={formatNumber}
          />
          <YAxis 
            type="category"
            dataKey="provider" 
            tick={{ fontSize: 9 }}
            width={115}
            tickFormatter={(value) => {
              if (value && value.length > 14) {
                return value.substring(0, 14) + '...';
              }
              return value;
            }}
          />
          <Bar 
            dataKey="collections" 
            radius={[0, 4, 4, 0]}
            onClick={interactive ? (data) => handleProviderClick(data) : undefined}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={selectedProvider === entry.provider ? theme.dark : theme.primary}
                stroke={selectedProvider === entry.provider ? theme.dark : 'none'}
                strokeWidth={selectedProvider === entry.provider ? 2 : 0}
              />
            ))}
          </Bar>
          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ServiceProviderChart;