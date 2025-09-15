// Memory Service - Phase 1 Implementation
// Provides hierarchical memory management with backward compatibility

import type {
  AnalysisContext,
  Hypothesis,
  BookmarkedInsight,
  UserAnalyticsProfile,
  SemanticSearchOptions,
  SemanticSearchResult,
  InsightConnection,
  MemoryServiceOptions,
  FeatureFlags
} from '../types/enhanced-chat.types';
import type { ChatSession, EnhancedChatMessage } from '../types/chat.types';

export class MemoryService {
  private contextMap: Map<string, AnalysisContext> = new Map();
  private userProfile: UserAnalyticsProfile | null = null;
  private insightConnections: Map<string, InsightConnection[]> = new Map();
  private sessionSummaries: Map<string, string> = new Map();
  private options: MemoryServiceOptions;
  private featureFlags: FeatureFlags;

  constructor(
    options: Partial<MemoryServiceOptions> = {},
    featureFlags: Partial<FeatureFlags> = {}
  ) {
    // Default options with conservative settings
    this.options = {
      maxSessionHistory: 50,
      contextRetentionDays: 7,
      insightImportanceThreshold: 0.7,
      enableSemanticSearch: true,
      enableCrossSessionLearning: false, // Start disabled for safety
      ...options
    };

    // Import default feature flags and override with provided ones
    this.featureFlags = {
      enableMemoryService: true,
      enableProgressiveDisclosure: true,
      enableCollaborativeFeatures: false,
      enableArtifactVersioning: false,
      enableVoiceCommands: false,
      enableSemanticSearch: true,
      enableCrossSessionInsights: false,
      enableAdvancedExports: false,
      ...featureFlags
    };

    // Load persisted data if available
    this.loadPersistedData();
  }

  // === CORE MEMORY OPERATIONS ===

  /**
   * Get or create analysis context for a session
   * BACKWARD COMPATIBLE: Returns null if memory service disabled
   */
  getAnalysisContext(sessionId: string): AnalysisContext | null {
    if (!this.featureFlags.enableMemoryService) {
      return null;
    }

    let context = this.contextMap.get(sessionId);
    if (!context) {
      context = this.createAnalysisContext(sessionId);
      this.contextMap.set(sessionId, context);
    }

    return context;
  }

  /**
   * Update analysis context with new information
   * SAFE FALLBACK: Does nothing if memory service disabled
   */
  updateAnalysisContext(
    sessionId: string, 
    updates: Partial<AnalysisContext>
  ): void {
    if (!this.featureFlags.enableMemoryService) {
      return; // Graceful degradation
    }

    const context = this.getAnalysisContext(sessionId);
    if (!context) return;

    // Merge updates safely
    Object.assign(context, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });

    this.contextMap.set(sessionId, context);
    this.persistData(); // Auto-save changes
  }

  /**
   * Add hypothesis to session context
   * BACKWARD COMPATIBLE: Works alongside existing chat functionality
   */
  addHypothesis(
    sessionId: string, 
    hypothesis: Omit<Hypothesis, 'id' | 'createdAt' | 'lastUpdated'>
  ): string | null {
    if (!this.featureFlags.enableMemoryService) {
      return null;
    }

    const context = this.getAnalysisContext(sessionId);
    if (!context) return null;

    const newHypothesis: Hypothesis = {
      ...hypothesis,
      id: `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    context.workingHypotheses.push(newHypothesis);
    this.updateAnalysisContext(sessionId, { workingHypotheses: context.workingHypotheses });

    return newHypothesis.id;
  }

  /**
   * Bookmark an insight for future reference
   * SAFE OPERATION: Returns success boolean
   */
  bookmarkInsight(
    sessionId: string,
    insight: Omit<BookmarkedInsight, 'id' | 'bookmarkedAt'>
  ): boolean {
    try {
      if (!this.featureFlags.enableMemoryService) {
        return false;
      }

      const context = this.getAnalysisContext(sessionId);
      if (!context) return false;

      const bookmarked: BookmarkedInsight = {
        ...insight,
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookmarkedAt: new Date().toISOString()
      };

      context.keyFindings.push(bookmarked);
      this.updateAnalysisContext(sessionId, { keyFindings: context.keyFindings });

      return true;
    } catch (error) {
      console.warn('Failed to bookmark insight:', error);
      return false;
    }
  }

  // === SEMANTIC SEARCH ===

  /**
   * Search across conversation history using semantic matching
   * FALLBACK: Returns empty array if disabled or fails
   */
  async searchSessions(
    options: SemanticSearchOptions
  ): Promise<SemanticSearchResult[]> {
    try {
      if (!this.featureFlags.enableSemanticSearch) {
        return [];
      }

      // For Phase 1: Implement basic keyword search
      // TODO: Upgrade to vector similarity search in later phases
      return this.performKeywordSearch(options);
    } catch (error) {
      console.warn('Semantic search failed, falling back to empty results:', error);
      return [];
    }
  }

  private performKeywordSearch(options: SemanticSearchOptions): SemanticSearchResult[] {
    const results: SemanticSearchResult[] = [];
    const searchTerms = options.query.toLowerCase().split(' ');
    
    // Search through session summaries (simplified for Phase 1)
    this.sessionSummaries.forEach((summary, sessionId) => {
      const summaryLower = summary.toLowerCase();
      let relevanceScore = 0;
      const matchedTerms: string[] = [];

      // Calculate basic relevance score
      searchTerms.forEach(term => {
        const matches = (summaryLower.match(new RegExp(term, 'g')) || []).length;
        if (matches > 0) {
          relevanceScore += matches * 0.1;
          matchedTerms.push(term);
        }
      });

      // Only include results above threshold
      if (relevanceScore >= options.relevanceThreshold) {
        results.push({
          sessionId,
          messageId: `summary_${sessionId}`,
          content: summary,
          relevanceScore,
          matchedTerms,
          context: 'session_summary',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxResults);
  }

  /**
   * Filter sessions by context similarity
   * SAFE OPERATION: Returns all sessions if filtering fails
   */
  filterByContext(
    currentContext: AnalysisContext,
    allSessions: ChatSession[]
  ): ChatSession[] {
    try {
      if (!this.featureFlags.enableMemoryService) {
        return allSessions;
      }

      // Simple context matching for Phase 1
      return allSessions.filter(session => {
        const sessionContext = this.contextMap.get(session.id);
        if (!sessionContext) return false;

        // Match by dataset
        if (sessionContext.currentDataset !== currentContext.currentDataset) {
          return false;
        }

        // Match by similar hypotheses
        const hypothesesOverlap = this.calculateHypothesesSimilarity(
          currentContext.workingHypotheses,
          sessionContext.workingHypotheses
        );

        return hypothesesOverlap > 0.3; // 30% similarity threshold
      });
    } catch (error) {
      console.warn('Context filtering failed, returning all sessions:', error);
      return allSessions;
    }
  }

  private calculateHypothesesSimilarity(
    hypotheses1: Hypothesis[],
    hypotheses2: Hypothesis[]
  ): number {
    if (hypotheses1.length === 0 && hypotheses2.length === 0) {
      return 1.0;
    }
    if (hypotheses1.length === 0 || hypotheses2.length === 0) {
      return 0.0;
    }

    let totalSimilarity = 0;
    let comparisons = 0;

    hypotheses1.forEach(hyp1 => {
      hypotheses2.forEach(hyp2 => {
        const similarity = this.calculateTextSimilarity(hyp1.content, hyp2.content);
        totalSimilarity += similarity;
        comparisons++;
      });
    });

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity for Phase 1
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Find connections between insights across sessions
   * PHASE 1: Basic implementation, expandable in later phases
   */
  findConnectedInsights(insightId: string): InsightConnection[] {
    if (!this.featureFlags.enableCrossSessionInsights) {
      return [];
    }

    return this.insightConnections.get(insightId) || [];
  }

  // === USER PROFILE MANAGEMENT ===

  /**
   * Get user analytics profile
   * SAFE FALLBACK: Returns null if disabled
   */
  getUserProfile(): UserAnalyticsProfile | null {
    if (!this.featureFlags.enableMemoryService) {
      return null;
    }
    return this.userProfile;
  }

  /**
   * Update user profile based on usage patterns
   * SAFE OPERATION: Does nothing if disabled
   */
  updateUserProfile(updates: Partial<UserAnalyticsProfile>): void {
    if (!this.featureFlags.enableMemoryService) {
      return;
    }

    if (!this.userProfile) {
      this.userProfile = this.createDefaultUserProfile();
    }

    Object.assign(this.userProfile, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });

    this.persistData();
  }

  // === SESSION MANAGEMENT ===

  /**
   * Generate session summary for future reference
   * BACKWARD COMPATIBLE: Works with existing ChatSession
   */
  generateSessionSummary(session: ChatSession): string {
    try {
      const messages = session.messages.filter(m => m.role === 'user');
      if (messages.length === 0) {
        return 'Empty session';
      }

      // Extract key topics and queries
      const queries = messages.map(m => m.content).join(' ');
      const keyWords = this.extractKeywords(queries);
      
      const summary = `Session ${session.title}: Analyzed ${keyWords.slice(0, 5).join(', ')}. ${messages.length} queries explored.`;
      
      this.sessionSummaries.set(session.id, summary);
      return summary;
    } catch (error) {
      console.warn('Failed to generate session summary:', error);
      return `Session ${session.title}`;
    }
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index) // unique
      .slice(0, 10);
  }

  /**
   * Clean up old session data based on retention policy
   * SAFE OPERATION: Only removes data older than configured threshold
   */
  cleanupOldSessions(): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.contextRetentionDays);
      const cutoffTimestamp = cutoffDate.toISOString();

      // Remove old contexts
      const toRemove: string[] = [];
      this.contextMap.forEach((context, sessionId) => {
        if (context.lastUpdated < cutoffTimestamp) {
          toRemove.push(sessionId);
        }
      });

      toRemove.forEach(sessionId => {
        this.contextMap.delete(sessionId);
        this.sessionSummaries.delete(sessionId);
      });

      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} old session contexts`);
        this.persistData();
      }
    } catch (error) {
      console.warn('Failed to cleanup old sessions:', error);
    }
  }

  // === PRIVATE HELPER METHODS ===

  private createAnalysisContext(sessionId: string): AnalysisContext {
    return {
      id: `ctx_${sessionId}`,
      sessionId,
      currentDataset: 'services', // default dataset
      activeFilters: {},
      workingHypotheses: [],
      keyFindings: [],
      dataLineage: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  private createDefaultUserProfile(): UserAnalyticsProfile {
    return {
      domainExpertise: [],
      preferredAnalysisStyles: [
        { style: 'surface', frequency: 1, satisfaction: 0.8 }
      ],
      commonQueryPatterns: [],
      frequentlyUsedDatasets: ['services'],
      collaborationPreferences: {
        prefersValidation: false,
        wantsExplanations: true,
        likesProgressiveDisclosure: true,
        prefersVisualizationTypes: ['bar', 'pie']
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // === PERSISTENCE ===

  private loadPersistedData(): void {
    try {
      // Load from localStorage for Phase 1
      const contextData = localStorage.getItem('pie-memory-contexts');
      if (contextData) {
        const contexts = JSON.parse(contextData);
        this.contextMap = new Map(Object.entries(contexts));
      }

      const profileData = localStorage.getItem('pie-user-profile');
      if (profileData) {
        this.userProfile = JSON.parse(profileData);
      }

      const summariesData = localStorage.getItem('pie-session-summaries');
      if (summariesData) {
        const summaries = JSON.parse(summariesData);
        this.sessionSummaries = new Map(Object.entries(summaries));
      }

      // Schedule periodic cleanup
      this.schedulePeriodicCleanup();
    } catch (error) {
      console.warn('Failed to load persisted memory data:', error);
      // Continue with empty state
    }
  }

  private persistData(): void {
    try {
      // Save to localStorage for Phase 1
      const contexts = Object.fromEntries(this.contextMap);
      localStorage.setItem('pie-memory-contexts', JSON.stringify(contexts));

      if (this.userProfile) {
        localStorage.setItem('pie-user-profile', JSON.stringify(this.userProfile));
      }

      const summaries = Object.fromEntries(this.sessionSummaries);
      localStorage.setItem('pie-session-summaries', JSON.stringify(summaries));
    } catch (error) {
      console.warn('Failed to persist memory data:', error);
    }
  }

  private schedulePeriodicCleanup(): void {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanupOldSessions();
    }, 24 * 60 * 60 * 1000);
  }

  // === PUBLIC API FOR FEATURE MANAGEMENT ===

  /**
   * Update feature flags at runtime
   * SAFE OPERATION: Allows gradual feature rollout
   */
  updateFeatureFlags(flags: Partial<FeatureFlags>): void {
    Object.assign(this.featureFlags, flags);
    console.log('Memory service feature flags updated:', this.featureFlags);
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Get memory service statistics
   */
  getStatistics() {
    return {
      totalContexts: this.contextMap.size,
      totalSummaries: this.sessionSummaries.size,
      userProfileExists: !!this.userProfile,
      featureFlags: this.featureFlags,
      options: this.options
    };
  }
}

// Export singleton instance for easy use
export const memoryService = new MemoryService();