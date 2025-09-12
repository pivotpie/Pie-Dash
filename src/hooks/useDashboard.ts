// hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { AnalyticsService } from '../services/supabaseClient';

interface DashboardGeographic {
  area: string;
  collection_count: number;
  total_gallons: number;
  unique_locations: number;
}

interface DashboardCategory {
  category: string;
  percentage: number;
  collection_count: number;
  total_gallons: number;
}

interface DashboardVolume {
  gallons_collected: number;
  percentage: number;
  frequency: number;
  unique_locations: number;
}

interface DashboardProvider {
  service_provider: string;
  market_share: number;
  collection_count: number;
  total_gallons: number;
}

// Updated KPI interface to match DataInsightsService response
interface KPIData {
  totalGallons: number;
  uniqueLocations: number;
  uniqueVehicles: number;
  uniqueProviders: number;
  avgDailyGallons: number;
  avgCollectionSize: number;
  totalCollections: number;
  uniqueAreas: number;
  uniqueZones: number;
  uniqueCategories: number;
  dateRange: {
    start: string;
    end: string;
    duration_days: number;
  };
}

export const useDashboard = () => {
  const [geographicData, setGeographicData] = useState<DashboardGeographic[]>([]);
  const [categoryData, setCategoryData] = useState<DashboardCategory[]>([]);
  const [volumeData, setVolumeData] = useState<DashboardVolume[]>([]);
  const [providerData, setProviderData] = useState<DashboardProvider[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalGallons: 0,
    uniqueLocations: 0,
    uniqueVehicles: 0,
    uniqueProviders: 0,
    avgDailyGallons: 0,
    avgCollectionSize: 0,
    totalCollections: 0,
    uniqueAreas: 0,
    uniqueZones: 0,
    uniqueCategories: 0,
    dateRange: {
      start: '',
      end: '',
      duration_days: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [
        geographic,
        categories,
        volumes,
        providers,
        kpis
      ] = await Promise.all([
        AnalyticsService.getGeographicData(),
        AnalyticsService.getCategoryData(),
        AnalyticsService.getVolumeData(),
        AnalyticsService.getProviderData(),
        AnalyticsService.getKPIData()
      ]);

      setGeographicData(geographic);
      setCategoryData(categories);
      setVolumeData(volumes);
      setProviderData(providers);
      setKpiData(kpis);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
      
      // Set empty arrays as fallback - the services have their own fallbacks
      setGeographicData([]);
      setCategoryData([]);
      setVolumeData([]);
      setProviderData([]);
      setKpiData({
        totalGallons: 0,
        uniqueLocations: 0,
        uniqueVehicles: 0,
        uniqueProviders: 0,
        avgDailyGallons: 0,
        avgCollectionSize: 0,
        totalCollections: 0,
        uniqueAreas: 0,
        uniqueZones: 0,
        uniqueCategories: 0,
        dateRange: {
          start: '',
          end: '',
          duration_days: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadAllData();
  };

  return {
    geographicData,
    categoryData,
    volumeData,
    providerData,
    kpiData,
    loading,
    error,
    refreshData
  };
};