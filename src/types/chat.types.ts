import type { VisualizationResponse, MultiVisualizationResponse } from './visualization.types';

export interface ChatSession {
  id: string;
  title: string;
  messages: EnhancedChatMessage[];
  createdAt: string;
  lastUpdated: string;
}

export interface EnhancedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  queryResult?: EnhancedQueryResult;
}

export interface EnhancedQueryResult {
  question: string;
  sqlQuery: string;
  results: any[];
  naturalResponse: string; // Brief response for conversation
  detailedResponse: string; // Detailed response for artifacts
  visualization?: VisualizationResponse;
  multiVisualization?: MultiVisualizationResponse;
  sessionId: string;
  timestamp: string;
  executionTime: number;
  metadata: {
    recordCount: number;
    queryType: string;
    visualizationType?: string;
  };
}