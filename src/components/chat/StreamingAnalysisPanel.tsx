/**
 * StreamingAnalysisPanel - Progressive Analysis Panel with Streaming
 * Features: Real-time section building, typewriter effects, smooth transitions
 */

import React, { useState, useEffect } from 'react';
import {
  Copy, Download, Share2, Printer, Eye, EyeOff,
  Activity, Target, TrendingUp, BarChart3, FileText,
  Database, Clock, Layers, Sparkles, Loader2
} from 'lucide-react';
import TypewriterText from '../ui/TypewriterText';
import PlotlyChart from '../visualization/PlotlyChart';
import type { StreamingState, StreamingResponse } from '../../services/streamingAIService';
import type { EnhancedQueryResult } from '../../types/chat.types';

interface StreamingAnalysisPanelProps {
  streamingState?: StreamingState;
  queryResult?: EnhancedQueryResult | null;
  isStreaming?: boolean;
  isDarkMode?: boolean;
  onExportAnalysis?: () => void;
  onCopyResponse?: () => void;
  onShareAnalysis?: () => void;
  onPrintAnalysis?: () => void;
  onRetryVisualization?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface SectionState {
  content: string;
  isVisible: boolean;
  isStreaming: boolean;
  isComplete: boolean;
}

const StreamingAnalysisPanel: React.FC<StreamingAnalysisPanelProps> = ({
  streamingState,
  queryResult,
  isStreaming = false,
  isDarkMode = false,
  onExportAnalysis,
  onCopyResponse,
  onShareAnalysis,
  onPrintAnalysis,
  onRetryVisualization,
  className = '',
  style = {}
}) => {
  // Section states for progressive building
  const [sections, setSections] = useState<Record<string, SectionState>>({
    summary: { content: '', isVisible: false, isStreaming: false, isComplete: false },
    metrics: { content: '', isVisible: false, isStreaming: false, isComplete: false },
    analysis: { content: '', isVisible: false, isStreaming: false, isComplete: false },
    recommendations: { content: '', isVisible: false, isStreaming: false, isComplete: false }
  });

  const [visualizationState, setVisualizationState] = useState<{
    isVisible: boolean;
    isLoading: boolean;
    data: any;
  }>({
    isVisible: false,
    isLoading: false,
    data: null
  });

  const [overallProgress, setOverallProgress] = useState(0);

  // Handle streaming updates
  const handleStreamingUpdate = (response: StreamingResponse) => {
    if (response.type === 'artifact_section' && response.sectionType) {
      setSections(prev => ({
        ...prev,
        [response.sectionType!]: {
          content: response.content,
          isVisible: true,
          isStreaming: !response.isComplete,
          isComplete: response.isComplete
        }
      }));
    }

    if (response.type === 'visualization') {
      setVisualizationState({
        isVisible: true,
        isLoading: false,
        data: JSON.parse(response.content)
      });
    }

    // Update overall progress
    const completedSections = Object.values(sections).filter(s => s.isComplete).length;
    const totalSections = 5; // 4 text sections + 1 visualization
    setOverallProgress((completedSections / totalSections) * 100);
  };

  // Update from streaming state prop
  useEffect(() => {
    if (streamingState) {
      setSections({
        summary: {
          content: streamingState.artifactSections.summary.content,
          isVisible: !!streamingState.artifactSections.summary.content,
          isStreaming: !streamingState.artifactSections.summary.isComplete,
          isComplete: streamingState.artifactSections.summary.isComplete
        },
        metrics: {
          content: streamingState.artifactSections.metrics.content,
          isVisible: !!streamingState.artifactSections.metrics.content,
          isStreaming: !streamingState.artifactSections.metrics.isComplete,
          isComplete: streamingState.artifactSections.metrics.isComplete
        },
        analysis: {
          content: streamingState.artifactSections.analysis.content,
          isVisible: !!streamingState.artifactSections.analysis.content,
          isStreaming: !streamingState.artifactSections.analysis.isComplete,
          isComplete: streamingState.artifactSections.analysis.isComplete
        },
        recommendations: {
          content: streamingState.artifactSections.recommendations.content,
          isVisible: !!streamingState.artifactSections.recommendations.content,
          isStreaming: !streamingState.artifactSections.recommendations.isComplete,
          isComplete: streamingState.artifactSections.recommendations.isComplete
        }
      });

      setVisualizationState({
        isVisible: !!streamingState.artifactSections.visualization.content,
        isLoading: !streamingState.artifactSections.visualization.isComplete,
        data: streamingState.artifactSections.visualization.content
      });

      setOverallProgress(streamingState.overallProgress);
    }
  }, [streamingState]);

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Loading state with streaming animation
  if (isStreaming && !Object.values(sections).some(s => s.isVisible)) {
    return (
      <div className={`${className}`} style={style}>
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
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Analysis Streaming...
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Building comprehensive analysis
                </p>
              </div>
            </div>
          </div>

          {/* Streaming content area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                }}
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Preparing Analysis
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                Analysis sections will appear here as they're generated...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state when no data
  if (!isStreaming && !queryResult && !Object.values(sections).some(s => s.isVisible)) {
    return (
      <div className={`${className}`} style={style}>
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
                  Ready for analysis
                </p>
              </div>
            </div>
          </div>

          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center">
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
                Start a conversation to see real-time analysis, visualizations, and insights stream here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} style={style}>
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
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Activity className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isStreaming ? 'Analysis Streaming' : 'Analysis Artifacts'}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {queryResult ? formatTimestamp(queryResult.timestamp) : 'Real-time analysis'}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2">
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {Math.round(overallProgress)}%
                </div>
                <div
                  className="w-20 h-2 rounded-full overflow-hidden"
                  style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${overallProgress}%`,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCopyResponse}
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
                onClick={onExportAnalysis}
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

        {/* Content with progressive sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Query Summary */}
            {queryResult && (
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
                  "{queryResult.question}"
                </p>
              </div>
            )}

            {/* Progressive Sections */}
            {Object.entries(sections).map(([sectionKey, section]) => {
              if (!section.isVisible) return null;

              const getSectionIcon = (key: string) => {
                switch (key) {
                  case 'summary': return <Target className="w-5 h-5 text-blue-500" />;
                  case 'metrics': return <BarChart3 className="w-5 h-5 text-emerald-500" />;
                  case 'analysis': return <FileText className="w-5 h-5 text-purple-500" />;
                  case 'recommendations': return <TrendingUp className="w-5 h-5 text-orange-500" />;
                  default: return <Activity className="w-5 h-5 text-gray-500" />;
                }
              };

              const getSectionTitle = (key: string) => {
                switch (key) {
                  case 'summary': return 'Executive Summary';
                  case 'metrics': return 'Key Metrics';
                  case 'analysis': return 'Detailed Analysis';
                  case 'recommendations': return 'Recommendations';
                  default: return 'Section';
                }
              };

              return (
                <div
                  key={sectionKey}
                  className="rounded-xl overflow-hidden animate-in fade-in duration-500"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {getSectionIcon(sectionKey)}
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getSectionTitle(sectionKey)}
                      </h4>
                      {section.isStreaming && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                    </div>

                    <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                      <TypewriterText
                        text={section.content}
                        isStreaming={section.isStreaming}
                        speed={800} // Slightly faster for sections
                        className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        preserveWhitespace={true}
                        cursor={section.isStreaming}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Visualization Section */}
            {visualizationState.isVisible && (
              <div
                className="rounded-xl overflow-hidden animate-in fade-in duration-500"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Data Visualization
                    </h4>
                    {visualizationState.isLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                  </div>

                  {visualizationState.isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Generating visualization...
                        </p>
                      </div>
                    </div>
                  ) : visualizationState.data ? (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      <PlotlyChart
                        visualization={visualizationState.data}
                        loading={false}
                        error={null}
                        onRetry={onRetryVisualization}
                        onFullscreen={() => {}}
                        onExport={(format) => console.log(`Export chart as ${format}`)}
                        className="w-full"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingAnalysisPanel;