// Command Palette - Phase 4 Implementation
// Provides ⌘K quick access to all features and smart command routing

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Hash, MessageCircle, Download, Settings, Zap, Brain, History, BookOpen, Users } from 'lucide-react';
import type { CommandPaletteAction, KeyboardShortcut } from '../../types/enhanced-chat.types';
import { memoryService } from '../../services/memoryService';
import { artifactService } from '../../services/artifactService';
import { collaborationService } from '../../services/collaborationService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (action: CommandPaletteAction) => void;
  onOpenChat?: (query?: string) => void;
  currentSessionId?: string;
}

interface CommandCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  onOpenChat,
  currentSessionId
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Categories for organizing commands
  const categories: CommandCategory[] = [
    { id: 'all', label: 'All', icon: <Search className="w-4 h-4" />, color: 'text-gray-600' },
    { id: 'analysis', label: 'Analysis', icon: <Brain className="w-4 h-4" />, color: 'text-blue-600' },
    { id: 'data', label: 'Data', icon: <Hash className="w-4 h-4" />, color: 'text-green-600' },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" />, color: 'text-purple-600' },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, color: 'text-orange-600' },
    { id: 'collaboration', label: 'Team', icon: <Users className="w-4 h-4" />, color: 'text-pink-600' },
    { id: 'navigation', label: 'Navigate', icon: <BookOpen className="w-4 h-4" />, color: 'text-indigo-600' }
  ];

  // Comprehensive command definitions
  const allCommands: CommandPaletteAction[] = useMemo(() => [
    // Analysis Commands
    {
      id: 'new-analysis',
      label: 'Start New Analysis',
      description: 'Begin a fresh analysis session',
      category: 'analysis',
      shortcut: 'Ctrl+N',
      icon: '🧠',
      action: () => onOpenChat?.(),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'quick-insights',
      label: 'Quick Insights Dashboard',
      description: 'Get overview of key metrics',
      category: 'analysis',
      shortcut: 'Ctrl+I',
      icon: '⚡',
      action: () => onOpenChat?.('Show me quick insights and key metrics overview'),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'collection-trends',
      label: 'Collection Trends',
      description: 'Analyze collection patterns over time',
      category: 'analysis',
      icon: '📈',
      action: () => onOpenChat?.('Show me collection trends and patterns over the last 6 months'),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'provider-performance',
      label: 'Provider Performance Analysis',
      description: 'Compare service provider efficiency',
      category: 'analysis',
      icon: '🏆',
      action: () => onOpenChat?.('Compare service provider performance and efficiency metrics'),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'delay-analysis',
      label: 'Delay Detection',
      description: 'Identify collections with delays',
      category: 'analysis',
      icon: '⏰',
      action: () => onOpenChat?.('Show me locations with collection delays and overdue services'),
      enabled: true,
      visibility: 'always'
    },

    // Data Commands
    {
      id: 'data-overview',
      label: 'Data Overview',
      description: 'View database statistics and health',
      category: 'data',
      icon: '📊',
      action: () => onOpenChat?.('Give me an overview of the database: total records, coverage, and data quality'),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'geographic-coverage',
      label: 'Geographic Coverage',
      description: 'Analyze coverage by area and zone',
      category: 'data',
      icon: '🗺️',
      action: () => onOpenChat?.('Show me geographic coverage across Dubai areas and zones'),
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'volume-analysis',
      label: 'Volume Analysis',
      description: 'Analyze collection volumes and patterns',
      category: 'data',
      icon: '📦',
      action: () => onOpenChat?.('Analyze collection volumes by category and location'),
      enabled: true,
      visibility: 'always'
    },

    // Chat Commands
    {
      id: 'chat-history',
      label: 'Chat History',
      description: 'View recent conversations',
      category: 'chat',
      shortcut: 'Ctrl+H',
      icon: '💬',
      action: () => {
        // Focus on chat history panel
        console.log('Opening chat history');
      },
      enabled: true,
      visibility: 'always'
    },
    {
      id: 'clear-context',
      label: 'Clear Context',
      description: 'Reset conversation context',
      category: 'chat',
      icon: '🔄',
      action: () => {
        if (currentSessionId) {
          memoryService.updateAnalysisContext(currentSessionId, {
            activeFilters: {},
            workingHypotheses: [],
            lastUpdated: new Date().toISOString()
          });
        }
      },
      enabled: !!currentSessionId,
      visibility: 'contextual'
    }
  ], [currentSessionId, onOpenChat]);

  // Filter commands based on query and category
  const filteredCommands = useMemo(() => {
    let commands = allCommands.filter(cmd => cmd.enabled);
    
    // Filter by category
    if (activeCategory !== 'all') {
      commands = commands.filter(cmd => cmd.category === activeCategory);
    }
    
    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      commands = commands.filter(cmd => 
        cmd.label.toLowerCase().includes(searchTerm) ||
        cmd.description.toLowerCase().includes(searchTerm) ||
        cmd.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return commands;
  }, [allCommands, activeCategory, query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          // Cycle through categories
          const currentCategoryIndex = categories.findIndex(cat => cat.id === activeCategory);
          const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
          setActiveCategory(categories[nextCategoryIndex].id);
          setSelectedIndex(0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, categories, activeCategory, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
    }
  }, [isOpen]);

  const executeCommand = useCallback((command: CommandPaletteAction) => {
    try {
      command.action();
      onExecuteCommand?.(command);
      
      // Add to recent commands
      setRecentCommands(prev => {
        const updated = [command.id, ...prev.filter(id => id !== command.id)].slice(0, 5);
        localStorage.setItem('command-palette-recent', JSON.stringify(updated));
        return updated;
      });
      
      onClose();
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  }, [onExecuteCommand, onClose]);

  // Load recent commands
  useEffect(() => {
    try {
      const saved = localStorage.getItem('command-palette-recent');
      if (saved) {
        setRecentCommands(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load recent commands:', error);
    }
  }, []);

  // Get recent command objects
  const recentCommandObjects = useMemo(() => {
    return recentCommands
      .map(id => allCommands.find(cmd => cmd.id === id))
      .filter(Boolean) as CommandPaletteAction[];
  }, [recentCommands, allCommands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands... (use Tab to switch categories)"
              className="flex-1 outline-none text-lg placeholder-gray-400"
            />
            <div className="text-xs text-gray-400 ml-3 hidden sm:block">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘K</kbd>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors mr-2 ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto">
            {/* Recent Commands (when no query) */}
            {!query.trim() && recentCommandObjects.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-3 py-2 flex items-center gap-2">
                  <History className="w-3 h-3" />
                  Recent Commands
                </div>
                {recentCommandObjects.slice(0, 3).map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                  >
                    <span className="text-lg">{command.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.description}</div>
                    </div>
                    {command.shortcut && (
                      <kbd className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-2"></div>
              </div>
            )}

            {/* Filtered Commands */}
            {filteredCommands.length > 0 ? (
              <div className="p-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{command.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.description}</div>
                    </div>
                    {command.shortcut && (
                      <kbd className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>No commands found</div>
                <div className="text-xs mt-1">Try a different search term or category</div>
              </div>
            )}
          </div>

          {/* Footer with shortcuts */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-gray-200 rounded">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-gray-200 rounded">↵</kbd> Execute
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-gray-200 rounded">Tab</kbd> Categories
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-gray-200 rounded">Esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;