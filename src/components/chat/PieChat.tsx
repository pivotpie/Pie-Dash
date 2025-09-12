/**
 * PieChat - AI-Powered Grease Collection Assistant
 * Modal interface that flies in from the header search bar
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import { enhancedAIService } from '../../services/enhancedAIService';
import ChatHistory from './ChatHistory';
import AnalysisPanel from './AnalysisPanel';
import type { ChatSession, EnhancedQueryResult, EnhancedChatMessage } from '../../types/chat.types';

interface PieChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

// Legacy ChatMessage interface removed - now using EnhancedChatMessage from types

const PieChat: React.FC<PieChatProps> = ({ isOpen, onClose, initialQuery }) => {
  // Input and UI state
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // New 3-column layout state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    // Load sessions from localStorage on initialization
    try {
      const saved = localStorage.getItem('pie-chat-sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    // Try to restore last active session
    try {
      const saved = localStorage.getItem('pie-chat-current-session');
      return saved || '';
    } catch (error) {
      console.error('Failed to load current session ID:', error);
      return '';
    }
  });
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<EnhancedQueryResult | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState<boolean>(true); // Default to collapsed
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Derived state: current session messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize with welcome session if no sessions exist
      if (sessions.length === 0) {
        const welcomeSessionId = `welcome_${Date.now()}`;
        const welcomeMessage: EnhancedChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm Pie, your Dubai grease collection assistant. I can help you analyze real-time collection data, performance metrics, operational insights, and generate visualizations.

I can query the live database and create charts to help you understand patterns, delays, efficiency metrics, and comparative analysis.

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
      
      // Handle initial query if provided
      if (initialQuery) {
        setInputValue(initialQuery);
        setTimeout(() => {
          handleSendMessage(initialQuery);
        }, 500);
      }
      
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pie-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [sessions]);

  // Persist current session ID
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
      // Use enhanced AI service for processing
      const result: EnhancedQueryResult = await enhancedAIService.processQuery(
        content, 
        currentSessionId || undefined
      );
      
      // Set analysis result for the analysis panel
      setCurrentAnalysisResult(result);

      // Create assistant response message
      const assistantMessage: EnhancedChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant', 
        content: result.naturalResponse,
        timestamp: result.timestamp,
        queryResult: result
      };

      // Update session with both messages
      const sessionIdToUse = currentSessionId || result.sessionId || `session_${Date.now()}`;
      
      setSessions(prev => {
        const existingSession = prev.find(s => s.id === sessionIdToUse);
        
        if (existingSession) {
          // Update existing session
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
          // Create new session
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

      // Update current session ID if needed
      if (!currentSessionId) {
        setCurrentSessionId(sessionIdToUse);
      }

    } catch (error) {
      console.error('Enhanced AI Service error:', error);
      
      const errorMessage: EnhancedChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing your request right now. This might be due to database connectivity or AI service issues. Please try again or rephrase your question.",
        timestamp: new Date().toISOString()
      };
      
      // Add user message and error message to current session
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

  // Removed handleSuggestionClick - suggestions handled by welcome message and analysis panel

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Pie AI Assistant</h3>
                  <p className="text-xs text-blue-100">Dubai Grease Collection Expert</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Column 1: Chat History (20% expanded / 48px collapsed) */}
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
                  // TODO: Implement search functionality
                  console.log('Search sessions:', query);
                }}
              />
              
              {/* Column 2: Current Conversation (30% width) */}
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
                          </div>
                        )}
                        
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* Quick access buttons for assistant messages */}
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
                          <span>Analyzing data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about Dubai grease collection data..."
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
                    <span>Real-time Dubai grease collection analysis</span>
                  </div>
                </div>
              </div>
              
              {/* Column 3: Analysis & Visualization Panel (50% expanded / 70% collapsed) */}
              <AnalysisPanel 
                className="flex-1 border-l border-gray-200 min-w-[400px]"
                queryResult={currentAnalysisResult}
                sessionHistory={messages
                  .filter(msg => msg.role === 'assistant' && msg.queryResult)
                  .map(msg => msg.queryResult!)
                }
                isLoading={isAnalyzing}
                onExportAnalysis={() => {
                  // TODO: Implement export functionality
                  console.log('Export analysis');
                }}
                onCopyResponse={() => {
                  // TODO: Implement copy functionality
                  if (currentAnalysisResult?.naturalResponse) {
                    navigator.clipboard.writeText(currentAnalysisResult.naturalResponse);
                  }
                }}
                onShareAnalysis={() => {
                  // TODO: Implement share functionality
                  console.log('Share analysis');
                }}
                onPrintAnalysis={() => {
                  // TODO: Implement print functionality
                  window.print();
                }}
                onRetryVisualization={() => {
                  // TODO: Implement retry functionality
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

export default PieChat;