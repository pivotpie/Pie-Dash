/**
 * ModernPieChat - Ultra-Modern Futuristic Chat Interface
 * Features: Glass morphism, light theme, modern typography, smooth animations
 * Inspired by modern AI providers with cutting-edge design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, Loader2, MessageCircle, Sparkles, Brain,
  BarChart3, FileText, Copy, Share2, Download,
  Plus, Search, Archive, Settings, Moon, Sun,
  ChevronDown, ChevronRight, ChevronLeft, Zap, Target, TrendingUp
} from 'lucide-react';
import { enhancedAIService } from '../../services/enhancedAIService';
import { streamingAIService, type StreamingResponse, type StreamingState } from '../../services/streamingAIService';
import ModernAnalysisPanel from './ModernAnalysisPanel';
import StreamingAnalysisPanel from './StreamingAnalysisPanel';
import TypewriterText from '../ui/TypewriterText';
import type { ChatSession, EnhancedQueryResult, EnhancedChatMessage } from '../../types/chat.types';
import type { SuggestedQuery } from '../../types/enhanced-chat.types';

interface ModernPieChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  enableStreaming?: boolean; // Enable progressive streaming mode
}

const ModernPieChat: React.FC<ModernPieChatProps> = ({ isOpen, onClose, initialQuery, enableStreaming = true }) => {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('modern-pie-chat-sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('modern-pie-chat-current-session');
      return saved || '';
    } catch (error) {
      console.error('Failed to load current session ID:', error);
      return '';
    }
  });
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<EnhancedQueryResult | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deepDiveQuestions, setDeepDiveQuestions] = useState<SuggestedQuery[]>([]);

  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    briefResponse: { content: '', isStreaming: false, isComplete: false },
    artifactSections: {
      summary: { content: '', isComplete: false },
      metrics: { content: '', isComplete: false },
      analysis: { content: '', isComplete: false },
      recommendations: { content: '', isComplete: false },
      visualization: { content: null, isComplete: false }
    },
    overallProgress: 0,
    isProcessing: false
  });
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<EnhancedChatMessage | null>(null);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    if (isOpen) {
      if (sessions.length === 0) {
        const welcomeSessionId = `welcome_${Date.now()}`;
        const welcomeMessage: EnhancedChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm Pie AI, your advanced Dubai grease collection intelligence assistant. ✨

I can help you with:
🔍 **Real-time Data Analysis** - Query live collection metrics
📊 **Performance Insights** - Analyze efficiency and delays
🗺️ **Geographic Patterns** - Understand regional collection trends
📈 **Predictive Analytics** - Forecast collection volumes and optimize routes

What would you like to explore about Dubai's grease trap collection operations?`,
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
        setTimeout(() => handleSendMessage(initialQuery), 500);
      }

      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('modern-pie-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      if (currentSessionId) {
        localStorage.setItem('modern-pie-chat-current-session', currentSessionId);
      }
    } catch (error) {
      console.error('Failed to save current session ID:', error);
    }
  }, [currentSessionId]);

  // Handle streaming updates
  const handleStreamingUpdate = (response: StreamingResponse) => {
    if (response.type === 'brief') {
      setStreamingState(prev => ({
        ...prev,
        briefResponse: {
          content: response.content,
          isStreaming: !response.isComplete,
          isComplete: response.isComplete
        }
      }));

      // Update the streaming message content
      setCurrentStreamingMessage(prev => prev ? {
        ...prev,
        content: response.content
      } : null);
    }

    if (response.type === 'artifact_section' && response.sectionType) {
      setStreamingState(prev => ({
        ...prev,
        artifactSections: {
          ...prev.artifactSections,
          [response.sectionType!]: {
            content: response.content,
            isComplete: response.isComplete
          }
        }
      }));
    }

    if (response.type === 'visualization') {
      setStreamingState(prev => ({
        ...prev,
        artifactSections: {
          ...prev.artifactSections,
          visualization: {
            content: JSON.parse(response.content),
            isComplete: response.isComplete
          }
        }
      }));
    }

    if (response.type === 'complete') {
      setStreamingState(prev => ({
        ...prev,
        isProcessing: false,
        overallProgress: 100
      }));
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    const userMessage: EnhancedChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Reset streaming state
    setStreamingState({
      briefResponse: { content: '', isStreaming: false, isComplete: false },
      artifactSections: {
        summary: { content: '', isComplete: false },
        metrics: { content: '', isComplete: false },
        analysis: { content: '', isComplete: false },
        recommendations: { content: '', isComplete: false },
        visualization: { content: null, isComplete: false }
      },
      overallProgress: 0,
      isProcessing: true
    });

    // Create streaming message placeholder
    const streamingMessage: EnhancedChatMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setCurrentStreamingMessage(streamingMessage);

    try {
      let result: EnhancedQueryResult;

      // Use the original enhanced AI service (faster)
      result = await enhancedAIService.processQuery(
        content,
        currentSessionId || undefined
      );

      setCurrentAnalysisResult(result);

      // Generate contextual deep-dive questions based on the latest result
      const sessionHistory = sessions.find(s => s.id === currentSessionId)?.messages
        ?.filter(msg => msg.role === 'assistant' && msg.queryResult)
        ?.map(msg => msg.queryResult!)
        ?.slice(0, -1) || []; // Exclude current result

      const questions = enhancedAIService.generateDeepDiveQuestions(result, sessionHistory);
      setDeepDiveQuestions(questions);

      // Create assistant response message
      const assistantMessage: EnhancedChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.naturalResponse,
        timestamp: result.timestamp,
        queryResult: result
      };

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


    } catch (error) {
      console.error('AI Service error:', error);

      const errorMessage: EnhancedChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm experiencing some technical difficulties right now. Please try again in a moment, or rephrase your question. 🔧",
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
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeepDiveClick = (question: SuggestedQuery) => {
    handleSendMessage(question.query);
  };

  const createNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      messages: [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setCurrentAnalysisResult(null);
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Glassmorphism backdrop */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(30,30,30,0.8) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(240,248,255,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
        onClick={onClose}
      />

      {/* Main Chat Container */}
      <div className="fixed inset-4 lg:inset-8">
        <div
          className={`w-full h-full rounded-3xl shadow-2xl transition-all duration-500 transform ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header Bar */}
            <div
              className={`px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
              }`}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(90deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                  : 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className={`text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
                        Pie AI Assistant
                      </h1>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Dubai Grease Collection Intelligence
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Theme Toggle */}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700/50 text-yellow-400 hover:bg-gray-600/50'
                        : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  {/* Settings */}
                  <button className={`p-2 rounded-xl transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                  }`}>
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
                        : 'bg-gray-100/50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Chat History */}
              <div
                className={`transition-all duration-300 border-r ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}
                style={{
                  width: sidebarCollapsed ? '48px' : '20%',
                  minWidth: sidebarCollapsed ? '48px' : '240px',
                  background: isDarkMode
                    ? 'linear-gradient(180deg, rgba(20,20,20,0.5) 0%, rgba(30,30,30,0.5) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(248,250,252,0.5) 100%)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                {/* Sidebar Header */}
                <div className="p-4">
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!sidebarCollapsed && (
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Conversations
                      </h3>
                    )}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode
                          ? 'hover:bg-gray-700/50 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title={sidebarCollapsed ? 'Expand conversations' : 'Collapse conversations'}
                    >
                      {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                  </div>

                  {!sidebarCollapsed && (
                    <button
                      onClick={createNewSession}
                      className={`w-full mt-3 p-3 rounded-xl border-2 border-dashed transition-all ${
                        isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30 text-gray-300'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Chat</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Session List */}
                {!sidebarCollapsed && (
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setCurrentSessionId(session.id)}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            currentSessionId === session.id
                              ? isDarkMode
                                ? 'bg-indigo-600/20 border border-indigo-500/30'
                                : 'bg-indigo-50 border border-indigo-200'
                              : isDarkMode
                                ? 'hover:bg-gray-700/30'
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {session.title}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {formatTimestamp(session.lastUpdated)} • {session.messages.length} messages
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Area - 30% width */}
              <div
                className="flex flex-col overflow-hidden border-r"
                style={{
                  width: '30%',
                  minWidth: '360px',
                  borderRightColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }}
              >
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                    {/* Render existing messages */}
                    {messages.map((message) => (
                      <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                            }}
                          >
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                          <div
                            className={`p-4 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : isDarkMode
                                  ? 'bg-gray-800/50 text-white'
                                  : 'bg-white/80 text-gray-900'
                            }`}
                            style={{
                              backdropFilter: 'blur(20px)',
                              border: message.role === 'assistant'
                                ? isDarkMode
                                  ? '1px solid rgba(255,255,255,0.1)'
                                  : '1px solid rgba(0,0,0,0.05)'
                                : 'none',
                              boxShadow: message.role === 'user'
                                ? '0 8px 32px rgba(102, 126, 234, 0.3)'
                                : isDarkMode
                                  ? '0 4px 16px rgba(0,0,0,0.2)'
                                  : '0 4px 16px rgba(0,0,0,0.05)'
                            }}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`text-sm font-semibold ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Pie AI
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className={`text-xs ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Online
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                              {message.role === 'assistant' && message === currentStreamingMessage && streamingState.briefResponse.isStreaming ? (
                                <TypewriterText
                                  text={streamingState.briefResponse.content}
                                  isStreaming={streamingState.briefResponse.isStreaming}
                                  speed={700}
                                  cursor={true}
                                  preserveWhitespace={true}
                                />
                              ) : (
                                message.content
                              )}
                            </div>

                            {/* Action Buttons for AI responses */}
                            {message.role === 'assistant' && message.queryResult && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200/20">
                                <button
                                  onClick={() => {
                                    setCurrentAnalysisResult(message.queryResult!);
                                    setShowArtifacts(true);
                                  }}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isDarkMode
                                      ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                  }`}
                                >
                                  <BarChart3 className="w-3 h-3" />
                                  View Analysis
                                </button>

                                {message.queryResult.visualization && (
                                  <button
                                    onClick={() => {
                                      setCurrentAnalysisResult(message.queryResult!);
                                      setShowArtifacts(true);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      isDarkMode
                                        ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    View Chart
                                  </button>
                                )}

                                <button
                                  onClick={() => navigator.clipboard.writeText(message.content)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isDarkMode
                                      ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                            )}

                            <div className={`text-xs mt-3 ${
                              message.role === 'user'
                                ? 'text-indigo-200'
                                : isDarkMode
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                            }`}>
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">U</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-4 justify-start">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>

                        <div
                          className={`p-4 rounded-2xl ${
                            isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                          }`}
                          style={{
                            backdropFilter: 'blur(20px)',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                            boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Analyzing your request...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div
                  className={`border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} p-6`}
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(180deg, rgba(20,20,20,0.5) 0%, rgba(30,30,30,0.8) 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(248,250,252,0.8) 100%)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="max-w-4xl mx-auto">
                    {/* Deep Dive Questions */}
                    {deepDiveQuestions.length > 0 && !isLoading && (
                      <div className="mb-4">
                        <div className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          💡 Explore deeper insights:
                        </div>
                        <div className="grid gap-3">
                          {deepDiveQuestions.map((question) => (
                            <button
                              key={question.id}
                              onClick={() => handleDeepDiveClick(question)}
                              className={`p-3 rounded-xl text-left transition-all duration-200 border group hover:scale-[1.02] ${
                                isDarkMode
                                  ? 'bg-gray-800/60 border-gray-600/50 text-gray-200 hover:bg-gray-700/80 hover:border-indigo-500/50'
                                  : 'bg-white/80 border-gray-200/50 text-gray-800 hover:bg-white hover:border-indigo-400/50 hover:shadow-lg'
                              }`}
                              style={{
                                backdropFilter: 'blur(20px)',
                                boxShadow: isDarkMode
                                  ? '0 2px 8px rgba(0,0,0,0.1)'
                                  : '0 2px 8px rgba(0,0,0,0.05)'
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {question.type === 'drill_down' && <Target className="w-3 h-3 text-blue-500" />}
                                    {question.type === 'explore_related' && <Sparkles className="w-3 h-3 text-purple-500" />}
                                    {question.type === 'follow_up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                    {question.type === 'validate_assumption' && <Brain className="w-3 h-3 text-orange-500" />}
                                    <span className={`text-xs font-medium ${
                                      question.type === 'drill_down' ? 'text-blue-600' :
                                      question.type === 'explore_related' ? 'text-purple-600' :
                                      question.type === 'follow_up' ? 'text-green-600' :
                                      'text-orange-600'
                                    }`}>
                                      {question.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {question.query}
                                  </div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {question.reasoning} • {Math.round(question.confidence * 100)}% confidence
                                  </div>
                                </div>
                                <div className={`ml-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about Dubai grease collection data..."
                        className={`w-full p-4 pr-16 rounded-2xl border transition-all duration-200 resize-none min-h-[56px] max-h-[120px] ${
                          isDarkMode
                            ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-indigo-500/50'
                            : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-indigo-500/50'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        style={{
                          backdropFilter: 'blur(20px)',
                          boxShadow: isDarkMode
                            ? '0 4px 16px rgba(0,0,0,0.1)'
                            : '0 4px 16px rgba(0,0,0,0.05)'
                        }}
                        disabled={isLoading}
                      />

                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all ${
                          !inputValue.trim() || isLoading
                            ? isDarkMode
                              ? 'bg-gray-700/50 text-gray-500'
                              : 'bg-gray-100 text-gray-400'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                        } disabled:cursor-not-allowed`}
                        style={{
                          boxShadow: !inputValue.trim() || isLoading
                            ? 'none'
                            : '0 4px 16px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-3 h-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Real-time analysis with AI insights
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Press ⏎ to send</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern Artifacts Panel - 50% (expanded) or 70% (collapsed) */}
              {showArtifacts && (
                <ModernAnalysisPanel
                  className="flex-1"
                  style={{
                    width: sidebarCollapsed ? '70%' : '50%',
                    minWidth: '400px'
                  }}
                  queryResult={currentAnalysisResult}
                  sessionHistory={messages
                    .filter(msg => msg.role === 'assistant' && msg.queryResult)
                    .map(msg => msg.queryResult!)
                  }
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPieChat;