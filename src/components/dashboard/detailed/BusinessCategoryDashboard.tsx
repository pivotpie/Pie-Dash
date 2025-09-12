// components/dashboard/detailed/BusinessCategoryDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, BuildingIcon, TrendingUpIcon, InfoIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon } from 'lucide-react';
import { InteractiveChart } from '../components/InteractiveChart';
import { DataTable } from '../../ui/DataTable';
import { AnalyticsService } from '../../../services/supabaseClient';

interface DashboardCategory {
  category: string;
  collection_count: number;
  total_gallons: number;
  avg_gallons: number;
  median_gallons: number;
  std_gallons: number;
  unique_locations: number;
  areas_served: number;
  service_providers: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  [key: string]: any;
}

interface BusinessCategoryDashboardProps {
  onBack: () => void;
}

export const BusinessCategoryDashboard: React.FC<BusinessCategoryDashboardProps> = ({ onBack }) => {
  const [categoryData, setCategoryData] = useState<DashboardCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categories, monthly] = await Promise.all([
        AnalyticsService.getCategoryData(),
        AnalyticsService.getMonthlyData()
      ]);
      
      setCategoryData(categories);
      setMonthlyData(monthly);
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleCategoryClick = (category: string | any) => {
    const categoryName = typeof category === 'string' ? category : category.name || category.category;
    const categoryDetails = categoryData.find(item => item.category === categoryName);
    
    if (categoryDetails) {
      setDrillDownData({
        category: categoryDetails.category,
        collections: categoryDetails.collection_count,
        percentage: categoryDetails.percentage,
        gallons: categoryDetails.total_gallons,
        avgGallons: categoryDetails.avg_gallons,
        locations: categoryDetails.unique_locations,
        marketPosition: categoryDetails.percentage > 10 ? 'High Volume' : categoryDetails.percentage > 5 ? 'Medium Volume' : 'Low Volume'
      });
      setShowDrillDown(true);
    }
  };

  const closeDrillDown = () => {
    setShowDrillDown(false);
    setDrillDownData(null);
  };

  // Category performance matrix
  const categoryMatrix = categoryData.map(cat => ({
    category: cat.category,
    collections: cat.collection_count,
    percentage: cat.percentage,
    avgVolume: cat.avg_gallons,
    locations: cat.unique_locations,
    efficiency: Math.round(cat.total_gallons / (cat.unique_locations || 1)),
    frequency: Math.round(cat.collection_count / (cat.unique_locations || 1)),
    status: cat.percentage > 10 ? 'High Volume' : cat.percentage > 5 ? 'Medium Volume' : 'Low Volume'
  }));

  const chartData = categoryData.map(item => ({
    name: item.category,
    collections: item.collection_count,
    percentage: item.percentage,
    gallons: item.total_gallons,
    locations: item.unique_locations
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-3 py-2">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Layout - 70/30 split */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">

          {/* Category Performance Matrix */}
          <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BuildingIcon className="mr-2 h-5 w-5" />
          Category Performance Matrix
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryMatrix.slice(0, 6).map(cat => (
            <div 
              key={cat.category}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCategoryClick(cat.category)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{cat.category}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  cat.status === 'High Volume' ? 'bg-green-100 text-green-800' :
                  cat.status === 'Medium Volume' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cat.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collections:</span>
                  <span className="font-medium">{cat.collections.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Share:</span>
                  <span className="font-medium">{cat.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Volume:</span>
                  <span className="font-medium">{cat.avgVolume} gal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locations:</span>
                  <span className="font-medium">{cat.locations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-medium">{cat.efficiency} gal/location</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChart
          title="Collection Distribution by Category"
          type="pie"
          data={chartData}
          xKey="name"
          yKey="collections"
          height={350}
          onDrillDown={handleCategoryClick}
        />
        
        <InteractiveChart
          title="Average Volume per Category"
          type="bar"
          data={chartData.map(item => ({
            name: item.name,
            avgVolume: Math.round(item.gallons / item.collections)
          }))}
          xKey="name"
          yKey="avgVolume"
          height={350}
          onDrillDown={handleCategoryClick}
        />
      </div>

      {/* Category Trends */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUpIcon className="mr-2 h-5 w-5" />
          Category Trends Over Time
        </h3>
        
        <InteractiveChart
          title=""
          type="line"
          data={monthlyData}
          xKey="month"
          yKey="collection_count"
          height={300}
          onDrillDown={handleCategoryClick}
        />
      </div>

      {/* Detailed Table */}
      <DataTable
        title="Category Performance Details"
        columns={[
          { key: 'category', title: 'Category', sortable: true },
          { key: 'collection_count', title: 'Collections', sortable: true },
          { key: 'percentage', title: 'Market Share (%)', sortable: true },
          { key: 'total_gallons', title: 'Total Gallons', sortable: true },
          { key: 'avg_gallons', title: 'Avg Gallons', sortable: true },
          { key: 'median_gallons', title: 'Median Gallons', sortable: true },
          { key: 'unique_locations', title: 'Entities', sortable: true },
          { key: 'areas_served', title: 'Areas Served', sortable: true },
          { key: 'service_providers', title: 'Providers', sortable: true }
        ]}
        data={categoryData}
        onRowClick={(row: DashboardCategory) => handleCategoryClick(row.category)}
        pagination={false}
        enableColumnFilters={true}
      />

        </div>

        {/* Right Panel - 30% (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Category Summary */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <InfoIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Category Summary</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Market Distribution</p>
                <p>Operating across {categoryData.length} business categories. Top category: {categoryMatrix.sort((a,b) => b.percentage - a.percentage)[0]?.category || 'N/A'} ({categoryMatrix.sort((a,b) => b.percentage - a.percentage)[0]?.percentage || 0}% market share)</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">Performance Metrics</p>
                <p>Average {Math.round(categoryData.reduce((sum, cat) => sum + cat.avg_gallons, 0) / categoryData.length)} gallons per collection. Total coverage: {categoryData.reduce((sum, cat) => sum + cat.unique_locations, 0)} locations</p>
              </div>
            </div>
          </div>

          {/* Category Insights */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Category Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">High-Volume Categories</p>
                  <p className="text-green-700">{categoryMatrix.filter(c => c.status === 'High Volume').length} categories showing strong market presence</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Growth Opportunities</p>
                  <p className="text-yellow-700">Focus on efficiency improvements in medium-volume segments</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Market Expansion</p>
                  <p className="text-blue-700">Potential to increase coverage in underserved categories</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border-l-4 border-red-400 bg-red-50">
                <div className="text-sm">
                  <p className="font-medium text-red-800">High Priority</p>
                  <p className="text-red-700">Optimize collection frequency in low-efficiency categories</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Analyze market share trends for strategic planning</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
                <div className="text-sm">
                  <p className="font-medium text-green-800">Low Priority</p>
                  <p className="text-green-700">Explore new category expansion opportunities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Sensitive Elements */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Time Sensitive</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-red-800">Category Performance Review</p>
                  <p className="text-red-600">Due in 3 days</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Monthly Category Report</p>
                  <p className="text-orange-600">Due in 1 week</p>
                </div>
                <Button size="sm" variant="outline">
                  Prepare
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Down Modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Category Details</h3>
              <Button variant="ghost" size="sm" onClick={closeDrillDown}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900">{drillDownData.category}</h4>
                <p className="text-sm text-blue-700">{drillDownData.marketPosition} • {drillDownData.percentage}% Market Share</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.collections.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Collections</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(drillDownData.gallons / 1000)}K</div>
                  <div className="text-sm text-gray-600">Total Gallons</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.avgGallons}</div>
                  <div className="text-sm text-gray-600">Avg/Collection</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{drillDownData.locations}</div>
                  <div className="text-sm text-gray-600">Locations</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  This {drillDownData.marketPosition.toLowerCase()} category represents {drillDownData.percentage}% of total market activity 
                  with {drillDownData.collections.toLocaleString()} collections across {drillDownData.locations} locations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};