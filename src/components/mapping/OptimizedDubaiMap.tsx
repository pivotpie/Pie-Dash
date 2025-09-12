// components/mapping/OptimizedDubaiMap.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Zone, Area, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OptimizedDubaiMapProps {
  height?: string;
  showZones?: boolean;
  showVehicles?: boolean;
  showCollectionPoints?: boolean;
  selectedZone?: string;
  zones?: Zone[];
  vehicles?: VehicleLocation[];
  collectionPoints?: CollectionPoint[];
  onZoneClick?: (zone: Zone) => void;
  onVehicleClick?: (vehicle: VehicleLocation) => void;
  onCollectionPointClick?: (point: CollectionPoint) => void;
  children?: React.ReactNode;
  maxCollectionPoints?: number;
}

const FitToDubai: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    const dubaiBounds = L.latLngBounds(
      [24.8, 54.9], // Southwest
      [25.4, 55.6]  // Northeast
    );
    map.fitBounds(dubaiBounds);
  }, [map]);

  return null;
};

const createCustomIcon = (color: string, size: [number, number] = [25, 25]) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${size[0]}px; height: ${size[1]}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
};

const createZoneMarker = (zoneName: string, zoneNumber: number) => {
  return L.divIcon({
    className: 'zone-marker',
    html: `<div style="background: linear-gradient(135deg, #3498db, #2980b9); width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; position: relative;">
      ${zoneNumber}
      <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;">${zoneName}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const OptimizedDubaiMap: React.FC<OptimizedDubaiMapProps> = ({
  height = '500px',
  showZones = true,
  showVehicles = true,
  showCollectionPoints = true,
  selectedZone,
  zones = [],
  vehicles = [],
  collectionPoints = [],
  onZoneClick,
  onVehicleClick,
  onCollectionPointClick,
  children,
  maxCollectionPoints = 1000
}) => {

  // Performance optimization: Filter and limit data
  const filteredData = useMemo(() => {
    let filteredVehicles = vehicles;
    let filteredCollectionPoints = collectionPoints;

    // Filter by selected zone
    if (selectedZone) {
      filteredVehicles = vehicles.filter(v => v.assigned_zone === selectedZone);
      filteredCollectionPoints = collectionPoints.filter(p => p.zone === selectedZone);
    }

    // Limit collection points for performance
    if (filteredCollectionPoints.length > maxCollectionPoints) {
      // Prioritize critical and high priority points
      const criticalPoints = filteredCollectionPoints.filter(p => p.priority === 'critical');
      const highPoints = filteredCollectionPoints.filter(p => p.priority === 'high');
      const mediumPoints = filteredCollectionPoints.filter(p => p.priority === 'medium');
      const lowPoints = filteredCollectionPoints.filter(p => p.priority === 'low');

      const remaining = maxCollectionPoints - criticalPoints.length - highPoints.length;
      const mediumToShow = Math.min(mediumPoints.length, Math.floor(remaining * 0.6));
      const lowToShow = Math.min(lowPoints.length, remaining - mediumToShow);

      filteredCollectionPoints = [
        ...criticalPoints,
        ...highPoints,
        ...mediumPoints.slice(0, mediumToShow),
        ...lowPoints.slice(0, lowToShow)
      ];
    }

    return { filteredVehicles, filteredCollectionPoints };
  }, [vehicles, collectionPoints, selectedZone, maxCollectionPoints]);

  // Zone centers with markers
  const zoneMarkers = useMemo(() => {
    const dubaiZones = DubaiGeographyService.getDubaiZones();
    return dubaiZones.map((zone, index) => ({
      position: zone.coordinates as [number, number],
      name: zone.name,
      number: index + 1,
      zone: {
        zone_id: `zone-${index + 1}`,
        zone_name: zone.name,
        latitude: zone.coordinates[0],
        longitude: zone.coordinates[1],
        boundary_coordinates: zone.boundaries,
        color: zone.color,
        created_at: new Date().toISOString()
      }
    }));
  }, []);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={[25.2048, 55.2708]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        preferCanvas={true} // Use canvas rendering for better performance
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
          minZoom={9}
          updateWhenIdle={true} // Only update when map is idle
          updateWhenZooming={false} // Don't update while zooming
        />
        
        <FitToDubai />

        {/* Zone Markers */}
        {showZones && zoneMarkers.map((zoneMarker) => (
          <Marker
            key={`zone-${zoneMarker.number}`}
            position={zoneMarker.position}
            icon={createZoneMarker(zoneMarker.name, zoneMarker.number)}
            eventHandlers={{
              click: () => onZoneClick?.(zoneMarker.zone)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold">{zoneMarker.name}</h4>
                <p className="text-sm text-gray-600">Zone {zoneMarker.number}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicles */}
        {showVehicles && filteredData.filteredVehicles.slice(0, 50).map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createCustomIcon('#2196F3', [25, 25])}
            eventHandlers={{
              click: () => onVehicleClick?.(vehicle)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold">Vehicle {vehicle.vehicle_id}</h4>
                <p className="text-sm text-gray-600">{vehicle.driver_name}</p>
                <p className="text-sm">Status: <span className={`font-semibold ${
                  vehicle.status === 'active' ? 'text-green-600' :
                  vehicle.status === 'idle' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                </span></p>
                <p className="text-sm">Zone: {vehicle.assigned_zone}</p>
                <p className="text-xs text-gray-500">
                  Last updated: {vehicle.last_updated ? new Date(vehicle.last_updated).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Collection Points */}
        {showCollectionPoints && filteredData.filteredCollectionPoints.map((point) => (
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
      
      {/* Performance Info */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg z-[1000] text-xs">
        <div>Collection Points: {filteredData.filteredCollectionPoints.length} / {collectionPoints.length}</div>
        <div>Vehicles: {Math.min(50, filteredData.filteredVehicles.length)} / {filteredData.filteredVehicles.length}</div>
        {selectedZone && <div>Zone: {selectedZone}</div>}
        <div className="text-green-600 font-semibold">✓ Optimized View</div>
      </div>
    </div>
  );
};