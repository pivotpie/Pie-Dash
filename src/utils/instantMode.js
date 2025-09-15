// Instant Mode - Ultra-fast responses with mock data for testing
// This bypasses all AI services for instant testing of charts and formatting

import { hybridAIService } from '../services/hybridAIService';

export const enableInstantMode = () => {
  console.log('⚡ INSTANT MODE: Enabling ultra-fast mock responses for testing...');

  // Override the processQuery method temporarily for testing
  const originalProcessQuery = hybridAIService.processQuery;

  hybridAIService.processQuery = async function(question, sessionId) {
    console.log('⚡ INSTANT MODE: Generating mock response for:', question);

    // Create mock data that matches your provider query
    const mockResults = [
      {
        service_provider: 'Al-Quoz Environmental Services',
        total_gallons: 45678,
        collections: 1250,
        volume_share_pct: 18.5,
        avg_gallons_per_collection: 36.5
      },
      {
        service_provider: 'Dubai Waste Management Co.',
        total_gallons: 38945,
        collections: 890,
        volume_share_pct: 15.8,
        avg_gallons_per_collection: 43.8
      },
      {
        service_provider: 'Emirates Clean Solutions',
        total_gallons: 32156,
        collections: 743,
        volume_share_pct: 13.1,
        avg_gallons_per_collection: 43.3
      },
      {
        service_provider: 'Green Dubai Services',
        total_gallons: 28934,
        collections: 645,
        volume_share_pct: 11.7,
        avg_gallons_per_collection: 44.9
      },
      {
        service_provider: 'Metro Collection Services',
        total_gallons: 25678,
        collections: 567,
        volume_share_pct: 10.4,
        avg_gallons_per_collection: 45.3
      }
    ];

    // Create proper chart configuration
    const chartConfig = {
      data: [{
        type: 'bar',
        x: mockResults.map(r => r.service_provider.replace(' ', '<br>')), // Break long names
        y: mockResults.map(r => r.total_gallons),
        text: mockResults.map(r => `${r.total_gallons.toLocaleString()} gal<br>${r.collections} collections`),
        textposition: 'outside',
        marker: {
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          opacity: 0.8
        },
        hovertemplate: '<b>%{x}</b><br>' +
                      'Total Volume: %{y:,.0f} gallons<br>' +
                      'Collections: %{text}<br>' +
                      '<extra></extra>'
      }],
      layout: {
        title: {
          text: 'Top 5 Service Providers by Collection Volume',
          font: { size: 16, family: 'Arial, sans-serif' }
        },
        xaxis: {
          title: { text: 'Service Provider', font: { size: 12 } },
          tickangle: -45,
          automargin: true
        },
        yaxis: {
          title: { text: 'Total Gallons Collected', font: { size: 12 } },
          tickformat: ',.0f'
        },
        margin: { t: 60, r: 30, b: 120, l: 80 },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Arial, sans-serif' }
      }
    };

    // Create enhanced detailed response
    const detailedResponse = `# 📊 Top 5 Service Providers Analysis

## Key Findings
- **Al-Quoz Environmental Services** leads with 45,678 gallons (18.5% market share)
- Top 5 providers handle **171,391 gallons** combined (69.5% of total volume)
- Average collection size ranges from **36.5 to 45.3 gallons per pickup**
- **Metro Collection Services** has highest efficiency at 45.3 gal/collection

## Provider Performance Summary

| Provider | Total Volume | Collections | Market Share | Avg/Collection |
|----------|--------------|-------------|--------------|----------------|
| Al-Quoz Environmental | 45,678 gal | 1,250 | 18.5% | 36.5 gal |
| Dubai Waste Management | 38,945 gal | 890 | 15.8% | 43.8 gal |
| Emirates Clean Solutions | 32,156 gal | 743 | 13.1% | 43.3 gal |
| Green Dubai Services | 28,934 gal | 645 | 11.7% | 44.9 gal |
| Metro Collection Services | 25,678 gal | 567 | 10.4% | 45.3 gal |

## Operational Insights
- **Volume Leaders**: Al-Quoz and Dubai Waste Management dominate with 34.3% combined share
- **Efficiency Champions**: Smaller providers show higher gallons per collection (44+ gal)
- **Service Frequency**: Al-Quoz handles 2.2x more collections than Metro Collection
- **Market Concentration**: Top 5 providers serve 4,095 collection points

## Strategic Recommendations
- **Optimize Route Efficiency**: Learn from Metro Collection's high-volume pickups
- **Capacity Planning**: Al-Quoz may need additional trucks for volume growth
- **Performance Benchmarking**: Target 45+ gallons per collection across all providers
- **Geographic Analysis**: Review service area overlap for optimization opportunities

## Technical Details
- Analysis covers 2023 collection data from Dubai Municipality database
- Data represents grease trap servicing across commercial and restaurant sectors
- Volume measurements in gallons, efficiency calculated as total/collections ratio`;

    // Return mock result instantly
    const mockResult = {
      question: question,
      sqlQuery: `SELECT service_provider, SUM(gallons_collected) as total_gallons, COUNT(*) as collections
FROM services WHERE EXTRACT(YEAR FROM collected_date) = 2023
GROUP BY service_provider ORDER BY total_gallons DESC LIMIT 5`,
      results: mockResults,
      naturalResponse: `Found the top 5 service providers by collection volume. Al-Quoz Environmental Services leads with 45,678 gallons collected across 1,250 collections. The top 5 providers handle 69.5% of total volume. View detailed analysis in the right panel for complete insights.`,
      detailedResponse: detailedResponse,
      visualization: {
        chartType: 'bar',
        chartConfig: chartConfig,
        title: 'Top 5 Service Providers by Volume',
        description: 'Bar chart showing collection volume by provider'
      },
      sessionId: sessionId || `instant_${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTime: 234, // Mock fast execution
      metadata: {
        recordCount: mockResults.length,
        queryType: 'provider',
        visualizationType: 'bar'
      }
    };

    console.log('⚡ INSTANT MODE: Mock result generated in <1ms');
    return mockResult;
  };

  console.log('✅ Instant mode enabled! All queries will return immediately with mock data.');
  console.log('🔄 To disable: refreshPage() or reload the page');
};

export const disableInstantMode = () => {
  // This would restore the original method, but for now just refresh the page
  console.log('🔄 To disable instant mode, please refresh the page');
  console.log('   Or run: window.location.reload()');
};

// Usage instructions
console.log(`
⚡ INSTANT MODE Available for Testing!

Enable: import('/src/utils/instantMode.js').then(m => m.enableInstantMode())
Test:   Ask any question and get instant response with charts
Disable: Refresh page

This bypasses all AI services for instant testing!
`);