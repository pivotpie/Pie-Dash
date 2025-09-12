// components/mapping/FleetMapDashboard.tsx
import React, { useState, useEffect } from 'react';
import { DubaiMap } from './DubaiMap';
import { MapControls } from './MapControls';
import { RouteOptimizationPanel } from './RouteOptimizationPanel';
import { RouteVisualization } from './RouteVisualization';
import { Zone, Area, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { AnalyticsService } from '../../services/supabaseClient';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';
import { CollectionPatternService } from '../../services/collectionPatternService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapIcon, TruckIcon, AlertTriangleIcon, TargetIcon, BuildingIcon, ClockIcon, RouteIcon } from 'lucide-react';

export const FleetMapDashboard: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | undefined>();
  
  // Map layer visibility controls
  const [showZones, setShowZones] = useState(true);
  const [showAreas, setShowAreas] = useState(false);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showCollectionPoints, setShowCollectionPoints] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  
  // Route optimization state
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      console.log('Loading map data...');
      
      // Load zones first (these should work with our geography service)
      const zones = AnalyticsService.getZonesWithCoordinates();
      
      // Load vehicles and collection points with timeout and fallbacks
      const vehiclesPromise = Promise.race([
        AnalyticsService.getVehicleLocations(),
        new Promise<VehicleLocation[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]).catch(error => {
        console.warn('Failed to load vehicles, using mock data:', error);
        return getMockVehicles();
      });
      
      const pointsPromise = Promise.race([
        AnalyticsService.getCollectionPoints(),
        new Promise<CollectionPoint[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]).catch(error => {
        console.warn('Failed to load collection points, using mock data:', error);
        return getMockCollectionPoints();
      });

      const [zonesData, vehiclesData, pointsData] = await Promise.all([
        zones, vehiclesPromise, pointsPromise
      ]);

      console.log('Loaded data:', { zones: zonesData.length, vehicles: vehiclesData.length, points: pointsData.length });
      
      setZones(zonesData);
      setVehicles(vehiclesData);
      setCollectionPoints(pointsData);
    } catch (error) {
      console.error('Error loading map data:', error);
      // Load fallback data
      setZones(getMockZones());
      setVehicles(getMockVehicles());
      setCollectionPoints(getMockCollectionPoints());
    } finally {
      setLoading(false);
    }
  };

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone.zone_name);
  };

  const handleVehicleClick = (vehicle: VehicleLocation) => {
    setSelectedVehicle(vehicle);
  };

  const handleCollectionPointClick = (point: CollectionPoint) => {
    setSelectedPoint(point);
  };

  const handleZoneFilter = (zoneName: string | undefined) => {
    setSelectedZone(zoneName);
  };

  const handleRouteSelect = (route: OptimizedRoute) => {
    setSelectedRoute(route);
    setShowRoutes(true);
  };

  const toggleOptimizationPanel = () => {
    setShowOptimizationPanel(!showOptimizationPanel);
  };

  // Filter data based on selected zone
  const filteredVehicles = selectedZone 
    ? vehicles.filter(v => v.assigned_zone === selectedZone)
    : vehicles;
    
  const filteredCollectionPoints = selectedZone
    ? collectionPoints.filter(p => p.zone === selectedZone)
    : collectionPoints;

  // Calculate summary statistics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const criticalPoints = collectionPoints.filter(p => p.priority === 'critical').length;
  const totalZones = zones.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapIcon className="h-8 w-8" />
            Dubai Fleet Management
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOptimizationPanel}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                showOptimizationPanel
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <RouteIcon className="h-4 w-4" />
              {showOptimizationPanel ? 'Hide Optimization' : 'Route Optimization'}
            </button>
            <button
              onClick={loadMapData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
            <BuildingIcon className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800">Business Center: Al Quoz</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
            <ClockIcon className="h-4 w-4 text-green-600" />
            <span className="text-green-800">Current Date: {CollectionPatternService.CURRENT_DATE.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
            <TargetIcon className="h-4 w-4 text-purple-600" />
            <span className="text-purple-800">Area-Based Collection Optimization</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalVehicles}</div>
                <div className="text-sm text-gray-500">Total Vehicles</div>
                <div className="text-xs text-green-600">{activeVehicles} active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapIcon className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalZones}</div>
                <div className="text-sm text-gray-500">Coverage Zones</div>
                {selectedZone && (
                  <div className="text-xs text-blue-600">Viewing: {selectedZone}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TargetIcon className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{filteredCollectionPoints.length}</div>
                <div className="text-sm text-gray-500">Collection Points</div>
                <div className="text-xs text-gray-600">
                  {selectedZone ? `in ${selectedZone}` : 'total'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{criticalPoints}</div>
                <div className="text-sm text-gray-500">Critical Delays</div>
                <div className="text-xs text-red-600">&gt;7 days overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Map and Controls */}
      <div className={`grid gap-6 ${showOptimizationPanel ? 'grid-cols-1 lg:grid-cols-6' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* Map Controls */}
        <div className="lg:col-span-1">
          <MapControls
            showZones={showZones}
            showAreas={showAreas}
            showVehicles={showVehicles}
            showCollectionPoints={showCollectionPoints}
            onToggleZones={() => setShowZones(!showZones)}
            onToggleAreas={() => setShowAreas(!showAreas)}
            onToggleVehicles={() => setShowVehicles(!showVehicles)}
            onToggleCollectionPoints={() => setShowCollectionPoints(!showCollectionPoints)}
            onRefresh={loadMapData}
            selectedZone={selectedZone}
            onZoneFilter={handleZoneFilter}
            zones={zones}
          />
        </div>

        {/* Map */}
        <div className={showOptimizationPanel ? "lg:col-span-3" : "lg:col-span-3"}>
          <Card>
            <CardContent className="p-0">
              <DubaiMap
                height="600px"
                showZones={showZones}
                showAreas={showAreas}
                showVehicles={showVehicles}
                showCollectionPoints={showCollectionPoints}
                selectedZone={selectedZone}
                zones={zones}
                areas={[]} // We'll pass areas when needed
                vehicles={filteredVehicles}
                collectionPoints={filteredCollectionPoints}
                onZoneClick={handleZoneClick}
                onVehicleClick={handleVehicleClick}
                onCollectionPointClick={handleCollectionPointClick}
              >
                {/* Add route visualization to the map */}
                {showRoutes && selectedRoute && (
                  <RouteVisualization
                    route={selectedRoute}
                    showStartEnd={true}
                    showWaypoints={true}
                    opacity={0.8}
                  />
                )}
              </DubaiMap>
            </CardContent>
          </Card>
        </div>

        {/* Route Optimization Panel */}
        {showOptimizationPanel && (
          <div className="lg:col-span-2">
            <RouteOptimizationPanel
              vehicles={vehicles}
              collectionPoints={collectionPoints}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}
      </div>

      {/* Selection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                Vehicle {selectedVehicle.vehicle_id} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    selectedVehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedVehicle.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assigned Zone:</span>
                  <span className="text-sm font-medium">{selectedVehicle.assigned_zone || 'None'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="text-xs text-gray-500">
                    {selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedVehicle.last_updated).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Collection Point Details */}
        {selectedPoint && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                Collection Point Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">{selectedPoint.outlet_name}</h4>
                  <p className="text-sm text-gray-600">{selectedPoint.category}</p>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Priority:</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    selectedPoint.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedPoint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedPoint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedPoint.priority.charAt(0).toUpperCase() + selectedPoint.priority.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected Gallons:</span>
                  <span className="text-sm font-medium">{selectedPoint.expected_gallons}</span>
                </div>
                
                {selectedPoint.days_overdue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days Overdue:</span>
                    <span className="text-sm font-semibold text-red-600">{selectedPoint.days_overdue}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="text-sm">{selectedPoint.area}, {selectedPoint.zone}</span>
                </div>
                
                {selectedPoint.last_collection && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Collection:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedPoint.last_collection).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Mock data functions for fallback when database is not available
const getMockZones = (): Zone[] => {
  const dubaiZones = DubaiGeographyService.getDubaiZones();
  return dubaiZones.map((zone, index) => ({
    zone_id: `zone_${index + 1}`,
    zone_name: zone.name,
    latitude: zone.coordinates[0],
    longitude: zone.coordinates[1],
    boundary_coordinates: zone.boundaries,
    color: zone.color,
    created_at: new Date().toISOString()
  }));
};

const getMockVehicles = (): VehicleLocation[] => {
  const zones = DubaiGeographyService.getDubaiZones();
  const areasByZone = CollectionPatternService.getAreasByZone();
  const vehicles: VehicleLocation[] = [];
  
  // Generate vehicles distributed across areas
  let vehicleCounter = 1;
  Object.entries(areasByZone).forEach(([zoneName, areas]) => {
    const vehiclesPerZone = Math.ceil(15 / zones.length); // Distribute vehicles across zones
    
    for (let i = 0; i < vehiclesPerZone && vehicleCounter <= 15; i++) {
      const randomArea = areas[i % areas.length];
      const [lat, lng] = CollectionPatternService.generateAreaCoordinates(
        randomArea,
        zoneName,
        100000 + vehicleCounter
      );
      
      const statuses: ('active' | 'idle' | 'maintenance')[] = ['active', 'idle', 'maintenance'];
      const statusWeights = [0.7, 0.2, 0.1]; // 70% active, 20% idle, 10% maintenance
      const randomValue = Math.random();
      let status: 'active' | 'idle' | 'maintenance';
      
      if (randomValue < statusWeights[0]) status = 'active';
      else if (randomValue < statusWeights[0] + statusWeights[1]) status = 'idle';
      else status = 'maintenance';
      
      vehicles.push({
        vehicle_id: vehicleCounter,
        latitude: lat,
        longitude: lng,
        status,
        assigned_zone: zoneName,
        assigned_area: randomArea,
        last_updated: new Date().toISOString()
      });
      
      vehicleCounter++;
    }
  });
  
  return vehicles;
};

const getMockCollectionPoints = (): CollectionPoint[] => {
  const zones = DubaiGeographyService.getDubaiZones();
  const areas = DubaiGeographyService.getDubaiAreas();
  const points: CollectionPoint[] = [];
  
  // Generate sample collection points for each zone
  zones.forEach((zone, zoneIndex) => {
    const zoneAreas = areas.filter(area => area.parent_zone === zone.name);
    
    for (let i = 0; i < 3; i++) {
      const randomArea = zoneAreas[i % zoneAreas.length] || { name: zone.name, coordinates: zone.coordinates };
      const [lat, lng] = randomArea.coordinates;
      
      // Add some random offset
      const offsetLat = lat + (Math.random() - 0.5) * 0.01;
      const offsetLng = lng + (Math.random() - 0.5) * 0.01;
      
      const priorities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
      const categories = ['Restaurant', 'Hotel', 'Commercial Kitchen', 'Food Court', 'Cafe'];
      
      const daysSince = Math.floor(Math.random() * 15);
      let priority: 'critical' | 'high' | 'medium' | 'low';
      if (daysSince > 7) priority = 'critical';
      else if (daysSince > 3) priority = 'high';
      else if (daysSince > 1) priority = 'medium';
      else priority = 'low';
      
      points.push({
        entity_id: `mock_${zoneIndex}_${i}`,
        outlet_name: `${randomArea.name} ${categories[i % categories.length]}`,
        latitude: offsetLat,
        longitude: offsetLng,
        area: randomArea.name,
        zone: zone.name,
        category: categories[i % categories.length],
        priority,
        days_overdue: Math.max(0, daysSince - 2),
        expected_gallons: Math.round((daysSince + 1) * (10 + Math.random() * 20)),
        last_collection: new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  });
  
  return points;
};