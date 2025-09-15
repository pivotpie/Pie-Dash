// App.tsx - COMPLETE VERSION
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TileCache } from './services/tileCache';
import { UltimateAppLayout } from './components/layout/UltimateAppLayout';
import { enableFastEnhancedAnalysis } from './utils/toggleFeatures';
import { ExecutiveOverview } from './components/dashboard/overview/ExecutiveOverview';
import { GeographicDashboard } from './components/dashboard/detailed/GeographicDashboard';
import { BusinessCategoryDashboard } from './components/dashboard/detailed/BusinessCategoryDashboard';
import { VolumeDashboard } from './components/dashboard/detailed/VolumeDashboard';
import { PerformanceDashboard } from './components/dashboard/detailed/PerformanceDashboard';
import { DelaysDashboard } from './components/dashboard/detailed/DelaysDashboard';
import { OperationsDashboard } from './components/dashboard/detailed/OperationsDashboard';
import { FleetMapPage } from './components/mapping/FleetMapPage';
import { RouteOptimizationPage } from './components/mapping/RouteOptimizationPage';
import { RouteOptimizer } from './components/routing/RouteOptimizer';
import { QueryInterface } from './components/ai-query/QueryInterface';
import { FleetDashboard } from './components/fleet/FleetDashboard';

function App() {
  useEffect(() => {
    // Initialize tile caching for faster map performance
    TileCache.initialize().catch(console.warn);

    // Enable fast mode by default for optimal performance
    enableFastEnhancedAnalysis();
  }, []);

  return (
    <Router>
      <UltimateAppLayout useEnhancedFeatures={true} useModernUI={true}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ExecutiveOverview />} />
          <Route path="/dashboard/geographic" element={<GeographicDashboard onBack={() => window.history.back()} />} />
          <Route path="/dashboard/categories" element={<BusinessCategoryDashboard onBack={() => window.history.back()} />} />
          <Route path="/dashboard/volumes" element={<VolumeDashboard onBack={() => window.history.back()} />} />
          <Route path="/dashboard/providers" element={<PerformanceDashboard onBack={() => window.history.back()} />} />
          <Route path="/dashboard/delays" element={<DelaysDashboard onBack={() => window.history.back()} />} />
          <Route path="/dashboard/operations" element={<OperationsDashboard onBack={() => window.history.back()} />} />
          <Route path="/fleet-map" element={<FleetMapPage />} />
          <Route path="/route-optimization" element={<RouteOptimizationPage />} />
          <Route path="/routing" element={<RouteOptimizer />} />
          <Route path="/ai" element={<QueryInterface />} />
          <Route path="/fleet" element={<FleetDashboard />} />
        </Routes>
      </UltimateAppLayout>
    </Router>
  );
}

export default App;