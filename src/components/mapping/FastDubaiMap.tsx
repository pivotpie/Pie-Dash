// components/mapping/FastDubaiMap.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { CachedTileLayer } from './CachedTileLayer';
import L from 'leaflet';
import { Zone, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FastDubaiMapProps {
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
  maxMarkers?: number;
}

const FitToDubai: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    const dubaiBounds = L.latLngBounds([24.8, 54.9], [25.4, 55.6]);
    map.fitBounds(dubaiBounds);
    
    // Set performance options
    map.options.zoomAnimation = true;
    map.options.fadeAnimation = true;
    map.options.markerZoomAnimation = true;
  }, [map]);

  return null;
};

// Memoized marker components for better performance
const VehicleMarker = React.memo<{
  vehicle: VehicleLocation;
  onClick: (vehicle: VehicleLocation) => void;
}>(({ vehicle, onClick }) => {
  const icon = useMemo(() => L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="background: #2196F3; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${vehicle.vehicle_id}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), [vehicle.vehicle_id]);

  const handleClick = useCallback(() => onClick(vehicle), [vehicle, onClick]);

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="p-2">
          <h4 className="font-bold">Vehicle {vehicle.vehicle_id}</h4>
          <p className="text-sm text-gray-600">{vehicle.driver_name}</p>
          <p className="text-sm">Status: <span className={`font-semibold ${
            vehicle.status === 'active' ? 'text-green-600' :
            vehicle.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
          </span></p>
          <p className="text-sm">Zone: {vehicle.assigned_zone}</p>
        </div>
      </Popup>
    </Marker>
  );
});

const CollectionPointMarker = React.memo<{
  point: CollectionPoint;
  onClick: (point: CollectionPoint) => void;
}>(({ point, onClick }) => {
  const icon = useMemo(() => {
    const color = DubaiGeographyService.getPriorityColor(point.priority);
    return L.divIcon({
      className: 'collection-marker',
      html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }, [point.priority]);

  const handleClick = useCallback(() => onClick(point), [point, onClick]);

  return (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="p-2">
          <h4 className="font-bold text-sm">{point.outlet_name}</h4>
          <p className="text-xs text-gray-600">{point.category}</p>
          <p className="text-xs">Priority: <span className={`font-semibold ${
            point.priority === 'critical' ? 'text-red-600' :
            point.priority === 'high' ? 'text-orange-600' :
            point.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {point.priority}
          </span></p>
          <p className="text-xs">{point.expected_gallons} gallons</p>
          <p className="text-xs text-gray-500">{point.area}</p>
        </div>
      </Popup>
    </Marker>
  );
});

const ZoneMarker = React.memo<{
  zoneData: { position: [number, number]; name: string; number: number; zone: Zone };
  onClick: (zone: Zone) => void;
}>(({ zoneData, onClick }) => {
  const icon = useMemo(() => L.divIcon({
    className: 'zone-marker',
    html: `<div style="background: linear-gradient(135deg, #3498db, #2980b9); width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${zoneData.number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }), [zoneData.number]);

  const handleClick = useCallback(() => onClick(zoneData.zone), [zoneData.zone, onClick]);

  return (
    <Marker
      position={zoneData.position}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="p-2">
          <h4 className="font-bold">{zoneData.name}</h4>
          <p className="text-sm text-gray-600">Zone {zoneData.number}</p>
        </div>
      </Popup>
    </Marker>
  );
});

export const FastDubaiMap: React.FC<FastDubaiMapProps> = ({
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
  maxMarkers = 200
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Optimized data filtering with viewport awareness
  const optimizedData = useMemo(() => {
    let filteredVehicles = vehicles;
    let filteredCollectionPoints = collectionPoints;

    // Filter by selected zone
    if (selectedZone) {
      filteredVehicles = vehicles.filter(v => v.assigned_zone === selectedZone);
      filteredCollectionPoints = collectionPoints.filter(p => p.zone === selectedZone);
    }

    // Limit vehicles for performance
    filteredVehicles = filteredVehicles.slice(0, 25);

    // Smart collection point filtering
    if (filteredCollectionPoints.length > maxMarkers) {
      // Prioritize by urgency and spread geographically
      const critical = filteredCollectionPoints.filter(p => p.priority === 'critical');
      const high = filteredCollectionPoints.filter(p => p.priority === 'high');
      const medium = filteredCollectionPoints.filter(p => p.priority === 'medium');
      const low = filteredCollectionPoints.filter(p => p.priority === 'low');

      const maxCritical = Math.min(critical.length, Math.floor(maxMarkers * 0.4));
      const maxHigh = Math.min(high.length, Math.floor(maxMarkers * 0.3));
      const maxMedium = Math.min(medium.length, Math.floor(maxMarkers * 0.2));
      const maxLow = Math.min(low.length, Math.floor(maxMarkers * 0.1));

      filteredCollectionPoints = [
        ...critical.slice(0, maxCritical),
        ...high.slice(0, maxHigh),
        ...medium.slice(0, maxMedium),
        ...low.slice(0, maxLow)
      ];
    }

    return { filteredVehicles, filteredCollectionPoints };
  }, [vehicles, collectionPoints, selectedZone, maxMarkers]);

  // Zone markers data
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

  // Memoized callback handlers
  const handleVehicleClick = useCallback((vehicle: VehicleLocation) => {
    onVehicleClick?.(vehicle);
  }, [onVehicleClick]);

  const handleCollectionPointClick = useCallback((point: CollectionPoint) => {
    onCollectionPointClick?.(point);
  }, [onCollectionPointClick]);

  const handleZoneClick = useCallback((zone: Zone) => {
    onZoneClick?.(zone);
  }, [onZoneClick]);

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
        preferCanvas={true}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        ref={mapRef}
        attributionControl={false} // Remove attribution for cleaner look
      >
        <CachedTileLayer />
        <FitToDubai />

        {/* Zone Markers */}
        {showZones && zoneMarkers.map((zoneMarker) => (
          <ZoneMarker
            key={`zone-${zoneMarker.number}`}
            zoneData={zoneMarker}
            onClick={handleZoneClick}
          />
        ))}

        {/* Vehicles */}
        {showVehicles && optimizedData.filteredVehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.vehicle_id}
            vehicle={vehicle}
            onClick={handleVehicleClick}
          />
        ))}

        {/* Collection Points */}
        {showCollectionPoints && optimizedData.filteredCollectionPoints.map((point) => (
          <CollectionPointMarker
            key={point.entity_id}
            point={point}
            onClick={handleCollectionPointClick}
          />
        ))}

        {/* Render children (e.g., route visualizations) */}
        {children}
      </MapContainer>
      
      {/* Performance Info */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
        <div>📍 Points: {optimizedData.filteredCollectionPoints.length}</div>
        <div>🚛 Vehicles: {optimizedData.filteredVehicles.length}</div>
        {selectedZone && <div>📍 Zone: {selectedZone}</div>}
        <div className="text-green-400">⚡ Fast Mode</div>
      </div>

      {/* Quick zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.setZoom(11)}
          className="bg-white shadow-lg p-2 rounded text-xs font-bold hover:bg-gray-100"
        >
          Dubai
        </button>
        <button
          onClick={() => mapRef.current?.setZoom(13)}
          className="bg-white shadow-lg p-2 rounded text-xs font-bold hover:bg-gray-100"
        >
          Areas
        </button>
        <button
          onClick={() => mapRef.current?.setZoom(15)}
          className="bg-white shadow-lg p-2 rounded text-xs font-bold hover:bg-gray-100"
        >
          Streets
        </button>
      </div>
    </div>
  );
};