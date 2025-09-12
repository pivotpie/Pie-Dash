// components/debug/DataDebugger.tsx
import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const DataDebugger: React.FC = () => {
  const {
    geographicData,
    categoryData,
    volumeData,
    providerData,
    kpiData,
    loading,
    error
  } = useDashboard();

  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      loading,
      error,
      dataStats: {
        geographic: {
          length: geographicData?.length || 0,
          sample: geographicData?.[0] || null,
          hasRequiredFields: geographicData?.[0] ? 
            'area' in geographicData[0] && 'collection_count' in geographicData[0] : false
        },
        category: {
          length: categoryData?.length || 0,
          sample: categoryData?.[0] || null,
          hasRequiredFields: categoryData?.[0] ? 
            'category' in categoryData[0] && 'collection_count' in categoryData[0] : false
        },
        volume: {
          length: volumeData?.length || 0,
          sample: volumeData?.[0] || null,
          hasRequiredFields: volumeData?.[0] ? 
            'volume_range' in volumeData[0] && 'frequency' in volumeData[0] : false
        },
        provider: {
          length: providerData?.length || 0,
          sample: providerData?.[0] || null,
          hasRequiredFields: providerData?.[0] ? 
            'service_provider' in providerData[0] && 'collection_count' in providerData[0] : false
        },
        kpi: {
          hasData: !!kpiData,
          totalCollections: kpiData?.totalCollections,
          totalGallons: kpiData?.totalGallons
        }
      }
    };
    setDebugInfo(info);
  }, [geographicData, categoryData, volumeData, providerData, kpiData, loading, error]);

  return (
    <Card className="mb-4 border-2 border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">📊 Data Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <strong>Loading Status:</strong> {loading ? '⏳ Loading...' : '✅ Loaded'}
          </div>
          
          {error && (
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800">Geographic Data</h4>
              <ul className="text-sm text-gray-600">
                <li>Length: {debugInfo.dataStats?.geographic?.length}</li>
                <li>Has Required Fields: {debugInfo.dataStats?.geographic?.hasRequiredFields ? '✅' : '❌'}</li>
                <li>Sample: {debugInfo.dataStats?.geographic?.sample?.area} ({debugInfo.dataStats?.geographic?.sample?.collection_count} collections)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800">Category Data</h4>
              <ul className="text-sm text-gray-600">
                <li>Length: {debugInfo.dataStats?.category?.length}</li>
                <li>Has Required Fields: {debugInfo.dataStats?.category?.hasRequiredFields ? '✅' : '❌'}</li>
                <li>Sample: {debugInfo.dataStats?.category?.sample?.category} ({debugInfo.dataStats?.category?.sample?.collection_count} collections)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800">Volume Data</h4>
              <ul className="text-sm text-gray-600">
                <li>Length: {debugInfo.dataStats?.volume?.length}</li>
                <li>Has Required Fields: {debugInfo.dataStats?.volume?.hasRequiredFields ? '✅' : '❌'}</li>
                <li>Sample: {debugInfo.dataStats?.volume?.sample?.volume_range} ({debugInfo.dataStats?.volume?.sample?.frequency} collections)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800">Provider Data</h4>
              <ul className="text-sm text-gray-600">
                <li>Length: {debugInfo.dataStats?.provider?.length}</li>
                <li>Has Required Fields: {debugInfo.dataStats?.provider?.hasRequiredFields ? '✅' : '❌'}</li>
                <li>Sample: {debugInfo.dataStats?.provider?.sample?.service_provider} ({debugInfo.dataStats?.provider?.sample?.collection_count} collections)</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">KPI Data</h4>
            <ul className="text-sm text-gray-600">
              <li>Has Data: {debugInfo.dataStats?.kpi?.hasData ? '✅' : '❌'}</li>
              <li>Total Collections: {debugInfo.dataStats?.kpi?.totalCollections?.toLocaleString()}</li>
              <li>Total Gallons: {debugInfo.dataStats?.kpi?.totalGallons?.toLocaleString()}</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800">Chart Data Mapping</h4>
            <p className="text-sm text-blue-700">
              Charts expect data with 'area' and 'collection_count' properties. 
              Geographic and Category data should map correctly, but Volume data maps 'volume_range' to 'area' and 'frequency' to 'collection_count'.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};