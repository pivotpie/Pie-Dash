/**
 * Pie AI Service - GPT-5 Powered Grease Collection Assistant
 * Integrates with PPQ.AI API for natural language querying of Dubai grease trap collection data
 */

interface PieQuery {
  message: string;
  sessionId?: string;
  context?: 'dashboard' | 'map' | 'reports' | 'general';
}

interface PieResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestions?: string[];
  charts?: any[];
  sessionId: string;
  timestamp: string;
}

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class PieAiService {
  private config: ApiConfig;
  private systemPrompt: string;
  private dataInsights: any = null;
  private sessionHistory: Map<string, any[]> = new Map();

  constructor() {
    this.config = {
      baseUrl: 'https://api.ppq.ai',
      apiKey: import.meta.env.VITE_PPQ_API_KEY || '',
      model: 'gpt-5',
      maxTokens: 24000,
      temperature: 0.3
    };

    this.systemPrompt = this.buildSystemPrompt();
    this.loadDataInsights();
  }

  private buildSystemPrompt(): string {
    return `You are "Pie", PivotPie's intelligent AI assistant for Dubai grease trap collection data analysis.

I have access to comprehensive Q1 2023 Dubai grease collection data and can analyze it to answer your questions. I can create tables, provide rankings, calculate percentages, identify patterns, and offer insights just like any data analyst would.

Please analyze the provided dataset and respond naturally to user queries. Use tables, rankings, comparisons, and any format that best answers the question. Be thorough and helpful.

For queries outside grease collection data, politely redirect: "I specialize in Dubai grease collection data analysis. Please ask about our Q1 2023 operations instead."`;
  }

  private async loadDataInsights(): Promise<void> {
    try {
      const response = await fetch('/data_insights_q1_2023.json');
      this.dataInsights = await response.json();
      console.log('Pie AI: Q1 2023 data insights loaded successfully');
    } catch (error) {
      console.error('Pie AI: Failed to load Q1 2023 data insights:', error);
    }
  }

  private generateSessionId(): string {
    return `pie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildContextualPrompt(query: PieQuery): string {
    const userMessage = query.message;
    
    // Provide the complete dataset context for natural AI analysis
    let fullDataset = '';
    
    if (this.dataInsights) {
      // Provide comprehensive data in clean JSON format
      fullDataset = `DUBAI GREASE COLLECTION Q1 2023 DATASET:

${JSON.stringify(this.dataInsights, null, 2)}`;
    }

    return `${this.systemPrompt}

${fullDataset}

USER QUESTION: ${userMessage}

Please analyze the data and provide a comprehensive, natural response that directly answers the user's question. Format your response appropriately (tables, lists, etc.) as needed.`;
  }

  private isGeographicQuery(message: string): boolean {
    const geoKeywords = ['area', 'zone', 'location', 'geographic', 'al quoz', 'bur dubai', 'deira', 'jumeirah'];
    return geoKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isDelayQuery(message: string): boolean {
    const delayKeywords = ['delay', 'overdue', 'late', 'urgent', 'critical', 'warning', 'alert', 'due'];
    return delayKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isProviderQuery(message: string): boolean {
    const providerKeywords = ['provider', 'service provider', 'vehicle', 'fleet', 'performance', 'efficiency'];
    return providerKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isVolumeQuery(message: string): boolean {
    const volumeKeywords = ['gallon', 'volume', 'capacity', 'amount', 'collected', 'size'];
    return volumeKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isCategoryQuery(message: string): boolean {
    const categoryKeywords = ['restaurant', 'hotel', 'category', 'business', 'type', 'sector'];
    return categoryKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }


  private isOutOfScope(message: string): boolean {
    const outOfScopeKeywords = [
      'weather', 'news', 'politics', 'sports', 'entertainment', 'travel',
      'food recipe', 'programming', 'code', 'math', 'science', 'history',
      'personal', 'health', 'medical', 'finance', 'stock', 'crypto'
    ];
    
    const hasGreaseContext = ['grease', 'collection', 'trap', 'waste', 'dubai', 'entity', 'gallons'].some(
      keyword => message.toLowerCase().includes(keyword)
    );
    
    const hasOutOfScopeContent = outOfScopeKeywords.some(
      keyword => message.toLowerCase().includes(keyword)
    );
    
    return hasOutOfScopeContent && !hasGreaseContext;
  }

  async query(queryData: PieQuery): Promise<PieResponse> {
    try {
      // Check if query is out of scope
      if (this.isOutOfScope(queryData.message)) {
        return {
          response: "I'm Pie, your specialized assistant for Dubai grease trap collection analysis. I can only help with questions about our Q1 2023 collection data, operations, delays, and performance metrics. Could you rephrase your question to focus on grease collection operations?",
          confidence: 1.0,
          sessionId: queryData.sessionId || this.generateSessionId(),
          timestamp: new Date().toISOString(),
          suggestions: [
            "What are the top areas by collection volume?",
            "Show me overdue collections requiring attention",
            "Which service providers are most efficient?",
            "What's the average collection frequency?"
          ]
        };
      }

      const sessionId = queryData.sessionId || this.generateSessionId();
      const contextualPrompt = this.buildContextualPrompt(queryData);

      // Prepare request for Claude through PPQ.AI with full dataset context
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: contextualPrompt
          },
          {
            role: 'user',
            content: queryData.message
          }
        ]
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error('API Error:', response.status, await response.text());
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';

      // Store session history
      if (!this.sessionHistory.has(sessionId)) {
        this.sessionHistory.set(sessionId, []);
      }
      
      const sessionData = this.sessionHistory.get(sessionId)!;
      sessionData.push({
        query: queryData.message,
        response: aiResponse,
        timestamp: new Date().toISOString(),
        context: queryData.context
      });

      // Generate suggestions based on query type
      const suggestions = this.generateSuggestions(queryData.message);

      return {
        response: aiResponse,
        confidence: 0.9, // High confidence for in-scope queries
        sources: ['Q1 2023 Dubai Grease Collection Database'],
        suggestions,
        sessionId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Pie AI Service Error:', error);
      
      return {
        response: "I'm experiencing technical difficulties right now. Please try again in a moment, or contact support if the issue persists.",
        confidence: 0.0,
        sessionId: queryData.sessionId || this.generateSessionId(),
        timestamp: new Date().toISOString(),
        suggestions: [
          "Try rephrasing your question",
          "Ask about collection volumes",
          "Check delay alerts",
          "View provider performance"
        ]
      };
    }
  }

  private generateSuggestions(query: string): string[] {
    const allSuggestions = [
      "What are the top 5 areas by collection volume?",
      "Which entities are overdue for collection?",
      "Show me critical delay alerts",
      "Compare restaurant vs hotel collection patterns",
      "What's the average turnaround time?",
      "Which service provider is most efficient?",
      "Show collection trends by month",
      "What are the peak collection days?",
      "Which vehicles collect the most gallons?",
      "How many entities need immediate attention?"
    ];

    // Return 3-4 random suggestions
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }

  getSessionHistory(sessionId: string): any[] {
    return this.sessionHistory.get(sessionId) || [];
  }

  clearSession(sessionId: string): void {
    this.sessionHistory.delete(sessionId);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const testQuery: PieQuery = {
        message: "system health check",
        context: 'general'
      };
      
      const response = await this.query(testQuery);
      return response.confidence > 0;
    } catch {
      return false;
    }
  }
}

export default new PieAiService();
export type { PieQuery, PieResponse };