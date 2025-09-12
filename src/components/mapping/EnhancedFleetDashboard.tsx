// components/mapping/EnhancedFleetDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FleetMapDashboard } from './FleetMapDashboard';
import { VehicleAssignmentInterface } from './VehicleAssignmentInterface';
import { ZoneCoverageDashboard } from './ZoneCoverageDashboard';
import { VehicleLocation } from '../../types/database.types';
import { OptimizedRoute } from '../../types/routing.types';
import { 
  MapIcon, 
  TruckIcon, 
  TargetIcon, 
  SettingsIcon,
  BarChart3Icon,
  NavigationIcon
} from 'lucide-react';

type DashboardView = 'map' | 'assignment' | 'coverage' | 'overview';

interface VehicleAssignment {
  vehicle_id: number;
  assigned_zone: string;
  status: 'active' | 'idle' | 'maintenance';
  current_route?: OptimizedRoute;
}

export const EnhancedFleetDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);

  const handleVehicleAssignmentChange = (assignments: VehicleAssignment[]) => {
    setVehicleAssignments(assignments);
  };

  const handleRouteGenerated = (routes: OptimizedRoute[]) => {
    setOptimizedRoutes(routes);
    setLastOptimization(new Date());
  };

  const navigationItems = [
    { 
      id: 'overview' as DashboardView, 
      label: 'Overview', 
      icon: BarChart3Icon,
      description: 'Fleet performance summary' 
    },
    { 
      id: 'map' as DashboardView, 
      label: 'Live Map', 
      icon: MapIcon,
      description: 'Real-time fleet visualization' 
    },
    { 
      id: 'assignment' as DashboardView, 
      label: 'Vehicle Assignment', 
      icon: TruckIcon,
      description: 'Manage vehicle-zone assignments' 
    },
    { 
      id: 'coverage' as DashboardView, 
      label: 'Zone Coverage', 
      icon: TargetIcon,
      description: 'Analyze zone coverage efficiency' 
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Dubai Fleet Management System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Comprehensive fleet optimization using zone-aware routing, real-time tracking, 
          and delay-integrated priority scheduling across Dubai's districts.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TruckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Vehicle Fleet</h3>
            <p className="text-3xl font-bold text-blue-600">{vehicleAssignments.length || 15}</p>
            <p className="text-sm text-gray-500 mt-2">Active vehicles managed</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MapIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coverage Zones</h3>
            <p className="text-3xl font-bold text-green-600">10</p>
            <p className="text-sm text-gray-500 mt-2">Dubai districts covered</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <NavigationIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Optimized Routes</h3>
            <p className="text-3xl font-bold text-purple-600">{optimizedRoutes.length}</p>
            <p className="text-sm text-gray-500 mt-2">Routes generated</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TargetIcon className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Efficiency Score</h3>
            <p className="text-3xl font-bold text-orange-600">87%</p>
            <p className="text-sm text-gray-500 mt-2">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Interactive Dubai Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600">
                Real-time visualization of vehicles, collection points, and zone boundaries 
                across Dubai using Leaflet and OpenStreetMap.
              </p>
              <ul className="text-sm space-y-1 text-gray-500">
                <li>• Zone boundary visualization with color coding</li>
                <li>• Vehicle tracking with status indicators</li>
                <li>• Priority-based collection point mapping</li>
                <li>• Interactive tooltips and filtering</li>
              </ul>
              <Button 
                onClick={() => setCurrentView('map')}
                className="w-full mt-4"
              >
                View Live Map
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Smart Vehicle Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600">
                Drag-and-drop interface for vehicle assignment with automatic 
                zone-based optimization and capacity balancing.
              </p>
              <ul className="text-sm space-y-1 text-gray-500">
                <li>• Drag-and-drop vehicle assignment</li>
                <li>• Automatic capacity optimization</li>
                <li>• Zone workload analysis</li>
                <li>• Real-time efficiency scoring</li>
              </ul>
              <Button 
                onClick={() => setCurrentView('assignment')}
                variant="outline"
                className="w-full mt-4"
              >
                Manage Assignments
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5" />
              Zone Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600">
                Comprehensive analysis of zone coverage efficiency, vehicle 
                utilization, and performance metrics.
              </p>
              <ul className="text-sm space-y-1 text-gray-500">
                <li>• Zone performance scoring</li>
                <li>• Coverage gap identification</li>
                <li>• Resource allocation optimization</li>
                <li>• Delay and priority analysis</li>
              </ul>
              <Button 
                onClick={() => setCurrentView('coverage')}
                variant="outline"
                className="w-full mt-4"
              >
                Analyze Coverage
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Route Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600">
                Advanced routing algorithms with zone-aware clustering, 
                delay integration, and priority-based scheduling.
              </p>
              <ul className="text-sm space-y-1 text-gray-500">
                <li>• Zone-aware route clustering</li>
                <li>• Priority-based collection scheduling</li>
                <li>• Cross-zone travel minimization</li>
                <li>• OSRM-based distance optimization</li>
              </ul>
              {lastOptimization && (
                <div className="text-xs text-gray-500 mt-2">
                  Last optimization: {lastOptimization.toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">Mapping & Visualization</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Leaflet.js for interactive maps</li>
                <li>• OpenStreetMap tiles (free)</li>
                <li>• React-Leaflet integration</li>
                <li>• Custom marker clustering</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Route Optimization</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• OSRM routing engine</li>
                <li>• Zone-aware clustering algorithms</li>
                <li>• Priority-based scheduling</li>
                <li>• Capacity constraint optimization</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-purple-600">Data Management</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Supabase PostgreSQL database</li>
                <li>• Real-time data synchronization</li>
                <li>• TypeScript type safety</li>
                <li>• Geographic data integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TruckIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Dubai Fleet</span>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'overview' && renderOverview()}
        
        {currentView === 'map' && (
          <FleetMapDashboard />
        )}
        
        {currentView === 'assignment' && (
          <VehicleAssignmentInterface
            onVehicleAssignmentChange={handleVehicleAssignmentChange}
            onRouteGenerated={handleRouteGenerated}
          />
        )}
        
        {currentView === 'coverage' && (
          <ZoneCoverageDashboard />
        )}
      </div>
    </div>
  );
};