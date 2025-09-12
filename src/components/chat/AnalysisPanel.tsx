import React, { useState, useCallback } from 'react';
import PlotlyChart from '../visualization/PlotlyChart';
import { EnhancedQueryResult } from '../../types/chat.types';

// Simple markdown to HTML converter for rich analysis display
function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-blue-900 mt-8 mb-6">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Tables (basic markdown table support)
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim());
      const isHeaderRow = match.includes('---');
      if (isHeaderRow) return '<hr class="my-2 border-gray-300">';
      
      const cellType = cells.some((cell: string) => /^[A-Za-z]/.test(cell)) ? 'th' : 'td';
      const cellClass = cellType === 'th' ? 'font-semibold bg-gray-50 px-3 py-2 border' : 'px-3 py-2 border';
      return `<tr>${cells.map((cell: string) => `<${cellType} class="${cellClass}">${cell}</${cellType}>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>)/g, '<table class="w-full border-collapse border border-gray-300 my-4">$1</table>')
    
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2">• $1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="my-4">$1</ul>')
    
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(.+)$/gim, '<p class="mb-4">$1</p>')
    
    // Clean up extra tags
    .replace(/<p class="mb-4"><\/p>/g, '')
    .replace(/<p class="mb-4">(<h[1-3])/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1');
}

interface AnalysisPanelProps {
  queryResult?: EnhancedQueryResult | null;
  sessionHistory?: EnhancedQueryResult[]; // Array of all analyses in current session
  isLoading?: boolean;
  onExportAnalysis?: () => void;
  onCopyResponse?: () => void;
  onShareAnalysis?: () => void;
  onPrintAnalysis?: () => void;
  onRetryVisualization?: () => void;
  className?: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  queryResult,
  sessionHistory = [],
  isLoading,
  onExportAnalysis,
  onCopyResponse,
  onShareAnalysis,
  onPrintAnalysis,
  onRetryVisualization,
  className = ''
}) => {
  const [showSQLQuery, setShowSQLQuery] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(-1); // -1 means show latest
  const [activeChartIndex, setActiveChartIndex] = useState(0);

  // Handle copy response text
  const handleCopyResponse = useCallback(async () => {
    if (queryResult?.naturalResponse) {
      try {
        await navigator.clipboard.writeText(queryResult.naturalResponse);
        if (onCopyResponse) {
          onCopyResponse();
        }
      } catch (err) {
        console.error('Failed to copy response:', err);
      }
    }
  }, [queryResult?.naturalResponse, onCopyResponse]);

  // Handle export analysis
  const handleExportAnalysis = useCallback(() => {
    if (queryResult && onExportAnalysis) {
      onExportAnalysis();
    }
  }, [queryResult, onExportAnalysis]);

  // Handle chart export
  const handleChartExport = useCallback((format: 'png' | 'pdf') => {
    if (queryResult?.visualization) {
      // Export functionality would be implemented by parent
      console.log(`Exporting chart as ${format}`);
    }
  }, [queryResult?.visualization]);

  // Handle fullscreen toggle for chart
  const handleChartFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`analysis-panel-container ${className}`}>
        <div className="h-full bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your query...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!queryResult) {
    return (
      <div className={`analysis-panel-container ${className}`}>
        <div className="h-full bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-500 text-sm">Start by asking a question to see analysis and visualizations here.</p>
          </div>
        </div>
      </div>
    );
  }

  // Main analysis panel
  return (
    <div className={`analysis-panel-container ${className}`}>
      <div className="h-full bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
              {sessionHistory.length > 1 && (
                <p className="text-sm text-gray-500">
                  Analysis {selectedAnalysisIndex + 1} of {sessionHistory.length}
                </p>
              )}
            </div>
            
            {/* Navigation Controls */}
            {sessionHistory.length > 1 && (
              <div className="flex items-center space-x-2 mr-4">
                <button
                  onClick={() => {
                    const currentIndex = selectedAnalysisIndex === -1 ? sessionHistory.length - 1 : selectedAnalysisIndex;
                    setSelectedAnalysisIndex(Math.max(0, currentIndex - 1));
                  }}
                  disabled={selectedAnalysisIndex === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous Analysis"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                  {(selectedAnalysisIndex === -1 ? sessionHistory.length : selectedAnalysisIndex + 1)} / {sessionHistory.length}
                </div>
                
                <button
                  onClick={() => {
                    const currentIndex = selectedAnalysisIndex === -1 ? sessionHistory.length - 1 : selectedAnalysisIndex;
                    const nextIndex = Math.min(sessionHistory.length - 1, currentIndex + 1);
                    setSelectedAnalysisIndex(nextIndex === sessionHistory.length - 1 ? -1 : nextIndex);
                  }}
                  disabled={selectedAnalysisIndex === -1}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next Analysis"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setSelectedAnalysisIndex(-1)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    selectedAnalysisIndex === -1 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Jump to Latest"
                >
                  Latest
                </button>
              </div>
            )}
            
            {/* Panel Controls */}
            <div className="flex items-center space-x-2">
              {/* Copy Response */}
              <button
                onClick={handleCopyResponse}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy Response"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Export Analysis */}
              <button
                onClick={handleExportAnalysis}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Export Analysis"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Share */}
              <button
                onClick={onShareAnalysis}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Share Analysis"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>

              {/* Print */}
              <button
                onClick={onPrintAnalysis}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Print Analysis"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            // Get the current analysis to display
            const getDisplayAnalysis = () => {
              if (sessionHistory.length === 0) return queryResult;
              
              // If selectedAnalysisIndex is -1, show the latest (most recent)
              if (selectedAnalysisIndex === -1) {
                return sessionHistory[sessionHistory.length - 1] || queryResult;
              }
              
              // Otherwise show the selected analysis
              return sessionHistory[selectedAnalysisIndex] || queryResult;
            };
            
            const currentAnalysis = getDisplayAnalysis();
              
            if (!currentAnalysis) return null;
            
            // Get available charts
            const charts = [];
            if (currentAnalysis.multiVisualization) {
              charts.push(currentAnalysis.multiVisualization.primary);
              if (currentAnalysis.multiVisualization.secondary) {
                charts.push(...currentAnalysis.multiVisualization.secondary);
              }
            } else if (currentAnalysis.visualization) {
              charts.push(currentAnalysis.visualization);
            }
            
            return (
              <>
                {/* Analysis Question */}
                <div className="p-4 border-b border-gray-100 bg-blue-50">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Question</h4>
                  <p className="text-sm text-blue-800 italic">"{currentAnalysis.question}"</p>
                </div>

                {/* Visualization Section */}
                {charts.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Visualization{charts.length > 1 ? 's' : ''}
                        </h4>
                        {charts.length > 1 && (
                          <div className="flex space-x-1">
                            {charts.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setActiveChartIndex(index)}
                                className={`px-2 py-1 text-xs rounded ${
                                  activeChartIndex === index
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                Chart {index + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleChartFullscreen}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Fullscreen
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg">
                      <PlotlyChart
                        visualization={charts[activeChartIndex]}
                        loading={false}
                        error={null}
                        onRetry={onRetryVisualization}
                        onFullscreen={handleChartFullscreen}
                        onExport={handleChartExport}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Chart Description */}
                    {charts[activeChartIndex]?.description && (
                      <p className="text-xs text-gray-600 mt-2">
                        {charts[activeChartIndex].description}
                      </p>
                    )}
                  </div>
                )}

                {/* Rich Detailed Analysis Section */}
                <div className="p-4 border-b border-gray-100">
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="text-gray-700 leading-relaxed rich-analysis"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownToHtml(currentAnalysis.detailedResponse || currentAnalysis.naturalResponse)
                      }}
                    />
                  </div>
                  
                  {/* Add some custom styling for rich content */}
                  <style jsx="true">{`
                    .rich-analysis table {
                      margin: 1rem 0;
                      border-collapse: collapse;
                      width: 100%;
                    }
                    .rich-analysis th, .rich-analysis td {
                      border: 1px solid #d1d5db;
                      padding: 0.5rem;
                      text-align: left;
                    }
                    .rich-analysis th {
                      background-color: #f9fafb;
                      font-weight: 600;
                    }
                    .rich-analysis ul {
                      margin: 1rem 0;
                      padding-left: 1.5rem;
                    }
                    .rich-analysis li {
                      margin-bottom: 0.5rem;
                    }
                    .rich-analysis h1, .rich-analysis h2, .rich-analysis h3 {
                      margin-top: 1.5rem;
                      margin-bottom: 1rem;
                    }
                  `}</style>
                </div>
              </>
            );
          })()}

          {/* SQL Query Section */}
          {(() => {
            const getDisplayAnalysis = () => {
              if (sessionHistory.length === 0) return queryResult;
              
              // If selectedAnalysisIndex is -1, show the latest (most recent)
              if (selectedAnalysisIndex === -1) {
                return sessionHistory[sessionHistory.length - 1] || queryResult;
              }
              
              // Otherwise show the selected analysis
              return sessionHistory[selectedAnalysisIndex] || queryResult;
            };
            
            const currentAnalysis = getDisplayAnalysis();
            
            return currentAnalysis && (
              <div className="p-4 border-b border-gray-100">
                <button
                  onClick={() => setShowSQLQuery(!showSQLQuery)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-medium text-gray-900">SQL Query</h4>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      showSQLQuery ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSQLQuery && (
                  <div className="mt-3 bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {currentAnalysis.sqlQuery}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Metadata Section */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Query Metadata</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Execution Time</div>
                <div className="text-gray-900 font-medium">
                  {queryResult.executionTime ? `${queryResult.executionTime}ms` : 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Records Found</div>
                <div className="text-gray-900 font-medium">
                  {queryResult.metadata?.recordCount?.toLocaleString() || 'N/A'}
                </div>
              </div>
              
              {queryResult.metadata?.queryType && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Query Type</div>
                  <div className="text-gray-900 font-medium capitalize">
                    {queryResult.metadata.queryType}
                  </div>
                </div>
              )}
              
              {queryResult.metadata?.visualizationType && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Chart Type</div>
                  <div className="text-gray-900 font-medium capitalize">
                    {queryResult.metadata.visualizationType}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Session ID</div>
                <div className="text-gray-900 font-mono text-xs">
                  {queryResult.sessionId}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Timestamp</div>
                <div className="text-gray-900 font-medium">
                  {new Date(queryResult.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;