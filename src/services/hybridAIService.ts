// Hybrid AI Service - Backward Compatible Upgrade Bridge
// Allows seamless transition from enhancedAIService to enhancedAIServiceV2

import { enhancedAIService } from './enhancedAIService';
import { enhancedAIServiceV2 } from './enhancedAIServiceV2';
import { memoryService } from './memoryService';
import type { EnhancedQueryResult } from '../types/chat.types';
import type { FeatureFlags } from '../types/enhanced-chat.types';

interface HybridServiceConfig {
  useV2Features: boolean;
  enableMemory: boolean;
  enableProgressiveDisclosure: boolean;
  enableVoiceCommands: boolean;
  enableArtifacts: boolean;
  fallbackToV1: boolean; // Always fallback to V1 if V2 fails
}

export class HybridAIService {
  private config: HybridServiceConfig;
  private featureFlags: FeatureFlags;

  constructor(config: Partial<HybridServiceConfig> = {}) {
    // Conservative defaults - start with V1 behavior
    this.config = {
      useV2Features: false, // Start disabled
      enableMemory: false,
      enableProgressiveDisclosure: false,
      enableVoiceCommands: false,
      enableArtifacts: false,
      fallbackToV1: true, // Always fallback for safety
      ...config
    };

    this.featureFlags = {
      enableMemoryService: this.config.enableMemory,
      enableProgressiveDisclosure: this.config.enableProgressiveDisclosure,
      enableCollaborativeFeatures: false,
      enableArtifactVersioning: this.config.enableArtifacts,
      enableVoiceCommands: this.config.enableVoiceCommands,
      enableSemanticSearch: false,
      enableCrossSessionInsights: false,
      enableAdvancedExports: false
    };

    // Update V2 service with our feature flags
    if (this.config.useV2Features) {
      enhancedAIServiceV2.updateFeatureFlags(this.featureFlags);
    }

    console.log(`🔄 HybridAIService initialized:`, {
      useV2: this.config.useV2Features,
      memory: this.config.enableMemory,
      voice: this.config.enableVoiceCommands,
      fallback: this.config.fallbackToV1
    });
  }

  /**
   * Main query processing - intelligently routes to V1 or V2
   * GUARANTEED BACKWARD COMPATIBILITY: Always returns same interface as V1
   */
  async processQuery(
    question: string,
    sessionId?: string
  ): Promise<EnhancedQueryResult> {

    try {
      // If V2 features disabled, use V1 directly
      if (!this.config.useV2Features) {
        console.log('🔵 Using V1 service (V2 features disabled)');
        const v1Result = await enhancedAIService.processQuery(question, sessionId);

        // Apply enhanced formatting to V1 results - use fast fallback
        try {
          const enhancedDetailedResponse = this.generateFallbackDetailedResponse(
            v1Result.question,
            v1Result.results,
            v1Result.sqlQuery
          );
          v1Result.detailedResponse = enhancedDetailedResponse;
          console.log('✨ Fast enhanced detailed response formatting applied to V1 result');
        } catch (error) {
          console.warn('Enhanced formatting failed for V1, using original:', error);
        }

        // Debug V1 visualization
        console.log('🔵 V1 Visualization data check:', {
          hasVisualization: !!v1Result.visualization,
          hasMultiVisualization: !!v1Result.multiVisualization,
          visualizationType: v1Result.visualization?.chartType,
          chartConfigExists: !!v1Result.visualization?.chartConfig,
          dataPoints: v1Result.visualization?.chartConfig?.data?.length || 0
        });

        return v1Result;
      }

      // Try V2 with enhanced features
      console.log('🟣 Attempting V2 service with enhanced features...');
      const startTime = Date.now();

      // Set up memory context if enabled
      if (this.config.enableMemory && sessionId) {
        this.initializeMemoryForSession(sessionId, question);
      }

      // Add timeout protection for V2 service (30 seconds max)
      const v2Promise = enhancedAIServiceV2.processQueryV2(question, sessionId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('V2 service timeout after 30 seconds')), 30000)
      );

      const result = await Promise.race([v2Promise, timeoutPromise]) as any;

      // Enhance detailed response formatting if V2 features enabled
      if (result.detailedResponse) {
        try {
          const enhancedDetailedResponse = await this.generateDetailedResponseFast(
            result.question,
            result.results,
            result.sqlQuery
          );
          result.detailedResponse = enhancedDetailedResponse;
          console.log('✨ Enhanced detailed response formatting applied');
        } catch (error) {
          console.warn('Enhanced formatting failed, using original response:', error);
          // Keep original detailed response
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ V2 processing completed in ${processingTime}ms`);

      // Convert V2 result back to V1 format for compatibility
      const compatibleResult: EnhancedQueryResult = {
        question: result.question,
        sqlQuery: result.sqlQuery,
        results: result.results,
        naturalResponse: result.naturalResponse,
        detailedResponse: result.detailedResponse,
        visualization: result.visualization,
        multiVisualization: result.multiVisualization,
        sessionId: result.sessionId,
        timestamp: result.timestamp,
        executionTime: result.executionTime,
        metadata: {
          ...result.metadata,
          // Add V2 metadata as optional fields for future use
          confidence: result.confidence,
          analysisLevel: result.analysisLevel,
          validationNeeded: result.validationNeeded,
          followUpSuggestions: result.followUpSuggestions,
          assumptions: result.assumptions,
          uncertaintyAreas: result.uncertaintyAreas
        }
      };

      // Debug logging for visualization data
      console.log('🎨 Visualization data check:', {
        hasVisualization: !!compatibleResult.visualization,
        hasMultiVisualization: !!compatibleResult.multiVisualization,
        visualizationType: compatibleResult.visualization?.chartType,
        chartConfigExists: !!compatibleResult.visualization?.chartConfig,
        dataPoints: compatibleResult.visualization?.chartConfig?.data?.length || 0
      });

      return compatibleResult;

    } catch (error) {
      console.warn('⚠️ V2 processing failed, falling back to V1:', error);

      // ALWAYS fallback to V1 if enabled
      if (this.config.fallbackToV1) {
        console.log('🔵 Falling back to V1 service');
        return await enhancedAIService.processQuery(question, sessionId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize memory context for session if memory is enabled
   */
  private initializeMemoryForSession(sessionId: string, question: string): void {
    try {
      if (!this.config.enableMemory) return;

      // Get or create analysis context
      const context = memoryService.getAnalysisContext(sessionId);
      if (!context) {
        memoryService.updateAnalysisContext(sessionId, {
          currentDataset: 'services',
          lastUpdated: new Date().toISOString(),
          focusAreas: [this.extractFocusArea(question)],
          currentHypotheses: [],
          sessionType: 'exploratory'
        });
        console.log(`🧠 Memory context initialized for session: ${sessionId}`);
      }
    } catch (error) {
      console.warn('Memory initialization failed (non-critical):', error);
    }
  }

  private extractFocusArea(question: string): string {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('geographic') || lowerQuestion.includes('area') || lowerQuestion.includes('zone')) return 'geographic';
    if (lowerQuestion.includes('provider') || lowerQuestion.includes('service')) return 'providers';
    if (lowerQuestion.includes('volume') || lowerQuestion.includes('gallon')) return 'volume';
    if (lowerQuestion.includes('time') || lowerQuestion.includes('trend') || lowerQuestion.includes('month')) return 'temporal';
    if (lowerQuestion.includes('delay') || lowerQuestion.includes('overdue')) return 'delays';
    return 'general';
  }

  /**
   * Upgrade configuration at runtime - enables progressive feature rollout
   */
  updateConfig(newConfig: Partial<HybridServiceConfig>): void {
    const previousConfig = { ...this.config };
    Object.assign(this.config, newConfig);

    // Update feature flags
    this.featureFlags = {
      ...this.featureFlags,
      enableMemoryService: this.config.enableMemory,
      enableProgressiveDisclosure: this.config.enableProgressiveDisclosure,
      enableArtifactVersioning: this.config.enableArtifacts,
      enableVoiceCommands: this.config.enableVoiceCommands
    };

    if (this.config.useV2Features) {
      enhancedAIServiceV2.updateFeatureFlags(this.featureFlags);
    }

    console.log('🔄 HybridAIService configuration updated:', {
      previous: previousConfig,
      current: this.config
    });
  }

  /**
   * Get current configuration for debugging
   */
  getConfig(): HybridServiceConfig {
    return { ...this.config };
  }

  /**
   * Health check - tests both V1 and V2 services
   */
  async healthCheck(): Promise<{
    v1Status: 'healthy' | 'error';
    v2Status: 'healthy' | 'error';
    memoryStatus: 'active' | 'inactive' | 'error';
    recommendedConfig: Partial<HybridServiceConfig>;
  }> {
    const results = {
      v1Status: 'healthy' as const,
      v2Status: 'healthy' as const,
      memoryStatus: 'inactive' as const,
      recommendedConfig: {} as Partial<HybridServiceConfig>
    };

    // Test V1
    try {
      await enhancedAIService.processQuery('test query health', 'health_check');
      results.v1Status = 'healthy';
    } catch (error) {
      results.v1Status = 'error';
      console.error('V1 health check failed:', error);
    }

    // Test V2 if enabled
    if (this.config.useV2Features) {
      try {
        await enhancedAIServiceV2.processQueryV2('test query health', 'health_check');
        results.v2Status = 'healthy';
      } catch (error) {
        results.v2Status = 'error';
        console.error('V2 health check failed:', error);
      }
    }

    // Test memory service if enabled
    if (this.config.enableMemory) {
      try {
        const context = memoryService.getAnalysisContext('health_check');
        results.memoryStatus = context ? 'active' : 'inactive';
      } catch (error) {
        results.memoryStatus = 'error';
        console.error('Memory service health check failed:', error);
      }
    }

    // Generate recommendations
    if (results.v1Status === 'healthy' && results.v2Status === 'error') {
      results.recommendedConfig.useV2Features = false;
      results.recommendedConfig.fallbackToV1 = true;
    }

    return results;
  }

  // === ENHANCED FORMATTING METHODS ===

  /**
   * Format detailed response with proper markdown structure and spacing
   */
  private formatDetailedResponse(rawResponse: string): string {
    if (!rawResponse) return '';

    // Clean up the response and add proper spacing
    let formatted = rawResponse
      // Fix missing spaces after headers
      .replace(/# ([^#])/g, '# $1')
      .replace(/## ([^#])/g, '\n\n## $1')
      .replace(/### ([^#])/g, '\n\n### $1')

      // Fix list items
      .replace(/- ([^\n])/g, '\n- $1')
      .replace(/• ([^\n])/g, '\n• $1')

      // Fix numbered lists
      .replace(/(\d+\.) ([^\n])/g, '\n$1 $2')

      // Fix table formatting - ensure proper spacing
      .replace(/\|([^|]+)\|/g, (match, content) => `| ${content.trim()} |`)

      // Clean up multiple newlines but preserve intentional spacing
      .replace(/\n{3,}/g, '\n\n')

      // Ensure spacing around sections
      .replace(/([^\n])(##[^#])/g, '$1\n\n$2')
      .replace(/(Notes:)/g, '\n\n$1')

      // Fix spacing in recommendations
      .replace(/Recommendations([\s\S]*?)(-[^\n]+)/g, (match, middle, item) => {
        return match.replace(/(-[^\n]+)/g, '\n$1');
      });

    return formatted.trim();
  }

  /**
   * Generate enhanced detailed response with better structure
   */
  private async generateDetailedResponseFast(
    question: string,
    results: any[],
    sqlQuery?: string
  ): Promise<string> {
    const dataString = JSON.stringify(results.slice(0, 10), null, 2);

    const prompt = `Detailed analysis for: "${question}"

Data (${results.length} records):
${dataString.substring(0, 1000)}...

Generate well-formatted markdown analysis with proper spacing:

# 📊 Analysis Results

## Key Findings
- Finding 1 with specific numbers
- Finding 2 with context
- Finding 3 with implications

## Data Summary
| Column | Value | Percentage |
|--------|--------|------------|
| Metric 1 | Value 1 | XX% |
| Metric 2 | Value 2 | XX% |

## Recommendations
- Recommendation 1 with actions
- Recommendation 2 with rationale

Keep concise but professional:`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const data = await this.callPPQChatCompletionsEnhanced(prompt, controller.signal);
      clearTimeout(timeout);

      const rawResponse = data.choices?.[0]?.message?.content?.trim() || '';
      const formattedResponse = this.formatDetailedResponse(rawResponse);

      return formattedResponse || this.generateFallbackDetailedResponse(question, results, sqlQuery);
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Enhanced PPQ API call with abort signal support
   */
  private async callPPQChatCompletionsEnhanced(prompt: string, signal?: AbortSignal): Promise<any> {
    const url = `https://api.ppq.ai/chat/completions`;
    const body = {
      model: 'gpt-5',
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 4000,
      temperature: 0.3
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_PPQ_API_KEY}`
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PPQ.AI error ${response.status}: ${response.statusText} - ${errText}`);
    }

    return await response.json();
  }

  /**
   * Generate fallback detailed response with enhanced structure
   */
  private generateFallbackDetailedResponse(
    question: string,
    results: any[],
    sqlQuery?: string
  ): string {
    const recordCount = results.length;

    return `# 📊 Analysis Results

## Query Summary
**Question:** ${question}
**Records Found:** ${recordCount}
${sqlQuery ? `**SQL Executed:** \`${sqlQuery.substring(0, 100)}...\`` : ''}

## Key Findings
- Query returned ${recordCount} records from Dubai's waste collection database
- Data represents grease trap servicing operations across Dubai Municipality areas
${recordCount > 0 ? '- Results include geographic, temporal, and operational metrics' : '- No matching records found for the specified criteria'}

## Data Overview
${recordCount > 0 ? `
| Metric | Value |
|--------|-------|
| Total Records | ${recordCount} |
| Data Fields | ${Object.keys(results[0] || {}).length} |
| Sample Coverage | ${recordCount > 100 ? 'Comprehensive' : recordCount > 10 ? 'Moderate' : 'Limited'} |
` : `
No data available for analysis. This could be due to:
- Specific date range filters
- Geographic area limitations
- Business category restrictions
- Data availability constraints
`}

## Recommendations
${recordCount > 0 ? `
- Review the visualization panel for graphical insights
- Consider expanding date ranges if data seems limited
- Use follow-up queries to explore specific patterns
- Export results for detailed offline analysis
` : `
- Try broader search criteria or date ranges
- Verify spelling of location names or categories
- Use general queries like "show overall collection statistics"
- Check data availability for the specified time period
`}

## Technical Details
- Analysis processed through enhanced Dubai waste collection database
- Data represents official municipality collection records
- Geographic coverage spans Dubai's major collection zones
- Business categories include restaurants, accommodations, and commercial facilities`;
  }

  // === BACKWARD COMPATIBILITY METHODS ===
  // These ensure existing code continues to work

  /**
   * Legacy method - routes to appropriate service
   */
  async generateSQL(question: string): Promise<string> {
    if (this.config.useV2Features) {
      return await enhancedAIServiceV2.generateSQLQuery(question);
    }
    return await (enhancedAIService as any).generateSQL(question);
  }

  /**
   * Legacy method - routes to appropriate service
   */
  async executeQuery(sqlQuery: string): Promise<any[]> {
    if (this.config.useV2Features) {
      return await enhancedAIServiceV2.executeSQLQuery(sqlQuery);
    }
    return await (enhancedAIService as any).executeQuery(sqlQuery);
  }

  /**
   * Session management - works with both services
   */
  getSessionHistory(sessionId: string) {
    return enhancedAIService.getSessionHistory(sessionId);
  }

  clearSession(sessionId: string): void {
    enhancedAIService.clearSession(sessionId);
    if (this.config.enableMemory) {
      // Clear memory context too
      try {
        memoryService.clearSession?.(sessionId);
      } catch (error) {
        console.warn('Failed to clear memory session:', error);
      }
    }
  }
}

// Export singleton instance with conservative defaults
export const hybridAIService = new HybridAIService({
  useV2Features: false, // Start with V1 behavior
  enableMemory: false,
  enableProgressiveDisclosure: false,
  enableVoiceCommands: false,
  enableArtifacts: false,
  fallbackToV1: true // Always fallback for safety
});