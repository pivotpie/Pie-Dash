// Quick Diagnostic Script for Enhanced AI Services
// Run this in browser console to diagnose chart and artifact issues

import { hybridAIService } from '../services/hybridAIService';

export const runFullDiagnostic = async () => {
  console.log('🔍 Running Full Enhanced AI Service Diagnostic...\n');

  // Step 1: Check current configuration
  console.log('1️⃣ Current Configuration:');
  const config = hybridAIService.getConfig();
  console.table(config);

  // Step 2: Enable enhanced features for testing
  console.log('\n2️⃣ Enabling Enhanced Features...');
  hybridAIService.updateConfig({
    useV2Features: true,
    enableProgressiveDisclosure: true,
    fallbackToV1: true
  });
  console.log('✅ Enhanced features enabled');

  // Step 3: Test query with debugging
  console.log('\n3️⃣ Testing Query Processing...');
  try {
    const testQuery = "Show me top 5 collection areas";
    console.log(`Testing query: "${testQuery}"`);

    const result = await hybridAIService.processQuery(testQuery, 'diagnostic_test');

    console.log('Query Result Analysis:', {
      questionAnswered: result.question,
      hasSQL: !!result.sqlQuery,
      sqlLength: result.sqlQuery?.length || 0,
      resultCount: result.results?.length || 0,
      hasNaturalResponse: !!result.naturalResponse,
      hasDetailedResponse: !!result.detailedResponse,
      naturalResponseLength: result.naturalResponse?.length || 0,
      detailedResponseLength: result.detailedResponse?.length || 0,
      executionTime: result.executionTime
    });

    console.log('Visualization Analysis:', {
      hasVisualization: !!result.visualization,
      visualizationType: result.visualization?.chartType,
      hasChartConfig: !!result.visualization?.chartConfig,
      hasChartData: !!result.visualization?.chartConfig?.data,
      chartDataLength: result.visualization?.chartConfig?.data?.length || 0,
      hasMultiVisualization: !!result.multiVisualization
    });

    // Step 4: Detailed visualization inspection
    if (result.visualization?.chartConfig?.data) {
      console.log('\n4️⃣ Chart Data Sample:');
      console.log('First data item:', result.visualization.chartConfig.data[0]);
      console.log('Chart layout:', result.visualization.chartConfig.layout);
    } else {
      console.warn('⚠️ No chart data found');
    }

    // Step 5: Test with V1 fallback
    console.log('\n5️⃣ Testing V1 Fallback...');
    hybridAIService.updateConfig({
      useV2Features: false,
      fallbackToV1: true
    });

    const v1Result = await hybridAIService.processQuery(testQuery, 'diagnostic_v1_test');
    console.log('V1 Result Comparison:', {
      v1HasVisualization: !!v1Result.visualization,
      v1VisualizationType: v1Result.visualization?.chartType,
      v1HasChartData: !!v1Result.visualization?.chartConfig?.data,
      v1ChartDataLength: v1Result.visualization?.chartConfig?.data?.length || 0
    });

    return { v2Result: result, v1Result };

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error };
  }
};

export const quickTest = async () => {
  console.log('⚡ Quick Test - Enable Best Features and Test');

  // Enable best features
  hybridAIService.updateConfig({
    useV2Features: true,
    enableProgressiveDisclosure: true,
    fallbackToV1: true
  });

  try {
    const result = await hybridAIService.processQuery("Show collection statistics", 'quick_test');

    console.log('✅ Quick Test Results:', {
      working: !!result,
      hasChart: !!result.visualization,
      chartType: result.visualization?.chartType,
      hasData: result.results?.length > 0,
      responseLength: result.naturalResponse?.length || 0
    });

    if (result.visualization) {
      console.log('📊 Chart looks good!');
    } else {
      console.warn('⚠️ No chart generated');
    }

    return result;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return { error };
  }
};

export const checkServices = () => {
  console.log('🔧 Service Status Check:');

  try {
    console.log('✅ hybridAIService imported successfully');
    console.log('✅ Configuration accessible');
    console.log('Current config:', hybridAIService.getConfig());
    return true;
  } catch (error) {
    console.error('❌ Service check failed:', error);
    return false;
  }
};

// Usage instructions
console.log(`
🚀 Enhanced AI Service Diagnostics Available!

Quick Commands:
import('/src/utils/diagnoseIssues.js').then(d => d.quickTest())
import('/src/utils/diagnoseIssues.js').then(d => d.checkServices())
import('/src/utils/diagnoseIssues.js').then(d => d.runFullDiagnostic())

Or enable features:
import('/src/utils/toggleFeatures.js').then(f => f.enableBestFeatures())
`);