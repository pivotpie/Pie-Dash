import React, { useState, useEffect, useMemo } from 'react';
import { ChatSession } from '../../types/chat.types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  isCollapsed: boolean;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onToggleCollapse: () => void;
  onSearchSessions: (query: string) => void;
  className?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  isCollapsed,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onToggleCollapse,
  onSearchSessions,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter and sort sessions based on search query and sort preference
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (searchQuery) {
      filtered = sessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [sessions, searchQuery, sortBy]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchSessions(query);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle delete with confirmation
  const handleDelete = (sessionId: string) => {
    if (showDeleteConfirm === sessionId) {
      onDeleteSession(sessionId);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(sessionId);
    }
  };

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chat-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className={`chat-history-collapsed w-12 ${className}`}>
        <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
          {/* Expand button */}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors mb-4"
            title="Expand Chat History"
            aria-label="Expand Chat History"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* New session button */}
          <button
            onClick={onNewSession}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors mb-4"
            title="New Session"
            aria-label="New Session"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Session indicators */}
          <div className="flex-1 flex flex-col space-y-2 overflow-y-auto">
            {filteredSessions.slice(0, 10).map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-gray-300 border-gray-300 hover:bg-gray-400'
                }`}
                title={session.title}
                aria-label={`Select session: ${session.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`chat-history-expanded ${className}`}>
      <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Chat History</h3>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Collapse"
              aria-label="Collapse Chat History"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* New Session Button */}
          <button
            onClick={onNewSession}
            className="w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + New Chat
          </button>

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute right-2 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort Options */}
          <div className="flex text-xs">
            <button
              onClick={() => setSortBy('date')}
              className={`px-2 py-1 rounded-l-md transition-colors ${
                sortBy === 'date'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-2 py-1 rounded-r-md transition-colors ${
                sortBy === 'name'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery ? 'No sessions found' : 'No chat sessions yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    session.id === currentSessionId
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(session.lastUpdated)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {session.messages.length} messages
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className={`ml-2 p-1 rounded transition-colors ${
                        showDeleteConfirm === session.id
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={showDeleteConfirm === session.id ? 'Click to confirm delete' : 'Delete session'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {showDeleteConfirm === session.id && (
                    <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-red-700 font-medium">Click again to delete</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;