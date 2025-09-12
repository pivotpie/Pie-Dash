/**
 * PieChat - AI-Powered Grease Collection Assistant (BACKUP - ORIGINAL VERSION)
 * Modal interface that flies in from the header search bar
 * 
 * CURRENT IMPLEMENTATION FEATURES (as of Sept 12, 2025):
 * =====================================================
 * 
 * MODAL DIMENSIONS:
 * - Width: 60% of screen (max: 900px, min: 600px)
 * - Height: 70% of screen
 * - Centered modal with backdrop
 * 
 * SERVICE INTEGRATION:
 * - Uses pieAiService (legacy service with 71,485 token JSON file)
 * - Sends entire data_insights_q1_2023.json with every query
 * - Limited to Q1 2023 data only
 * 
 * UI LAYOUT:
 * - Single column chat interface
 * - Header with close button
 * - Scrollable messages area
 * - Input area with send button
 * - No visualization capabilities
 * - No session history sidebar
 * 
 * MESSAGE FEATURES:
 * - User/Assistant message distinction
 * - Message timestamps
 * - Suggestions (clickable)
 * - Sources display
 * - Welcome message with initial suggestions
 * - Loading states with spinner
 * - Error handling with fallback messages
 * 
 * INTERACTION FEATURES:
 * - Enter key to send message
 * - Auto-focus input on open
 * - Auto-scroll to latest message
 * - Suggestion click handling
 * - Initial query support (from props)
 * 
 * SESSION MANAGEMENT:
 * - Basic session ID tracking
 * - No session history persistence
 * - No session switching
 * - No session cleanup
 * 
 * LIMITATIONS TO REPLACE:
 * - No real-time database queries
 * - No visualizations/charts
 * - No chat history sidebar
 * - Narrow modal width (60%)
 * - High token cost (71,485 per query)
 * - Limited to static Q1 2023 data
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle, Lightbulb, Database, AlertTriangle } from 'lucide-react';
import pieAiService, { PieQuery, PieResponse } from '../../services/pieAiService';

interface PieChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'pie';
  content: string;
  timestamp: string;
  suggestions?: string[];
  sources?: string[];
}

const PieChat: React.FC<PieChatProps> = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'pie',
        content: `Hi! I'm Pie, your Dubai grease collection assistant. I can help you analyze Q1 2023 collection data, delays, performance metrics, and operational insights.

What would you like to know about our Dubai grease trap collection operations?`,
        timestamp: new Date().toISOString(),
        suggestions: [
          "What are the top areas by collection volume?",
          "Show me critical delay alerts",
          "Which service providers are most efficient?",
          "Compare restaurant vs hotel patterns"
        ]
      };
      
      setMessages([welcomeMessage]);
      
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const query: PieQuery = {
        message: content,
        sessionId: sessionId || undefined,
        context: 'dashboard'
      };

      const response: PieResponse = await pieAiService.query(query);
      
      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      const pieMessage: ChatMessage = {
        id: `pie_${Date.now()}`,
        type: 'pie',
        content: response.response,
        timestamp: response.timestamp,
        suggestions: response.suggestions,
        sources: response.sources
      };

      setMessages(prev => [...prev, pieMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'pie',
        content: "I'm having trouble processing your request right now. Please try again or rephrase your question.",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Try a simpler question",
          "Ask about collection volumes",
          "Check system status"
        ]
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

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
          className="bg-white rounded-lg shadow-2xl transform transition-all duration-300 ease-out"
          style={{ 
            width: '60%',
            height: '70%',
            maxWidth: '900px',
            minWidth: '600px',
            transform: isOpen ? 'scale(1) opacity(1)' : 'scale(0.95) opacity(0)'
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.type === 'pie' && (
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
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Database className="w-3 h-3" />
                          <span>Source: {message.sources[0]}</span>
                        </div>
                      </div>
                    )}
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Lightbulb className="w-3 h-3" />
                          <span>Try asking:</span>
                        </div>
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
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
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
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

            {/* Input */}
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
                <span>Specialized for Q1 2023 Dubai grease collection data only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieChat;