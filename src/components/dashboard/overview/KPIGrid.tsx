// components/dashboard/overview/KPIGrid.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface KPIData {
  totalGallons: number;
  uniqueLocations: number;
  uniqueVehicles: number;
  uniqueProviders: number;
  avgDailyGallons: number;
  avgCollectionSize: number;
  totalCollections: number;
  uniqueAreas: number;
  uniqueZones: number;
  uniqueCategories: number;
  dateRange: {
    start: string;
    end: string;
    duration_days: number;
  };
}

interface KPIGridProps {
  data: KPIData;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ data }) => {
  const kpis = [
    {
      title: 'Total Volume Collected',
      value: `${(data.totalGallons / 1000000).toFixed(1)}M`,
      subtitle: 'gallons (Q1 2023)',
      change: data.dateRange.duration_days ? `${data.dateRange.duration_days} days` : 'Q1 2023',
      trend: 'info',
      color: 'blue'
    },
    {
      title: 'Total Collections',
      value: data.totalCollections.toLocaleString(),
      subtitle: 'service completions',
      change: `${data.uniqueAreas} areas`,
      trend: 'info',
      color: 'green'
    },
    {
      title: 'Service Locations',
      value: data.uniqueLocations.toLocaleString(),
      subtitle: 'unique entities',
      change: `${data.uniqueCategories} categories`,
      trend: 'info',
      color: 'purple'
    },
    {
      title: 'Fleet Operations',
      value: data.uniqueVehicles.toString(),
      subtitle: 'active vehicles',
      change: `${data.uniqueZones} zones`,
      trend: 'info',
      color: 'orange'
    },
    {
      title: 'Service Network',
      value: data.uniqueProviders.toString(),
      subtitle: 'active providers',
      change: 'Full coverage',
      trend: 'info',
      color: 'teal'
    },
    {
      title: 'Average Collection',
      value: `${data.avgCollectionSize.toFixed(1)}`,
      subtitle: 'gallons per service',
      change: `${data.avgDailyGallons.toLocaleString()}/day`,
      trend: 'info',
      color: 'indigo'
    }
  ];

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'border-l-blue-500';
      case 'green': return 'border-l-green-500';
      case 'purple': return 'border-l-purple-500';
      case 'orange': return 'border-l-orange-500';
      case 'teal': return 'border-l-teal-500';
      case 'indigo': return 'border-l-indigo-500';
      case 'red': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {kpis.map((kpi, index) => (
        <Card key={index} className={`bg-white border-l-4 ${getBorderColor(kpi.color)}`}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-sm font-medium text-gray-500">{kpi.title}</div>
            <div className="text-xs text-gray-400">{kpi.subtitle}</div>
            <div className={`text-xs font-medium mt-1 ${
              kpi.trend === 'up' ? 'text-green-600' : 
              kpi.trend === 'down' ? 'text-red-600' : 
              kpi.trend === 'info' ? 'text-blue-600' :
              'text-gray-500'
            }`}>
              {kpi.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};