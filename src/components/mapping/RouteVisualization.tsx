// components/mapping/RouteVisualization.tsx
import React from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { OptimizedRoute } from '../../types/routing.types';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';

interface RouteVisualizationProps {
  route: OptimizedRoute;
  showStartEnd?: boolean;
  showWaypoints?: boolean;
  opacity?: number;
}

export const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  route,
  showStartEnd = true,
  showWaypoints = true,
  opacity = 0.8
}) => {
  // Generate polyline coordinates for the route
  const generatePolylineCoordinates = (): [number, number][] => {
    if (route.points.length === 0) return [];

    const coordinates: [number, number][] = [];
    
    // Start from business center (Al Quoz)
    const businessCenter = DubaiGeographyService.BUSINESS_CENTER;
    coordinates.push(businessCenter);
    
    // Add all waypoints in order
    route.points.forEach(point => {
      coordinates.push([point.latitude, point.longitude]);
    });
    
    // Return to business center
    coordinates.push(businessCenter);
    
    return coordinates;
  };

  // Create start/end marker icons
  const createStartIcon = () => {
    return L.divIcon({
      className: 'route-start-marker',
      html: `<div style="
        background: linear-gradient(135deg, #27AE60, #229954);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">🏢</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const createEndIcon = () => {
    return L.divIcon({
      className: 'route-end-marker',
      html: `<div style="
        background: linear-gradient(135deg, #E74C3C, #C0392B);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">🏁</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Create waypoint marker icons
  const createWaypointIcon = (index: number, priority: string) => {
    const priorityColors = {
      critical: '#E74C3C',
      high: '#F39C12',
      medium: '#F1C40F',
      low: '#27AE60'
    };

    return L.divIcon({
      className: 'route-waypoint-marker',
      html: `<div style="
        background: ${priorityColors[priority as keyof typeof priorityColors] || '#95A5A6'};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const polylineCoordinates = generatePolylineCoordinates();
  const businessCenter = DubaiGeographyService.BUSINESS_CENTER;

  return (
    <>
      {/* Route polyline */}
      {polylineCoordinates.length > 1 && (
        <Polyline
          positions={polylineCoordinates}
          pathOptions={{
            color: route.route_color,
            weight: 4,
            opacity: opacity,
            dashArray: '10, 5',
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}

      {/* Start marker (Business Center) */}
      {showStartEnd && (
        <Marker
          position={businessCenter}
          icon={createStartIcon()}
        />
      )}

      {/* End marker (Business Center) */}
      {showStartEnd && route.points.length > 0 && (
        <Marker
          position={businessCenter}
          icon={createEndIcon()}
        />
      )}

      {/* Waypoint markers */}
      {showWaypoints && route.points.map((point, index) => (
        <Marker
          key={`${route.vehicle_id}-${point.entity_id}`}
          position={[point.latitude, point.longitude]}
          icon={createWaypointIcon(index, point.priority)}
        />
      ))}
    </>
  );
};