// Ultimate App Layout - Phase 4 Complete Implementation
// Integrates all enhanced features: memory, collaboration, artifacts, voice, and command palette

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import EnhancedPieChat from '../chat/EnhancedPieChat';
import ModernPieChat from '../chat/ModernPieChat';
import CommandPalette from '../ui/CommandPalette';
import { voiceService } from '../../services/voiceService';
import { memoryService } from '../../services/memoryService';
import { collaborationService } from '../../services/collaborationService';
import { artifactService } from '../../services/artifactService';
import { Command, Mic, MicOff, Brain, Zap, AlertCircle } from 'lucide-react';
import type { 
  FeatureFlags, 
  CommandPaletteAction, 
  VoiceCommand 
} from '../../types/enhanced-chat.types';

interface UltimateAppLayoutProps {
  children: React.ReactNode;
  // Feature control
  useEnhancedFeatures?: boolean;
  useModernUI?: boolean; // Switch to modern glass morphism chat
  featureFlags?: Partial<FeatureFlags>;
  // Voice settings
  enableVoice?: boolean;
  voiceLanguage?: string;
  // Command palette settings
  enableCommandPalette?: boolean;
}

interface SystemStatus {
  memory: 'active' | 'inactive' | 'error';
  collaboration: 'active' | 'inactive' | 'error';
  voice: 'listening' | 'idle' | 'error' | 'disabled';
  artifacts: 'active' | 'inactive' | 'error';
}

export const UltimateAppLayout: React.FC<UltimateAppLayoutProps> = ({
  children,
  useEnhancedFeatures = true,
  useModernUI = false,
  featureFlags = {},
  enableVoice = true,
  voiceLanguage = 'en-US',
  enableCommandPalette = true
}) => {
  // Existing chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  // Enhanced features state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    memory: 'inactive',
    collaboration: 'inactive',
    voice: 'disabled',
    artifacts: 'inactive'
  });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

  // Merged feature flags
  const activeFeatureFlags: FeatureFlags = {
    enableMemoryService: true,
    enableProgressiveDisclosure: true,
    enableCollaborativeFeatures: true,
    enableArtifactVersioning: true,
    enableVoiceCommands: enableVoice,
    enableSemanticSearch: true,
    enableCrossSessionInsights: true,
    enableAdvancedExports: true,
    ...featureFlags
  };

  // Initialize services and check health
  useEffect(() => {
    if (!useEnhancedFeatures) return;

    initializeEnhancedServices();
    setupVoiceCommands();
    setupKeyboardShortcuts();
    
    // Health check interval
    const healthInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(healthInterval);
      cleanup();
    };
  }, [useEnhancedFeatures, enableVoice, voiceLanguage]);

  const initializeEnhancedServices = useCallback(async () => {
    try {
      // Initialize memory service
      if (activeFeatureFlags.enableMemoryService) {
        memoryService.updateFeatureFlags(activeFeatureFlags);
        setSystemStatus(prev => ({ ...prev, memory: 'active' }));
      }

      // Initialize collaboration service
      if (activeFeatureFlags.enableCollaborativeFeatures) {
        const stats = collaborationService.getCollaborationStats();
        setSystemStatus(prev => ({ ...prev, collaboration: 'active' }));
        console.log('Collaboration service initialized:', stats);
      }

      // Initialize artifact service
      if (activeFeatureFlags.enableArtifactVersioning) {
        const stats = artifactService.getStatistics();
        setSystemStatus(prev => ({ ...prev, artifacts: 'active' }));
        console.log('Artifact service initialized:', stats);
      }

      // Initialize voice service
      if (enableVoice && activeFeatureFlags.enableVoiceCommands) {
        if (voiceService.isSupported()) {
          voiceService.updateOptions({
            enabled: true,
            language: voiceLanguage,
            confidenceThreshold: 0.7
          });
          
          voiceService.setCallbacks({
            onResult: handleVoiceResult,
            onCommand: handleVoiceCommand,
            onError: handleVoiceError,
            onStatus: handleVoiceStatus
          });
          
          setSystemStatus(prev => ({ ...prev, voice: 'idle' }));
        } else {
          setSystemStatus(prev => ({ ...prev, voice: 'error' }));
          addNotification('Voice commands not supported in this browser');
        }
      }

    } catch (error) {
      console.error('Service initialization failed:', error);
      addNotification('Some enhanced features failed to initialize');
    }
  }, [activeFeatureFlags, enableVoice, voiceLanguage]);

  const setupVoiceCommands = useCallback(() => {
    if (!enableVoice || !activeFeatureFlags.enableVoiceCommands) return;

    // Custom voice commands for this app
    const customCommands: VoiceCommand[] = [
      {
        phrases: ['open pie chat', 'start chat', 'talk to pie'],
        action: 'ui.open_chat',
        confidence: 0.9,
        context: 'global'
      },
      {
        phrases: ['show command palette', 'open commands', 'quick actions'],
        action: 'ui.command_palette',
        confidence: 0.9,
        context: 'global'
      },
      {
        phrases: ['system health', 'check status', 'health check'],
        action: 'ui.system_health',
        confidence: 0.8,
        context: 'global'
      }
    ];

    customCommands.forEach(cmd => voiceService.registerCommand(cmd));
  }, [enableVoice, activeFeatureFlags.enableVoiceCommands]);

  const setupKeyboardShortcuts = useCallback(() => {
    if (!enableCommandPalette) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Voice toggle: Ctrl+Shift+V
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggleVoiceListening();
      }
      
      // Quick chat: Ctrl+/
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        handleOpenChat();
      }

      // System health: Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowSystemHealth(!showSystemHealth);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableCommandPalette, showSystemHealth]);

  // Voice handlers
  const handleVoiceResult = useCallback((result: any) => {
    setVoiceTranscript(result.transcript);
  }, []);

  const handleVoiceCommand = useCallback((match: any) => {
    console.log('Voice command executed:', match);
    addNotification(`Voice command: ${match.command.action}`);
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    console.error('Voice error:', error);
    setSystemStatus(prev => ({ ...prev, voice: 'error' }));
    addNotification(`Voice error: ${error}`);
  }, []);

  const handleVoiceStatus = useCallback((status: 'idle' | 'listening' | 'processing' | 'error') => {
    setIsVoiceListening(status === 'listening');
    setSystemStatus(prev => ({ ...prev, voice: status }));
    
    if (status === 'listening') {
      setVoiceTranscript('Listening...');
    } else if (status === 'idle') {
      setVoiceTranscript('');
    }
  }, []);

  const toggleVoiceListening = useCallback(() => {
    if (!enableVoice || !activeFeatureFlags.enableVoiceCommands) return;
    
    const started = voiceService.toggleListening();
    if (started) {
      addNotification('Voice listening started');
    } else {
      addNotification('Voice listening stopped');
    }
  }, [enableVoice, activeFeatureFlags.enableVoiceCommands]);

  // Chat handlers
  const handleOpenChat = useCallback((query?: string) => {
    setInitialQuery(query || '');
    setIsChatOpen(true);
  }, []);

  // Command palette handlers
  const handleExecuteCommand = useCallback((action: CommandPaletteAction) => {
    console.log('Command executed:', action);
    addNotification(`Executed: ${action.label}`);
  }, []);

  // System health monitoring
  const checkSystemHealth = useCallback(() => {
    try {
      // Check memory service
      if (activeFeatureFlags.enableMemoryService) {
        const memoryStats = memoryService.getStatistics();
        setSystemStatus(prev => ({
          ...prev,
          memory: memoryStats.totalContexts >= 0 ? 'active' : 'error'
        }));
      }

      // Check collaboration service
      if (activeFeatureFlags.enableCollaborativeFeatures) {
        const collabStats = collaborationService.getCollaborationStats();
        setSystemStatus(prev => ({
          ...prev,
          collaboration: 'active'
        }));
      }

      // Check artifact service
      if (activeFeatureFlags.enableArtifactVersioning) {
        const artifactStats = artifactService.getStatistics();
        setSystemStatus(prev => ({
          ...prev,
          artifacts: artifactStats.totalArtifacts >= 0 ? 'active' : 'error'
        }));
      }

      // Check voice service
      if (enableVoice && activeFeatureFlags.enableVoiceCommands) {
        const voiceStats = voiceService.getStatistics();
        if (!voiceStats.supported) {
          setSystemStatus(prev => ({ ...prev, voice: 'error' }));
        }
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, [activeFeatureFlags, enableVoice]);

  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]); // Keep last 5 notifications
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  const cleanup = useCallback(() => {
    voiceService.stopListening();
  }, []);

  // Listen for voice events
  useEffect(() => {
    const handleVoiceChatCommand = (e: CustomEvent) => {
      handleOpenChat(e.detail.query);
    };

    const handleVoiceUICommand = (e: CustomEvent) => {
      switch (e.detail.action) {
        case 'command_palette':
          setIsCommandPaletteOpen(true);
          break;
        case 'open_chat':
          handleOpenChat();
          break;
        case 'system_health':
          setShowSystemHealth(true);
          break;
      }
    };

    window.addEventListener('voice-chat-command', handleVoiceChatCommand as EventListener);
    window.addEventListener('voice-ui-command', handleVoiceUICommand as EventListener);

    return () => {
      window.removeEventListener('voice-chat-command', handleVoiceChatCommand as EventListener);
      window.removeEventListener('voice-ui-command', handleVoiceUICommand as EventListener);
    };
  }, [handleOpenChat]);

  return (
    <div className="min-h-screen bg-gradient-body bg-fixed relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40 animate-pulse-glow"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-float"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-accent rounded-full blur-2xl opacity-25 animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-neon rounded-full blur-3xl opacity-15 animate-float" style={{animationDelay: '4s'}}></div>
      
      <div className="min-h-screen relative z-10 flex flex-col">
        <Header onOpenChat={handleOpenChat} />
        
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="animate-fadeInUp space-y-6 w-full">
            {children}
          </div>
        </main>

        {/* Enhanced Features UI */}
        {useEnhancedFeatures && (
          <>
            {/* Floating Action Bar */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
              {/* Voice Control Button */}
              {enableVoice && activeFeatureFlags.enableVoiceCommands && (
                <button
                  onClick={toggleVoiceListening}
                  className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                    isVoiceListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : systemStatus.voice === 'error'
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={systemStatus.voice === 'error'}
                  title={isVoiceListening ? 'Stop listening' : 'Start voice commands'}
                >
                  {isVoiceListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* Command Palette Button */}
              {enableCommandPalette && (
                <button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                  title="Open command palette (⌘K)"
                >
                  <Command className="w-5 h-5" />
                </button>
              )}

              {/* System Health Button */}
              <button
                onClick={() => setShowSystemHealth(!showSystemHealth)}
                className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                  Object.values(systemStatus).some(status => status === 'error')
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title="System health"
              >
                <Brain className="w-5 h-5" />
              </button>
            </div>

            {/* Voice Transcript Display */}
            {isVoiceListening && voiceTranscript && (
              <div className="fixed bottom-24 right-6 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg z-40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">{voiceTranscript}</span>
                </div>
              </div>
            )}

            {/* System Health Panel */}
            {showSystemHealth && (
              <div className="fixed bottom-24 right-20 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-40 min-w-64">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">System Health</h3>
                  <button
                    onClick={() => setShowSystemHealth(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Memory Service</span>
                    <div className={`w-3 h-3 rounded-full ${
                      systemStatus.memory === 'active' ? 'bg-green-500' :
                      systemStatus.memory === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Collaboration</span>
                    <div className={`w-3 h-3 rounded-full ${
                      systemStatus.collaboration === 'active' ? 'bg-green-500' :
                      systemStatus.collaboration === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Voice Commands</span>
                    <div className={`w-3 h-3 rounded-full ${
                      systemStatus.voice === 'listening' ? 'bg-blue-500' :
                      systemStatus.voice === 'idle' ? 'bg-green-500' :
                      systemStatus.voice === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Artifacts</span>
                    <div className={`w-3 h-3 rounded-full ${
                      systemStatus.artifacts === 'active' ? 'bg-green-500' :
                      systemStatus.artifacts === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <div>Voice: {systemStatus.voice}</div>
                    <div>Commands: {voiceService.getCommands().length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="fixed top-20 right-6 space-y-2 z-40">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-right"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">{notification}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Pie AI Chat - Modern or Enhanced */}
      {useModernUI ? (
        <ModernPieChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          initialQuery={initialQuery}
          enableStreaming={true}
        />
      ) : (
        <EnhancedPieChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          initialQuery={initialQuery}
          enableEnhancedFeatures={useEnhancedFeatures}
          featureFlags={activeFeatureFlags}
        />
      )}

      {/* Command Palette */}
      {enableCommandPalette && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onExecuteCommand={handleExecuteCommand}
          onOpenChat={handleOpenChat}
          currentSessionId={undefined} // Would be passed from session context
        />
      )}
    </div>
  );
};