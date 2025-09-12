// components/dashboard/overview/ExecutiveOverview.tsx - FIXED ROUTES
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpandableCard } from './ExpandableCard';
import { KPIGrid } from './KPIGrid';
import { useDashboard } from '../../../hooks/useDashboard';
import { AlertTriangleIcon, RouteIcon, TruckIcon, MapIcon, SearchIcon, BarChart3Icon, FleetIcon } from 'lucide-react';

export const ExecutiveOverview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    geographicData, 
    categoryData, 
    volumeData, 
    providerData, 
    kpiData,
    loading 
  } = useDashboard();


  // Hardcoded demo data for charts
  const hardcodedGeographicData = [
    { area: 'Al Quoz', collection_count: 2847, percentage: 18.5, total_gallons: 142350, zone: 'Central' },
    { area: 'Al Grhoud', collection_count: 2156, percentage: 14.0, total_gallons: 107800, zone: 'Central' },
    { area: 'Al Khwneej', collection_count: 1923, percentage: 12.5, total_gallons: 96150, zone: 'North' },
    { area: 'Al Nhd', collection_count: 1647, percentage: 10.7, total_gallons: 82350, zone: 'North' },
    { area: 'Al Mzhr', collection_count: 1534, percentage: 10.0, total_gallons: 76700, zone: 'East' },
    { area: 'Al Brsh', collection_count: 1289, percentage: 8.4, total_gallons: 64450, zone: 'South' },
    { area: 'Al Krm', collection_count: 1078, percentage: 7.0, total_gallons: 53900, zone: 'East' },
    { area: 'Al jddf', collection_count: 945, percentage: 6.1, total_gallons: 47250, zone: 'Central' }
  ];

  const dashboardCards = [
    {
      id: 'geographic',
      title: 'Geographic Distribution',
      summary: `Top Areas: Al Quoz (18.5%), Al Grhoud (14.0%), Al Khwneej (12.5%)`,
      expandTo: '/dashboard/geographic',
      chartType: 'donut',
      data: hardcodedGeographicData,
      color: 'blue'
    },
    {
      id: 'categories',
      title: 'Business Categories',
      summary: `Restaurant (24.7%), Hotel (18.3%), Office Building (15.2%)`,
      expandTo: '/dashboard/categories',
      chartType: 'bar',
      data: [
        { area: 'Restaurant', collection_count: 3798, percentage: 24.7, total_gallons: 189900, category: 'Restaurant' },
        { area: 'Hotel', collection_count: 2814, percentage: 18.3, total_gallons: 140700, category: 'Hotel' },
        { area: 'Office Building', collection_count: 2337, percentage: 15.2, total_gallons: 116850, category: 'Office Building' },
        { area: 'Retail Store', collection_count: 1923, percentage: 12.5, total_gallons: 96150, category: 'Retail Store' },
        { area: 'Apartment Complex', collection_count: 1539, percentage: 10.0, total_gallons: 76950, category: 'Apartment Complex' },
        { area: 'Shopping Mall', collection_count: 1230, percentage: 8.0, total_gallons: 61500, category: 'Shopping Mall' },
        { area: 'Hospital', collection_count: 923, percentage: 6.0, total_gallons: 46150, category: 'Hospital' },
        { area: 'School', collection_count: 769, percentage: 5.0, total_gallons: 38450, category: 'School' }
      ],
      color: 'green'
    },
    {
      id: 'volumes',
      title: 'Collection Volumes',
      summary: `Top Volumes: 26-50 gal (28.5%), 51-100 gal (23.7%), 101-250 gal (18.9%)`,
      expandTo: '/dashboard/volumes',
      chartType: 'column',
      data: [
        { area: '26-50', collection_count: 4378, percentage: 28.5, gallons_collected: 38, total_gallons: 166244 },
        { area: '51-100', collection_count: 3641, percentage: 23.7, gallons_collected: 75, total_gallons: 273075 },
        { area: '101-250', collection_count: 2903, percentage: 18.9, gallons_collected: 175, total_gallons: 508025 },
        { area: '251-500', collection_count: 1847, percentage: 12.0, gallons_collected: 375, total_gallons: 692625 },
        { area: '501-1000', collection_count: 1385, percentage: 9.0, gallons_collected: 750, total_gallons: 1038750 },
        { area: '1000+', collection_count: 923, percentage: 6.0, gallons_collected: 1000, total_gallons: 923000 },
        { area: '11-25', collection_count: 308, percentage: 2.0, gallons_collected: 18, total_gallons: 5544 }
      ],
      color: 'purple'
    },
    {
      id: 'providers',
      title: 'Service Provider Performance',
      summary: `Top Performers: EcoWaste Dubai (32.1%), CleanTech Services (24.8%)`,
      expandTo: '/dashboard/providers',
      chartType: 'horizontal-bar',
      data: [
        { area: 'EcoWaste Dubai', collection_count: 4933, market_share: 32.1, total_gallons: 246650, service_provider: 'EcoWaste Dubai' },
        { area: 'CleanTech Services', collection_count: 3814, market_share: 24.8, total_gallons: 190700, service_provider: 'CleanTech Services' },
        { area: 'GreenCycle Solutions', collection_count: 2769, market_share: 18.0, total_gallons: 138450, service_provider: 'GreenCycle Solutions' },
        { area: 'WasteAway Emirates', collection_count: 2000, market_share: 13.0, total_gallons: 100000, service_provider: 'WasteAway Emirates' },
        { area: 'Dubai Environmental', collection_count: 1231, market_share: 8.0, total_gallons: 61550, service_provider: 'Dubai Environmental' },
        { area: 'Pure Waste Management', collection_count: 615, market_share: 4.0, total_gallons: 30750, service_provider: 'Pure Waste Management' }
      ],
      color: 'orange'
    },
    {
      id: 'operations',
      title: 'Operational Status',
      summary: 'Real-time monitoring and alerts',
      expandTo: '/dashboard/operations',
      chartType: 'status',
      data: [],
      color: 'red'
    },
    {
      id: 'delays',
      title: 'Collection Delays & Alerts',
      summary: 'Pattern analysis and predictions',
      expandTo: '/dashboard/delays',
      chartType: 'alerts',
      data: [],
      color: 'yellow'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <KPIGrid data={kpiData} />
      
      {/* Dashboard Cards Grid - 2x3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {dashboardCards.map(card => (
          <ExpandableCard
            key={card.id}
            config={card}
            onExpand={(path) => navigate(path)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-glass-strong backdrop-blur-strong border-2 border-glass-border-strong rounded-3xl shadow-glass-strong p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 rounded-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate('/fleet-map')}
              className="group p-6 text-left bg-glass-white backdrop-blur-glass border-2 border-glass-border-strong rounded-2xl hover:bg-blue-50/70 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-subtle"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl text-white mr-4 group-hover:scale-110 transition-transform duration-300">
                  <MapIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-lg">Fleet Map</h4>
                  <p className="text-neutral-600 text-sm">View live vehicle locations</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/route-optimization')}
              className="group p-6 text-left bg-glass-white backdrop-blur-glass border-2 border-glass-border-strong rounded-2xl hover:bg-purple-50/70 hover:border-purple-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-subtle"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl text-white mr-4 group-hover:scale-110 transition-transform duration-300">
                  <RouteIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-lg">Route Optimization</h4>
                  <p className="text-neutral-600 text-sm">Optimize collection routes</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/fleet')}
              className="group p-6 text-left bg-glass-white backdrop-blur-glass border-2 border-glass-border-strong rounded-2xl hover:bg-green-50/70 hover:border-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-subtle"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl text-white mr-4 group-hover:scale-110 transition-transform duration-300">
                  <TruckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-lg">Fleet Management</h4>
                  <p className="text-neutral-600 text-sm">Manage vehicle operations</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/delays')}
              className="group p-6 text-left bg-glass-white backdrop-blur-glass border-2 border-glass-border-strong rounded-2xl hover:bg-red-50/70 hover:border-red-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-subtle"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl text-white mr-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangleIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-lg">Critical Alerts</h4>
                  <p className="text-neutral-600 text-sm">Review overdue collections</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};