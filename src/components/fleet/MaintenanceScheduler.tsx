// components/fleet/MaintenanceScheduler.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangleIcon, CalendarIcon, WrenchIcon } from 'lucide-react';
import { VehiclePerformance } from '../../services/fleetService';

interface MaintenanceSchedulerProps {
  vehicles: VehiclePerformance[];
}

export const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({ vehicles }) => {
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const scheduleMaintenance = () => {
    // Implementation for scheduling maintenance
    console.log('Scheduling maintenance for vehicles:', selectedVehicles);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <WrenchIcon className="mr-2 h-5 w-5" />
            Maintenance Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Vehicles Requiring Maintenance</h4>
                <p className="text-sm text-gray-500">
                  {vehicles.length} vehicles need scheduled maintenance
                </p>
              </div>
              <Button 
                onClick={scheduleMaintenance}
                disabled={selectedVehicles.length === 0}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Selected
              </Button>
            </div>

            <div className="grid gap-4">
              {vehicles.map(vehicle => (
                <div key={vehicle.vehicle_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle.vehicle_id)}
                        onChange={() => handleVehicleSelect(vehicle.vehicle_id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div>
                        <div className="font-medium">Vehicle {vehicle.vehicle_id}</div>
                        <div className="text-sm text-gray-500">
                          Provider: {vehicle.assigned_provider}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <div className="text-gray-500">Collections</div>
                        <div className="font-medium">{vehicle.total_collections}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">Utilization</div>
                        <div className="font-medium">{(vehicle.utilization_rate * 100).toFixed(1)}%</div>
                      </div>
                      <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    Last service: {new Date(vehicle.last_service_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};