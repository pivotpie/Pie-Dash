/**
 * PieChat Enhanced - Drop-in replacement for PieChat.tsx
 * Adds memory, voice, and artifacts while maintaining full backward compatibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle, AlertTriangle, Mic, MicOff, Brain, FileText } from 'lucide-react';
import { hybridAIService } from '../../services/hybridAIService';
import { voiceService } from '../../services/voiceService';
import { memoryService } from '../../services/memoryService';
import { artifactService } from '../../services/artifactService';
import ChatHistory from './ChatHistory';
import AnalysisPanel from './AnalysisPanel';
import type { ChatSession, EnhancedQueryResult, EnhancedChatMessage } from '../../types/chat.types';

interface PieChatEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  // Enhanced features - all optional for backward compatibility
  enableMemory?: boolean;
  enableVoice?: boolean;
  enableArtifacts?: boolean;
  enableV2Features?: boolean;
}

const PieChatEnhanced: React.FC<PieChatEnhancedProps> = ({
  isOpen,
  onClose,
  initialQuery,
  enableMemory = false,
  enableVoice = false,
  enableArtifacts = false,
  enableV2Features = false
}) => {
  // Core state (same as original PieChat)
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
      return '';
    }
  });
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<EnhancedQueryResult | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Enhanced features state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [memoryInsights, setMemoryInsights] = useState<string[]>([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [artifacts, setArtifacts] = useState<any[]>([]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize enhanced features
  useEffect(() => {
    if (!isOpen) return;

    // Configure hybrid service with enhanced features
    hybridAIService.updateConfig({
      useV2Features: enableV2Features,
      enableMemory: enableMemory,
      enableProgressiveDisclosure: enableV2Features,
      enableVoiceCommands: enableVoice,
      enableArtifacts: enableArtifacts,
      fallbackToV1: true // Always safe fallback
    });

    console.log('🚀 PieChatEnhanced initialized with features:', {
      memory: enableMemory,
      voice: enableVoice,
      artifacts: enableArtifacts,
      v2: enableV2Features
    });

    // Initialize welcome session if none exist
    if (sessions.length === 0) {
      initializeWelcomeSession();
    }

    // Set up voice commands if enabled
    if (enableVoice) {
      setupVoiceCommands();
    }

    // Load memory insights if enabled
    if (enableMemory && currentSessionId) {
      loadMemoryInsights();
    }

    // Handle initial query
    if (initialQuery) {
      setInputValue(initialQuery);
      setTimeout(() => handleSendMessage(initialQuery), 500);
    }

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, enableMemory, enableVoice, enableArtifacts, enableV2Features]);

  // Voice commands setup
  const setupVoiceCommands = async () => {
    if (!enableVoice) return;

    try {
      const isSupported = await voiceService.initialize('en-US');
      if (isSupported) {
        voiceService.onTranscript((transcript, confidence) => {
          if (confidence > 0.7) {
            setVoiceTranscript(transcript);
            if (transcript.toLowerCase().includes('send') || transcript.toLowerCase().includes('submit')) {
              handleSendMessage(transcript.replace(/send|submit/gi, '').trim());
            } else {
              setInputValue(prev => prev + ' ' + transcript);
            }
          }
        });

        voiceService.onCommand((command) => {
          handleVoiceCommand(command);
        });

        console.log('🎤 Voice commands initialized');
      }
    } catch (error) {
      console.warn('Voice service initialization failed (non-critical):', error);
    }
  };

  const handleVoiceCommand = (command: any) => {
    switch (command.type) {
      case 'query':
        handleSendMessage(command.transcript);
        break;
      case 'clear':
        setInputValue('');
        break;
      case 'new_session':
        createNewSession();
        break;
      default:
        console.log('Unhandled voice command:', command);
    }
  };

  // Memory insights loading
  const loadMemoryInsights = async () => {
    if (!enableMemory || !currentSessionId) return;

    try {
      const context = memoryService.getAnalysisContext(currentSessionId);
      if (context) {
        // Extract insights from memory context
        const insights = [
          context.focusAreas?.length ? `Focus areas: ${context.focusAreas.join(', ')}` : '',
          context.currentHypotheses?.length ? `Active hypotheses: ${context.currentHypotheses.length}` : '',
          context.sessionType ? `Session type: ${context.sessionType}` : ''
        ].filter(Boolean);

        setMemoryInsights(insights);
        console.log('🧠 Memory insights loaded:', insights);
      }
    } catch (error) {
      console.warn('Failed to load memory insights (non-critical):', error);
    }
  };

  const initializeWelcomeSession = () => {
    const welcomeSessionId = `welcome_${Date.now()}`;
    const enhancedFeaturesList = [
      enableMemory && '🧠 Memory across sessions',
      enableVoice && '🎤 Voice commands',
      enableArtifacts && '📄 Artifacts & exports',
      enableV2Features && '⚡ Enhanced analysis'
    ].filter(Boolean);

    const welcomeMessage: EnhancedChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm Pie, your Dubai grease collection assistant${enhancedFeaturesList.length ? ' with enhanced features' : ''}.

I can analyze real-time collection data, performance metrics, and operational insights${enhancedFeaturesList.length ? `:\n\n${enhancedFeaturesList.join('\n')}` : '.'}

What would you like to know about Dubai grease trap collection operations?`,
      timestamp: new Date().toISOString()
    };

    const welcomeSession: ChatSession = {
      id: welcomeSessionId,
      title: 'Welcome to Enhanced Pie AI',
      messages: [welcomeMessage],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setSessions([welcomeSession]);
    setCurrentSessionId(welcomeSessionId);
  };

  // Enhanced message sending with hybrid service
  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    setInputValue('');
    setIsLoading(true);
    setIsAnalyzing(true);

    const userMessage: EnhancedChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    try {
      // Use hybrid service for intelligent routing
      const result: EnhancedQueryResult = await hybridAIService.processQuery(
        content,
        currentSessionId || undefined
      );

      setCurrentAnalysisResult(result);

      // Create artifact if enabled
      if (enableArtifacts && result.detailedResponse) {
        try {
          const artifact = await artifactService.createArtifact({
            title: `Analysis: ${content.substring(0, 50)}...`,
            type: 'analysis',
            content: result.detailedResponse,
            metadata: {
              queryType: result.metadata.queryType,
              recordCount: result.metadata.recordCount,
              sessionId: result.sessionId
            }
          });
          setArtifacts(prev => [artifact, ...prev.slice(0, 9)]); // Keep last 10
        } catch (error) {
          console.warn('Artifact creation failed (non-critical):', error);
        }
      }

      const assistantMessage: EnhancedChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.naturalResponse,
        timestamp: result.timestamp,
        queryResult: result
      };

      // Update sessions
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

      // Refresh memory insights if enabled
      if (enableMemory) {
        setTimeout(loadMemoryInsights, 500);
      }

    } catch (error) {
      console.error('Enhanced AI Service error:', error);

      const errorMessage: EnhancedChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble processing your request. ${enableV2Features ? 'The enhanced analysis features' : 'The system'} might be experiencing issues. Please try again or rephrase your question.`,
        timestamp: new Date().toISOString()
      };

      // Add error message to session (same logic as original)
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

  // Voice control
  const toggleVoiceListening = async () => {
    if (!enableVoice) return;

    try {
      if (isVoiceListening) {
        voiceService.stopListening();
        setIsVoiceListening(false);
      } else {
        const started = await voiceService.startListening();
        setIsVoiceListening(started);
      }
    } catch (error) {
      console.error('Voice control error:', error);
      setIsVoiceListening(false);
    }
  };

  const createNewSession = () => {
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
  };

  // Keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    // Enhanced shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          createNewSession();
          break;
        case 'm':
          if (enableMemory) {
            e.preventDefault();
            setShowMemoryPanel(!showMemoryPanel);
          }
          break;
      }
    }
  };

  // Auto-scroll and persistence (same as original)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Enhanced Dialog */}
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
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Enhanced Pie AI Assistant
                    {(enableV2Features || enableMemory || enableVoice || enableArtifacts) && (
                      <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                        ⚡ Enhanced
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-blue-100">Dubai Grease Collection Expert</p>
                </div>
              </div>

              {/* Enhanced header controls */}
              <div className="flex items-center gap-2">
                {enableMemory && (
                  <button
                    onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                    className={`p-2 rounded-full transition-colors ${
                      showMemoryPanel
                        ? 'bg-white bg-opacity-30'
                        : 'hover:bg-white hover:bg-opacity-20'
                    }`}
                    title="Memory Insights"
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                )}

                {enableVoice && (
                  <button
                    onClick={toggleVoiceListening}
                    className={`p-2 rounded-full transition-colors ${
                      isVoiceListening
                        ? 'bg-red-500 bg-opacity-80'
                        : 'hover:bg-white hover:bg-opacity-20'
                    }`}
                    title={isVoiceListening ? 'Stop Listening' : 'Start Voice Command'}
                  >
                    {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}

                {enableArtifacts && artifacts.length > 0 && (
                  <button
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors relative"
                    title={`${artifacts.length} Artifacts`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {artifacts.length}
                    </span>
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

            {/* Memory Panel (if enabled and shown) */}
            {enableMemory && showMemoryPanel && memoryInsights.length > 0 && (
              <div className="bg-blue-50 border-b p-3">
                <div className="text-sm">
                  <strong className="text-blue-800">🧠 Memory Insights:</strong>
                  <div className="mt-1 space-y-1">
                    {memoryInsights.map((insight, idx) => (
                      <div key={idx} className="text-blue-700 text-xs">{insight}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice Status */}
            {enableVoice && (isVoiceListening || voiceTranscript) && (
              <div className="bg-green-50 border-b p-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">
                    {isVoiceListening ? 'Listening...' : 'Voice input received'}
                  </span>
                  {voiceTranscript && (
                    <span className="text-green-600 italic">"{voiceTranscript}"</span>
                  )}
                </div>
              </div>
            )}

            {/* 3-Column Layout (same as original) */}
            <div className="flex-1 flex overflow-hidden">
              <ChatHistory
                sessions={sessions}
                currentSessionId={currentSessionId}
                isCollapsed={historyCollapsed}
                onSessionSelect={setCurrentSessionId}
                onNewSession={createNewSession}
                onDeleteSession={(sessionId) => {
                  setSessions(prev => prev.filter(s => s.id !== sessionId));
                  if (currentSessionId === sessionId) {
                    setCurrentSessionId(sessions[0]?.id || '');
                  }
                }}
                onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
                onSearchSessions={(query) => console.log('Search sessions:', query)}
              />

              {/* Conversation Column */}
              <div className="flex flex-col border-l border-gray-200 w-[30%] min-w-[300px]">
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
                            <span className="text-sm font-medium text-blue-600">
                              Enhanced Pie
                            </span>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>

                        {/* Enhanced action buttons */}
                        {message.role === 'assistant' && message.queryResult && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setCurrentAnalysisResult(message.queryResult!)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              📊 Analysis
                            </button>
                            {message.queryResult.visualization && (
                              <button
                                onClick={() => setCurrentAnalysisResult(message.queryResult!)}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                📈 Chart
                              </button>
                            )}
                            {enableV2Features && message.queryResult.metadata && (
                              <span className="text-xs text-gray-500">
                                {(message.queryResult.metadata as any).confidence &&
                                  `${Math.round((message.queryResult.metadata as any).confidence * 100)}% confident`
                                }
                              </span>
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
                          <span className="text-sm font-medium text-blue-600">Enhanced Pie</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {enableV2Features ? 'Enhanced analysis in progress...' : 'Analyzing data...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={
                        enableVoice
                          ? "Ask about data or use voice commands..."
                          : "Ask about Dubai grease collection data..."
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={isLoading}
                    />

                    {enableVoice && (
                      <button
                        onClick={toggleVoiceListening}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          isVoiceListening
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}

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

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        {enableV2Features ? 'Enhanced' : 'Real-time'} Dubai grease collection analysis
                      </span>
                    </div>

                    {(enableMemory || enableVoice || enableArtifacts) && (
                      <div className="flex gap-1 text-xs">
                        {enableMemory && <span title="Memory enabled">🧠</span>}
                        {enableVoice && <span title="Voice enabled">🎤</span>}
                        {enableArtifacts && <span title="Artifacts enabled">📄</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Panel */}
              <AnalysisPanel
                className="flex-1 border-l border-gray-200 min-w-[400px]"
                queryResult={currentAnalysisResult}
                sessionHistory={messages
                  .filter(msg => msg.role === 'assistant' && msg.queryResult)
                  .map(msg => msg.queryResult!)
                }
                isLoading={isAnalyzing}
                onExportAnalysis={() => console.log('Export analysis')}
                onCopyResponse={() => {
                  if (currentAnalysisResult?.naturalResponse) {
                    navigator.clipboard.writeText(currentAnalysisResult.naturalResponse);
                  }
                }}
                onShareAnalysis={() => console.log('Share analysis')}
                onPrintAnalysis={() => window.print()}
                onRetryVisualization={() => console.log('Retry visualization')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieChatEnhanced;