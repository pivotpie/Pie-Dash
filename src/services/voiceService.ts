// Voice Service - Phase 4 Implementation
// Provides voice command recognition and natural language processing

import type { VoiceCommand } from '../types/enhanced-chat.types';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface VoiceServiceOptions {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

interface VoiceCommandMatch {
  command: VoiceCommand;
  confidence: number;
  extractedParams: Record<string, any>;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: VoiceServiceOptions;
  private commands: VoiceCommand[] = [];
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onCommandCallback?: (match: VoiceCommandMatch) => void;
  private onErrorCallback?: (error: string) => void;
  private onStatusCallback?: (status: 'idle' | 'listening' | 'processing' | 'error') => void;

  constructor(options: Partial<VoiceServiceOptions> = {}) {
    this.options = {
      enabled: true,
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      ...options
    };

    this.initializeRecognition();
    this.registerDefaultCommands();
  }

  // === INITIALIZATION ===

  private initializeRecognition(): void {
    if (!this.options.enabled) return;

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      this.options.enabled = false;
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.setupRecognitionHandlers();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.options.enabled = false;
    }
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.lang = this.options.language;
    this.recognition.maxAlternatives = this.options.maxAlternatives;

    // Result handler
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult) {
        const transcript = latestResult[0].transcript;
        const confidence = latestResult[0].confidence;
        const isFinal = latestResult.isFinal;

        const alternatives = Array.from(latestResult)
          .slice(1)
          .map(alt => alt.transcript);

        const result: VoiceRecognitionResult = {
          transcript,
          confidence,
          isFinal,
          alternatives
        };

        this.onResultCallback?.(result);

        // Process command if final and confident enough
        if (isFinal && confidence >= this.options.confidenceThreshold) {
          this.processVoiceCommand(transcript);
        }
      }
    };

    // Start handler
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusCallback?.('listening');
    };

    // End handler
    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusCallback?.('idle');
    };

    // Error handler
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.onErrorCallback?.(event.error);
      this.onStatusCallback?.('error');
    };

    // No match handler
    this.recognition.onnomatch = () => {
      console.log('No speech recognition match');
    };

    // Audio start handler
    this.recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    // Audio end handler
    this.recognition.onaudioend = () => {
      console.log('Audio capture ended');
    };
  }

  // === VOICE COMMANDS ===

  private registerDefaultCommands(): void {
    this.commands = [
      // Chat & Analysis Commands
      {
        phrases: [
          'start new analysis',
          'begin analysis',
          'new analysis session',
          'analyze data'
        ],
        action: 'chat.new_analysis',
        confidence: 0.8,
        context: 'global'
      },
      {
        phrases: [
          'show me insights',
          'give me insights',
          'quick insights',
          'key insights'
        ],
        action: 'chat.quick_insights',
        confidence: 0.8,
        context: 'global'
      },
      {
        phrases: [
          'show collection trends',
          'analyze trends',
          'collection patterns',
          'trend analysis'
        ],
        action: 'chat.collection_trends',
        confidence: 0.8,
        context: 'analysis'
      },
      {
        phrases: [
          'provider performance',
          'compare providers',
          'service provider analysis',
          'provider efficiency'
        ],
        action: 'chat.provider_performance',
        confidence: 0.8,
        context: 'analysis'
      },
      {
        phrases: [
          'show delays',
          'find delays',
          'delay analysis',
          'overdue collections'
        ],
        action: 'chat.delay_analysis',
        confidence: 0.8,
        context: 'analysis'
      },

      // Navigation Commands
      {
        phrases: [
          'go to dashboard',
          'open dashboard',
          'show dashboard',
          'main dashboard'
        ],
        action: 'navigate.dashboard',
        confidence: 0.9,
        context: 'global'
      },
      {
        phrases: [
          'go to fleet map',
          'open map',
          'show fleet',
          'fleet operations'
        ],
        action: 'navigate.fleet_map',
        confidence: 0.9,
        context: 'global'
      },
      {
        phrases: [
          'route optimization',
          'optimize routes',
          'routing',
          'route planning'
        ],
        action: 'navigate.routing',
        confidence: 0.9,
        context: 'global'
      },

      // Export Commands
      {
        phrases: [
          'export as pdf',
          'generate report',
          'create pdf',
          'download report'
        ],
        action: 'export.pdf',
        confidence: 0.8,
        context: 'analysis'
      },
      {
        phrases: [
          'export data',
          'download csv',
          'export csv',
          'save data'
        ],
        action: 'export.csv',
        confidence: 0.8,
        context: 'analysis'
      },

      // UI Commands
      {
        phrases: [
          'open command palette',
          'show commands',
          'command menu',
          'quick actions'
        ],
        action: 'ui.command_palette',
        confidence: 0.9,
        context: 'global'
      },
      {
        phrases: [
          'open chat',
          'start chat',
          'ai assistant',
          'pie chat'
        ],
        action: 'ui.open_chat',
        confidence: 0.9,
        context: 'global'
      },

      // Data Query Commands with Parameters
      {
        phrases: [
          'show me data for {area}',
          'analyze {area} data',
          '{area} collections',
          'data from {area}'
        ],
        action: 'query.area_data',
        parameters: { area: 'string' },
        confidence: 0.7,
        context: 'analysis'
      },
      {
        phrases: [
          'collections in {month}',
          'data for {month}',
          '{month} analysis',
          'show {month} data'
        ],
        action: 'query.monthly_data',
        parameters: { month: 'string' },
        confidence: 0.7,
        context: 'analysis'
      },
      {
        phrases: [
          'top {number} providers',
          'best {number} providers',
          'show {number} providers',
          '{number} leading providers'
        ],
        action: 'query.top_providers',
        parameters: { number: 'number' },
        confidence: 0.8,
        context: 'analysis'
      }
    ];
  }

  private processVoiceCommand(transcript: string): void {
    this.onStatusCallback?.('processing');
    
    const matches = this.findCommandMatches(transcript);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      console.log('Voice command matched:', bestMatch);
      this.onCommandCallback?.(bestMatch);
      this.executeCommand(bestMatch);
    } else {
      console.log('No voice command matches found for:', transcript);
      // Fallback to general chat query
      this.executeCommand({
        command: {
          phrases: [transcript],
          action: 'chat.general_query',
          confidence: 0.5,
          context: 'global'
        },
        confidence: 0.5,
        extractedParams: { query: transcript }
      });
    }
  }

  private findCommandMatches(transcript: string): VoiceCommandMatch[] {
    const matches: VoiceCommandMatch[] = [];
    const transcriptLower = transcript.toLowerCase().trim();

    this.commands.forEach(command => {
      command.phrases.forEach(phrase => {
        const match = this.matchPhrase(transcriptLower, phrase.toLowerCase());
        if (match.confidence >= this.options.confidenceThreshold * 0.8) { // Slightly lower threshold for initial matching
          matches.push({
            command,
            confidence: match.confidence,
            extractedParams: match.params
          });
        }
      });
    });

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private matchPhrase(transcript: string, phrase: string): { confidence: number; params: Record<string, any> } {
    const params: Record<string, any> = {};
    
    // Handle parameter extraction for phrases with placeholders
    if (phrase.includes('{')) {
      return this.matchParameterizedPhrase(transcript, phrase);
    }

    // Simple similarity matching for exact phrases
    const similarity = this.calculateSimilarity(transcript, phrase);
    
    // Boost confidence for exact matches
    if (transcript === phrase) {
      return { confidence: 1.0, params };
    }
    
    // Boost confidence for substring matches
    if (transcript.includes(phrase) || phrase.includes(transcript)) {
      return { confidence: Math.max(0.8, similarity), params };
    }

    return { confidence: similarity, params };
  }

  private matchParameterizedPhrase(transcript: string, phrase: string): { confidence: number; params: Record<string, any> } {
    const params: Record<string, any> = {};
    
    // Convert phrase pattern to regex
    const regexPattern = phrase.replace(/\{(\w+)\}/g, (match, paramName) => {
      return `(?<${paramName}>\\w+(?:\\s+\\w+)*)`;
    });
    
    const regex = new RegExp(regexPattern, 'i');
    const match = transcript.match(regex);
    
    if (match && match.groups) {
      Object.entries(match.groups).forEach(([key, value]) => {
        params[key] = this.parseParameter(value, 'string'); // Default to string, could be enhanced
      });
      
      // High confidence for parameter matches
      return { confidence: 0.85, params };
    }
    
    // Fallback to fuzzy matching
    const basePhrase = phrase.replace(/\{[^}]+\}/g, '').trim();
    const similarity = this.calculateSimilarity(transcript, basePhrase);
    
    return { confidence: similarity * 0.6, params }; // Lower confidence for fuzzy parameter matches
  }

  private parseParameter(value: string, type: string): any {
    switch (type) {
      case 'number':
        const num = parseInt(value);
        return isNaN(num) ? value : num;
      case 'date':
        return new Date(value);
      default:
        return value.trim();
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }

  private executeCommand(match: VoiceCommandMatch): void {
    const { command, extractedParams } = match;
    
    // Execute based on action type
    switch (command.action) {
      case 'chat.new_analysis':
        this.triggerChatAction('Start a new analysis session');
        break;
      case 'chat.quick_insights':
        this.triggerChatAction('Show me quick insights and key metrics overview');
        break;
      case 'chat.collection_trends':
        this.triggerChatAction('Show me collection trends and patterns over the last 6 months');
        break;
      case 'chat.provider_performance':
        this.triggerChatAction('Compare service provider performance and efficiency metrics');
        break;
      case 'chat.delay_analysis':
        this.triggerChatAction('Show me locations with collection delays and overdue services');
        break;
      case 'chat.general_query':
        this.triggerChatAction(extractedParams.query);
        break;
      case 'query.area_data':
        this.triggerChatAction(`Analyze collection data for ${extractedParams.area}`);
        break;
      case 'query.monthly_data':
        this.triggerChatAction(`Show me collection data for ${extractedParams.month}`);
        break;
      case 'query.top_providers':
        this.triggerChatAction(`Show me the top ${extractedParams.number} service providers by performance`);
        break;
      case 'navigate.dashboard':
        window.location.href = '/dashboard';
        break;
      case 'navigate.fleet_map':
        window.location.href = '/fleet-map';
        break;
      case 'navigate.routing':
        window.location.href = '/route-optimization';
        break;
      case 'export.pdf':
        this.triggerExportAction('pdf');
        break;
      case 'export.csv':
        this.triggerExportAction('csv');
        break;
      case 'ui.command_palette':
        this.triggerUIAction('command_palette');
        break;
      case 'ui.open_chat':
        this.triggerUIAction('open_chat');
        break;
      default:
        console.log('Unknown voice command action:', command.action);
    }
  }

  private triggerChatAction(query: string): void {
    // Dispatch custom event for chat actions
    window.dispatchEvent(new CustomEvent('voice-chat-command', {
      detail: { query }
    }));
  }

  private triggerExportAction(format: string): void {
    // Dispatch custom event for export actions
    window.dispatchEvent(new CustomEvent('voice-export-command', {
      detail: { format }
    }));
  }

  private triggerUIAction(action: string): void {
    // Dispatch custom event for UI actions
    window.dispatchEvent(new CustomEvent('voice-ui-command', {
      detail: { action }
    }));
  }

  // === PUBLIC API ===

  /**
   * Start listening for voice commands
   */
  startListening(): boolean {
    if (!this.options.enabled || !this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.onErrorCallback?.('Failed to start listening');
      return false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Toggle voice listening
   */
  toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      return this.startListening();
    }
  }

  /**
   * Check if voice recognition is supported
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Register custom voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  /**
   * Remove voice command
   */
  removeCommand(action: string): void {
    this.commands = this.commands.filter(cmd => cmd.action !== action);
  }

  /**
   * Update voice service options
   */
  updateOptions(options: Partial<VoiceServiceOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (!this.options.enabled) {
      this.stopListening();
    } else if (!this.recognition) {
      this.initializeRecognition();
    }
  }

  /**
   * Set callback handlers
   */
  setCallbacks(callbacks: {
    onResult?: (result: VoiceRecognitionResult) => void;
    onCommand?: (match: VoiceCommandMatch) => void;
    onError?: (error: string) => void;
    onStatus?: (status: 'idle' | 'listening' | 'processing' | 'error') => void;
  }): void {
    this.onResultCallback = callbacks.onResult;
    this.onCommandCallback = callbacks.onCommand;
    this.onErrorCallback = callbacks.onError;
    this.onStatusCallback = callbacks.onStatus;
  }

  /**
   * Get available voice commands
   */
  getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  /**
   * Test voice command matching
   */
  testCommand(transcript: string): VoiceCommandMatch[] {
    return this.findCommandMatches(transcript);
  }

  /**
   * Get voice service statistics
   */
  getStatistics() {
    return {
      enabled: this.options.enabled,
      supported: this.isSupported(),
      listening: this.isListening,
      commandCount: this.commands.length,
      language: this.options.language,
      confidenceThreshold: this.options.confidenceThreshold
    };
  }
}

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();