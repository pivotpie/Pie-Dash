// components/ai-query/QueryInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SendIcon, BotIcon, UserIcon, ClockIcon, DatabaseIcon } from 'lucide-react';
import { AIService, QueryResult } from '../../services/aiService';
import { QuerySuggestions } from './QuerySuggestions';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryResult?: QueryResult;
}

export const QueryInterface: React.FC = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processQuery = async (question: string) => {
    if (!question.trim() || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setIsProcessing(true);
    setShowSuggestions(false);

    try {
      const result = await AIService.processQuery(question);
      
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.naturalResponse,
        timestamp: new Date(),
        queryResult: result
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I'm sorry, I encountered an error processing your question: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your question or contact support if the issue persists.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processQuery(currentQuery);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BotIcon className="mr-2 h-6 w-6 text-blue-500" />
          AI Operations Assistant
        </h1>
        <p className="text-gray-600 mt-1">
          Ask me anything about your waste collection operations, delays, or performance metrics.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <div className="text-center py-8">
            <BotIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to AI Operations Assistant
            </h3>
            <p className="text-gray-600 mb-6">
              I can help you analyze your collection data, find delays, and optimize operations.
            </p>
            <QuerySuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border'
              } rounded-lg p-4 shadow-sm`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <BotIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <UserIcon className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Query Details for Assistant Messages */}
                  {message.type === 'assistant' && message.queryResult && (
                    <details className="mt-4 text-sm">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View Technical Details
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border space-y-2">
                        <div>
                          <strong className="text-gray-700">Generated SQL:</strong>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {message.queryResult.sqlQuery}
                          </pre>
                        </div>
                        <div>
                          <strong className="text-gray-700">
                            Results ({message.queryResult.results.length} records):
                          </strong>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                            {JSON.stringify(message.queryResult.results.slice(0, 3), null, 2)}
                            {message.queryResult.results.length > 3 && 
                              `\n... (${message.queryResult.results.length - 3} more records)`
                            }
                          </pre>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {message.queryResult.executionTime}ms
                          </span>
                          <span className="flex items-center">
                            <DatabaseIcon className="h-3 w-3 mr-1" />
                            {message.queryResult.results.length} records
                          </span>
                        </div>
                      </div>
                    </details>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <BotIcon className="h-5 w-5 text-blue-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Processing your question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about collections, delays, providers, or any operational questions..."
            className="flex-1 resize-none border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={() => processQuery(currentQuery)}
            disabled={!currentQuery.trim() || isProcessing}
            className="px-6"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {messages.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </Button>
          </div>
        )}
        
        {showSuggestions && messages.length > 0 && (
          <div className="mt-2">
            <QuerySuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}
      </div>
    </div>
  );
};