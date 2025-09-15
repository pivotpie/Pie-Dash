// Collaboration Service - Phase 2 Implementation
// Manages human-in-loop validation, hypothesis tracking, and peer review

import type {
  ValidationCheckpoint,
  ValidationTask,
  ValidationResult,
  ReviewRequest,
  ReviewFeedback,
  Hypothesis,
  EvidenceItem
} from '../types/enhanced-chat.types';
import { memoryService } from './memoryService';

export class CollaborationService {
  private validationQueue: Map<string, ValidationTask[]> = new Map();
  private reviewRequests: Map<string, ReviewRequest[]> = new Map();
  private peerValidators: string[] = []; // Simulated peer validators
  
  constructor() {
    this.loadPersistedData();
    this.initializePeerValidators();
  }

  // === HYPOTHESIS MANAGEMENT ===

  /**
   * Propose a new hypothesis based on analysis results
   */
  proposeHypothesis(
    sessionId: string,
    content: string,
    evidence: Omit<EvidenceItem, 'id' | 'createdAt'>[]
  ): string {
    const hypothesis: Hypothesis = {
      id: `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      status: 'proposed',
      confidence: this.calculateInitialConfidence(evidence),
      evidence: evidence.map((ev, index) => ({
        ...ev,
        id: `ev_${Date.now()}_${index}`,
        createdAt: new Date().toISOString()
      })),
      createdBy: 'ai',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    memoryService.addHypothesis(sessionId, hypothesis);

    // Create validation task for hypothesis
    this.createValidationTask(sessionId, hypothesis.id, {
      type: 'assumption_check',
      priority: 'medium',
      description: `Validate hypothesis: ${content.substring(0, 100)}...`,
      expectedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    return hypothesis.id;
  }

  /**
   * Validate a hypothesis with user feedback
   */
  validateHypothesis(
    sessionId: string,
    hypothesisId: string,
    validation: {
      outcome: 'validated' | 'rejected' | 'needs_more_data' | 'inconclusive';
      confidence: number;
      userNotes: string;
      additionalEvidence?: Omit<EvidenceItem, 'id' | 'createdAt'>[];
    }
  ): boolean {
    try {
      const context = memoryService.getAnalysisContext(sessionId);
      if (!context) return false;

      const hypothesis = context.workingHypotheses.find(h => h.id === hypothesisId);
      if (!hypothesis) return false;

      // Update hypothesis based on validation
      hypothesis.status = validation.outcome === 'validated' ? 'validated' : 
                         validation.outcome === 'rejected' ? 'rejected' : 'testing';
      hypothesis.confidence = validation.confidence;
      hypothesis.lastUpdated = new Date().toISOString();

      // Add additional evidence if provided
      if (validation.additionalEvidence) {
        const newEvidence = validation.additionalEvidence.map((ev, index) => ({
          ...ev,
          id: `ev_${Date.now()}_${index}`,
          createdAt: new Date().toISOString()
        }));
        hypothesis.evidence.push(...newEvidence);
      }

      // Complete validation task
      this.completeValidationTask(sessionId, hypothesisId, {
        outcome: validation.outcome,
        confidence: validation.confidence,
        notes: validation.userNotes,
        recommendations: this.generateValidationRecommendations(validation),
        completedAt: new Date().toISOString(),
        completedBy: 'user'
      });

      // Update memory service
      memoryService.updateAnalysisContext(sessionId, {
        workingHypotheses: context.workingHypotheses
      });

      return true;
    } catch (error) {
      console.error('Hypothesis validation failed:', error);
      return false;
    }
  }

  // === VALIDATION SYSTEM ===

  /**
   * Create a validation checkpoint for user interaction
   */
  createValidationCheckpoint(
    sessionId: string,
    messageId: string,
    checkpoint: Omit<ValidationCheckpoint, 'id' | 'createdAt' | 'status'>
  ): string {
    const validationCheckpoint: ValidationCheckpoint = {
      ...checkpoint,
      id: `vcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store checkpoint (in production, this would be in a database)
    const checkpoints = this.getValidationCheckpoints(sessionId);
    checkpoints.push(validationCheckpoint);
    this.persistValidationCheckpoints(sessionId, checkpoints);

    return validationCheckpoint.id;
  }

  /**
   * Respond to a validation checkpoint
   */
  respondToValidationCheckpoint(
    sessionId: string,
    checkpointId: string,
    response: string
  ): boolean {
    try {
      const checkpoints = this.getValidationCheckpoints(sessionId);
      const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
      
      if (!checkpoint) return false;

      checkpoint.userResponse = response;
      checkpoint.status = 'completed';
      checkpoint.respondedAt = new Date().toISOString();

      this.persistValidationCheckpoints(sessionId, checkpoints);

      // Process the validation response
      this.processValidationResponse(sessionId, checkpoint);

      return true;
    } catch (error) {
      console.error('Validation response failed:', error);
      return false;
    }
  }

  /**
   * Create a validation task
   */
  private createValidationTask(
    sessionId: string,
    hypothesisId: string,
    task: Omit<ValidationTask, 'id' | 'sessionId' | 'hypothesisId' | 'status' | 'createdAt'>
  ): string {
    const validationTask: ValidationTask = {
      ...task,
      id: `vt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      hypothesisId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const tasks = this.validationQueue.get(sessionId) || [];
    tasks.push(validationTask);
    this.validationQueue.set(sessionId, tasks);
    this.persistValidationQueue();

    return validationTask.id;
  }

  /**
   * Complete a validation task
   */
  private completeValidationTask(
    sessionId: string,
    hypothesisId: string,
    result: ValidationResult
  ): boolean {
    try {
      const tasks = this.validationQueue.get(sessionId) || [];
      const task = tasks.find(t => t.hypothesisId === hypothesisId);
      
      if (!task) return false;

      task.status = 'completed';
      task.results = result;

      this.validationQueue.set(sessionId, tasks);
      this.persistValidationQueue();

      return true;
    } catch (error) {
      console.error('Failed to complete validation task:', error);
      return false;
    }
  }

  // === PEER REVIEW SYSTEM ===

  /**
   * Request peer review for analysis
   */
  requestPeerReview(
    sessionId: string,
    analysisId: string,
    request: Omit<ReviewRequest, 'id' | 'sessionId' | 'analysisId' | 'status' | 'createdAt' | 'requestedBy'>
  ): string {
    const reviewRequest: ReviewRequest = {
      ...request,
      id: `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      analysisId,
      requestedBy: 'current_user', // In production, get from auth context
      status: 'pending',
      feedback: [],
      createdAt: new Date().toISOString()
    };

    const requests = this.reviewRequests.get(sessionId) || [];
    requests.push(reviewRequest);
    this.reviewRequests.set(sessionId, requests);
    this.persistReviewRequests();

    // Simulate peer review assignment
    this.assignPeerReviewers(reviewRequest);

    return reviewRequest.id;
  }

  /**
   * Submit peer review feedback
   */
  submitReviewFeedback(
    sessionId: string,
    reviewRequestId: string,
    feedback: Omit<ReviewFeedback, 'submittedAt'>
  ): boolean {
    try {
      const requests = this.reviewRequests.get(sessionId) || [];
      const request = requests.find(r => r.id === reviewRequestId);
      
      if (!request) return false;

      const reviewFeedback: ReviewFeedback = {
        ...feedback,
        submittedAt: new Date().toISOString()
      };

      request.feedback = request.feedback || [];
      request.feedback.push(reviewFeedback);

      // Update status if all reviewers have responded
      if (request.feedback.length >= request.reviewers.length) {
        request.status = 'completed';
      }

      this.reviewRequests.set(sessionId, requests);
      this.persistReviewRequests();

      return true;
    } catch (error) {
      console.error('Review feedback submission failed:', error);
      return false;
    }
  }

  // === QUALITY ASSURANCE ===

  /**
   * Perform automated quality checks on analysis
   */
  performQualityAssurance(
    sessionId: string,
    queryResult: any
  ): {
    passed: boolean;
    issues: string[];
    recommendations: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.8; // Start with base confidence

    // Check 1: Data volume adequacy
    if (queryResult.results.length < 10) {
      issues.push('Small sample size may limit statistical significance');
      recommendations.push('Consider gathering more data or qualifying findings');
      confidence -= 0.2;
    }

    // Check 2: Missing data patterns
    const nullValues = queryResult.results.filter(row => 
      Object.values(row).some(val => val === null || val === undefined)
    ).length;
    
    if (nullValues / queryResult.results.length > 0.1) {
      issues.push('Significant missing data detected');
      recommendations.push('Investigate data quality and consider imputation strategies');
      confidence -= 0.15;
    }

    // Check 3: Temporal coverage
    if (queryResult.metadata.queryType === 'temporal') {
      const hasRecentData = this.checkTemporalCoverage(queryResult.results);
      if (!hasRecentData) {
        issues.push('Analysis may be based on outdated data');
        recommendations.push('Verify data freshness and consider time-based disclaimers');
        confidence -= 0.1;
      }
    }

    // Check 4: Statistical significance
    if (queryResult.metadata.queryType === 'comparative') {
      const hasSufficientSamples = queryResult.results.length > 30;
      if (!hasSufficientSamples) {
        issues.push('Comparison may lack statistical power');
        recommendations.push('Increase sample size or use appropriate statistical tests');
        confidence -= 0.15;
      }
    }

    // Check 5: Outlier detection
    const outliers = this.detectOutliers(queryResult.results);
    if (outliers.length > 0) {
      issues.push(`${outliers.length} potential outliers detected`);
      recommendations.push('Review outliers for data quality or investigate as special cases');
      confidence -= 0.05;
    }

    return {
      passed: issues.length === 0,
      issues,
      recommendations,
      confidence: Math.max(0.1, confidence) // Minimum confidence of 10%
    };
  }

  // === ASSUMPTION VALIDATION ===

  /**
   * Generate validation questions based on analysis assumptions
   */
  generateValidationQuestions(
    queryResult: any,
    assumptions: string[]
  ): ValidationCheckpoint[] {
    const questions: ValidationCheckpoint[] = [];

    assumptions.forEach((assumption, index) => {
      // Generate context-appropriate validation questions
      if (assumption.includes('complete collection records')) {
        questions.push({
          id: `vq_completeness_${index}`,
          messageId: '',
          type: 'data_quality',
          question: 'Do you believe the collection records are complete for the analyzed period?',
          options: [
            { id: 'complete', label: 'Yes, data is complete', value: 'complete', impact: 'Analysis is representative' },
            { id: 'partial', label: 'Some records may be missing', value: 'partial', impact: 'Results should be qualified' },
            { id: 'unknown', label: 'Unsure about completeness', value: 'unknown', impact: 'Additional validation needed' }
          ],
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      if (assumption.includes('representative')) {
        questions.push({
          id: `vq_representative_${index}`,
          messageId: '',
          type: 'methodology',
          question: 'Does this sample represent the broader population you\'re interested in?',
          options: [
            { id: 'representative', label: 'Yes, fully representative', value: 'representative', impact: 'Conclusions can be generalized' },
            { id: 'limited', label: 'Representative with limitations', value: 'limited', impact: 'Conclusions apply to similar contexts' },
            { id: 'not_representative', label: 'Not representative', value: 'not_representative', impact: 'Conclusions are context-specific' }
          ],
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    });

    return questions;
  }

  // === PUBLIC API ===

  /**
   * Get pending validation tasks for session
   */
  getPendingValidations(sessionId: string): ValidationTask[] {
    const tasks = this.validationQueue.get(sessionId) || [];
    return tasks.filter(task => task.status === 'pending');
  }

  /**
   * Get validation checkpoints for session
   */
  getValidationCheckpoints(sessionId: string): ValidationCheckpoint[] {
    try {
      const stored = localStorage.getItem(`validation-checkpoints-${sessionId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load validation checkpoints:', error);
      return [];
    }
  }

  /**
   * Get review requests for session
   */
  getReviewRequests(sessionId: string): ReviewRequest[] {
    return this.reviewRequests.get(sessionId) || [];
  }

  /**
   * Get collaboration statistics
   */
  getCollaborationStats() {
    const totalTasks = Array.from(this.validationQueue.values()).flat().length;
    const completedTasks = Array.from(this.validationQueue.values()).flat()
      .filter(task => task.status === 'completed').length;
    
    const totalReviews = Array.from(this.reviewRequests.values()).flat().length;
    const completedReviews = Array.from(this.reviewRequests.values()).flat()
      .filter(review => review.status === 'completed').length;

    return {
      validationTasks: { total: totalTasks, completed: completedTasks },
      peerReviews: { total: totalReviews, completed: completedReviews },
      avgValidationTime: this.calculateAverageValidationTime(),
      qualityScore: this.calculateOverallQualityScore()
    };
  }

  // === HELPER METHODS ===

  private calculateInitialConfidence(evidence: Omit<EvidenceItem, 'id' | 'createdAt'>[]): number {
    if (evidence.length === 0) return 0.5;
    
    const avgStrength = evidence.reduce((sum, ev) => sum + ev.strength, 0) / evidence.length;
    const evidenceBonus = Math.min(evidence.length * 0.1, 0.3); // Up to 30% bonus for multiple evidence
    
    return Math.min(0.9, avgStrength + evidenceBonus);
  }

  private generateValidationRecommendations(validation: any): string[] {
    const recommendations: string[] = [];
    
    if (validation.confidence < 0.5) {
      recommendations.push('Consider gathering additional evidence before proceeding');
    }
    
    if (validation.outcome === 'needs_more_data') {
      recommendations.push('Expand analysis scope or collect additional data points');
    }
    
    if (validation.outcome === 'inconclusive') {
      recommendations.push('Try alternative analysis approaches or seek expert consultation');
    }
    
    return recommendations;
  }

  private processValidationResponse(sessionId: string, checkpoint: ValidationCheckpoint): void {
    // Process the user's validation response and update analysis accordingly
    console.log('Processing validation response:', checkpoint.userResponse);
    
    // In a real implementation, this would:
    // 1. Update analysis confidence scores
    // 2. Modify recommendations based on validation
    // 3. Flag areas that need additional investigation
    // 4. Update user expertise profile
  }

  private assignPeerReviewers(request: ReviewRequest): void {
    // Simulate peer reviewer assignment
    const availableReviewers = this.peerValidators.filter(reviewer => 
      !request.reviewers.includes(reviewer)
    );
    
    // Assign 1-2 reviewers based on priority
    const reviewerCount = request.priority === 'high' ? 2 : 1;
    request.reviewers = availableReviewers.slice(0, reviewerCount);
  }

  private checkTemporalCoverage(results: any[]): boolean {
    // Simple check for recent data
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    return results.some(row => {
      const dateFields = ['collected_date', 'discharged_date', 'initiated_date'];
      return dateFields.some(field => {
        if (row[field]) {
          const date = new Date(row[field]);
          return date > threeMonthsAgo;
        }
        return false;
      });
    });
  }

  private detectOutliers(results: any[]): any[] {
    if (results.length < 5) return [];
    
    const outliers: any[] = [];
    const numericFields = Object.keys(results[0]).filter(key => 
      typeof results[0][key] === 'number'
    );
    
    numericFields.forEach(field => {
      const values = results.map(row => row[field]).filter(val => typeof val === 'number');
      if (values.length < 5) return;
      
      values.sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      results.forEach(row => {
        const value = row[field];
        if (typeof value === 'number' && (value < lowerBound || value > upperBound)) {
          if (!outliers.find(o => o === row)) {
            outliers.push(row);
          }
        }
      });
    });
    
    return outliers;
  }

  private calculateAverageValidationTime(): number {
    const completedTasks = Array.from(this.validationQueue.values()).flat()
      .filter(task => task.status === 'completed' && task.results?.completedAt);
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime();
      const completed = new Date(task.results!.completedAt).getTime();
      return sum + (completed - created);
    }, 0);
    
    return totalTime / completedTasks.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateOverallQualityScore(): number {
    const completedTasks = Array.from(this.validationQueue.values()).flat()
      .filter(task => task.status === 'completed' && task.results);
    
    if (completedTasks.length === 0) return 0.8; // Default score
    
    const avgConfidence = completedTasks.reduce((sum, task) => 
      sum + (task.results?.confidence || 0.5), 0) / completedTasks.length;
    
    return avgConfidence;
  }

  private initializePeerValidators(): void {
    // Simulate peer validators (in production, this would come from user management)
    this.peerValidators = [
      'expert_analyst_1',
      'domain_expert_waste_mgmt',
      'senior_data_scientist',
      'operations_manager'
    ];
  }

  private persistValidationCheckpoints(sessionId: string, checkpoints: ValidationCheckpoint[]): void {
    try {
      localStorage.setItem(`validation-checkpoints-${sessionId}`, JSON.stringify(checkpoints));
    } catch (error) {
      console.warn('Failed to persist validation checkpoints:', error);
    }
  }

  private persistValidationQueue(): void {
    try {
      const data = Object.fromEntries(this.validationQueue);
      localStorage.setItem('collaboration-validation-queue', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist validation queue:', error);
    }
  }

  private persistReviewRequests(): void {
    try {
      const data = Object.fromEntries(this.reviewRequests);
      localStorage.setItem('collaboration-review-requests', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist review requests:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      // Load validation queue
      const queueData = localStorage.getItem('collaboration-validation-queue');
      if (queueData) {
        const parsed = JSON.parse(queueData);
        this.validationQueue = new Map(Object.entries(parsed));
      }

      // Load review requests
      const reviewData = localStorage.getItem('collaboration-review-requests');
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        this.reviewRequests = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load persisted collaboration data:', error);
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();