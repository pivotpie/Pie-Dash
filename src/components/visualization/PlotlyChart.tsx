import React, { useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { PlotlyConfig, VisualizationResponse, ChartType } from '../../types/visualization.types';

interface PlotlyChartProps {
  visualization?: VisualizationResponse | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onFullscreen?: () => void;
  onExport?: (format: 'png' | 'pdf') => void;
  className?: string;
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({
  visualization,
  loading = false,
  error = null,
  onRetry,
  onFullscreen,
  onExport,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Transform data if needed for incompatible formats
  const transformedVisualization = React.useMemo(() => {
    if (!visualization?.chartConfig) return visualization;

    const { data, layout } = visualization.chartConfig;

    // Check if data needs transformation (raw objects instead of Plotly format)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // Check if it's already in Plotly format (has type, x, y properties)
      const isPlotlyFormat = data[0].hasOwnProperty('type') || data[0].hasOwnProperty('x') || data[0].hasOwnProperty('y');

      if (!isPlotlyFormat) {
        console.log('🔄 Transforming raw data to Plotly format');

        // Transform raw data objects to Plotly format
        const firstItem = data[0];
        const keys = Object.keys(firstItem);

        // Detect x and y fields from layout or infer from data
        let xField = layout?.xField || keys[0];
        let yField = layout?.yField || keys.find(k => typeof firstItem[k] === 'number') || keys[1];

        // Create Plotly data structure
        const plotlyData = [{
          type: 'bar',
          x: data.map(item => item[xField]),
          y: data.map(item => Number(item[yField]) || 0),
          text: data.map(item => `${item[yField]} ${yField === 'collections' ? 'collections' : yField === 'gallons_collected' || yField === 'total_gallons' ? 'gal' : ''}`),
          textposition: 'outside',
          hoverinfo: 'x+y+text',
          marker: { color: '#1f77b4' }
        }];

        // Create proper layout
        const plotlyLayout = {
          title: layout?.title || visualization.title || 'Data Analysis',
          xaxis: {
            title: layout?.xAxisTitle || xField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            tickangle: -45
          },
          yaxis: {
            title: layout?.yAxisTitle || yField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          showlegend: false,
          responsive: true,
          autosize: true,
          margin: { t: 60, r: 30, b: 80, l: 60 }
        };

        return {
          ...visualization,
          chartConfig: {
            data: plotlyData,
            layout: plotlyLayout
          }
        };
      }
    }

    return visualization;
  }, [visualization]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (onFullscreen) {
      onFullscreen();
    }
  }, [isFullscreen, onFullscreen]);

  const handleExport = useCallback((format: 'png' | 'pdf') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

  const handleDownload = useCallback(() => {
    if (transformedVisualization?.chartConfig) {
      // Create a temporary link to download the chart data
      const dataStr = JSON.stringify(transformedVisualization.chartConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [transformedVisualization]);
  // Loading state
  if (loading) {
    return (
      <div className={`plotly-chart-container ${className}`}>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-gray-600">Generating visualization...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`plotly-chart-container ${className}`}>
        <div className="h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-600 mb-2">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 font-medium mb-3">Failed to generate chart</p>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!visualization) {
    return (
      <div className={`plotly-chart-container ${className}`}>
        <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No visualization data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug chart data
  console.log('🎨 PlotlyChart Debug:', {
    hasVisualization: !!visualization,
    hasChartConfig: !!visualization?.chartConfig,
    hasData: !!visualization?.chartConfig?.data,
    dataType: typeof visualization?.chartConfig?.data,
    dataLength: Array.isArray(visualization?.chartConfig?.data) ? visualization?.chartConfig?.data.length : 'not array',
    dataStructure: visualization?.chartConfig?.data?.[0],
    fullChartConfig: visualization?.chartConfig
  });

  // Render the actual chart
  return (
    <div className={`plotly-chart-container relative ${className}`}>
      {/* Chart Controls */}
      <div className="absolute top-2 left-2 z-10 flex space-x-2">
        {/* Legend Toggle */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-2 bg-white shadow-md rounded-md hover:bg-gray-50 transition-colors"
          title="Toggle Legend"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        {/* Download Options */}
        <div className="relative group">
          <button className="p-2 bg-white shadow-md rounded-md hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <div className="absolute top-full right-0 mt-1 w-32 bg-white shadow-lg rounded-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={() => handleExport('png')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-t-md"
            >
              Export PNG
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              Export PDF
            </button>
            <button
              onClick={handleDownload}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-b-md"
            >
              Download Data
            </button>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={handleFullscreen}
          className="p-2 bg-white shadow-md rounded-md hover:bg-gray-50 transition-colors"
          title="Toggle Fullscreen"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
        </button>
      </div>

      {/* Plotly Chart */}
      <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}>
        <Plot
          data={transformedVisualization?.chartConfig?.data || []}
          layout={{
            ...transformedVisualization?.chartConfig?.layout,
            showlegend: showLegend,
            responsive: true,
            autosize: true,
            margin: { t: 40, r: 20, b: 40, l: 60 }
          }}
          config={{
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
            displaylogo: false,
            toImageButtonOptions: {
              format: 'png',
              filename: 'chart',
              height: 500,
              width: 700,
              scale: 1
            }
          }}
          style={{ width: '100%', height: isFullscreen ? '100vh' : '400px' }}
          useResizeHandler={true}
        />
        
        {isFullscreen && (
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default PlotlyChart;