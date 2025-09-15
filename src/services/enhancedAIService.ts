import { supabase } from './supabaseClient';
import type { EnhancedQueryResult, EnhancedChatMessage } from '../types/chat.types';
import type { VisualizationResponse, MultiVisualizationResponse } from '../types/visualization.types';
import type { SuggestedQuery } from '../types/enhanced-chat.types';

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class EnhancedAIService {
  private config: ApiConfig;
  private sessionHistory: Map<string, EnhancedChatMessage[]>;
  private queryCache: Map<string, EnhancedQueryResult>;
  private responseCache: Map<string, {
    briefResponse: string;
    detailedResponse: string;
    visualization: VisualizationResponse | null;
    multiVisualization: MultiVisualizationResponse | null;
    timestamp: number;
  }>;
  
  private static readonly DATABASE_SCHEMA = {
    services: {
      description: "Main table with 29,999+ waste collection service records from Dubai",
      columns: {
        service_report: "Unique service report ID (e.g., 'RN 176975')",
        entity_id: "Location identifier (e.g., 'E-1559')",
        service_provider: "Service provider name (66 total providers)",
        collected_date: "Date when waste was collected (DATE type)",
        discharged_date: "Date when waste was discharged (DATE type)",
        initiated_date: "Date when service was initiated (DATE type)",
        area: "Service area code - JOIN with areas table for proper names",
        zone: "Geographic zone code - JOIN with zones table for proper names",
        category: "Business category (Restaurant 48.5%, Accommodation 12.8%, etc.)",
        gallons_collected: "Volume in gallons (5-1578 range, avg 55.8)",
        assigned_vehicle: "Vehicle number (167 total vehicles)",
        outlet_name: "Business/facility name",
        initiator: "Service initiator (Org's System or Munci's System)",
        discharge_txn: "Discharge transaction ID",
        trap_count: "Number of traps serviced (default 1)",
        status: "Service status (default 'Discharged')",
        sub_area: "Sub-area within the main area",
        sub_category: "Sub-category within main category",
        trade_license_number: "Business trade license number",
        trap_label: "Trap identification label",
        trap_type: "Type of trap being serviced",
        latitude: "Latitude coordinate (NUMERIC)",
        longitude: "Longitude coordinate (NUMERIC)"
      },
      patterns: {
        geographic: "Al Quoz (26.6%) and Al Brsh (25.3%) = 52% of collections",
        business: "Restaurant category dominates with 48.5% of all collections",
        volume: "Standard sizes: 15 gal (30.2%), 25 gal (25.1%), 100 gal (19.4%)",
        providers: "66 providers, top provider handles 11.7% of collections",
        temporal: "Data spans multiple months with consistent collection patterns"
      },
      relationships: {
        areas: "FOREIGN KEY (area) REFERENCES areas (area_id)",
        zones: "FOREIGN KEY (zone) REFERENCES zones (zone_id)"
      }
    },
    areas: {
      description: "Geographic areas within Dubai zones",
      columns: {
        area_id: "Primary key for area",
        area_name: "Name of the area",
        zone_id: "Foreign key to zones table"
      }
    },
    zones: {
      description: "Major geographic zones in Dubai",
      columns: {
        zone_id: "Primary key for zone",
        zone_name: "Name of the zone"
      }
    },
    common_queries: [
      "SELECT * FROM services WHERE category = 'Restaurant' LIMIT 100",
      "SELECT area, COUNT(*) as collections, SUM(gallons_collected) as total_gallons FROM services GROUP BY area ORDER BY collections DESC",
      "SELECT service_provider, COUNT(*) FROM services GROUP BY service_provider ORDER BY COUNT(*) DESC LIMIT 10",
      "SELECT DATE_TRUNC('month', collected_date) as month, COUNT(*), AVG(gallons_collected) FROM services GROUP BY month ORDER BY month"
    ]
  };

  constructor() {
    // Initialize PPQ.AI configuration
    this.config = {
      baseUrl: 'https://api.ppq.ai',
      apiKey: import.meta.env.VITE_PPQ_API_KEY || '',
      model: 'gpt-5',
      maxTokens: 12000,
      temperature: 0.3
    };

    // Initialize session and cache storage
    this.sessionHistory = new Map();
    this.queryCache = new Map();
    this.responseCache = new Map();

    // Validate required environment variables
    if (!this.config.apiKey) {
      console.error('Missing VITE_PPQ_API_KEY environment variable');
      throw new Error('VITE_PPQ_API_KEY environment variable is required');
    }

    console.log('EnhancedAIService initialized successfully with PPQ.AI GPT-5');
  }

  async processQuery(
    question: string, 
    sessionId?: string
  ): Promise<EnhancedQueryResult> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!this.validateQuestion(question)) {
        throw new Error('Invalid question format');
      }
      
      // Generate or validate session ID
      const activeSessionId = sessionId || this.generateSessionId();
      if (!this.isValidSessionId(activeSessionId)) {
        throw new Error('Invalid session ID format');
      }
      
      console.log(`Processing query: "${question}" (Session: ${activeSessionId})`);
      
      // Check cache first
      const cacheEnabled = import.meta.env.VITE_ENABLE_QUERY_CACHE === 'true';
      const cacheKey = cacheEnabled ? this.createCacheKey(question) : '';
      
      if (cacheEnabled && cacheKey) {
        const cached = this.queryCache.get(cacheKey);
        if (cached) {
          console.log('Returning cached result');
          return cached;
        }
      }
      
      // Clean expired cache periodically
      if (cacheEnabled && Math.random() < 0.1) { // 10% chance to clean cache
        this.clearExpiredCache();
      }
      
      // Step 1: Generate SQL query
      console.log('Step 1: Generating SQL query...');
      const sqlQuery = await this.generateSQL(question);
      console.log('=== COMPLETE GENERATED SQL ===');
      console.log(sqlQuery);
      console.log('=== END SQL ===');
      
      // Step 2: Execute SQL query
      console.log('Step 2: Executing query...');
      const queryResults = await this.executeQuery(sqlQuery);
      console.log(`Query executed: ${queryResults.length} results`);
      
      // Step 3 & 4: Generate comprehensive response in a single AI call (with progressive loading)
      console.log('Step 3 & 4: Generating comprehensive response and visualization...');
      
      // Create a partial result immediately for better UX
      const partialResult: EnhancedQueryResult = {
        question,
        sqlQuery,
        results: queryResults,
        naturalResponse: "Analyzing your data and generating insights...",
        detailedResponse: "Please wait while we analyze your query results and generate comprehensive insights.",
        visualization: undefined,
        multiVisualization: undefined,
        sessionId: activeSessionId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        metadata: {
          recordCount: queryResults.length,
          queryType: this.classifyQueryType(question),
          visualizationType: 'loading'
        }
      };

      // Store partial result first
      if (cacheEnabled && cacheKey) {
        this.queryCache.set(cacheKey, partialResult);
      }
      
      // Generate comprehensive response
      const comprehensiveResponse = await this.generateComprehensiveResponse(question, queryResults, sqlQuery);
      
      const conversationResponse = comprehensiveResponse.briefResponse;
      const detailedResponse = comprehensiveResponse.detailedResponse;
      const visualization = comprehensiveResponse.visualization;
      const multiViz = comprehensiveResponse.multiVisualization;
      
      const executionTime = Date.now() - startTime;
      
      // Create enhanced query result
      const result: EnhancedQueryResult = {
        question,
        sqlQuery,
        results: queryResults,
        naturalResponse: conversationResponse,
        detailedResponse: detailedResponse,
        visualization: visualization || undefined,
        multiVisualization: multiViz || undefined,
        sessionId: activeSessionId,
        timestamp: new Date().toISOString(),
        executionTime,
        metadata: {
          recordCount: queryResults.length,
          queryType: this.classifyQueryType(question),
          visualizationType: visualization?.chartType || multiViz?.primary.chartType
        }
      };
      
      // Store in session history
      if (!this.sessionHistory.has(activeSessionId)) {
        this.sessionHistory.set(activeSessionId, []);
      }
      
      const sessionMessages = this.sessionHistory.get(activeSessionId)!;
      sessionMessages.push({
        id: `msg_${Date.now()}`,
        content: question,
        role: 'user',
        timestamp: new Date().toISOString()
      });
      sessionMessages.push({
        id: `msg_${Date.now() + 1}`,
        content: conversationResponse,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        queryResult: result
      });
      
      // Cache the result
      if (cacheEnabled && cacheKey) {
        this.queryCache.set(cacheKey, result);
      }
      
      console.log(`Query completed in ${executionTime}ms`);
      return result;
      
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`Query processing failed after ${errorTime}ms:`, error);
      
      // Return error result instead of throwing
      const errorMessage = `I encountered an error processing your query. ${error instanceof Error ? error.message : 'Please try rephrasing your question or contact support.'}`;
      return {
        question,
        sqlQuery: '',
        results: [],
        naturalResponse: `Sorry, I couldn't process your query. View detailed analysis in the right panel for more information.`,
        detailedResponse: errorMessage,
        visualization: undefined,
        sessionId: sessionId || this.generateSessionId(),
        timestamp: new Date().toISOString(),
        executionTime: errorTime,
        metadata: {
          recordCount: 0,
          queryType: 'error'
        }
      };
    }
  }

  private async callPPQChatCompletions(prompt: string): Promise<any> {
  const url = `${this.config.baseUrl}/chat/completions`;
  const body: Record<string, any> = {
    model: this.config.model,
    messages: [{ role: "user", content: prompt }],
    temperature: this.config.temperature
  };

  // ✅ Use max_completion_tokens for ppq.ai GPT-5
  if (this.config.maxTokens) {
    body["max_completion_tokens"] = this.config.maxTokens;
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${this.config.apiKey}`
  };

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `PPQ.AI error ${response.status}: ${response.statusText} - ${errText}`
    );
  }

  return await response.json();
}



  private async generateSQL(question: string): Promise<string> {
  const prompt = `You are a SQL query generator for a Dubai waste collection management database.
Generate ONLY a valid PostgreSQL SELECT query based on the user question.

DATABASE SCHEMA:
${JSON.stringify(EnhancedAIService.DATABASE_SCHEMA, null, 2)}

IMPORTANT RULES:
1. Return ONLY the SQL query, no explanations or markdown
2. Use only SELECT statements (no INSERT, UPDATE, DELETE)
3. Use proper PostgreSQL syntax and functions
4. NO LIMIT clauses - use full dataset for comprehensive analysis (only ~30k records)
5. DEFAULT to 2023 data unless user specifies different year (add WHERE EXTRACT(YEAR FROM collected_date) = 2023)
6. Use COLLECTED_DATE for collection performance metrics, not date_initiated
7. Use proper date comparisons (CURRENT_DATE, INTERVAL, EXTRACT)
8. For "this year" or unspecified timeframe, focus on 2023 data
9. AVOID WITH (CTE) clauses - use subqueries instead for better compatibility
10. For complex queries, use JOIN and subquery patterns rather than CTEs
11. Common terms mapping:
   - "collections" = rows in services table
   - "gallons" = gallons_collected column
   - "areas" = JOIN services s WITH areas a ON s.area = a.area_id, use a.area_name
   - "zones" = JOIN services s WITH zones z ON s.zone = z.zone_id, use z.zone_name
   - "providers" = service_provider column
   - "restaurants" = category = 'Restaurant'
   - "2023" or "year 2023" = EXTRACT(YEAR FROM collected_date) = 2023
   - "monthly" = GROUP BY EXTRACT(MONTH FROM collected_date)
   - "by provider" = GROUP BY service_provider
   - "by location" = GROUP BY z.zone_name, a.area_name (with proper JOINs)
   - "by zone" = JOIN with zones table, GROUP BY z.zone_name
   - "by area" = JOIN with areas table, GROUP BY a.area_name
   - "collection performance" = use collected_date column
   - "collection trends" = use collected_date for time-based analysis

12. CRITICAL for zone/area analysis:
   - ALWAYS JOIN with zones table: LEFT JOIN zones z ON s.zone = z.zone_id
   - ALWAYS JOIN with areas table: LEFT JOIN areas a ON s.area = a.area_id  
   - Use z.zone_name instead of raw zone codes
   - Use a.area_name instead of raw area codes
   - This provides proper readable names in results

BUSINESS CONTEXT:
This is Dubai's waste collection system with grease trap servicing for restaurants and other businesses.
Focus on practical waste management insights, collection efficiency, and service provider performance.

IMPORTANT: Do not include "SQL QUERY:" or any text before the query. Start directly with SELECT (or WITH for CTEs). Do not add a trailing semicolon.

USER QUESTION: "${question}"

SQL QUERY:`;

  try {
    const data = await this.callPPQChatCompletions(prompt);

    // Depending on schema: data.choices[0].message.content is typical for OpenAI compatibility
    let sqlQuery = data.choices?.[0]?.message?.content
                 || data.choices?.[0]?.text  // some schemas use text directly
                 || "";

    // Cleanup
    sqlQuery = sqlQuery.replace(/```sql\n?/gi, '').replace(/```\n?/gi, '').trim();
    sqlQuery = sqlQuery.replace(/^SQL QUERY:\s*/i, '').trim();

    if (!sqlQuery) {
      throw new Error('Empty SQL query from PPQ.AI');
    }

    this.validateQuery(sqlQuery);
    return sqlQuery;
  } catch (error) {
    console.error('SQL generation error:', error);
    throw new Error(`Failed to generate SQL query: ${error instanceof Error ? error.message : String(error)}`);
  }
}


  private async executeQuery(sqlQuery: string): Promise<any[]> {
    // Validate query safety before execution
    this.validateQuery(sqlQuery);
    
    // No LIMIT restrictions - use full dataset for comprehensive analysis
    let optimizedQuery = sqlQuery;
    
    // Ensure 2023 data focus unless user specifies different year
    if (!sqlQuery.toLowerCase().includes('date') && 
        !sqlQuery.toLowerCase().includes('year') && 
        !sqlQuery.toLowerCase().includes('2022') && 
        !sqlQuery.toLowerCase().includes('2024')) {
      console.log('Adding 2023 date filter for focused analysis using collected_date');
      // Add WHERE clause for 2023 using collected_date for collection performance
      if (sqlQuery.toLowerCase().includes('where')) {
        optimizedQuery = sqlQuery.replace(/where/i, "WHERE EXTRACT(YEAR FROM collected_date) = 2023 AND");
      } else {
        // Add WHERE clause before ORDER BY or at the end
        if (sqlQuery.toLowerCase().includes('order by')) {
          optimizedQuery = sqlQuery.replace(/order by/i, "WHERE EXTRACT(YEAR FROM collected_date) = 2023 ORDER BY");
        } else {
          optimizedQuery = `${sqlQuery} WHERE EXTRACT(YEAR FROM collected_date) = 2023`;
        }
      }
    }
    
    const maxRetries = Number(import.meta.env.VITE_MAX_QUERY_RETRIES) || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.rpc('execute_raw_sql', {
          sql_query: optimizedQuery
        });
        
        const executionTime = Date.now() - startTime;
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Log slow queries for optimization
        if (executionTime > 5000) {
          console.warn(`Slow query detected (${executionTime}ms):`, sqlQuery.substring(0, 100));
        }
        
        // Handle result size limits
        const results = data || [];
        if (results.length > 10000) {
          console.warn(`Large result set: ${results.length} rows - consider adding more filters`);
          return results.slice(0, 10000); // Limit to 10k rows for performance
        }
        
        console.log(`Query executed successfully in ${executionTime}ms, returned ${results.length} rows`);
        return results;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Attempt ${attempt} failed`);
        console.error(`Query execution attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All attempts failed
    throw new Error(`Query execution failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  private async generateComprehensiveResponse(
    question: string,
    results: any[],
    sqlQuery?: string
  ): Promise<{
    briefResponse: string;
    detailedResponse: string;
    visualization: VisualizationResponse | null;
    multiVisualization: MultiVisualizationResponse | null;
  }> {
    try {
      // Check cache first (using question + result count as key)
      const cacheKey = `${question.toLowerCase().trim()}_${results.length}_${JSON.stringify(results.slice(0,2))}`.substring(0, 100);
      const cached = this.responseCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
        console.log('Using cached comprehensive response');
        return cached;
      }
      
      console.log('Generating comprehensive response with single AI call...');
      const aiStartTime = Date.now();
      
      // Limit data size for faster processing
      const limitedResults = results.length > 20 ? results.slice(0, 20) : results;

      const prompt = `Generate rich, explanatory analysis of Dubai waste collection data in ChatGPT/Claude artifact style.

DATA: ${JSON.stringify(limitedResults, null, 2)}
QUERY: ${question}
TOTAL_RECORDS: ${results.length}

Required JSON (be concise for speed):
{
  "briefResponse": "2-3 sentences with key findings. End with 'View analysis in right panel.'",
  "detailedResponse": "# 📊 Analysis\n\n## Key Findings\n[Brief insights]\n\n## Data Summary\n[Simple table]\n\n## Recommendations\n- Key point 1\n- Key point 2",
  "visualization": {
    "chartType": "bar",
    "chartConfig": {
      "data": [/* Use top 10 data points only */],
      "layout": {"title": "Chart Title"}
    },
    "title": "Chart",
    "description": "Chart desc"
  },
  "insights": ["Finding 1", "Finding 2", "Finding 3"]
}

CRITICAL: Make detailedResponse like a professional analyst report with rich formatting, tables, and explanatory flow.`;

      // Add timeout for AI call to prevent long waits - 30 seconds max
      const aiCallPromise = this.callPPQChatCompletions(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI call timeout after 180 seconds')), 180000)
      );
      
      let data;
      try {
        data = await Promise.race([aiCallPromise, timeoutPromise]);
        const aiEndTime = Date.now();
        console.log(`AI call completed in ${aiEndTime - aiStartTime}ms`);
      } catch (error) {
        console.log('Main AI call failed, trying simplified fallback...');
        // Fallback with simplified prompt and reduced data
        const simplifiedData = results.slice(0, 10); // Only first 10 results
        const simplePrompt = `Analyze this Dubai waste collection data briefly:

DATA: ${JSON.stringify(simplifiedData, null, 2)}
QUERY: ${question}

Return JSON:
{
  "briefResponse": "2-3 sentences with key findings. End with 'View analysis in right panel.'",
  "detailedResponse": "# Analysis\n\n## Key Findings\n[Brief analysis]\n\n## Data Summary\n[Simple table or list]",
  "visualization": {
    "chartType": "bar",
    "chartConfig": {"data": [], "layout": {"title": "Chart"}},
    "title": "Chart",
    "description": "Chart description"
  },
  "insights": ["Finding 1", "Finding 2"]
}`;

        data = await this.callPPQChatCompletions(simplePrompt);
        console.log('Fallback AI call completed');
      }
      
      let responseText = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
      
      // Clean up JSON response
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsed = JSON.parse(responseText);
        
        // Validate and fix visualization data
        const visualization = parsed.visualization && this.validateVisualizationData(parsed.visualization, results) ? {
          chartType: parsed.visualization.chartType,
          chartConfig: parsed.visualization.chartConfig,
          title: parsed.visualization.title,
          description: parsed.visualization.description
        } : this.createFallbackVisualization(question, results);

        const multiVisualization = parsed.shouldCreateMultiple && parsed.additionalCharts ? {
          analysisType: 'multiple' as const,
          primary: visualization!,
          secondary: parsed.additionalCharts.map((chart: any) => ({
            chartType: chart.chartType,
            chartConfig: chart.chartConfig,
            title: chart.title,
            description: chart.description
          })),
          insights: parsed.insights || []
        } : null;

        const response = {
          briefResponse: parsed.briefResponse || this.generateFallbackBriefResponse(question, results),
          detailedResponse: parsed.detailedResponse || this.generateFallbackDetailedResponse(question, results, sqlQuery),
          visualization,
          multiVisualization
        };
        
        // Cache the response
        this.responseCache.set(cacheKey, {
          ...response,
          timestamp: Date.now()
        });
        
        return response;
      } catch (parseError) {
        console.warn('Failed to parse comprehensive AI response, using fallbacks:', parseError);
        return this.generateFallbackComprehensiveResponse(question, results, sqlQuery);
      }
    } catch (error) {
      console.error('Comprehensive response generation failed:', error);
      return this.generateFallbackComprehensiveResponse(question, results, sqlQuery);
    }
  }

  private async generateFallbackComprehensiveResponse(
    question: string,
    results: any[],
    sqlQuery?: string
  ): Promise<{
    briefResponse: string;
    detailedResponse: string;
    visualization: VisualizationResponse | null;
    multiVisualization: MultiVisualizationResponse | null;
  }> {
    // Use existing fallback methods
    const briefResponse = this.generateFallbackBriefResponse(question, results);
    const detailedResponse = this.generateFallbackDetailedResponse(question, results, sqlQuery);
    const visualization = this.generateFallbackVisualization(question, results);
    
    return {
      briefResponse,
      detailedResponse,
      visualization,
      multiVisualization: null
    };
  }

  private async generateConversationResponse(
    question: string, 
    results: any[],
    sqlQuery?: string
  ): Promise<string> {
    try {
      // Try PPQ.AI first, fallback if it fails
      console.log('Generating conversation response with PPQ.AI...');
    const prompt = `You are an AI assistant providing a BRIEF, conversational response about Dubai's waste collection data.

CONTEXT:
- 29,999+ total service records across 3,000+ locations  
- This is grease trap waste collection data from Dubai Municipality

USER QUESTION: "${question}"
QUERY RESULTS: ${results.length} records found

RESPONSE REQUIREMENTS:
1. Keep response to 2-3 sentences maximum
2. Highlight the most important finding only
3. Use conversational, friendly tone
4. Include key numbers but don't overwhelm
5. End with "View detailed analysis in the right panel for more insights."

Brief Response:`;

    try {
      const data = await this.callPPQChatCompletions(prompt);
      let briefResponse = data.choices?.[0]?.message?.content
                         || data.choices?.[0]?.text
                         || "";

      briefResponse = briefResponse.trim();
      if (!briefResponse) {
        briefResponse = this.generateFallbackBriefResponse(question, results);
      }

      return briefResponse;
    } catch (error) {
      console.error('Brief response generation error:', error);
      return this.generateFallbackBriefResponse(question, results);
    }
    } catch (outerError) {
      console.error('Conversation response generation failed:', outerError);
      return this.generateFallbackBriefResponse(question, results);
    }
  }

  private async generateDetailedResponse(
  question: string, 
  results: any[],
  sqlQuery?: string
): Promise<string> {
    try {
      // Try PPQ.AI first, fallback if it fails
      console.log('Generating detailed response with PPQ.AI...');
      
      const prompt = `You are an AI assistant providing DETAILED analysis of Dubai's waste collection data.

CONTEXT:
- 29,999+ total service records across 3,000+ locations  
- 167 vehicles, 66 service providers across Dubai
- Geographic concentration: Al Quoz (26.6%) + Al Brsh (25.3%) = 52%
- Business focus: Restaurants (48.5%), Accommodations (12.8%)
- Standard volumes: 15 gal (30.2%), 25 gal (25.1%), 100 gal (19.4%)
- This is grease trap waste collection data from Dubai Municipality

USER QUESTION: "${question}"

${sqlQuery ? `EXECUTED SQL: ${sqlQuery}` : ''}

QUERY RESULTS (${results.length} records):
${JSON.stringify(results.slice(0, 10), null, 2)}
${results.length > 10 ? `\n... (showing first 10 of ${results.length} total results)` : ''}

RESPONSE REQUIREMENTS:
1. Direct answer with specific numbers and insights
2. Key patterns and trends
3. Use business-friendly language focused on waste management
4. Include percentages, totals, averages, comparisons where relevant  
5. If concerning patterns, highlight them
6. If no data found, explain why and suggest alternatives
7. Keep response conversational but professional
8. Focus on actionable insights`;

  try {
    const data = await this.callPPQChatCompletions(prompt);
    let naturalResponse = data.choices?.[0]?.message?.content
                        || data.choices?.[0]?.text
                        || "";

    naturalResponse = naturalResponse.trim();
    if (!naturalResponse) {
      naturalResponse = this.generateFallbackResponse(question, results);
    }

    naturalResponse = this.enhanceWithStatistics(naturalResponse, results);
    return naturalResponse;
  } catch (error) {
    console.error('Response generation error:', error);
    return this.generateFallbackDetailedResponse(question, results, sqlQuery);
  }
  } catch (outerError) {
    console.error('Detailed response generation failed:', outerError);
    return this.generateFallbackDetailedResponse(question, results, sqlQuery);
  }
}


  private async generateVisualization(
  question: string, 
  results: any[]
): Promise<VisualizationResponse | null> {
  console.log('=== VISUALIZATION DEBUG START ===');
  console.log('Question:', question);
  console.log('Results length:', results.length);
  console.log('First result sample:', results[0]);
  console.log('Results type:', typeof results[0]);
  
  // Skip visualization if no data
  if (!results || results.length === 0) {
    console.log('SKIP: No data');
    return null;
  }
  
  // Handle potential nested result structure
  let firstResult = results[0];
  console.log('Original first result:', firstResult);
  
  if (firstResult && typeof firstResult === 'object' && 'result' in firstResult) {
    console.log('TRANSFORMATION: Detected nested result structure');
    firstResult = firstResult.result;
    results = results.map(item => item.result || item);
    console.log('Transformed first result:', firstResult);
  }
  
  if (!firstResult || typeof firstResult !== 'object') {
    console.log('SKIP: Invalid data structure', { firstResult, type: typeof firstResult });
    return null;
  }
  
  const keys = Object.keys(firstResult);
  console.log('Available keys:', keys);
  
  const numericKeys = keys.filter(key => {
    const value = firstResult[key];
    console.log(`Key "${key}": value=${value}, type=${typeof value}, isNumber=${typeof value === 'number'}, isNaN=${isNaN(value)}`);
    
    if (value == null) return false;
    
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return true;
    }
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      const isValidNum = !isNaN(numValue) && isFinite(numValue);
      console.log(`  String "${value}" -> ${numValue}, valid: ${isValidNum}`);
      return isValidNum;
    }
    return false;
  });
  
  console.log('Numeric keys found:', numericKeys);
  
  if (numericKeys.length === 0) {
    console.log('SKIP: No numeric data available');
    // FORCE CREATE A SIMPLE CHART ANYWAY
    return this.createSimpleTableVisualization(question, results);
  }

  try {
    const chartType = this.determineChartType(question, results);
    console.log('Chart type determined:', chartType);
    
    const plotlyConfig = this.createFallbackPlotlyConfig(results, chartType);
    console.log('Plotly config created:', plotlyConfig ? 'SUCCESS' : 'FAILED');
    
    if (plotlyConfig) {
      console.log('Plotly config data length:', plotlyConfig.data?.length);
      console.log('Plotly config sample:', JSON.stringify(plotlyConfig, null, 2).substring(0, 500));
      
      const result = {
        chartType: chartType,
        chartConfig: plotlyConfig,
        title: this.generateChartTitle(question, chartType),
        description: `${chartType} chart showing ${results.length} data points`
      };
      
      console.log('=== VISUALIZATION SUCCESS ===');
      return result;
    } else {
      console.log('FALLBACK: Creating simple visualization');
      return this.createSimpleTableVisualization(question, results);
    }
    
  } catch (error) {
    console.error('VISUALIZATION ERROR:', error);
    return this.createSimpleTableVisualization(question, results);
  }
}

// Add this new method to always create something
private createSimpleTableVisualization(question: string, results: any[]): VisualizationResponse {
  console.log('Creating simple table visualization');
  
  if (!results || results.length === 0) {
    return {
      chartType: 'bar',
      chartConfig: {
        data: [{
          type: 'bar',
          x: ['No Data'],
          y: [0],
          marker: { color: '#EF4444' }
        }],
        layout: {
          title: { text: 'No Data Available', font: { size: 16 } },
          xaxis: { title: { text: 'Status' } },
          yaxis: { title: { text: 'Count' } }
        }
      },
      title: 'No Data Found',
      description: 'No data available for visualization'
    };
  }

  // Create a simple summary chart
  const summaryData = [
    { label: 'Total Records', value: results.length },
    { label: 'Data Fields', value: Object.keys(results[0]).length }
  ];

  return {
    chartType: 'bar',
    chartConfig: {
      data: [{
        type: 'bar',
        x: summaryData.map(d => d.label),
        y: summaryData.map(d => d.value),
        marker: { color: '#3B82F6' }
      }],
      layout: {
        title: { text: 'Data Summary', font: { size: 16 } },
        xaxis: { title: { text: 'Metric' } },
        yaxis: { title: { text: 'Count' } },
        margin: { t: 60, r: 30, b: 80, l: 60 }
      }
    },
    title: 'Data Summary',
    description: `Summary of ${results.length} records`
  };
}

  private async generateMultiVisualization(
    question: string, 
    results: any[]
  ): Promise<import('../types/visualization.types').MultiVisualizationResponse | null> {
    // Skip if no data
    if (!results || results.length === 0) {
      return null;
    }
    
    // Determine if query warrants multiple charts
    const analysisType = this.determineAnalysisComplexity(question, results);
    
    if (analysisType === 'single') {
      // Generate single chart
      const singleViz = await this.generateSingleVisualization(question, results);
      if (!singleViz) return null;
      
      return {
        primary: singleViz,
        analysisType: 'single',
        insights: [`Primary analysis showing ${singleViz.chartType} visualization`]
      };
    }
    
    // Generate multiple charts for complex analysis
    try {
      const [primaryViz, secondaryViz] = await Promise.all([
        this.generateSingleVisualization(question, results),
        this.generateSecondaryVisualization(question, results)
      ]);
      
      if (!primaryViz) return null;
      
      const insights = [
        `Multi-dimensional analysis with ${primaryViz.chartType} as primary view`,
        secondaryViz ? `Secondary ${secondaryViz.chartType} view provides additional perspective` : 'Single view analysis'
      ].filter(Boolean);
      
      return {
        primary: primaryViz,
        secondary: secondaryViz ? [secondaryViz] : undefined,
        analysisType: 'multiple',
        insights
      };
    } catch (error) {
      console.error('Multi-visualization generation failed:', error);
      return null;
    }
  }

  private determineAnalysisComplexity(question: string, results: any[]): 'single' | 'multiple' {
    const questionLower = question.toLowerCase();
    const firstResult = results[0];
    const keys = Object.keys(firstResult);
    
    // Check for complex analysis indicators
    const complexityIndicators = [
      'compare', 'vs', 'versus', 'analyze', 'breakdown', 'distribution',
      'trend', 'correlation', 'performance', 'efficiency', 'patterns'
    ];
    
    const hasComplexTerms = complexityIndicators.some(term => questionLower.includes(term));
    const hasMultipleNumericColumns = keys.filter(key => typeof firstResult[key] === 'number').length > 2;
    const hasSufficientData = results.length > 10;
    
    return (hasComplexTerms && hasMultipleNumericColumns && hasSufficientData) ? 'multiple' : 'single';
  }

  private async generateSingleVisualization(
    question: string, 
    results: any[]
  ): Promise<VisualizationResponse | null> {
    if (!results || results.length === 0) return null;
    
    try {
      const chartType = this.determineChartType(question, results);
      const plotlyConfig = await this.generatePlotlyConfig(question, results, chartType);
      
      if (plotlyConfig) {
        return {
          chartType: chartType,
          chartConfig: plotlyConfig,
          title: this.generateChartTitle(question, chartType),
          description: `${chartType} chart showing ${results.length} data points`
        };
      }
    } catch (error) {
      console.warn('Single visualization generation failed:', error);
      return this.generateFallbackVisualization(question, results);
    }
    
    return null;
  }

  private async generateSecondaryVisualization(
    question: string, 
    results: any[]
  ): Promise<VisualizationResponse | null> {
    if (!results || results.length === 0) return null;
    
    // Generate a complementary chart type
    const primaryType = this.determineChartType(question, results);
    let secondaryType: 'bar' | 'line' | 'pie' | 'scatter';
    
    // Choose complementary chart type
    switch (primaryType) {
      case 'bar':
        secondaryType = 'pie';
        break;
      case 'pie':
        secondaryType = 'bar';
        break;
      case 'line':
        secondaryType = 'scatter';
        break;
      case 'scatter':
        secondaryType = 'line';
        break;
      default:
        secondaryType = 'bar';
    }
    
    try {
      const plotlyConfig = this.createFallbackPlotlyConfig(results, secondaryType);
      
      if (plotlyConfig) {
        return {
          chartType: secondaryType,
          chartConfig: plotlyConfig,
          title: this.generateChartTitle(question, secondaryType) + ' (Alternative View)',
          description: `Alternative ${secondaryType} visualization`
        };
      }
    } catch (error) {
      console.warn('Secondary visualization generation failed:', error);
    }
    
    return null;
  }

  // Visualization Helper Methods
  private determineChartType(question: string, results: any[]): 'bar' | 'line' | 'pie' | 'scatter' {
    const questionLower = question.toLowerCase();
    const firstResult = results[0];
    const keys = Object.keys(firstResult);
    
    // Check for time-based data
    const hasTimeColumn = keys.some(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('time')
    );
    
    // Check for categorical vs numeric data
    const numericColumns = keys.filter(key => typeof firstResult[key] === 'number');
    const categoricalColumns = keys.filter(key => typeof firstResult[key] === 'string');
    
    // Decision logic for chart type
    if (questionLower.includes('trend') || questionLower.includes('over time') || hasTimeColumn) {
      return 'line';
    }
    
    if (questionLower.includes('distribution') || questionLower.includes('percentage') || 
        questionLower.includes('share') || results.length <= 10) {
      return 'pie';
    }
    
    if (questionLower.includes('correlation') || questionLower.includes('relationship')) {
      return 'scatter';
    }
    
    // Default to bar chart for most comparisons
    return 'bar';
  }

  private async generatePlotlyConfig(
    question: string, 
    results: any[], 
    chartType: 'bar' | 'line' | 'pie' | 'scatter'
  ): Promise<any> {
    try {
      // Try PPQ.AI first, fallback if it fails
      console.log('Generating Plotly config with PPQ.AI...');
      
      const prompt = `Generate a Plotly.js configuration for visualizing data.

CHART TYPE: ${chartType}
DATA SAMPLE (first 3 rows):
${JSON.stringify(results.slice(0, 3), null, 2)}

USER QUESTION: "${question}"

REQUIREMENTS:
1. Return ONLY valid JSON for Plotly.js configuration
2. Use appropriate data columns for x/y axes based on data structure
3. Include proper titles, labels, and colors
4. Make charts responsive and professional
5. For Dubai waste collection context, use appropriate colors (blues, greens)
6. Include hover information and proper formatting

PLOTLY CONFIG:`;

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: this.config.maxTokens,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`PPQ.AI API error ${response.status}: ${errorText}`);
        throw new Error(`PPQ.AI API error: ${response.status}`);
      }

      const data = await response.json();
      let configJson = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
      
      // Clean up the response
      configJson = configJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(configJson);
      } catch (parseError) {
        console.warn('Failed to parse AI-generated config, using fallback');
        return this.createFallbackPlotlyConfig(results, chartType);
      }
      
    } catch (error) {
      console.warn('AI config generation failed, using fallback:', error);
      return this.createFallbackPlotlyConfig(results, chartType);
    }
    } catch (outerError) {
      console.warn('Plotly config generation failed completely:', outerError);
      return this.createFallbackPlotlyConfig(results, chartType);
    }
  }

  private createFallbackPlotlyConfig(results: any[], chartType: 'bar' | 'line' | 'pie' | 'scatter'): any {
    if (!results || results.length === 0) {
      return null;
    }
    
    let firstResult = results[0];
    
    // Handle potential nested result structure
    if (firstResult && typeof firstResult === 'object' && 'result' in firstResult) {
      firstResult = firstResult.result;
      // Also update the results array to use the corrected structure
      results = results.map(item => item.result || item);
    }
    
    if (!firstResult || typeof firstResult !== 'object') {
      return null;
    }
    
    const keys = Object.keys(firstResult);
    const numericKeys = keys.filter(key => {
      const value = firstResult[key];
      // Check if the value is numeric (number or string that can be converted to number)
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return true;
      }
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && isFinite(numValue);
      }
      return false;
    });
    const stringKeys = keys.filter(key => {
      const value = firstResult[key];
      return typeof value === 'string' && value !== null && value !== '' &&
             isNaN(parseFloat(value)); // Only true string data, not numeric strings
    });
    
    // Ensure we have valid data for charts
    if (numericKeys.length === 0 && chartType !== 'pie') {
      console.warn('No valid numeric data found for chart');
      return null;
    }
    
    const xKey = stringKeys[0] || keys[0];
    const yKey = numericKeys[0] || keys[1];
    
    // Filter out null/undefined values and ensure numeric data is valid
    const validResults = results.filter(r => {
      if (r[xKey] == null || r[yKey] == null) return false;
      
      if (chartType === 'pie') return true;
      
      // Check if yKey value is numeric (number or convertible string)
      const yValue = r[yKey];
      if (typeof yValue === 'number') {
        return !isNaN(yValue) && isFinite(yValue);
      }
      if (typeof yValue === 'string') {
        const numValue = parseFloat(yValue);
        return !isNaN(numValue) && isFinite(numValue);
      }
      return false;
    });
    
    if (validResults.length === 0) {
      console.warn('No valid data after filtering');
      return null;
    }

    switch (chartType) {
      case 'bar':
        return {
          data: [{
            type: 'bar',
            x: validResults.map(r => String(r[xKey] || 'N/A')),
            y: validResults.map(r => {
              const value = r[yKey];
              return typeof value === 'string' ? parseFloat(value) || 0 : Number(value || 0);
            }),
            marker: { color: '#3B82F6' },
            text: validResults.map(r => String(r[yKey] || 0)),
            textposition: 'outside'
          }],
          layout: {
            title: { text: 'Data Analysis', font: { size: 16 } },
            xaxis: { title: xKey, tickangle: -45 },
            yaxis: { title: yKey },
            margin: { t: 60, r: 30, b: 80, l: 60 }
          }
        };
        
      case 'pie':
        return {
          data: [{
            type: 'pie',
            labels: validResults.map(r => String(r[xKey] || 'N/A')),
            values: validResults.map(r => {
              const value = r[yKey];
              return typeof value === 'string' ? parseFloat(value) || 0 : Number(value || 0);
            }),
            textinfo: 'percent+label',
            textposition: 'auto',
            hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percent: %{percent}<extra></extra>'
          }],
          layout: {
            title: { text: 'Data Distribution', font: { size: 16 } },
            margin: { t: 60, r: 30, b: 30, l: 30 }
          }
        };
        
      case 'line':
        return {
          data: [{
            type: 'scatter',
            mode: 'lines+markers',
            x: validResults.map(r => String(r[xKey] || 'N/A')),
            y: validResults.map(r => {
              const value = r[yKey];
              return typeof value === 'string' ? parseFloat(value) || 0 : Number(value || 0);
            }),
            line: { color: '#10B981', width: 2 },
            marker: { color: '#10B981', size: 6 },
            hovertemplate: '<b>%{x}</b><br>%{y}<extra></extra>'
          }],
          layout: {
            title: { text: 'Trend Analysis', font: { size: 16 } },
            xaxis: { title: xKey, tickangle: -45 },
            yaxis: { title: yKey },
            margin: { t: 60, r: 30, b: 80, l: 60 }
          }
        };
        
      case 'scatter':
        return {
          data: [{
            type: 'scatter',
            mode: 'markers',
            x: validResults.map(r => {
              const value = r[xKey];
              return typeof value === 'string' ? parseFloat(value) || 0 : Number(value || 0);
            }),
            y: validResults.map(r => {
              const value = r[yKey];
              return typeof value === 'string' ? parseFloat(value) || 0 : Number(value || 0);
            }),
            marker: { 
              color: '#8B5CF6',
              size: 8,
              opacity: 0.7
            },
            hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<extra></extra>'
          }],
          layout: {
            title: { text: 'Data Correlation', font: { size: 16 } },
            xaxis: { title: xKey },
            yaxis: { title: yKey },
            margin: { t: 60, r: 30, b: 60, l: 60 }
          }
        };
    }
    
    return null;
  }

  private generateChartTitle(question: string, chartType: string): string {
    const questionWords = question.toLowerCase();
    
    if (questionWords.includes('collection')) return `Collection Analysis - ${chartType} Chart`;
    if (questionWords.includes('provider')) return `Service Provider Analysis - ${chartType} Chart`;
    if (questionWords.includes('area')) return `Geographic Analysis - ${chartType} Chart`;
    if (questionWords.includes('volume')) return `Volume Analysis - ${chartType} Chart`;
    
    return `Dubai Waste Collection Analysis - ${chartType} Chart`;
  }

  private generateFallbackVisualization(question: string, results: any[]): VisualizationResponse | null {
    if (results.length === 0) return null;
    
    const chartType = this.determineChartType(question, results);
    const config = this.createFallbackPlotlyConfig(results, chartType);
    
    return {
      chartType: chartType,
      chartConfig: config,
      title: this.generateChartTitle(question, chartType),
      description: `Fallback ${chartType} visualization with ${results.length} data points`
    };
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createCacheKey(question: string): string {
    return `cache_${question.toLowerCase().replace(/\s+/g, '_').substr(0, 50)}_${Date.now().toString().substr(-6)}`;
  }


  private isValidSessionId(sessionId: string): boolean {
    // More flexible validation - accept any non-empty string with minimum length
    return Boolean(sessionId) && sessionId.length >= 8;
  }

  private clearExpiredCache(): void {
    const cacheExpiryMinutes = Number(import.meta.env.VITE_CACHE_DURATION_MINUTES) || 30;
    const expiryTime = Date.now() - (cacheExpiryMinutes * 60 * 1000);
    
    const keysToDelete: string[] = [];
    this.queryCache.forEach((result, key) => {
      const resultTimestamp = new Date(result.timestamp).getTime();
      if (resultTimestamp < expiryTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.queryCache.delete(key));
    
    console.log(`Cleared expired cache entries. Remaining: ${this.queryCache.size}`);
  }

  private generateFallbackBriefResponse(question: string, results: any[]): string {
    if (results.length === 0) {
      return `No data found for "${question}". View detailed analysis in the right panel for more insights.`;
    }

    return `Found ${results.length} results for your query. The data shows key patterns in Dubai's waste collection operations. View detailed analysis in the right panel for more insights.`;
  }

  private generateFallbackDetailedResponse(question: string, results: any[], sqlQuery?: string): string {
    if (results.length === 0) {
      return `No data found for your query "${question}". This could be due to specific filters, date ranges, or categories that don't match our current dataset. Try broadening your search criteria or ask about general waste collection patterns in Dubai's grease trap servicing system.`;
    }

    let response = `## Waste Collection Analysis Results\n\n**Query:** "${question}"\n**Records Found:** ${results.length} entries\n\n`;

    // Analyze the data structure to provide insights
    let firstResult = results[0];
    
    // Handle nested result structure
    if (firstResult && typeof firstResult === 'object' && 'result' in firstResult) {
      firstResult = firstResult.result;
      results = results.map(item => item.result || item);
    }
    
    if (firstResult && typeof firstResult === 'object') {
      const keys = Object.keys(firstResult);
      const numericKeys = keys.filter(key => {
        const value = firstResult[key];
        return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
      });
      
      response += `**Data Overview:**\n`;
      response += `- ${keys.length} data fields analyzed\n`;
      response += `- ${numericKeys.length} quantitative metrics available\n\n`;
      
      // Try to identify key patterns
      if (keys.includes('collections') || keys.includes('total_collections')) {
        response += `**Collection Patterns:**\n`;
        const collections = results.map(r => r.collections || r.total_collections || 0).filter(c => c > 0);
        if (collections.length > 0) {
          const maxCollections = Math.max(...collections);
          const minCollections = Math.min(...collections);
          const avgCollections = collections.reduce((a, b) => a + b, 0) / collections.length;
          response += `- Collection volume ranges from ${minCollections} to ${maxCollections} per area/provider\n`;
          response += `- Average collections: ${Math.round(avgCollections)} per entity\n`;
        }
      }
      
      if (keys.includes('total_gallons') || keys.includes('gallons_collected')) {
        response += `\n**Volume Analysis:**\n`;
        const gallons = results.map(r => r.total_gallons || r.gallons_collected || 0).filter(g => g > 0);
        if (gallons.length > 0) {
          const totalGallons = gallons.reduce((a, b) => a + b, 0);
          response += `- Total volume processed: ${totalGallons.toLocaleString()} gallons\n`;
          response += `- Average volume per record: ${Math.round(totalGallons / gallons.length)} gallons\n`;
        }
      }
      
      if (keys.includes('area') || keys.includes('service_provider')) {
        response += `\n**Geographic & Service Analysis:**\n`;
        if (keys.includes('area')) {
          const uniqueAreas = Array.from(new Set(results.map(r => r.area).filter(Boolean)));
          response += `- Service areas covered: ${uniqueAreas.length}\n`;
        }
        if (keys.includes('service_provider')) {
          const uniqueProviders = Array.from(new Set(results.map(r => r.service_provider).filter(Boolean)));
          response += `- Service providers involved: ${uniqueProviders.length}\n`;
        }
      }
      
      if (keys.includes('avg_days_initiated_to_collected') || keys.includes('avg_days_collected_to_discharged')) {
        response += `\n**Efficiency Metrics:**\n`;
        if (keys.includes('avg_days_initiated_to_collected')) {
          const avgDays = results.map(r => r.avg_days_initiated_to_collected).filter(d => d != null);
          if (avgDays.length > 0) {
            const overallAvg = avgDays.reduce((a, b) => Number(a) + Number(b), 0) / avgDays.length;
            response += `- Average response time: ${overallAvg.toFixed(1)} days from initiation to collection\n`;
          }
        }
        if (keys.includes('pct_same_day_discharge')) {
          const pctSameDay = results.map(r => r.pct_same_day_discharge).filter(p => p != null);
          if (pctSameDay.length > 0) {
            const avgSameDay = pctSameDay.reduce((a, b) => Number(a) + Number(b), 0) / pctSameDay.length;
            response += `- Same-day processing rate: ${avgSameDay.toFixed(1)}% average\n`;
          }
        }
      }
    }
    
    response += `\n**Technical Details:**\n`;
    response += `- Query executed successfully returning ${results.length} records\n`;
    response += `- Data represents Dubai Municipality's grease trap servicing operations\n`;
    if (sqlQuery) {
      response += `- Custom SQL analysis performed on services database\n`;
    }
    
    response += `\n*This analysis provides insights into Dubai's waste collection efficiency, geographic coverage, and service provider performance patterns.*`;

    return response;
  }

  private generateFallbackResponse(question: string, results: any[]): string {
    if (results.length === 0) {
      return `No data found for your query "${question}". This could be due to specific filters, date ranges, or categories that don't match our current dataset. Try broadening your search criteria or ask about general waste collection patterns.`;
    }

    let response = `Based on your query "${question}", I found ${results.length} records in our waste collection database.`;

    // Try to provide basic insights from the data structure
    let firstResult = results[0];
    
    // Handle nested result structure
    if (firstResult && typeof firstResult === 'object' && 'result' in firstResult) {
      firstResult = firstResult.result;
    }
    
    if (firstResult && typeof firstResult === 'object') {
      const keys = Object.keys(firstResult);
      
      if (keys.includes('count') || keys.includes('total') || keys.includes('sum') || keys.includes('collections')) {
        response += ` The results include numerical summaries that show key metrics for Dubai's waste collection operations.`;
      }
      
      if (keys.includes('area') || keys.includes('zone')) {
        response += ` The data spans multiple geographic areas across Dubai.`;
      }
      
      if (keys.includes('category') || keys.includes('service_provider')) {
        response += ` Various business categories and service providers are represented in the results.`;
      }
    }

    response += ` For more detailed analysis, please try rephrasing your question or ask about specific aspects like "top performing areas" or "collection volumes by month".`;

    return response;
  }

  private enhanceWithStatistics(response: string, results: any[]): string {
    if (results.length === 0) return response;

    try {
      const firstResult = results[0];
      const keys = Object.keys(firstResult);
      
      // Calculate basic statistics for numeric columns
      const numericColumns = keys.filter(key => 
        typeof firstResult[key] === 'number' && 
        !['id', 'latitude', 'longitude'].includes(key.toLowerCase())
      );

      if (numericColumns.length > 0) {
        const stats: string[] = [];
        
        numericColumns.forEach(column => {
          const values = results.map(r => r[column]).filter(v => v != null && !isNaN(v));
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            
            if (sum > 1000) {
              stats.push(`Total ${column}: ${sum.toLocaleString()}`);
            }
            if (avg > 1) {
              stats.push(`Average ${column}: ${avg.toFixed(1)}`);
            }
          }
        });

        if (stats.length > 0) {
          response += `\n\nKey Statistics: ${stats.join(', ')}.`;
        }
      }
    } catch (error) {
      // Silently fail statistical enhancement
      console.warn('Statistical enhancement failed:', error);
    }

    return response;
  }

  // Session Management Methods
  public getSessionHistory(sessionId: string): EnhancedChatMessage[] {
    return this.sessionHistory.get(sessionId) || [];
  }

  public getAllSessions(): Map<string, EnhancedChatMessage[]> {
    return new Map(this.sessionHistory);
  }

  public clearSession(sessionId: string): void {
    this.sessionHistory.delete(sessionId);
    console.log(`Session ${sessionId} cleared`);
  }

  public clearAllSessions(): void {
    this.sessionHistory.clear();
    console.log('All sessions cleared');
  }

  // Query Classification Helper
  private classifyQueryType(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('trend') || questionLower.includes('over time')) return 'temporal';
    if (questionLower.includes('compare') || questionLower.includes('vs')) return 'comparative';
    if (questionLower.includes('total') || questionLower.includes('count')) return 'aggregation';
    if (questionLower.includes('area') || questionLower.includes('zone')) return 'geographic';
    if (questionLower.includes('provider') || questionLower.includes('company')) return 'provider';
    if (questionLower.includes('category') || questionLower.includes('business')) return 'category';
    if (questionLower.includes('volume') || questionLower.includes('gallon')) return 'volume';
    if (questionLower.includes('delay') || questionLower.includes('overdue')) return 'delay';
    
    return 'general';
  }

  private validateQuestion(question: string): boolean {
    if (!question || question.trim().length < 3) {
      return false;
    }
    
    const trimmed = question.trim();
    return trimmed.length <= 500 && !trimmed.includes('<script>');
  }

  private transformCTEToSubquery(query: string): string {
    // Handle simple CTE patterns like: WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name
    const ctePattern = /WITH\s+(\w+)\s+AS\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\)\s*(.+)/i;
    const match = query.match(ctePattern);
    
    if (!match) {
      throw new Error("Unsupported CTE format");
    }
    
    const cteName = match[1];
    const cteQuery = match[2].trim();
    const mainQuery = match[3].trim();
    
    // Replace references to the CTE with the subquery
    const transformedQuery = mainQuery.replace(
      new RegExp(`\\b${cteName}\\b`, 'gi'),
      `(${cteQuery})`
    );
    
    return transformedQuery;
  }

  private validateQuery(sqlQuery: string): string {
  // Remove trailing semicolon
  let cleanedQuery = sqlQuery.trim().replace(/;$/, "");
  
  // Remove "SQL QUERY:" prefix if model adds it
  cleanedQuery = cleanedQuery.replace(/^SQL QUERY:\s*/i, "");

  const upperQuery = cleanedQuery.toUpperCase();

  // --- Step 1: Transform WITH (CTE) queries ---
  // Supabase RPC restrictions require us to transform CTEs to subqueries
  if (upperQuery.startsWith("WITH")) {
    console.log("CTE query detected - transforming to subquery format");
    
    try {
      cleanedQuery = this.transformCTEToSubquery(cleanedQuery);
      console.log("CTE successfully transformed to subquery");
    } catch (error) {
      console.error("CTE transformation failed:", error);
      throw new Error("Complex CTE query cannot be processed. Please simplify your request.");
    }
  }

  // --- Step 2: Validate allowed SQL ---
  const upperQueryStart = cleanedQuery.toUpperCase().trim();
  if (!upperQueryStart.startsWith("SELECT")) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Dangerous keywords check
  const dangerousKeywords = [
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", 
    "TRUNCATE", "EXEC", "EXECUTE", "--", ";"
  ];

  for (const keyword of dangerousKeywords) {
    if (cleanedQuery.toUpperCase().includes(keyword)) {
      throw new Error(`Query contains restricted keyword: ${keyword}`);
    }
  }

  // Length check - increased limit for very complex analytical queries
  if (cleanedQuery.length > 10000) {
    throw new Error("Query too long - maximum 10,000 characters allowed");
  }

  // No LIMIT restrictions - using full dataset for comprehensive analysis
  console.log("Query will use full dataset for thorough analysis");
  
  // Ensure 2023 focus for relevant queries
  if (cleanedQuery.includes("2023") || cleanedQuery.includes("collected_date") || cleanedQuery.includes("date")) {
    console.log("Query includes date filtering - will use specified criteria for collection performance");
  }

  return cleanedQuery;
}

  private validateVisualizationData(visualization: any, results: any[]): boolean {
    if (!visualization || !visualization.chartConfig || !visualization.chartConfig.data) {
      return false;
    }
    
    const data = visualization.chartConfig.data;
    
    // Check if data is an array and has content
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }
    
    // Check if data has proper structure for the chart type
    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== 'object') {
      return false;
    }
    
    // For charts, ensure we have at least x and y values
    const hasValidKeys = Object.keys(firstItem).length >= 2;
    return hasValidKeys;
  }

  private createFallbackVisualization(question: string, results: any[]): any {
    if (!results || results.length === 0) {
      return null;
    }

    // Create a simple table visualization for any data
    const firstResult = results[0];
    const keys = Object.keys(firstResult);
    
    if (keys.length === 0) {
      return null;
    }

    // If we have numeric data, create a simple bar chart
    const numericKeys = keys.filter(key => {
      const value = firstResult[key];
      return typeof value === 'number' && !isNaN(value);
    });

    if (numericKeys.length >= 1 && results.length > 1) {
      // Create bar chart with first numeric field
      const valueKey = numericKeys[0];
      const labelKey = keys.find(key => key !== valueKey) || keys[0];
      
      const chartData = results.slice(0, 10).map((item, index) => ({
        [labelKey]: item[labelKey] || `Item ${index + 1}`,
        [valueKey]: Number(item[valueKey]) || 0
      }));

      return {
        chartType: 'bar',
        chartConfig: {
          data: chartData,
          layout: {
            title: `${question} - Data Overview`,
            xaxis: { title: labelKey },
            yaxis: { title: valueKey }
          }
        },
        title: `${question} - Data Overview`,
        description: `Showing ${results.length} records from your query.`
      };
    }

    // Fallback to summary statistics
    const summaryData = [
      { metric: 'Total Records', value: results.length },
      { metric: 'Data Fields', value: keys.length }
    ];

    // Add numeric summaries if available
    numericKeys.forEach(key => {
      const values = results.map(r => Number(r[key])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        summaryData.push(
          { metric: `Total ${key}`, value: Math.round(sum * 100) / 100 },
          { metric: `Average ${key}`, value: Math.round(avg * 100) / 100 }
        );
      }
    });

    return {
      chartType: 'bar',
      chartConfig: {
        data: summaryData,
        layout: {
          title: `${question} - Summary`,
          xaxis: { title: 'Metric' },
          yaxis: { title: 'Value' }
        }
      },
      title: `${question} - Data Summary`,
      description: `Summary statistics for ${results.length} records.`
    };
  }

  // Generate contextual deep-dive questions based on latest analysis
  public generateDeepDiveQuestions(latestResult: EnhancedQueryResult, sessionHistory: EnhancedQueryResult[] = []): SuggestedQuery[] {
    const questions: SuggestedQuery[] = [];

    if (!latestResult || !latestResult.results || latestResult.results.length === 0) {
      return this.getDefaultDeepDiveQuestions();
    }

    // Analyze the latest result to generate contextual questions
    const { question, results, metadata } = latestResult;
    const queryType = metadata?.queryType || 'general';

    // Get data insights from results
    const dataInsights = this.extractDataInsights(results);

    // Generate questions based on query type and data patterns
    switch (queryType) {
      case 'geographic':
        questions.push(...this.generateGeographicDeepDive(dataInsights, question));
        break;
      case 'provider':
        questions.push(...this.generateProviderDeepDive(dataInsights, question));
        break;
      case 'volume':
        questions.push(...this.generateVolumeDeepDive(dataInsights, question));
        break;
      case 'temporal':
        questions.push(...this.generateTemporalDeepDive(dataInsights, question));
        break;
      default:
        questions.push(...this.generateGeneralDeepDive(dataInsights, question));
    }

    // Add cross-analysis questions if we have session history
    if (sessionHistory.length > 1) {
      questions.push(...this.generateCrossAnalysisQuestions(latestResult, sessionHistory));
    }

    // Ensure we have exactly 3 questions, prioritize by confidence
    return questions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((q, index) => ({ ...q, id: `deepdive_${Date.now()}_${index}` }));
  }

  private extractDataInsights(results: any[]): any {
    if (!results || results.length === 0) return {};

    const firstResult = results[0];
    const keys = Object.keys(firstResult);

    // Find numeric and string columns
    const numericColumns = keys.filter(key => {
      const value = firstResult[key];
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
    });

    const categoricalColumns = keys.filter(key => {
      const value = firstResult[key];
      return typeof value === 'string' && isNaN(parseFloat(value));
    });

    // Extract patterns
    const hasEntityIds = keys.some(key => key.includes('entity') || key.includes('id'));
    const hasLocations = keys.some(key => key.includes('area') || key.includes('zone') || key.includes('location'));
    const hasVolumes = keys.some(key => key.includes('gallon') || key.includes('volume'));
    const hasCollections = keys.some(key => key.includes('collection') || key.includes('count'));
    const hasProviders = keys.some(key => key.includes('provider') || key.includes('service'));
    const hasTemporalData = keys.some(key => key.includes('date') || key.includes('time') || key.includes('month'));

    return {
      resultCount: results.length,
      numericColumns,
      categoricalColumns,
      hasEntityIds,
      hasLocations,
      hasVolumes,
      hasCollections,
      hasProviders,
      hasTemporalData,
      topEntities: results.slice(0, 3),
      sampleData: firstResult
    };
  }

  private generateGeographicDeepDive(insights: any, originalQuestion: string): SuggestedQuery[] {
    const questions: SuggestedQuery[] = [];

    if (insights.hasCollections) {
      questions.push({
        id: '',
        query: "What are the collection efficiency patterns across different zones by time of day?",
        type: 'drill_down',
        confidence: 0.9,
        reasoning: "Dive deeper into geographic performance with temporal patterns",
        estimatedComplexity: 'guided'
      });
    }

    if (insights.hasVolumes) {
      questions.push({
        id: '',
        query: "Which specific locations within the top areas have the highest volume-to-collection ratios?",
        type: 'drill_down',
        confidence: 0.85,
        reasoning: "Identify outlier locations for operational optimization",
        estimatedComplexity: 'guided'
      });
    }

    questions.push({
      id: '',
      query: "How does the geographic distribution compare with Dubai's business district density?",
      type: 'explore_related',
      confidence: 0.8,
      reasoning: "Understand geographic patterns in business context",
      estimatedComplexity: 'expert'
    });

    return questions;
  }

  private generateProviderDeepDive(insights: any, originalQuestion: string): SuggestedQuery[] {
    return [
      {
        id: '',
        query: "What is the service reliability score for each provider based on completion times?",
        type: 'drill_down',
        confidence: 0.9,
        reasoning: "Analyze provider performance metrics for optimization",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "Which providers show the best volume-per-trip efficiency in high-density areas?",
        type: 'explore_related',
        confidence: 0.85,
        reasoning: "Identify most efficient providers for route optimization",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "How do provider costs correlate with their service quality metrics?",
        type: 'validate_assumption',
        confidence: 0.8,
        reasoning: "Validate cost-effectiveness assumptions about provider selection",
        estimatedComplexity: 'expert'
      }
    ];
  }

  private generateVolumeDeepDive(insights: any, originalQuestion: string): SuggestedQuery[] {
    return [
      {
        id: '',
        query: "What are the volume anomalies and their root causes in the collection data?",
        type: 'drill_down',
        confidence: 0.9,
        reasoning: "Identify and understand volume outliers for process improvement",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "How do container sizes correlate with actual collection volumes across different business types?",
        type: 'explore_related',
        confidence: 0.85,
        reasoning: "Optimize container sizing based on business category patterns",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "What is the predicted volume growth pattern for the next quarter?",
        type: 'follow_up',
        confidence: 0.8,
        reasoning: "Use current volume trends to forecast future capacity needs",
        estimatedComplexity: 'expert'
      }
    ];
  }

  private generateTemporalDeepDive(insights: any, originalQuestion: string): SuggestedQuery[] {
    return [
      {
        id: '',
        query: "What are the seasonal patterns in collection frequency and volume?",
        type: 'drill_down',
        confidence: 0.9,
        reasoning: "Identify seasonal trends for resource planning",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "How do collection delays correlate with specific days of the week or holidays?",
        type: 'explore_related',
        confidence: 0.85,
        reasoning: "Understand temporal factors affecting service efficiency",
        estimatedComplexity: 'guided'
      },
      {
        id: '',
        query: "What is the optimal collection schedule based on historical demand patterns?",
        type: 'follow_up',
        confidence: 0.8,
        reasoning: "Use temporal analysis to optimize scheduling",
        estimatedComplexity: 'expert'
      }
    ];
  }

  private generateGeneralDeepDive(insights: any, originalQuestion: string): SuggestedQuery[] {
    const questions: SuggestedQuery[] = [];

    if (insights.hasEntityIds) {
      questions.push({
        id: '',
        query: "What are the operational patterns of the top-performing entities?",
        type: 'drill_down',
        confidence: 0.85,
        reasoning: "Analyze success patterns from top entities",
        estimatedComplexity: 'guided'
      });
    }

    if (insights.hasCollections && insights.hasVolumes) {
      questions.push({
        id: '',
        query: "How can we optimize route planning based on volume-to-distance ratios?",
        type: 'explore_related',
        confidence: 0.8,
        reasoning: "Combine collection and volume data for route optimization",
        estimatedComplexity: 'expert'
      });
    }

    questions.push({
      id: '',
      query: "What are the key performance indicators we should monitor for continuous improvement?",
      type: 'follow_up',
      confidence: 0.9,
      reasoning: "Identify actionable metrics from current analysis",
      estimatedComplexity: 'surface'
    });

    return questions.slice(0, 3);
  }

  private generateCrossAnalysisQuestions(latestResult: EnhancedQueryResult, sessionHistory: EnhancedQueryResult[]): SuggestedQuery[] {
    const questions: SuggestedQuery[] = [];

    // Find different query types in history
    const queryTypes = new Set(sessionHistory.map(r => r.metadata?.queryType).filter(Boolean));

    if (queryTypes.has('geographic') && queryTypes.has('provider')) {
      questions.push({
        id: '',
        query: "How do provider performance metrics vary across different geographic zones?",
        type: 'explore_related',
        confidence: 0.9,
        reasoning: "Cross-analyze geographic and provider data from previous queries",
        estimatedComplexity: 'expert'
      });
    }

    if (queryTypes.has('volume') && queryTypes.has('temporal')) {
      questions.push({
        id: '',
        query: "What volume trends emerge when we combine temporal patterns with current findings?",
        type: 'validate_assumption',
        confidence: 0.85,
        reasoning: "Validate patterns by combining volume and temporal analysis",
        estimatedComplexity: 'expert'
      });
    }

    return questions;
  }

  private getDefaultDeepDiveQuestions(): SuggestedQuery[] {
    return [
      {
        id: 'default_1',
        query: "Show me the top 10 areas by collection frequency and their efficiency metrics",
        type: 'explore_related',
        confidence: 0.8,
        reasoning: "Start with geographic overview for comprehensive analysis",
        estimatedComplexity: 'surface'
      },
      {
        id: 'default_2',
        query: "Which service providers have the best volume-to-collection ratios?",
        type: 'drill_down',
        confidence: 0.85,
        reasoning: "Analyze provider efficiency for operational insights",
        estimatedComplexity: 'guided'
      },
      {
        id: 'default_3',
        query: "What are the monthly collection trends and seasonal patterns?",
        type: 'follow_up',
        confidence: 0.9,
        reasoning: "Understand temporal patterns for strategic planning",
        estimatedComplexity: 'guided'
      }
    ];
  }

  // Add missing methods that streamingAIService needs
  public async generateSQLQuery(question: string): Promise<string> {
    return this.generateSQL(question);
  }

  public async executeSQLQuery(sqlQuery: string): Promise<any[]> {
    return this.executeQuery(sqlQuery);
  }

  public async generateBasicVisualization(question: string, results: any[]): Promise<any> {
    // Use existing visualization generation logic
    return this.generateVisualization(question, results);
  }

}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();