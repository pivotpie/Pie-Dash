/**
 * StreamingAIService - Progressive AI Response System
 * Provides ChatGPT/Claude-style streaming for real-time user engagement
 */

import { enhancedAIService } from './enhancedAIService';
import type { EnhancedQueryResult } from '../types/chat.types';

export interface StreamingResponse {
  id: string;
  type: 'brief' | 'artifact_section' | 'visualization' | 'complete';
  content: string;
  sectionType?: 'summary' | 'metrics' | 'analysis' | 'recommendations' | 'chart';
  isComplete: boolean;
  timestamp: number;
}

export interface StreamingState {
  briefResponse: {
    content: string;
    isStreaming: boolean;
    isComplete: boolean;
  };
  artifactSections: {
    summary: { content: string; isComplete: boolean };
    metrics: { content: string; isComplete: boolean };
    analysis: { content: string; isComplete: boolean };
    recommendations: { content: string; isComplete: boolean };
    visualization: { content: any; isComplete: boolean };
  };
  overallProgress: number; // 0-100
  isProcessing: boolean;
}

export type StreamingCallback = (response: StreamingResponse) => void;

export class StreamingAIService {
  private static instance: StreamingAIService;
  private activeStreams: Map<string, boolean> = new Map();

  public static getInstance(): StreamingAIService {
    if (!StreamingAIService.instance) {
      StreamingAIService.instance = new StreamingAIService();
    }
    return StreamingAIService.instance;
  }

  /**
   * Process query with progressive streaming
   */
  public async processStreamingQuery(
    question: string,
    sessionId?: string,
    onStreamUpdate?: StreamingCallback
  ): Promise<EnhancedQueryResult> {
    const streamId = `stream_${Date.now()}_${Math.random()}`;
    this.activeStreams.set(streamId, true);

    try {
      // Step 1: Execute SQL query (fast, 1-2 seconds)
      console.log('🚀 Starting streaming analysis...');
      const startTime = Date.now();

      // Get SQL query and execute it first
      const sqlQuery = await this.generateSQLQuery(question);
      const results = await this.executeSQLQuery(sqlQuery);

      console.log(`📊 Data retrieved: ${results.length} records in ${Date.now() - startTime}ms`);

      // Step 2: Generate quick statistical summary for immediate response
      const quickStats = this.generateQuickStatistics(results, question);

      // Step 3: Start dual-track streaming
      const streamPromises = [
        this.streamBriefResponse(streamId, question, quickStats, results, onStreamUpdate),
        this.streamArtifactSections(streamId, question, results, onStreamUpdate)
      ];

      // Wait for both streams to complete
      const [briefResult, detailedResult] = await Promise.all(streamPromises);

      // Step 4: Combine results
      const finalResult: EnhancedQueryResult = {
        sessionId: sessionId || `session_${Date.now()}`,
        question,
        sqlQuery,
        naturalResponse: briefResult.content,
        detailedResponse: detailedResult.detailedAnalysis,
        visualization: detailedResult.visualization,
        multiVisualization: detailedResult.multiVisualization,
        metadata: {
          recordCount: results.length,
          queryType: this.determineQueryType(question),
          visualizationType: detailedResult.visualization?.chartType || 'none'
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      // Send completion signal
      onStreamUpdate?.({
        id: streamId,
        type: 'complete',
        content: '',
        isComplete: true,
        timestamp: Date.now()
      });

      this.activeStreams.delete(streamId);
      return finalResult;

    } catch (error) {
      console.error('Streaming error:', error);
      this.activeStreams.delete(streamId);

      // Fallback to regular processing
      return enhancedAIService.processQuery(question, sessionId);
    }
  }

  /**
   * Stream brief response with typewriter effect
   */
  private async streamBriefResponse(
    streamId: string,
    question: string,
    quickStats: any,
    results: any[],
    onStreamUpdate?: StreamingCallback
  ): Promise<{ content: string }> {

    // Generate brief response based on quick statistics
    let briefContent = this.generateInstantBriefResponse(question, quickStats, results);

    // Stream the brief response with typewriter effect
    const words = briefContent.split(' ');
    let streamedContent = '';

    for (let i = 0; i < words.length; i++) {
      if (!this.activeStreams.get(streamId)) break;

      streamedContent += (i > 0 ? ' ' : '') + words[i];

      onStreamUpdate?.({
        id: streamId,
        type: 'brief',
        content: streamedContent,
        isComplete: false,
        timestamp: Date.now()
      });

      // Variable delay for natural typing effect
      const delay = this.calculateTypingDelay(words[i], i, words.length);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Mark brief response as complete
    onStreamUpdate?.({
      id: streamId,
      type: 'brief',
      content: streamedContent,
      isComplete: true,
      timestamp: Date.now()
    });

    return { content: streamedContent };
  }

  /**
   * Stream artifact sections progressively
   */
  private async streamArtifactSections(
    streamId: string,
    question: string,
    results: any[],
    onStreamUpdate?: StreamingCallback
  ): Promise<{ detailedAnalysis: string; visualization: any; multiVisualization: any }> {

    try {
      // Start with immediate sections using statistical data
      const sections = [
        { type: 'summary', title: '# 📊 Executive Summary' },
        { type: 'metrics', title: '## 📈 Key Metrics' },
        { type: 'analysis', title: '## 🔍 Analysis' },
        { type: 'recommendations', title: '## 💡 Recommendations' }
      ];

      let detailedContent = '';

      // Stream each section with typing effect
      for (const section of sections) {
        if (!this.activeStreams.get(streamId)) break;

        const sectionContent = await this.generateSectionContent(section.type, question, results);
        const fullSectionText = `${section.title}\n\n${sectionContent}\n\n`;

        // Stream this section with typing effect
        await this.streamTextWithTyping(streamId, fullSectionText, section.type as any, onStreamUpdate);
        detailedContent += fullSectionText;
      }

      // Generate visualization in background
      const visualization = await this.generateVisualization(question, results);

      onStreamUpdate?.({
        id: streamId,
        type: 'visualization',
        content: JSON.stringify(visualization),
        sectionType: 'chart',
        isComplete: true,
        timestamp: Date.now()
      });

      return {
        detailedAnalysis: detailedContent,
        visualization,
        multiVisualization: null
      };

    } catch (error) {
      console.error('Artifact streaming error:', error);

      // Fallback: Use enhanced AI service for detailed response
      const fallbackResponse = await enhancedAIService.processQuery(question);
      return {
        detailedAnalysis: fallbackResponse.detailedResponse || fallbackResponse.naturalResponse,
        visualization: fallbackResponse.visualization,
        multiVisualization: fallbackResponse.multiVisualization
      };
    }
  }

  /**
   * Stream text with typing animation
   */
  private async streamTextWithTyping(
    streamId: string,
    text: string,
    sectionType: 'summary' | 'metrics' | 'analysis' | 'recommendations',
    onStreamUpdate?: StreamingCallback
  ): Promise<void> {
    const words = text.split(' ');
    let streamedText = '';

    for (let i = 0; i < words.length; i++) {
      if (!this.activeStreams.get(streamId)) break;

      streamedText += (i > 0 ? ' ' : '') + words[i];

      onStreamUpdate?.({
        id: streamId,
        type: 'artifact_section',
        content: streamedText,
        sectionType,
        isComplete: false,
        timestamp: Date.now()
      });

      const delay = this.calculateTypingDelay(words[i], i, words.length);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Mark section as complete
    onStreamUpdate?.({
      id: streamId,
      type: 'artifact_section',
      content: streamedText,
      sectionType,
      isComplete: true,
      timestamp: Date.now()
    });
  }

  /**
   * Calculate realistic typing delay
   */
  private calculateTypingDelay(word: string, index: number, totalWords: number): number {
    // Base delay: 50-150ms per word
    let delay = 50 + Math.random() * 100;

    // Longer delay after punctuation
    if (word.includes('.') || word.includes(',') || word.includes(':')) {
      delay += 200;
    }

    // Shorter delay for articles and prepositions
    if (['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'].includes(word.toLowerCase())) {
      delay *= 0.7;
    }

    // Speed up towards the end
    if (index > totalWords * 0.8) {
      delay *= 0.8;
    }

    return Math.max(30, Math.min(300, delay));
  }

  /**
   * Generate quick statistics for immediate response
   */
  private generateQuickStatistics(results: any[], question: string): any {
    if (!results.length) return {};

    const stats: any = {
      totalRecords: results.length,
      dateRange: this.getDateRange(results),
      topValues: this.getTopValues(results),
      aggregates: this.calculateAggregates(results)
    };

    return stats;
  }

  /**
   * Generate instant brief response from statistics
   */
  private generateInstantBriefResponse(question: string, stats: any, results: any[]): string {
    const { totalRecords, topValues, aggregates } = stats;

    const topProvider = topValues?.service_provider?.[0];
    if (question.toLowerCase().includes('provider') && topProvider) {
      return `Analysis of ${totalRecords?.toLocaleString() || 'N/A'} service records shows **${topProvider.value}** leads provider performance with ${topProvider.count?.toLocaleString() || 'N/A'} collections (${((topProvider.count / (totalRecords || 1)) * 100).toFixed(1)}% market share). ${aggregates?.total_gallons ? `Total volume processed: ${aggregates.total_gallons.toLocaleString()} gallons.` : ''} View detailed analysis in the right panel for comprehensive insights and visualizations.`;
    }

    if (question.toLowerCase().includes('volume') && aggregates?.total_gallons) {
      const topPerformer = topValues?.service_provider?.[0];
      return `Volume analysis across ${totalRecords?.toLocaleString() || 'N/A'} collections reveals total processing of ${aggregates.total_gallons.toLocaleString()} gallons, averaging ${aggregates.avg_gallons?.toFixed(1) || 'N/A'} gallons per collection. ${topPerformer ? `Top performer: ${topPerformer.value}.` : ''} View detailed breakdown in the right panel for trends and comparative analysis.`;
    }

    // Generic response
    return `Analysis of ${totalRecords?.toLocaleString() || 'N/A'} records completed. Key patterns identified across ${topValues?.service_provider?.length || 'multiple'} service providers and ${topValues?.area?.length || 'various'} areas. ${aggregates?.total_gallons ? `Total volume: ${aggregates.total_gallons.toLocaleString()} gallons.` : ''} View comprehensive analysis in the right panel for detailed insights and recommendations.`;
  }

  /**
   * Helper methods for data analysis
   */
  private getDateRange(results: any[]): { start: string; end: string } | null {
    const dates = results
      .map(r => r.collected_date)
      .filter(d => d)
      .sort();

    return dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null;
  }

  private getTopValues(results: any[]): Record<string, Array<{ value: string; count: number }>> {
    const fields = ['service_provider', 'area', 'category'];
    const topValues: Record<string, Array<{ value: string; count: number }>> = {};

    fields.forEach(field => {
      const counts = results.reduce((acc, item) => {
        const value = item[field];
        if (value) {
          acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      topValues[field] = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    });

    return topValues;
  }

  private calculateAggregates(results: any[]): Record<string, number> {
    const numericFields = ['gallons_collected', 'trap_count'];
    const aggregates: Record<string, number> = {};

    numericFields.forEach(field => {
      const values = results
        .map(r => parseFloat(r[field]))
        .filter(v => !isNaN(v));

      if (values.length) {
        aggregates[`total_${field.replace('_collected', '')}`] = values.reduce((sum, v) => sum + v, 0);
        aggregates[`avg_${field.replace('_collected', '')}`] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    });

    return aggregates;
  }

  /**
   * Generate section content using rule-based approach for speed
   */
  private async generateSectionContent(sectionType: string, question: string, results: any[]): Promise<string> {
    const stats = this.generateQuickStatistics(results, question);

    switch (sectionType) {
      case 'summary':
        return this.generateSummarySection(question, stats, results);
      case 'metrics':
        return this.generateMetricsSection(stats, results);
      case 'analysis':
        return this.generateAnalysisSection(question, stats, results);
      case 'recommendations':
        return this.generateRecommendationsSection(question, stats, results);
      default:
        return 'Content generating...';
    }
  }

  private generateSummarySection(question: string, stats: any, results: any[]): string {
    const { totalRecords, topValues, aggregates } = stats;

    const topProvider = topValues?.service_provider?.[0];
    const providerText = topProvider
      ? `**${topProvider.value}** emerges as the leading provider with ${((topProvider.count / totalRecords) * 100).toFixed(1)}% market share.`
      : '';

    const volumeText = aggregates?.total_gallons
      ? `Total volume processed: **${aggregates.total_gallons.toLocaleString()} gallons** across all operations.`
      : '';

    return `Based on analysis of **${totalRecords?.toLocaleString() || 'N/A'} service records**, key performance patterns have been identified. ${providerText} ${volumeText}`;
  }

  private generateMetricsSection(stats: any, results: any[]): string {
    const { totalRecords, topValues, aggregates } = stats;

    let metrics = `| Metric | Value |\n|--------|-------|\n`;
    metrics += `| Total Records | ${totalRecords?.toLocaleString() || 'N/A'} |\n`;

    if (aggregates?.total_gallons) {
      metrics += `| Total Volume | ${aggregates.total_gallons.toLocaleString()} gallons |\n`;
      metrics += `| Average per Collection | ${aggregates.avg_gallons?.toFixed(1) || 'N/A'} gallons |\n`;
    }

    if (topValues?.service_provider?.length) {
      metrics += `| Active Providers | ${topValues.service_provider.length} |\n`;
      metrics += `| Top Provider | ${topValues.service_provider[0]?.value || 'N/A'} |\n`;
    }

    return metrics;
  }

  private generateAnalysisSection(question: string, stats: any, results: any[]): string {
    const { topValues, aggregates } = stats;

    if (question.toLowerCase().includes('provider') && topValues?.service_provider?.length) {
      const providers = topValues.service_provider.slice(0, 3);
      return `Provider performance analysis reveals distinct market segments:\n\n${providers.map((p, i) =>
        `**${i + 1}. ${p?.value || 'Unknown'}**: ${p?.count?.toLocaleString() || 'N/A'} collections (${((p?.count / (stats.totalRecords || 1)) * 100).toFixed(1)}% share)`
      ).join('\n')}\n\nPerformance distribution indicates ${providers[0]?.count > (providers[1]?.count || 0) * 2 ? 'concentrated market leadership' : 'competitive market dynamics'}.`;
    }

    return `Performance analysis indicates ${topValues?.service_provider ? 'varied provider efficiency' : 'operational patterns'} across the dataset. ${aggregates?.total_gallons ? `Volume distribution averages ${aggregates.avg_gallons?.toFixed(1)} gallons per service.` : ''} Detailed patterns suggest opportunities for optimization.`;
  }

  private generateRecommendationsSection(question: string, stats: any, results: any[]): string {
    const recommendations = [
      '**Monitor top performers** to identify best practices and scalable strategies',
      '**Analyze volume efficiency** to optimize collection routes and scheduling',
      '**Implement performance benchmarks** based on leading provider metrics'
    ];

    const topProvider = stats?.topValues?.service_provider?.[0];
    if (topProvider && stats.totalRecords && (topProvider.count / stats.totalRecords) > 0.2) {
      recommendations.unshift('**Diversify provider portfolio** to reduce dependency on single provider');
    }

    return recommendations.map(r => `• ${r}`).join('\n');
  }

  /**
   * Delegate to existing services for complex operations
   */
  private async generateSQLQuery(question: string): Promise<string> {
    return enhancedAIService.generateSQLQuery(question);
  }

  private async executeSQLQuery(sqlQuery: string): Promise<any[]> {
    return enhancedAIService.executeSQLQuery(sqlQuery);
  }

  private async generateVisualization(question: string, results: any[]): Promise<any> {
    // Use existing visualization logic or create simplified version
    return enhancedAIService.generateBasicVisualization(question, results);
  }

  private determineQueryType(question: string): string {
    if (question.toLowerCase().includes('provider')) return 'provider_analysis';
    if (question.toLowerCase().includes('volume')) return 'volume_analysis';
    if (question.toLowerCase().includes('performance')) return 'performance_analysis';
    return 'general_analysis';
  }

  /**
   * Stop active stream
   */
  public stopStream(streamId: string): void {
    this.activeStreams.set(streamId, false);
  }

  /**
   * Get streaming state
   */
  public getStreamingState(streamId: string): boolean {
    return this.activeStreams.get(streamId) || false;
  }
}

export const streamingAIService = StreamingAIService.getInstance();