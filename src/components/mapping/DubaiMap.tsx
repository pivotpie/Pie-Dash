// components/mapping/DubaiMap.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone, Area, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';
import { AnalyticsService } from '../../services/supabaseClient';

// Fix default markers issue in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DubaiMapProps {
  height?: string;
  showZones?: boolean;
  showAreas?: boolean;
  showVehicles?: boolean;
  showCollectionPoints?: boolean;
  selectedZone?: string;
  zones?: Zone[];
  areas?: Area[];
  vehicles?: VehicleLocation[];
  collectionPoints?: CollectionPoint[];
  onZoneClick?: (zone: Zone) => void;
  onVehicleClick?: (vehicle: VehicleLocation) => void;
  onCollectionPointClick?: (point: CollectionPoint) => void;
  children?: React.ReactNode;
}

// Component to fit map bounds to Dubai
const FitToDubai: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    const bounds = DubaiGeographyService.DUBAI_BOUNDS;
    map.fitBounds([
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    ]);
  }, [map]);
  
  return null;
};

// Custom icons for different markers
const createCustomIcon = (color: string, size: [number, number] = [25, 25]) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size[0]}px;
      height: ${size[1]}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
};

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

const createZoneMarker = (zoneName: string, zoneNumber: number) => {
  return L.divIcon({
    className: 'zone-marker',
    html: `<div style="
      background: linear-gradient(135deg, #3498db, #2980b9);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      position: relative;
    ">
      ${zoneNumber}
      <div style="
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
      ">${zoneName}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const DubaiMap: React.FC<DubaiMapProps> = ({
  height = '500px',
  showZones = true,
  showAreas = false,
  showVehicles = true,
  showCollectionPoints = true,
  selectedZone,
  zones = [],
  areas = [],
  vehicles = [],
  collectionPoints = [],
  onZoneClick,
  onVehicleClick,
  onCollectionPointClick,
  children
}) => {

  const getZonePolygonPositions = (zone: Zone): [number, number][] => {
    if (zone.boundary_coordinates && zone.boundary_coordinates.length > 0) {
      return zone.boundary_coordinates.map(coord => [coord[0], coord[1]]);
    }
    
    // Generate a simple rectangle around the zone center if no boundary data
    if (zone.latitude && zone.longitude) {
      const offset = 0.01; // Small offset for rectangle
      return [
        [zone.latitude - offset, zone.longitude - offset],
        [zone.latitude + offset, zone.longitude - offset],
        [zone.latitude + offset, zone.longitude + offset],
        [zone.latitude - offset, zone.longitude + offset],
      ];
    }
    
    return [];
  };

  return (
    <div style={{ height }} className="relative">
      <MapContainer
        center={DubaiGeographyService.DUBAI_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitToDubai />

        {/* Zone Boundaries */}
        {showZones && zones.map((zone) => {
          const positions = getZonePolygonPositions(zone);
          if (positions.length === 0) return null;

          const isSelected = selectedZone === zone.zone_name;
          
          return (
            <Polygon
              key={zone.zone_id}
              positions={positions}
              pathOptions={{
                color: zone.color || '#3498DB',
                weight: isSelected ? 4 : 2,
                opacity: isSelected ? 1 : 0.7,
                fillOpacity: isSelected ? 0.3 : 0.1,
              }}
              eventHandlers={{
                click: () => onZoneClick?.(zone)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{zone.zone_name}</h3>
                  <p className="text-sm text-gray-600">Zone ID: {zone.zone_id}</p>
                  {zone.latitude && zone.longitude && (
                    <p className="text-xs text-gray-500">
                      {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Zone Center Markers with Numbers */}
        {showZones && zones.map((zone, index) => {
          if (!zone.latitude || !zone.longitude) return null;
          
          return (
            <Marker
              key={`zone-marker-${zone.zone_id}`}
              position={[zone.latitude, zone.longitude]}
              icon={createZoneMarker(zone.zone_name, index + 1)}
              eventHandlers={{
                click: () => onZoneClick?.(zone)
              }}
            >
              <Popup>
                <div className="p-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    {zone.zone_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Zone ID: {zone.zone_id}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Coordinates: {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</p>
                    <p className="mt-1" style={{ color: zone.color }}>● Zone Color</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Area Boundaries (if enabled) */}
        {showAreas && areas.map((area) => {
          if (!area.latitude || !area.longitude) return null;
          
          return (
            <Marker
              key={area.area_id}
              position={[area.latitude, area.longitude]}
              icon={createCustomIcon(area.color || '#BDC3C7', [15, 15])}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold">{area.area_name}</h4>
                  <p className="text-sm text-gray-600">Area ID: {area.area_id}</p>
                  {area.zone_id && (
                    <p className="text-sm text-gray-600">Zone: {area.zone_id}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Vehicle Locations */}
        {showVehicles && vehicles.map((vehicle) => (
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
                <p className="text-xs text-gray-500">
                  Updated: {new Date(vehicle.last_updated).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Collection Points */}
        {showCollectionPoints && collectionPoints.map((point) => (
          <Marker
            key={point.entity_id}
            position={[point.latitude, point.longitude]}
            icon={createCustomIcon(DubaiGeographyService.getPriorityColor(point.priority), [20, 20])}
            eventHandlers={{
              click: () => onCollectionPointClick?.(point)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold">{point.outlet_name}</h4>
                <p className="text-sm text-gray-600">{point.category}</p>
                <p className="text-sm">
                  Priority: <span className={`font-semibold ${
                    point.priority === 'critical' ? 'text-red-600' :
                    point.priority === 'high' ? 'text-orange-600' :
                    point.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {point.priority.charAt(0).toUpperCase() + point.priority.slice(1)}
                  </span>
                </p>
                <p className="text-sm">Expected: {point.expected_gallons} gallons</p>
                {point.days_overdue > 0 && (
                  <p className="text-sm text-red-600">
                    Overdue: {point.days_overdue} days
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {point.area}, {point.zone}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render children (e.g., route visualizations) */}
        {children}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-bold text-sm mb-2">Legend</h4>
        
        {showVehicles && (
          <div className="mb-2">
            <div className="text-xs font-semibold mb-1">Vehicles:</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Active</span>
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Idle</span>
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Maintenance</span>
            </div>
          </div>
        )}
        
        {showCollectionPoints && (
          <div>
            <div className="text-xs font-semibold mb-1">Collection Points:</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};