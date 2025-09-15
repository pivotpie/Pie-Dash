// Enhanced AI Service V2 - Backward Compatible Enhancement
// Extends existing enhancedAIService with progressive disclosure and memory integration

import { enhancedAIService, EnhancedAIService } from './enhancedAIService';
import { memoryService } from './memoryService';
import type { 
  EnhancedMessage, 
  AnalysisLevel, 
  SuggestedQuery,
  FeatureFlags
} from '../types/enhanced-chat.types';
import { DEFAULT_FEATURE_FLAGS } from '../types/enhanced-chat.types';
import type { EnhancedQueryResult, EnhancedChatMessage } from '../types/chat.types';

export class EnhancedAIServiceV2 extends EnhancedAIService {
  private featureFlags: FeatureFlags;

  constructor(featureFlags: Partial<FeatureFlags> = {}) {
    super();
    this.featureFlags = { ...DEFAULT_FEATURE_FLAGS, ...featureFlags };
  }

  /**
   * Enhanced query processing with confidence scoring and progressive disclosure
   * BACKWARD COMPATIBLE: Falls back to original behavior if new features disabled
   */
  async processQueryV2(
    question: string, 
    sessionId?: string
  ): Promise<EnhancedQueryResult & { 
    confidence?: number;
    analysisLevel?: AnalysisLevel;
    followUpSuggestions?: SuggestedQuery[];
    validationNeeded?: boolean;
    assumptions?: string[];
    uncertaintyAreas?: string[];
  }> {
    const startTime = Date.now();
    console.log(`🚀 Enhanced Query V2: "${question}"`);
    
    // Step 1: Ensure we have a valid session ID
    const activeSessionId = sessionId || `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 2: Get base result from original service with timeout protection
      const baseResultPromise = super.processQuery(question, activeSessionId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout - taking too long')), 45000)
      );
      
      const baseResult = await Promise.race([baseResultPromise, timeoutPromise]) as any;
      
      const queryTime = Date.now() - startTime;
      console.log(`✅ Query completed in ${queryTime}ms`);

      // Step 3: If enhanced features disabled, return original result
      if (!this.featureFlags.enableProgressiveDisclosure) {
        return baseResult;
      }

    try {
      // Step 3: Add confidence scoring
      const confidence = this.calculateConfidence(baseResult);
      
      // Step 4: Determine analysis level
      const analysisLevel = this.determineAnalysisLevel(question, baseResult);
      
      // Step 5: Generate follow-up suggestions
      const followUpSuggestions = this.generateFollowUpSuggestions(baseResult);
      
      // Step 6: Identify validation needs
      const validationNeeded = this.identifyValidationNeeds(baseResult);
      
      // Step 7: Extract assumptions and uncertainties
      const assumptions = this.extractAssumptions(baseResult);
      const uncertaintyAreas = this.identifyUncertaintyAreas(baseResult);

      // Step 8: Update memory service if enabled
      if (this.featureFlags.enableMemoryService && sessionId) {
        this.updateMemoryContext(sessionId, question, baseResult, {
          confidence,
          analysisLevel,
          validationNeeded
        });
      }

      return {
        ...baseResult,
        confidence,
        analysisLevel,
        followUpSuggestions,
        validationNeeded,
        assumptions,
        uncertaintyAreas
      };
    } catch (enhancedError) {
      console.warn('Enhanced processing failed, returning base result:', enhancedError);
      return baseResult; // Graceful degradation
    }
    
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ Query failed after ${errorTime}ms:`, error);
      
      // Return a helpful error response instead of throwing
      return {
        briefResponse: `Query took too long (${Math.round(errorTime/1000)}s) or encountered an error. Please try a simpler query or try again.`,
        detailedResponse: `**Query Error**\n\nYour query "${question}" encountered an issue:\n\n- **Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n- **Time**: ${errorTime}ms\n\n**Suggestions:**\n- Try a simpler or more specific query\n- Check your internet connection\n- Refresh the page and try again\n\nThe system is optimized for quick responses under 30 seconds.`,
        sqlQuery: '',
        executedQuery: '',
        dataSize: 0,
        visualization: null,
        multiVisualization: null,
        queryType: 'error',
        confidence: 0,
        analysisLevel: 'surface' as AnalysisLevel
      };
    }
  }

  /**
   * Calculate confidence score for analysis results
   * Based on data quality, query complexity, and result consistency
   */
  private calculateConfidence(result: EnhancedQueryResult): number {
    let confidence = 0.5; // Start with neutral confidence

    // Factor 1: Data volume (more data = higher confidence)
    const dataVolume = result.results.length;
    if (dataVolume > 100) confidence += 0.2;
    else if (dataVolume > 10) confidence += 0.1;
    else if (dataVolume < 5) confidence -= 0.2;

    // Factor 2: Query execution success
    if (result.executionTime < 5000) confidence += 0.1; // Fast query suggests good data structure
    if (result.sqlQuery && result.sqlQuery.length > 0) confidence += 0.1;

    // Factor 3: Visualization availability (suggests structured data)
    if (result.visualization) confidence += 0.1;
    if (result.multiVisualization) confidence += 0.1;

    // Factor 4: Response quality indicators
    if (result.naturalResponse.length > 50) confidence += 0.1;
    if (result.detailedResponse.length > 200) confidence += 0.1;

    // Factor 5: Statistical significance (for numerical data)
    const hasNumericalData = this.hasNumericalData(result.results);
    if (hasNumericalData && dataVolume > 30) confidence += 0.1;

    // Factor 6: Reduce confidence for complex aggregations without sufficient data
    const isComplexQuery = result.sqlQuery.toLowerCase().includes('group by') ||
                           result.sqlQuery.toLowerCase().includes('having') ||
                           result.sqlQuery.toLowerCase().includes('join');
    if (isComplexQuery && dataVolume < 10) confidence -= 0.2;

    // Factor 7: Time-based queries need sufficient temporal coverage
    const isTimeBasedQuery = result.sqlQuery.toLowerCase().includes('date') ||
                             result.sqlQuery.toLowerCase().includes('month') ||
                             result.sqlQuery.toLowerCase().includes('year');
    if (isTimeBasedQuery) {
      const hasTemporalVariation = this.hasTemporalVariation(result.results);
      if (hasTemporalVariation) confidence += 0.1;
      else confidence -= 0.1;
    }

    // Clamp confidence between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine appropriate analysis level based on query complexity and results
   */
  private determineAnalysisLevel(
    question: string, 
    result: EnhancedQueryResult
  ): AnalysisLevel {
    const questionLower = question.toLowerCase();
    const dataPoints = result.results.length;

    // Expert level indicators
    const expertIndicators = [
      'correlation', 'regression', 'statistical', 'significance',
      'hypothesis', 'model', 'predict', 'forecast', 'trend analysis'
    ];
    if (expertIndicators.some(term => questionLower.includes(term))) {
      return 'expert';
    }

    // Collaborative level indicators
    const collaborativeIndicators = [
      'compare', 'analyze', 'why', 'how', 'relationship', 'pattern',
      'efficiency', 'performance', 'optimization', 'breakdown'
    ];
    if (collaborativeIndicators.some(term => questionLower.includes(term)) && dataPoints > 50) {
      return 'collaborative';
    }

    // Guided level indicators
    const guidedIndicators = [
      'show me', 'what are', 'which', 'top', 'best', 'worst',
      'most', 'least', 'total', 'average', 'count'
    ];
    if (guidedIndicators.some(term => questionLower.includes(term)) && dataPoints > 10) {
      return 'guided';
    }

    // Default to surface level for simple queries
    return 'surface';
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateFollowUpSuggestions(result: EnhancedQueryResult): SuggestedQuery[] {
    const suggestions: SuggestedQuery[] = [];
    const queryType = result.metadata.queryType;
    const hasData = result.results.length > 0;

    if (!hasData) {
      // Suggestions for empty results
      suggestions.push({
        id: `suggest_${Date.now()}_1`,
        query: "Show me overall collection statistics",
        type: 'explore_related',
        confidence: 0.8,
        reasoning: "Get a broader view of the data",
        estimatedComplexity: 'surface'
      });
      return suggestions;
    }

    // Type-specific suggestions
    switch (queryType) {
      case 'geographic':
        suggestions.push({
          id: `suggest_${Date.now()}_geo1`,
          query: "Compare performance across different zones",
          type: 'drill_down',
          confidence: 0.9,
          reasoning: "Explore geographic performance variations",
          estimatedComplexity: 'guided'
        });
        if (result.results.length > 5) {
          suggestions.push({
            id: `suggest_${Date.now()}_geo2`,
            query: "What are the efficiency trends in the top performing areas?",
            type: 'follow_up',
            confidence: 0.8,
            reasoning: "Investigate success factors in high-performing regions",
            estimatedComplexity: 'collaborative'
          });
        }
        break;

      case 'provider':
        suggestions.push({
          id: `suggest_${Date.now()}_prov1`,
          query: "Show service provider efficiency metrics",
          type: 'drill_down',
          confidence: 0.9,
          reasoning: "Analyze provider performance in detail",
          estimatedComplexity: 'guided'
        });
        suggestions.push({
          id: `suggest_${Date.now()}_prov2`,
          query: "Which providers handle the largest volume collections?",
          type: 'explore_related',
          confidence: 0.8,
          reasoning: "Understand capacity and specialization patterns",
          estimatedComplexity: 'surface'
        });
        break;

      case 'temporal':
        suggestions.push({
          id: `suggest_${Date.now()}_temp1`,
          query: "What seasonal patterns exist in the data?",
          type: 'follow_up',
          confidence: 0.8,
          reasoning: "Explore cyclical trends and seasonality",
          estimatedComplexity: 'collaborative'
        });
        suggestions.push({
          id: `suggest_${Date.now()}_temp2`,
          query: "Are there any concerning delay trends?",
          type: 'validate_assumption',
          confidence: 0.7,
          reasoning: "Validate service quality consistency over time",
          estimatedComplexity: 'guided'
        });
        break;

      case 'volume':
        suggestions.push({
          id: `suggest_${Date.now()}_vol1`,
          query: "What drives volume variations across locations?",
          type: 'drill_down',
          confidence: 0.8,
          reasoning: "Understand volume patterns and their causes",
          estimatedComplexity: 'collaborative'
        });
        break;

      default:
        // Generic suggestions
        suggestions.push({
          id: `suggest_${Date.now()}_gen1`,
          query: "Show me the geographic distribution of this data",
          type: 'explore_related',
          confidence: 0.7,
          reasoning: "Understand geographic context",
          estimatedComplexity: 'surface'
        });
        if (result.results.length > 20) {
          suggestions.push({
            id: `suggest_${Date.now()}_gen2`,
            query: "What are the top 3 insights from this analysis?",
            type: 'follow_up',
            confidence: 0.8,
            reasoning: "Synthesize key findings",
            estimatedComplexity: 'guided'
          });
        }
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Identify if validation is needed based on data characteristics
   */
  private identifyValidationNeeds(result: EnhancedQueryResult): boolean {
    // Validation needed for:
    
    // 1. Low data volume with strong claims
    if (result.results.length < 10 && 
        (result.naturalResponse.includes('significant') || 
         result.naturalResponse.includes('strong') ||
         result.naturalResponse.includes('clear pattern'))) {
      return true;
    }

    // 2. Unusual or extreme results
    if (this.hasOutliers(result.results)) {
      return true;
    }

    // 3. Time-sensitive analysis without recent data
    const queryType = result.metadata.queryType;
    if (queryType === 'temporal' && result.results.length > 0) {
      const hasRecentData = this.hasRecentData(result.results);
      if (!hasRecentData) return true;
    }

    // 4. Complex aggregations with potential edge cases
    if (result.sqlQuery.toLowerCase().includes('group by') &&
        result.results.some(row => Object.values(row).some(val => val === null || val === 0))) {
      return true;
    }

    return false;
  }

  /**
   * Extract assumptions from the analysis
   */
  private extractAssumptions(result: EnhancedQueryResult): string[] {
    const assumptions: string[] = [];

    // Standard assumptions for Dubai waste collection analysis
    assumptions.push("Data represents complete collection records");
    assumptions.push("Collection dates reflect actual service timing");

    // Query-specific assumptions
    const queryLower = result.sqlQuery.toLowerCase();
    
    if (queryLower.includes('group by')) {
      assumptions.push("Grouping categories are mutually exclusive");
    }
    
    if (queryLower.includes('avg') || queryLower.includes('average')) {
      assumptions.push("Average calculations exclude null values");
    }
    
    if (queryLower.includes('date')) {
      assumptions.push("Date ranges capture relevant time periods");
    }

    // Data quality assumptions
    if (result.results.length < 100) {
      assumptions.push("Sample size is representative of overall patterns");
    }

    return assumptions;
  }

  /**
   * Identify areas where uncertainty exists
   */
  private identifyUncertaintyAreas(result: EnhancedQueryResult): string[] {
    const uncertainties: string[] = [];
    const dataSize = result.results.length;

    if (dataSize < 30) {
      uncertainties.push("Small sample size may limit statistical significance");
    }

    if (result.executionTime > 10000) {
      uncertainties.push("Complex query may indicate data complexity or quality issues");
    }

    // Check for missing data indicators
    if (result.results.some(row => Object.values(row).includes(null))) {
      uncertainties.push("Missing data points may affect analysis completeness");
    }

    // Temporal coverage uncertainty
    if (result.metadata.queryType === 'temporal') {
      const hasTemporalGaps = this.hasTemporalGaps(result.results);
      if (hasTemporalGaps) {
        uncertainties.push("Temporal data gaps may affect trend analysis");
      }
    }

    // Geographic coverage uncertainty
    if (result.metadata.queryType === 'geographic') {
      const geographicCoverage = this.assessGeographicCoverage(result.results);
      if (geographicCoverage < 0.5) {
        uncertainties.push("Limited geographic coverage may not represent all areas");
      }
    }

    return uncertainties;
  }

  /**
   * Update memory service context with analysis insights
   */
  private updateMemoryContext(
    sessionId: string,
    question: string,
    result: EnhancedQueryResult,
    metadata: {
      confidence: number;
      analysisLevel: AnalysisLevel;
      validationNeeded: boolean;
    }
  ): void {
    try {
      memoryService.updateAnalysisContext(sessionId, {
        currentDataset: 'services', // Default for Phase 1
        lastUpdated: new Date().toISOString()
      });

      // Add to user profile for learning
      const profile = memoryService.getUserProfile();
      if (profile) {
        // Update analysis style preferences
        const existingStyle = profile.preferredAnalysisStyles.find(s => s.style === metadata.analysisLevel);
        if (existingStyle) {
          existingStyle.frequency++;
        } else {
          profile.preferredAnalysisStyles.push({
            style: metadata.analysisLevel,
            frequency: 1,
            satisfaction: 0.8 // Default satisfaction
          });
        }

        // Update query patterns
        const pattern = this.extractQueryPattern(question);
        const existingPattern = profile.commonQueryPatterns.find(p => p.pattern === pattern);
        if (existingPattern) {
          existingPattern.frequency++;
          if (metadata.confidence > 0.7) existingPattern.successRate = 
            (existingPattern.successRate + 1) / 2; // Simple moving average
        } else {
          profile.commonQueryPatterns.push({
            pattern,
            frequency: 1,
            successRate: metadata.confidence,
            averageFollowups: 0,
            commonVariations: []
          });
        }

        memoryService.updateUserProfile(profile);
      }
    } catch (error) {
      console.warn('Failed to update memory context:', error);
      // Don't fail the main operation for memory issues
    }
  }

  // === HELPER METHODS ===

  private hasNumericalData(results: any[]): boolean {
    if (results.length === 0) return false;
    const firstRow = results[0];
    return Object.values(firstRow).some(val => typeof val === 'number');
  }

  private hasTemporalVariation(results: any[]): boolean {
    // Simple check for date/time variation in results
    const dateFields = ['date', 'month', 'year', 'collected_date', 'discharged_date'];
    if (results.length < 2) return false;
    
    const firstRow = results[0];
    const lastRow = results[results.length - 1];
    
    return dateFields.some(field => {
      const val1 = firstRow[field];
      const val2 = lastRow[field];
      return val1 && val2 && val1 !== val2;
    });
  }

  private hasOutliers(results: any[]): boolean {
    if (results.length < 5) return false;
    
    // Check for numerical outliers using simple IQR method
    const numericalFields = Object.keys(results[0]).filter(key => 
      typeof results[0][key] === 'number'
    );
    
    return numericalFields.some(field => {
      const values = results.map(row => row[field]).filter(val => typeof val === 'number');
      if (values.length < 5) return false;
      
      values.sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      return values.some(val => val < lowerBound || val > upperBound);
    });
  }

  private hasRecentData(results: any[]): boolean {
    const dateFields = ['collected_date', 'discharged_date', 'initiated_date'];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return results.some(row => {
      return dateFields.some(field => {
        const dateVal = row[field];
        if (!dateVal) return false;
        const recordDate = new Date(dateVal);
        return recordDate > sixMonthsAgo;
      });
    });
  }

  private hasTemporalGaps(results: any[]): boolean {
    // Simple heuristic: if we have time-based data but less than expected frequency
    const dateFields = ['collected_date', 'discharged_date'];
    const datesFound = new Set<string>();
    
    results.forEach(row => {
      dateFields.forEach(field => {
        if (row[field]) {
          const date = new Date(row[field]);
          datesFound.add(date.toISOString().split('T')[0]); // Just date part
        }
      });
    });
    
    // If we have data spanning more than 30 days but fewer than 10 unique dates, likely gaps
    if (datesFound.size > 0) {
      const dates = Array.from(datesFound).sort();
      const firstDate = new Date(dates[0]);
      const lastDate = new Date(dates[dates.length - 1]);
      const daySpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return daySpan > 30 && datesFound.size < 10;
    }
    
    return false;
  }

  private assessGeographicCoverage(results: any[]): number {
    const geographicFields = ['area', 'zone', 'sub_area'];
    const uniqueAreas = new Set<string>();
    
    results.forEach(row => {
      geographicFields.forEach(field => {
        if (row[field] && typeof row[field] === 'string') {
          uniqueAreas.add(row[field]);
        }
      });
    });
    
    // Simple heuristic: Dubai has approximately 23 areas and 7 zones
    // Coverage = unique areas / expected total areas
    const expectedAreas = 30; // Conservative estimate
    return Math.min(1.0, uniqueAreas.size / expectedAreas);
  }

  private extractQueryPattern(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Extract common patterns
    if (questionLower.includes('how many')) return 'count_query';
    if (questionLower.includes('what is the total')) return 'sum_query';
    if (questionLower.includes('show me') || questionLower.includes('list')) return 'display_query';
    if (questionLower.includes('compare')) return 'comparison_query';
    if (questionLower.includes('trend') || questionLower.includes('over time')) return 'temporal_query';
    if (questionLower.includes('top') || questionLower.includes('best')) return 'ranking_query';
    if (questionLower.includes('average') || questionLower.includes('mean')) return 'average_query';
    
    return 'general_query';
  }

  // === PUBLIC API ===

  /**
   * Update feature flags at runtime
   */
  updateFeatureFlags(flags: Partial<FeatureFlags>): void {
    Object.assign(this.featureFlags, flags);
    console.log('Enhanced AI Service V2 feature flags updated:', this.featureFlags);
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Convert enhanced message to original format for backward compatibility
   */
  toOriginalMessage(enhancedMessage: EnhancedMessage): EnhancedChatMessage {
    const { analysisLevel, confidenceScore, followUpSuggestions, validationNeeded, assumptions, uncertaintyAreas, alternativeInterpretations, ...originalFields } = enhancedMessage;
    return originalFields;
  }
}

// Export singleton instance that can be used alongside or instead of original service
export const enhancedAIServiceV2 = new EnhancedAIServiceV2();