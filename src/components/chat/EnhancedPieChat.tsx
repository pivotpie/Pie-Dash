/**
 * Enhanced PieChat - Backward Compatible Enhancement
 * Extends existing PieChat.tsx with progressive disclosure and memory features
 * 
 * MIGRATION STRATEGY:
 * 1. This component extends the original PieChat without breaking it
 * 2. Can be used as drop-in replacement by changing import
 * 3. Falls back to original behavior if enhanced features disabled
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle, AlertTriangle, Brain, Lightbulb, CheckCircle2, HelpCircle } from 'lucide-react';

// Use enhanced services with fallback
import { enhancedAIServiceV2 } from '../../services/enhancedAIServiceV2';
import { memoryService } from '../../services/memoryService';

// Import both original and enhanced types
import type { ChatSession, EnhancedChatMessage, EnhancedQueryResult } from '../../types/chat.types';
import type { 
  SuggestedQuery,
  FeatureFlags
} from '../../types/enhanced-chat.types';
import { DEFAULT_FEATURE_FLAGS } from '../../types/enhanced-chat.types';

// Import existing components - they will work unchanged
import ChatHistory from './ChatHistory';
import AnalysisPanel from './AnalysisPanel';

interface EnhancedPieChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  // New optional props for enhanced features
  enableEnhancedFeatures?: boolean;
  featureFlags?: Partial<FeatureFlags>;
}

const EnhancedPieChat: React.FC<EnhancedPieChatProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery,
  enableEnhancedFeatures = true,
  featureFlags = {}
}) => {
  // Merge feature flags with defaults
  const activeFeatureFlags: FeatureFlags = { 
    ...DEFAULT_FEATURE_FLAGS, 
    ...featureFlags 
  };

  // === EXISTING STATE (unchanged) ===
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('pie-chat-sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pie-chat-current-session');
      return saved || '';
    } catch (error) {
      console.error('Failed to load current session ID:', error);
      return '';
    }
  });
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<EnhancedQueryResult | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // === NEW ENHANCED STATE ===
  const [progressiveDisclosureEnabled, setProgressiveDisclosureEnabled] = useState(
    enableEnhancedFeatures && activeFeatureFlags.enableProgressiveDisclosure
  );
  const [, setPendingValidations] = useState<{messageId: string, questions: string[]}[]>([]);
  const [showConfidenceScores, setShowConfidenceScores] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestedQuery[]>([]);

  // === EXISTING REFS AND DERIVED STATE (unchanged) ===
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === EXISTING EFFECTS (unchanged) ===
  useEffect(() => {
    if (isOpen) {
      if (sessions.length === 0) {
        const welcomeSessionId = `welcome_${Date.now()}`;
        const welcomeMessage: EnhancedChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: progressiveDisclosureEnabled
            ? `Hi! I'm Pie, your enhanced Dubai grease collection assistant. I now provide confidence scoring, smart suggestions, and contextual insights.

I can analyze patterns, suggest follow-up questions, and help validate your findings with my new progressive analysis capabilities.

What would you like to explore about Dubai's grease trap collection operations?`
            : `Hi! I'm Pie, your Dubai grease collection assistant. I can help you analyze real-time collection data, performance metrics, operational insights, and generate visualizations.

What would you like to know about Dubai grease trap collection operations?`,
          timestamp: new Date().toISOString()
        };
        
        const welcomeSession: ChatSession = {
          id: welcomeSessionId,
          title: 'Welcome to Pie AI',
          messages: [welcomeMessage],
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        setSessions([welcomeSession]);
        setCurrentSessionId(welcomeSessionId);
      }
      
      if (initialQuery) {
        setInputValue(initialQuery);
        setTimeout(() => {
          handleSendMessage(initialQuery);
        }, 500);
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, initialQuery, progressiveDisclosureEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('pie-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      if (currentSessionId) {
        localStorage.setItem('pie-chat-current-session', currentSessionId);
      }
    } catch (error) {
      console.error('Failed to save current session ID:', error);
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // === ENHANCED MESSAGE HANDLING ===
  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    setInputValue('');
    setIsLoading(true);
    setIsAnalyzing(true);

    // Create user message
    const userMessage: EnhancedChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    try {
      // Always use enhanced service V2 for consistent performance and features
      const result = await enhancedAIServiceV2.processQueryV2(content, currentSessionId || undefined);
      
      // Update suggestions if available
      if (result.followUpSuggestions) {
        setCurrentSuggestions(result.followUpSuggestions);
      }
      
      // Add validation if needed
      if (result.validationNeeded && result.assumptions && result.assumptions.length > 0) {
        setPendingValidations(prev => [...prev, {
          messageId: `assistant_${Date.now()}`,
          questions: result.assumptions.slice(0, 3) // Limit to 3 questions
        }]);
      }
      
      setCurrentAnalysisResult(result);

      // Create assistant response message - enhance if features enabled
      let assistantMessage: EnhancedChatMessage;
      
      if (enableEnhancedFeatures && progressiveDisclosureEnabled && result.confidence !== undefined) {
        // Enhanced message with metadata
        assistantMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant', 
          content: result.naturalResponse,
          timestamp: result.timestamp,
          queryResult: result
        };
      } else {
        // Original message format
        assistantMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant', 
          content: result.naturalResponse,
          timestamp: result.timestamp,
          queryResult: result
        };
      }

      // Update session with both messages
      const sessionIdToUse = currentSessionId || result.sessionId || `session_${Date.now()}`;
      
      setSessions(prev => {
        const existingSession = prev.find(s => s.id === sessionIdToUse);
        
        if (existingSession) {
          return prev.map(session => 
            session.id === sessionIdToUse 
              ? { 
                  ...session, 
                  messages: [...session.messages, userMessage, assistantMessage],
                  lastUpdated: result.timestamp 
                }
              : session
          );
        } else {
          const newSession: ChatSession = {
            id: sessionIdToUse,
            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
            messages: [userMessage, assistantMessage],
            lastUpdated: result.timestamp,
            createdAt: result.timestamp
          };
          return [newSession, ...prev];
        }
      });

      if (!currentSessionId) {
        setCurrentSessionId(sessionIdToUse);
      }

      // Update memory service if enabled
      if (enableEnhancedFeatures && activeFeatureFlags.enableMemoryService) {
        try {
          memoryService.generateSessionSummary({
            id: sessionIdToUse,
            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
            messages: [userMessage, assistantMessage],
            lastUpdated: result.timestamp,
            createdAt: result.timestamp
          });
        } catch (error) {
          console.warn('Memory service update failed:', error);
          // Don't fail the main operation
        }
      }

    } catch (error) {
      console.error('Enhanced AI Service error:', error);
      
      const errorMessage: EnhancedChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: enableEnhancedFeatures && progressiveDisclosureEnabled
          ? "I'm having trouble processing your request right now. This might be due to database connectivity or AI service issues. My enhanced features are working to provide fallback analysis. Please try again or rephrase your question."
          : "I'm having trouble processing your request right now. This might be due to database connectivity or AI service issues. Please try again or rephrase your question.",
        timestamp: new Date().toISOString()
      };
      
      const sessionIdToUse = currentSessionId || `session_${Date.now()}`;
      
      setSessions(prev => {
        const existingSession = prev.find(s => s.id === sessionIdToUse);
        
        if (existingSession) {
          return prev.map(session => 
            session.id === sessionIdToUse 
              ? { 
                  ...session, 
                  messages: [...session.messages, userMessage, errorMessage],
                  lastUpdated: new Date().toISOString() 
                }
              : session
          );
        } else {
          const newSession: ChatSession = {
            id: sessionIdToUse,
            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
            messages: [userMessage, errorMessage],
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          return [newSession, ...prev];
        }
      });

      if (!currentSessionId) {
        setCurrentSessionId(sessionIdToUse);
      }
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // === ENHANCED UI HELPERS ===
  const handleSuggestionClick = (suggestion: SuggestedQuery) => {
    setInputValue(suggestion.query);
    setCurrentSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle2 className="w-3 h-3" />;
    if (confidence >= 0.6) return <HelpCircle className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Center Dialog Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-2xl transform transition-all duration-300 ease-out font-['Poppins',_sans-serif] text-sm"
          style={{ 
            width: '90vw',
            height: '85vh',
            minWidth: '1200px',
            transform: isOpen ? 'scale(1) opacity(1)' : 'scale(0.95) opacity(0)',
            fontSize: '14px'
          }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {enableEnhancedFeatures && progressiveDisclosureEnabled ? (
                    <Brain className="w-4 h-4" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {enableEnhancedFeatures && progressiveDisclosureEnabled ? 'Enhanced Pie AI' : 'Pie AI Assistant'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {enableEnhancedFeatures && progressiveDisclosureEnabled 
                      ? 'Advanced Dubai Grease Collection Expert with Confidence Scoring'
                      : 'Dubai Grease Collection Expert'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Enhanced Features Toggle */}
                {enableEnhancedFeatures && (
                  <button
                    onClick={() => setProgressiveDisclosureEnabled(!progressiveDisclosureEnabled)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      progressiveDisclosureEnabled 
                        ? 'bg-white bg-opacity-20 text-white' 
                        : 'bg-white bg-opacity-10 text-blue-200'
                    }`}
                    title="Toggle Enhanced Features"
                  >
                    {progressiveDisclosureEnabled ? 'Enhanced' : 'Standard'}
                  </button>
                )}
                {/* Confidence Scores Toggle */}
                {progressiveDisclosureEnabled && (
                  <button
                    onClick={() => setShowConfidenceScores(!showConfidenceScores)}
                    className={`p-1 rounded transition-colors ${
                      showConfidenceScores 
                        ? 'bg-white bg-opacity-20' 
                        : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                    title="Toggle Confidence Scores"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Column 1: Chat History (unchanged) */}
              <ChatHistory 
                sessions={sessions}
                currentSessionId={currentSessionId}
                isCollapsed={historyCollapsed}
                onSessionSelect={(sessionId) => setCurrentSessionId(sessionId)}
                onNewSession={() => {
                  const newSessionId = `session_${Date.now()}`;
                  const newSession: ChatSession = {
                    id: newSessionId,
                    title: 'New Chat',
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                  };
                  setSessions(prev => [newSession, ...prev]);
                  setCurrentSessionId(newSessionId);
                }}
                onDeleteSession={(sessionId) => {
                  setSessions(prev => prev.filter(s => s.id !== sessionId));
                  if (currentSessionId === sessionId) {
                    setCurrentSessionId(sessions[0]?.id || '');
                  }
                }}
                onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
                onSearchSessions={(query) => {
                  console.log('Search sessions:', query);
                }}
              />
              
              {/* Column 2: Enhanced Conversation */}
              <div className="flex flex-col border-l border-gray-200 w-[30%] min-w-[300px]">
                {/* Conversation Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">P</span>
                            </div>
                            <span className="text-sm font-medium text-blue-600">Pie</span>
                            
                            {/* Enhanced: Show confidence score */}
                            {progressiveDisclosureEnabled && showConfidenceScores && message.queryResult && 'confidence' in message.queryResult && (
                              <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(message.queryResult.confidence as number)}`}>
                                {getConfidenceIcon(message.queryResult.confidence as number)}
                                <span>{((message.queryResult.confidence as number) * 100).toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* Enhanced: Show analysis level */}
                        {progressiveDisclosureEnabled && message.role === 'assistant' && message.queryResult && 'analysisLevel' in message.queryResult && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Brain className="w-3 h-3" />
                              <span>Analysis Level: {(message.queryResult.analysisLevel as string).charAt(0).toUpperCase() + (message.queryResult.analysisLevel as string).slice(1)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Original: Quick access buttons */}
                        {message.role === 'assistant' && message.queryResult && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setCurrentAnalysisResult(message.queryResult!)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              📊 View Analysis
                            </button>
                            {message.queryResult.visualization && (
                              <button
                                onClick={() => setCurrentAnalysisResult(message.queryResult!)}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                📈 View Chart
                              </button>
                            )}
                            <span className="text-xs text-gray-500">
                              {message.queryResult.metadata.recordCount} records
                            </span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[90%]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">P</span>
                          </div>
                          <span className="text-sm font-medium text-blue-600">Pie</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {progressiveDisclosureEnabled ? 'Performing enhanced analysis...' : 'Analyzing data...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced: Suggestions Panel */}
                {progressiveDisclosureEnabled && currentSuggestions.length > 0 && (
                  <div className="border-t p-3 bg-blue-50">
                    <div className="text-xs font-medium text-gray-700 mb-2">💡 Suggested follow-ups:</div>
                    <div className="space-y-1">
                      {currentSuggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left text-xs p-2 bg-white rounded border hover:bg-blue-100 transition-colors"
                        >
                          <div className="font-medium">{suggestion.query}</div>
                          <div className="text-gray-500">{suggestion.reasoning}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={progressiveDisclosureEnabled 
                        ? "Ask about Dubai grease collection data with enhanced insights..."
                        : "Ask about Dubai grease collection data..."
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {progressiveDisclosureEnabled 
                        ? 'Enhanced real-time Dubai grease collection analysis with confidence scoring'
                        : 'Real-time Dubai grease collection analysis'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Column 3: Analysis & Visualization Panel (unchanged interface) */}
              <AnalysisPanel 
                className="flex-1 border-l border-gray-200 min-w-[400px]"
                queryResult={currentAnalysisResult}
                sessionHistory={messages
                  .filter(msg => msg.role === 'assistant' && msg.queryResult)
                  .map(msg => msg.queryResult!)
                }
                isLoading={isAnalyzing}
                onExportAnalysis={() => {
                  console.log('Export analysis');
                }}
                onCopyResponse={() => {
                  if (currentAnalysisResult?.naturalResponse) {
                    navigator.clipboard.writeText(currentAnalysisResult.naturalResponse);
                  }
                }}
                onShareAnalysis={() => {
                  console.log('Share analysis');
                }}
                onPrintAnalysis={() => {
                  window.print();
                }}
                onRetryVisualization={() => {
                  console.log('Retry visualization');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPieChat;