// components/mapping/VehicleMarkers.tsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VehicleLocation } from '../../types/database.types';

interface VehicleMarkersProps {
  vehicles: VehicleLocation[];
  onVehicleClick?: (vehicle: VehicleLocation) => void;
}

const createVehicleIcon = (status: string) => {
  const colors = {
    active: '#27AE60',
    idle: '#F39C12',
    maintenance: '#E74C3C'
  };
  
  return L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="
      background-color: ${colors[status as keyof typeof colors] || '#95A5A6'};
      width: 30px;
      height: 30px;
      border-radius: 4px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">🚛</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export const VehicleMarkers: React.FC<VehicleMarkersProps> = ({
  vehicles,
  onVehicleClick
}) => {
  return (
    <>
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.vehicle_id}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={createVehicleIcon(vehicle.status)}
          eventHandlers={{
            click: () => onVehicleClick?.(vehicle)
          }}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold">Vehicle {vehicle.vehicle_id}</h4>
              <p className="text-sm">
                Status: <span className={`font-semibold ${
                  vehicle.status === 'active' ? 'text-green-600' :
                  vehicle.status === 'idle' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                </span>
              </p>
              {vehicle.assigned_zone && (
                <p className="text-sm text-gray-600">Zone: {vehicle.assigned_zone}</p>
              )}
              {vehicle.assigned_area && (
                <p className="text-sm text-gray-600">Area: {vehicle.assigned_area}</p>
              )}
              <p className="text-xs text-gray-500">
                Updated: {new Date(vehicle.last_updated).toLocaleTimeString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};