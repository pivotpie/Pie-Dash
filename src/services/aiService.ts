// services/aiService.ts
import { supabase } from './supabaseClient';

export interface QueryResult {
  question: string;
  sqlQuery: string;
  results: any[];
  naturalResponse: string;
  executionTime: number;
}

export class AIService {
  private static readonly CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
  
  private static readonly DATABASE_SCHEMA = {
    services: {
      description: "Main table with 29,999 waste collection service records",
      columns: {
        service_report: "Unique service report ID (e.g., 'RN 176975')",
        entity_id: "Location identifier (e.g., 'E-1559')",
        service_provider: "Service provider name (66 total providers)",
        collected_date: "Date when waste was collected",
        discharged_date: "Date when waste was discharged",
        area: "Service area (Al Quoz, Al Brsh, etc. - 23 total areas)",
        zone: "Geographic zone (7 total zones)",
        category: "Business category (Restaurant 48.5%, Accommodation 12.8%, etc.)",
        gallons_collected: "Volume in gallons (5-1578 range, avg 55.8)",
        assigned_vehicle: "Vehicle number (167 total vehicles)",
        outlet_name: "Business/facility name",
        initiator: "Service initiator (Org's System or Munci's System)"
      },
      patterns: {
        geographic: "Al Quoz (26.6%) and Al Brsh (25.3%) = 52% of collections",
        business: "Restaurant category dominates with 48.5% of all collections",
        volume: "Standard sizes: 15 gal (30.2%), 25 gal (25.1%), 100 gal (19.4%)",
        providers: "66 providers, top provider handles 11.7% of collections"
      }
    },
    location_patterns: {
      description: "Delay detection and collection frequency analysis",
      columns: {
        entity_id: "Location identifier",
        avg_interval_days: "Average days between collections",
        last_collection: "Date of last collection",
        days_since_last: "Days since last collection",
        delay_status: "CRITICAL, WARNING, or ON_SCHEDULE"
      }
    }
  };

  static async processQuery(userQuestion: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Generate SQL query
      const sqlQuery = await this.generateSQL(userQuestion);
      
      // Step 2: Execute SQL query  
      const queryResults = await this.executeQuery(sqlQuery);
      
      // Step 3: Generate natural language response
      const naturalResponse = await this.generateResponse(userQuestion, queryResults, sqlQuery);
      
      return {
        question: userQuestion,
        sqlQuery,
        results: queryResults,
        naturalResponse,
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('AI query processing error:', error);
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async generateSQL(userQuestion: string): Promise<string> {
    const prompt = `You are a SQL query generator for a waste collection database.
Generate ONLY a valid PostgreSQL SELECT query based on the user question.

DATABASE SCHEMA:
${JSON.stringify(this.DATABASE_SCHEMA, null, 2)}

IMPORTANT RULES:
1. Return ONLY the SQL query, no explanations or markdown
2. Use only SELECT statements (no INSERT, UPDATE, DELETE)
3. Use proper PostgreSQL syntax and functions
4. Limit results to max 1000 rows with LIMIT clause
5. Use proper date comparisons (CURRENT_DATE, INTERVAL)
6. For "this week/month" use date functions like CURRENT_DATE - INTERVAL '7 days'
7. Common terms mapping:
   - "collections" = rows in services table
   - "gallons" = gallons_collected column
   - "areas" = area column
   - "providers" = service_provider column
   - "delays/overdue" = use location_patterns view with delay_status
   - "restaurants" = category = 'Restaurant'

USER QUESTION: "${userQuestion}"

SQL QUERY:`;

    const response = await fetch(this.CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    let sqlQuery = data.content[0].text.trim();
    
    // Clean up the response
    sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    return sqlQuery;
  }

  private static async executeQuery(sqlQuery: string): Promise<any[]> {
    // Validate query safety
    this.validateQuery(sqlQuery);
    
    try {
      const { data, error } = await supabase.rpc('execute_raw_sql', {
        sql_query: sqlQuery
      });
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('SQL execution error:', error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static validateQuery(sqlQuery: string): void {
    const upperQuery = sqlQuery.toUpperCase().trim();
    
    // Check if query starts with SELECT
    if (!upperQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    // Check for dangerous keywords
    const dangerousKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
      'TRUNCATE', 'EXEC', 'EXECUTE', '--', ';', 'UNION'
    ];
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains restricted keyword: ${keyword}`);
      }
    }
  }

  private static async generateResponse(
    userQuestion: string, 
    queryResults: any[], 
    sqlQuery: string
  ): Promise<string> {
    const prompt = `You are an AI assistant analyzing waste collection data.
Provide a clear, conversational answer based on the query results.

CONTEXT:
- 29,999 total service records across 3,315 locations
- 167 vehicles, 66 service providers
- Geographic concentration: Al Quoz (26.6%) + Al Brsh (25.3%) = 52%
- Business focus: Restaurants (48.5%), Accommodations (12.8%)
- Standard volumes: 15 gal (30.2%), 25 gal (25.1%), 100 gal (19.4%)

USER QUESTION: "${userQuestion}"

EXECUTED SQL: ${sqlQuery}

QUERY RESULTS (${queryResults.length} records):
${JSON.stringify(queryResults.slice(0, 10), null, 2)}
${queryResults.length > 10 ? `\n... (showing first 10 of ${queryResults.length} results)` : ''}

RESPONSE REQUIREMENTS:
1. Direct answer to the question
2. Key insights and patterns from the data
3. Use business-friendly language (not technical jargon)
4. Include specific numbers, percentages, and comparisons
5. If about delays, prioritize critical findings and suggest actions
6. If no data found, explain why and suggest alternatives
7. Keep response conversational but informative

ANSWER:`;

    const response = await fetch(this.CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  // Preset queries for common business questions
  static readonly PRESET_QUERIES = [
    {
      question: "Show me locations overdue for collection",
      description: "Find critical and warning delay status locations"
    },
    {
      question: "Which service provider collected the most gallons this month?",
      description: "Provider performance analysis"
    },
    {
      question: "How many restaurants in Al Quoz need service?",
      description: "Area and category specific analysis"
    },
    {
      question: "What's the average collection volume by business category?",
      description: "Category volume analysis"
    },
    {
      question: "Which areas have the most delays?",
      description: "Geographic delay pattern analysis"
    },
    {
      question: "Show me collection trends for the last 6 months",
      description: "Temporal trend analysis"
    }
  ];
}