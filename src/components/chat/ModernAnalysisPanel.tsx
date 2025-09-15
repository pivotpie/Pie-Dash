/**
 * ModernAnalysisPanel - Glass Morphism Artifact Panel
 * Features: Modern glass effects, smooth animations, futuristic styling
 */

import React, { useState, useCallback } from 'react';
import {
  Copy, Download, Share2, Printer, RotateCcw, Maximize2,
  ChevronDown, ChevronUp, Code, BarChart3, FileText,
  Zap, Clock, Database, TrendingUp, Eye, EyeOff,
  Layers, Activity, Target, Sparkles
} from 'lucide-react';
import PlotlyChart from '../visualization/PlotlyChart';
import EnhancedMarkdownRenderer from '../ui/EnhancedMarkdownRenderer';
import { EnhancedQueryResult } from '../../types/chat.types';

interface ModernAnalysisPanelProps {
  queryResult?: EnhancedQueryResult | null;
  sessionHistory?: EnhancedQueryResult[];
  isLoading?: boolean;
  isDarkMode?: boolean;
  onExportAnalysis?: () => void;
  onCopyResponse?: () => void;
  onShareAnalysis?: () => void;
  onPrintAnalysis?: () => void;
  onRetryVisualization?: () => void;
  className?: string;
}

const ModernAnalysisPanel: React.FC<ModernAnalysisPanelProps> = ({
  queryResult,
  sessionHistory = [],
  isLoading,
  isDarkMode = false,
  onExportAnalysis,
  onCopyResponse,
  onShareAnalysis,
  onPrintAnalysis,
  onRetryVisualization,
  className = ''
}) => {
  const [showSQLQuery, setShowSQLQuery] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(-1);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    visualization: true,
    analysis: true,
    metadata: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const handleExportAnalysis = useCallback(() => {
    if (queryResult && onExportAnalysis) {
      onExportAnalysis();
    }
  }, [queryResult, onExportAnalysis]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Loading state with modern styling
  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div
          className="h-full rounded-2xl flex items-center justify-center"
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
              style={{
                borderRightColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                borderBottomColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                borderLeftColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                borderTopColor: 'transparent'
              }}
            />
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                Analyzing your data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state with modern styling
  if (!queryResult) {
    return (
      <div className={`${className} p-6`}>
        <div
          className="h-full rounded-2xl flex items-center justify-center"
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(30,30,30,0.5) 0%, rgba(40,40,40,0.3) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(248,250,252,0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <div className="text-center max-w-sm">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
              }}
            >
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Ready for Analysis
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
              Start a conversation to see real-time analysis, visualizations, and insights appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get current analysis to display
  const getDisplayAnalysis = () => {
    // If no session history, use queryResult
    if (sessionHistory.length === 0) return queryResult;

    // If queryResult is explicitly provided and different from the latest session, prioritize it
    // This handles when user clicks "View Analysis" on a specific message
    if (queryResult && sessionHistory.length > 0) {
      const latestSession = sessionHistory[sessionHistory.length - 1];
      // Compare by timestamp or ID to see if it's a different analysis
      if (queryResult.timestamp !== latestSession?.timestamp) {
        return queryResult;
      }
    }

    // Default behavior: use selected index or latest from session
    if (selectedAnalysisIndex === -1) {
      return sessionHistory[sessionHistory.length - 1] || queryResult;
    }
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
    <div className={`${className}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{
            background: isDarkMode
              ? 'linear-gradient(90deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Analysis Artifacts
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTimestamp(currentAnalysis.timestamp)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyResponse}
                className={`p-2 rounded-xl transition-all ${
                  isDarkMode
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                }`}
                title="Copy Response"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportAnalysis}
                className={`p-2 rounded-xl transition-all ${
                  isDarkMode
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                }`}
                title="Export Analysis"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={onShareAnalysis}
                className={`p-2 rounded-xl transition-all ${
                  isDarkMode
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                }`}
                title="Share Analysis"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Query Summary */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-500" />
                <h4 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Query Analysis
                </h4>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-600'} italic leading-relaxed`}>
                "{currentAnalysis.question}"
              </p>
            </div>

            {/* Visualization Section */}
            {charts.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <button
                  onClick={() => toggleSection('visualization')}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Data Visualization
                    </h4>
                    {charts.length > 1 && (
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {charts.length} charts
                      </span>
                    )}
                  </div>
                  {expandedSections.visualization ? (
                    <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>

                {expandedSections.visualization && (
                  <div className="p-4 pt-0">
                    {charts.length > 1 && (
                      <div className="flex gap-2 mb-4">
                        {charts.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveChartIndex(index)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              activeChartIndex === index
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : isDarkMode
                                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Chart {index + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      <PlotlyChart
                        visualization={charts[activeChartIndex]}
                        loading={false}
                        error={null}
                        onRetry={onRetryVisualization}
                        onFullscreen={() => setIsFullscreen(!isFullscreen)}
                        onExport={(format) => console.log(`Export chart as ${format}`)}
                        className="w-full"
                      />
                    </div>

                    {charts[activeChartIndex]?.description && (
                      <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {charts[activeChartIndex].description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Response */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <button
                onClick={() => toggleSection('analysis')}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Detailed Analysis
                  </h4>
                </div>
                {expandedSections.analysis ? (
                  <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </button>

              {expandedSections.analysis && (
                <div className="p-4 pt-0">
                  <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                    <EnhancedMarkdownRenderer
                      content={currentAnalysis.detailedResponse || currentAnalysis.naturalResponse}
                      className={`rich-analysis ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    />
                  </div>

                  {/* Custom styling for rich content */}
                  <style jsx>{`
                    .rich-analysis table {
                      margin: 1rem 0 !important;
                      border-collapse: collapse !important;
                      width: 100% !important;
                      border-radius: 8px !important;
                      overflow: hidden !important;
                    }
                    .rich-analysis th, .rich-analysis td {
                      border: 1px solid ${isDarkMode ? '#374151' : '#d1d5db'} !important;
                      padding: 0.75rem !important;
                      text-align: left !important;
                    }
                    .rich-analysis th {
                      background-color: ${isDarkMode ? '#1f2937' : '#dbeafe'} !important;
                      font-weight: 600 !important;
                      color: ${isDarkMode ? '#f3f4f6' : '#1e40af'} !important;
                    }
                    .rich-analysis td {
                      background-color: ${isDarkMode ? '#374151' : '#ffffff'} !important;
                      color: ${isDarkMode ? '#d1d5db' : '#374151'} !important;
                    }
                    .rich-analysis tr:hover td {
                      background-color: ${isDarkMode ? '#4b5563' : '#f3f4f6'} !important;
                    }
                    .rich-analysis .overflow-x-auto {
                      border-radius: 8px !important;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
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
                      color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
                    }
                  `}</style>
                </div>
              )}
            </div>

            {/* SQL Query Section */}
            {currentAnalysis.sqlQuery && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <button
                  onClick={() => setShowSQLQuery(!showSQLQuery)}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Code className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      SQL Query
                    </h4>
                  </div>
                  {showSQLQuery ? (
                    <EyeOff className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <Eye className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>

                {showSQLQuery && (
                  <div className="p-4 pt-0">
                    <div
                      className="rounded-lg p-4 overflow-x-auto"
                      style={{
                        background: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(30,41,59,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap">
                        {currentAnalysis.sqlQuery}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata Section */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <button
                onClick={() => toggleSection('metadata')}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Query Metadata
                  </h4>
                </div>
                {expandedSections.metadata ? (
                  <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </button>

              {expandedSections.metadata && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Execution Time
                        </span>
                      </div>
                      <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentAnalysis.executionTime ? `${currentAnalysis.executionTime}ms` : 'N/A'}
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-3 h-3 text-emerald-500" />
                        <span className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Records Found
                        </span>
                      </div>
                      <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentAnalysis.metadata?.recordCount?.toLocaleString() || 'N/A'}
                      </div>
                    </div>

                    {currentAnalysis.metadata?.queryType && (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3 h-3 text-purple-500" />
                          <span className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Query Type
                          </span>
                        </div>
                        <div className={`font-bold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {currentAnalysis.metadata.queryType}
                        </div>
                      </div>
                    )}

                    {currentAnalysis.metadata?.visualizationType && (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-3 h-3 text-indigo-500" />
                          <span className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chart Type
                          </span>
                        </div>
                        <div className={`font-bold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {currentAnalysis.metadata.visualizationType}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAnalysisPanel;