// utils/chartDataValidator.ts
export const validateChartData = (data: any[], chartType: string, componentName: string) => {
  console.log(`🔍 Validating chart data for ${componentName} (${chartType}):`, {
    dataLength: data.length,
    firstItem: data[0],
    hasAreaProperty: data[0]?.area !== undefined,
    hasCollectionCountProperty: data[0]?.collection_count !== undefined,
    chartType
  });

  if (!data || data.length === 0) {
    console.warn(`⚠️ ${componentName}: No data provided for ${chartType} chart`);
    return false;
  }

  const firstItem = data[0];
  if (!firstItem.area) {
    console.warn(`⚠️ ${componentName}: Missing 'area' property for chart display`);
    return false;
  }

  if (firstItem.collection_count === undefined) {
    console.warn(`⚠️ ${componentName}: Missing 'collection_count' property for chart display`);
    return false;
  }

  console.log(`✅ ${componentName}: Chart data validation passed`);
  return true;
};

export const debugDashboardData = (dashboardData: any) => {
  console.log('🔧 Dashboard Data Debug Report');
  console.log('================================');
  
  const { geographicData, categoryData, volumeData, providerData, kpiData, loading } = dashboardData;
  
  console.log('📊 Data Loading State:', loading ? 'LOADING' : 'LOADED');
  console.log('📊 KPI Data Available:', !!kpiData.totalCollections);
  
  // Test each data set
  console.log('\n📍 Geographic Data:');
  validateChartData(geographicData, 'donut', 'Geographic');
  
  console.log('\n🏢 Category Data:');
  const mappedCategoryData = categoryData.map((d: any) => ({
    area: d.category,
    collection_count: d.collection_count,
    percentage: d.percentage
  }));
  validateChartData(mappedCategoryData, 'bar', 'Categories');
  
  console.log('\n📦 Volume Data:');
  const mappedVolumeData = volumeData.map((d: any) => ({
    area: d.volume_range,
    collection_count: d.frequency,
    percentage: d.percentage
  }));
  validateChartData(mappedVolumeData, 'column', 'Volumes');
  
  console.log('\n🏪 Provider Data:');
  const mappedProviderData = providerData.map((d: any) => ({
    area: d.service_provider,
    collection_count: d.collection_count,
    market_share: d.market_share
  }));
  validateChartData(mappedProviderData, 'horizontal-bar', 'Providers');
  
  console.log('\n🎯 Summary:');
  console.log('- Geographic areas:', geographicData.length);
  console.log('- Business categories:', categoryData.length);
  console.log('- Volume ranges:', volumeData.length);
  console.log('- Service providers:', providerData.length);
  console.log('- Total collections:', kpiData.totalCollections?.toLocaleString());
  console.log('- Total gallons:', kpiData.totalGallons?.toLocaleString());
};