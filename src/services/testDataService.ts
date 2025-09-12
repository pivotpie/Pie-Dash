// Test file to verify DataInsightsService works
import { DataInsightsService } from './dataInsightsService';

export const testDataService = async () => {
  console.log('🧪 Testing DataInsightsService...');
  
  try {
    // Test KPI data
    console.log('1. Testing KPI data...');
    const kpiData = await DataInsightsService.getKPIData();
    console.log('✅ KPI Data:', {
      totalCollections: kpiData.totalCollections,
      totalGallons: kpiData.totalGallons,
      avgCollectionSize: kpiData.avgCollectionSize
    });
    
    // Test Geographic data
    console.log('2. Testing Geographic data...');
    const geoData = await DataInsightsService.getGeographicData();
    console.log('✅ Geographic Data:', {
      count: geoData.length,
      firstArea: geoData[0]?.area,
      firstCollections: geoData[0]?.collection_count
    });
    
    // Test Category data
    console.log('3. Testing Category data...');
    const categoryData = await DataInsightsService.getCategoryData();
    console.log('✅ Category Data:', {
      count: categoryData.length,
      firstCategory: categoryData[0]?.category,
      firstCollections: categoryData[0]?.collection_count
    });
    
    // Test Provider data
    console.log('4. Testing Provider data...');
    const providerData = await DataInsightsService.getProviderData();
    console.log('✅ Provider Data:', {
      count: providerData.length,
      firstProvider: providerData[0]?.service_provider,
      firstCollections: providerData[0]?.collection_count
    });
    
    // Test Volume data
    console.log('5. Testing Volume data...');
    const volumeData = await DataInsightsService.getVolumeData();
    console.log('✅ Volume Data:', {
      count: volumeData.length,
      firstRange: volumeData[0]?.volume_range,
      firstFrequency: volumeData[0]?.frequency
    });
    
    console.log('🎉 All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};