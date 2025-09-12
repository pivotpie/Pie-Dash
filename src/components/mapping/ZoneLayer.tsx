// components/mapping/ZoneLayer.tsx
import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { Zone } from '../../types/database.types';

interface ZoneLayerProps {
  zones: Zone[];
  selectedZone?: string;
  onZoneClick?: (zone: Zone) => void;
}

export const ZoneLayer: React.FC<ZoneLayerProps> = ({
  zones,
  selectedZone,
  onZoneClick
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
    <>
      {zones.map((zone) => {
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
    </>
  );
};