// components/mapping/FleetMapPage.tsx
import React, { useState, useEffect } from 'react';
import { FastDubaiMap } from './FastDubaiMap';
import { MapPreloader } from './MapPreloader';
import { MapControls } from './MapControls';
import { Zone, Area, VehicleLocation, CollectionPoint } from '../../types/database.types';
import { AnalyticsService } from '../../services/supabaseClient';
import { DubaiGeographyService } from '../../services/dubaiGeographyService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapIcon, TruckIcon, AlertTriangleIcon, TargetIcon, BuildingIcon, ClockIcon, RouteIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export const FleetMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | undefined>();
  
  // Map layer visibility controls
  const [showZones, setShowZones] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showCollectionPoints, setShowCollectionPoints] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await loadMapData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      console.log('Loading map data...');
      
      // Load data in parallel for better performance
      const [vehiclesData, collectionPointsData, zonesData] = await Promise.all([
        AnalyticsService.getVehicleLocations(),
        AnalyticsService.getCollectionPoints(),
        Promise.resolve([]) // We'll use geography service for zones
      ]);

      console.log('Data loaded:', {
        vehicles: vehiclesData?.length || 0,
        collectionPoints: collectionPointsData?.length || 0,
        zones: zonesData?.length || 0
      });

      setVehicles(vehiclesData || []);
      setCollectionPoints(collectionPointsData || []);
      setZones(zonesData || []);
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleClick = (vehicle: VehicleLocation) => {
    setSelectedVehicle(vehicle);
    setSelectedPoint(null);
  };

  const handleCollectionPointClick = (point: CollectionPoint) => {
    setSelectedPoint(point);
    setSelectedVehicle(null);
  };

  const handleZoneClick = (zone: Zone) => {
    console.log('Zone clicked:', zone);
    setSelectedZone(selectedZone === zone.zone_name ? undefined : zone.zone_name);
  };

  const handleZoneFilter = (zoneName: string | undefined) => {
    setSelectedZone(zoneName);
  };

  // Filter data based on selected zone
  const filteredVehicles = selectedZone 
    ? vehicles.filter(v => v.assigned_zone === selectedZone)
    : vehicles;

  const filteredCollectionPoints = selectedZone 
    ? collectionPoints.filter(p => p.zone === selectedZone)
    : collectionPoints;

  // Calculate statistics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const criticalPoints = collectionPoints.filter(p => p.priority === 'critical').length;
  const overduePoints = collectionPoints.filter(p => p.days_overdue > 0).length;
  const totalGallonsExpected = collectionPoints.reduce((sum, p) => sum + p.expected_gallons, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fleet map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MapPreloader onPreloadComplete={() => setMapReady(true)} />
      <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapIcon className="h-8 w-8" />
            Fleet Map View
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/route-optimization')}
              variant="primary"
              size="md"
            >
              <RouteIcon className="h-4 w-4 mr-2" />
              Route Optimization
            </Button>
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
            <span className="text-green-800">Current Date: January 15, 2025</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-green-600">{activeVehicles}</p>
              </div>
              <TruckIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {vehicles.length} total vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Points</p>
                <p className="text-2xl font-bold text-blue-600">{collectionPoints.length}</p>
              </div>
              <TargetIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Points</p>
                <p className="text-2xl font-bold text-red-600">{criticalPoints}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overduePoints} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Volume</p>
                <p className="text-2xl font-bold text-purple-600">{totalGallonsExpected.toLocaleString()}</p>
              </div>
              <div className="text-purple-600 text-2xl">🛢️</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Gallons pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Map and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls */}
        <div className="lg:col-span-1">
          <MapControls
            showZones={showZones}
            showAreas={false}
            showVehicles={showVehicles}
            showCollectionPoints={showCollectionPoints}
            onToggleZones={() => setShowZones(!showZones)}
            onToggleAreas={() => {}} // Not used in optimized version
            onToggleVehicles={() => setShowVehicles(!showVehicles)}
            onToggleCollectionPoints={() => setShowCollectionPoints(!showCollectionPoints)}
            onRefresh={loadMapData}
            selectedZone={selectedZone}
            onZoneFilter={handleZoneFilter}
            zones={zones}
          />
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <FastDubaiMap
                height="600px"
                showZones={showZones}
                showVehicles={showVehicles}
                showCollectionPoints={showCollectionPoints}
                selectedZone={selectedZone}
                zones={zones}
                vehicles={filteredVehicles}
                collectionPoints={filteredCollectionPoints}
                onZoneClick={handleZoneClick}
                onVehicleClick={handleVehicleClick}
                onCollectionPointClick={handleCollectionPointClick}
                maxMarkers={200} // Optimized limit
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Vehicle ID:</span>
                  <p className="text-lg font-semibold">{selectedVehicle.vehicle_id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Driver:</span>
                  <p className="text-lg font-semibold">{selectedVehicle.driver_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <p className={`text-lg font-semibold ${
                    selectedVehicle.status === 'active' ? 'text-green-600' :
                    selectedVehicle.status === 'idle' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Zone:</span>
                  <p className="text-lg font-semibold">{selectedVehicle.assigned_zone}</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Location:</span>
                <p className="text-sm text-gray-700">
                  {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}
                </p>
              </div>
              
              {selectedVehicle.last_updated && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedVehicle.last_updated).toLocaleString()}
                  </p>
                </div>
              )}
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
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-bold text-lg">{selectedPoint.outlet_name}</h4>
                <p className="text-gray-600">{selectedPoint.category}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Priority:</span>
                  <p className={`text-lg font-semibold ${
                    selectedPoint.priority === 'critical' ? 'text-red-600' :
                    selectedPoint.priority === 'high' ? 'text-orange-600' :
                    selectedPoint.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedPoint.priority.charAt(0).toUpperCase() + selectedPoint.priority.slice(1)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Expected Volume:</span>
                  <p className="text-lg font-semibold">{selectedPoint.expected_gallons} gallons</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Area:</span>
                  <p className="text-lg font-semibold">{selectedPoint.area}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Zone:</span>
                  <p className="text-lg font-semibold">{selectedPoint.zone}</p>
                </div>
              </div>
              
              {selectedPoint.days_overdue > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 font-medium">
                      Overdue by {selectedPoint.days_overdue} days
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-600">Location:</span>
                <p className="text-sm text-gray-700">
                  {selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
};