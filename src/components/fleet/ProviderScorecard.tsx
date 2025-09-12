// components/fleet/ProviderScorecard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Chart } from '../ui/Chart';
import { DataTable } from '../ui/DataTable';
import { ProviderMetrics } from '../../services/fleetService';

interface ProviderScorecardProps {
  providers: ProviderMetrics[];
}

export const ProviderScorecard: React.FC<ProviderScorecardProps> = ({ providers }) => {
  const chartData = providers.map(provider => ({
    name: provider.provider_name.replace('Service Provider ', 'SP-'),
    quality: provider.service_quality_score,
    collections: provider.total_collections,
    efficiency: provider.avg_efficiency
  }));

  const columns = [
    { key: 'provider_name', title: 'Provider', sortable: true },
    { key: 'vehicle_count', title: 'Vehicles', sortable: true },
    { key: 'total_collections', title: 'Collections', sortable: true },
    { key: 'total_gallons', title: 'Total Gallons', sortable: true },
    { key: 'avg_efficiency', title: 'Avg Efficiency', sortable: true },
    { 
      key: 'service_quality_score', 
      title: 'Quality Score', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value >= 80 ? 'bg-green-100 text-green-800' :
          value >= 60 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'delay_rate', title: 'Delay Rate %', sortable: true, render: (value: number) => `${value.toFixed(1)}%` }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Quality Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart
            data={chartData}
            type="bar"
            xKey="name"
            yKey="quality"
            height={300}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={providers}
            columns={columns}
            pagination={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};