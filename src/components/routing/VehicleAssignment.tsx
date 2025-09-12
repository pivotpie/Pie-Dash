// components/routing/VehicleAssignment.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../ui/DataTable';
import { OptimizedRoute } from '../../services/routingService';

interface VehicleAssignmentProps {
  routes: OptimizedRoute[];
}

export const VehicleAssignment: React.FC<VehicleAssignmentProps> = ({ routes }) => {
  const assignmentData = routes.map(route => ({
    vehicle_id: route.vehicle_id,
    stops: route.points.length,
    distance: `${route.total_distance.toFixed(1)} km`,
    time: `${route.total_time.toFixed(1)} hrs`,
    gallons: route.total_gallons,
    efficiency: route.efficiency_score.toFixed(1),
    status: route.points.length > 0 ? 'Assigned' : 'Available'
  }));

  const columns = [
    { key: 'vehicle_id', title: 'Vehicle', sortable: true },
    { key: 'stops', title: 'Stops', sortable: true },
    { key: 'distance', title: 'Distance', sortable: true },
    { key: 'time', title: 'Time', sortable: true },
    { key: 'gallons', title: 'Gallons', sortable: true },
    { key: 'efficiency', title: 'Efficiency', sortable: true },
    { 
      key: 'status', 
      title: 'Status', 
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Assigned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={assignmentData}
          columns={columns}
          pagination={false}
          searchable={false}
        />
      </CardContent>
    </Card>
  );
};