// components/fleet/VehiclePerformanceChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Chart } from '../ui/Chart';
import { DataTable } from '../ui/DataTable';
import { VehiclePerformance } from '../../services/fleetService';

interface VehiclePerformanceChartProps {
  vehicles: VehiclePerformance[];
}

export const VehiclePerformanceChart: React.FC<VehiclePerformanceChartProps> = ({ vehicles }) => {
  const chartData = vehicles.slice(0, 20).map(vehicle => ({
    vehicle: `V-${vehicle.vehicle_id}`,
    efficiency: vehicle.efficiency_score,
    utilization: vehicle.utilization_rate * 100,
    collections: vehicle.total_collections
  }));

  const columns = [
    { key: 'vehicle_id', title: 'Vehicle ID', sortable: true },
    { key: 'total_collections', title: 'Collections', sortable: true },
    { key: 'total_gallons', title: 'Total Gallons', sortable: true },
    { key: 'efficiency_score', title: 'Efficiency', sortable: true },
    { key: 'utilization_rate', title: 'Utilization %', sortable: true, render: (value: number) => `${(value * 100).toFixed(1)}%` },
    { key: 'assigned_provider', title: 'Provider', sortable: true },
    { 
      key: 'maintenance_due', 
      title: 'Maintenance', 
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Due' : 'OK'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Efficiency vs Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              data={chartData}
              type="bar"
              xKey="vehicle"
              yKey="efficiency"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Volume Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              data={chartData}
              type="bar"
              xKey="vehicle"
              yKey="collections"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vehicles}
            columns={columns}
            pagination={true}
            pageSize={15}
          />
        </CardContent>
      </Card>
    </div>
  );
};