// components/mapping/CollectionPoints.tsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CollectionPoint } from '../../types/database.types';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';

interface CollectionPointsProps {
  points: CollectionPoint[];
  onPointClick?: (point: CollectionPoint) => void;
}

const createCollectionPointIcon = (priority: string, size: [number, number] = [20, 20]) => {
  const color = DubaiGeographyService.getPriorityColor(priority);
  
  return L.divIcon({
    className: 'collection-point-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size[0]}px;
      height: ${size[1]}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
    ">
      ${priority === 'critical' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #fff; border-radius: 50%; animation: pulse 1s infinite;"></div>' : ''}
    </div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
};

export const CollectionPoints: React.FC<CollectionPointsProps> = ({
  points,
  onPointClick
}) => {
  return (
    <>
      {points.map((point) => (
        <Marker
          key={point.entity_id}
          position={[point.latitude, point.longitude]}
          icon={createCollectionPointIcon(point.priority)}
          eventHandlers={{
            click: () => onPointClick?.(point)
          }}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold">{point.outlet_name}</h4>
              <p className="text-sm text-gray-600">{point.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">Priority:</span>
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                  point.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  point.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {point.priority.charAt(0).toUpperCase() + point.priority.slice(1)}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm">Expected: <span className="font-semibold">{point.expected_gallons} gallons</span></p>
                {point.days_overdue > 0 && (
                  <p className="text-sm text-red-600 font-semibold">
                    Overdue: {point.days_overdue} days
                  </p>
                )}
                {point.last_collection && (
                  <p className="text-xs text-gray-500">
                    Last collection: {new Date(point.last_collection).toLocaleDateString()}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {point.area}, {point.zone}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};