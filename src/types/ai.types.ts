// types/ai.types.ts
export interface QueryResult {
  question: string;
  sqlQuery: string;
  results: any[];
  naturalResponse: string;
  executionTime: number;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryResult?: QueryResult;
}

export interface AIQueryContext {
  currentDashboard?: string;
  selectedFilters?: any;
  recentQueries?: string[];
}