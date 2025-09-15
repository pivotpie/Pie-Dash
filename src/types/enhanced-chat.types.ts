// Enhanced Chat Types - Backward Compatible Extensions
// These types extend existing chat.types.ts without breaking changes

import type { ChatSession } from './chat.types';
import type { VisualizationResponse } from './visualization.types';

// === MEMORY & CONTEXT SYSTEM ===

export interface AnalysisContext {
  id: string;
  sessionId: string;
  currentDataset: string;
  activeFilters: Record<string, any>;
  workingHypotheses: Hypothesis[];
  keyFindings: BookmarkedInsight[];
  dataLineage: TransformationStep[];
  createdAt: string;
  lastUpdated: string;
}

export interface Hypothesis {
  id: string;
  content: string;
  status: 'proposed' | 'testing' | 'validated' | 'rejected';
  confidence: number; // 0-1
  evidence: EvidenceItem[];
  createdBy: 'user' | 'ai';
  createdAt: string;
  lastUpdated: string;
}

export interface EvidenceItem {
  id: string;
  type: 'data_point' | 'pattern' | 'correlation' | 'statistical';
  content: string;
  source: string; // query or analysis that generated this
  strength: number; // 0-1
  createdAt: string;
}

export interface BookmarkedInsight {
  id: string;
  title: string;
  content: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  relatedQueries: string[];
  sessionId: string;
  createdAt: string;
  bookmarkedAt: string;
}

export interface TransformationStep {
  id: string;
  operation: string;
  input: string;
  output: string;
  timestamp: string;
}

// User analytics profile for cross-session learning
export interface UserAnalyticsProfile {
  userId?: string;
  domainExpertise: ExpertiseIndicator[];
  preferredAnalysisStyles: AnalysisStylePreference[];
  commonQueryPatterns: QueryPattern[];
  frequentlyUsedDatasets: string[];
  collaborationPreferences: CollaborationPreference;
  lastUpdated: string;
}

export interface ExpertiseIndicator {
  domain: string; // 'waste-management', 'logistics', 'analytics', etc.
  level: 'novice' | 'intermediate' | 'expert';
  confidence: number; // 0-1, based on query complexity and validation accuracy
  evidenceCount: number;
}

export interface QueryPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  averageFollowups: number;
  commonVariations: string[];
}

export interface AnalysisStylePreference {
  style: 'surface' | 'guided' | 'collaborative' | 'expert';
  frequency: number;
  satisfaction: number; // based on session completion and follow-ups
}

export interface CollaborationPreference {
  prefersValidation: boolean;
  wantsExplanations: boolean;
  likesProgressiveDisclosure: boolean;
  prefersVisualizationTypes: string[];
}

// === PROGRESSIVE DISCLOSURE SYSTEM ===

export interface EnhancedMessage extends EnhancedChatMessage {
  analysisLevel: AnalysisLevel;
  confidenceScore: number;
  followUpSuggestions: SuggestedQuery[];
  validationNeeded: boolean;
  assumptions: string[];
  uncertaintyAreas: string[];
  alternativeInterpretations?: string[];
}

export type AnalysisLevel = 'surface' | 'guided' | 'collaborative' | 'expert';

export interface SuggestedQuery {
  id: string;
  query: string;
  type: 'follow_up' | 'drill_down' | 'explore_related' | 'validate_assumption';
  confidence: number;
  reasoning: string;
  estimatedComplexity: AnalysisLevel;
}

// === COLLABORATION SYSTEM ===

export interface ValidationCheckpoint {
  id: string;
  messageId: string;
  type: 'assumption_check' | 'interpretation_review' | 'data_quality' | 'methodology';
  question: string;
  options: ValidationOption[];
  userResponse?: string;
  status: 'pending' | 'completed' | 'skipped';
  createdAt: string;
  respondedAt?: string;
}

export interface ValidationOption {
  id: string;
  label: string;
  value: string;
  impact: string; // how this choice affects the analysis
}

export interface ValidationTask {
  id: string;
  sessionId: string;
  hypothesisId: string;
  type: 'data_validation' | 'assumption_check' | 'peer_review' | 'external_check';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  description: string;
  expectedCompletion?: string;
  results?: ValidationResult;
  createdAt: string;
}

export interface ValidationResult {
  outcome: 'validated' | 'rejected' | 'needs_more_data' | 'inconclusive';
  confidence: number;
  notes: string;
  recommendations: string[];
  completedAt: string;
  completedBy: string;
}

export interface ReviewRequest {
  id: string;
  sessionId: string;
  analysisId: string;
  requestedBy: string;
  reviewType: 'peer_review' | 'expert_review' | 'stakeholder_review';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_review' | 'completed' | 'declined';
  reviewers: string[];
  dueDate?: string;
  description: string;
  feedback?: ReviewFeedback[];
  createdAt: string;
}

export interface ReviewFeedback {
  reviewerId: string;
  rating: number; // 1-5
  comments: string;
  suggestions: string[];
  approved: boolean;
  submittedAt: string;
}

// === ARTIFACT VERSIONING ===

export interface VersionedArtifact {
  id: string;
  type: 'chart' | 'table' | 'insight' | 'report';
  currentVersion: number;
  versions: ArtifactVersion[];
  collaborators: string[];
  permissions: ArtifactPermissions;
  metadata: ArtifactMetadata;
  createdAt: string;
  lastModified: string;
}

export interface ArtifactVersion {
  version: number;
  content: ArtifactContent;
  changelog: string;
  createdBy: string;
  createdAt: string;
  tags: string[];
  parentVersion?: number;
}

export interface ArtifactContent {
  data: any[];
  visualization?: VisualizationResponse;
  analysis: string;
  insights: string[];
  methodology: string;
  assumptions: string[];
  limitations: string[];
}

export interface ArtifactPermissions {
  owner: string;
  viewers: string[];
  editors: string[];
  publiclyVisible: boolean;
  shareableLink?: string;
}

export interface ArtifactMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  qualityScore: number;
  usageCount: number;
  lastAccessed: string;
}

// === ENHANCED SESSION MANAGEMENT ===

export interface EnhancedChatSession extends ChatSession {
  analysisContext?: AnalysisContext;
  activeHypotheses: Hypothesis[];
  validationQueue: ValidationTask[];
  artifacts: VersionedArtifact[];
  collaborators: string[];
  sessionType: 'individual' | 'collaborative' | 'review';
  parentSessionId?: string; // for branched conversations
  childSessionIds: string[];
  bookmarkedInsights: BookmarkedInsight[];
  sessionMetrics: SessionMetrics;
}

export interface SessionMetrics {
  totalQueries: number;
  analysisDepth: AnalysisLevel;
  insightsDiscovered: number;
  validationsCompleted: number;
  timeSpent: number; // in minutes
  userSatisfaction?: number; // 1-5 rating
  completionStatus: 'ongoing' | 'completed' | 'abandoned';
}

// === COMMAND & CONTROL ===

export interface CommandPaletteAction {
  id: string;
  label: string;
  description: string;
  category: 'analysis' | 'data' | 'export' | 'collaboration' | 'navigation' | 'chat';
  shortcut?: string;
  icon?: string;
  action: () => void | Promise<void>;
  enabled: boolean;
  visibility: 'always' | 'contextual';
}

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description: string;
  context: 'global' | 'chat' | 'analysis' | 'editing';
}

export interface VoiceCommand {
  phrases: string[];
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  context: 'global' | 'analysis' | 'navigation';
}

// === MEMORY SERVICE INTERFACES ===

export interface MemoryServiceOptions {
  maxSessionHistory: number;
  contextRetentionDays: number;
  insightImportanceThreshold: number;
  enableSemanticSearch: boolean;
  enableCrossSessionLearning: boolean;
}

export interface SemanticSearchOptions {
  query: string;
  sessionIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  relevanceThreshold: number;
  maxResults: number;
}

export interface SemanticSearchResult {
  sessionId: string;
  messageId: string;
  content: string;
  relevanceScore: number;
  matchedTerms: string[];
  context: string;
  timestamp: string;
}

export interface InsightConnection {
  id: string;
  sourceInsightId: string;
  targetInsightId: string;
  connectionType: 'builds_on' | 'contradicts' | 'supports' | 'related_to';
  strength: number; // 0-1
  explanation: string;
  discoveredAt: string;
  validatedBy?: string;
}

// === EXPORT TYPES ===

export interface ExportConfiguration {
  format: 'pdf' | 'png' | 'svg' | 'csv' | 'json' | 'pptx' | 'docx';
  includeVisualization: boolean;
  includeData: boolean;
  includeAnalysis: boolean;
  includeMetadata: boolean;
  customSections?: ExportSection[];
  branding?: BrandingOptions;
}

export interface ExportSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'chart' | 'table' | 'insight';
  order: number;
  includedInExport: boolean;
}

export interface BrandingOptions {
  logo?: string;
  companyName?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

// === BACKWARD COMPATIBILITY ===

// Re-export original types to ensure no breaking changes
export type {
  ChatSession as OriginalChatSession,
  EnhancedChatMessage as OriginalEnhancedChatMessage,
  EnhancedQueryResult as OriginalEnhancedQueryResult
} from './chat.types';

// Utility types for gradual migration
export type MigrationCompatibleMessage = EnhancedChatMessage | EnhancedMessage;
export type MigrationCompatibleSession = ChatSession | EnhancedChatSession;

// Feature flags for enabling/disabling new features during migration
export interface FeatureFlags {
  enableMemoryService: boolean;
  enableProgressiveDisclosure: boolean;
  enableCollaborativeFeatures: boolean;
  enableArtifactVersioning: boolean;
  enableVoiceCommands: boolean;
  enableSemanticSearch: boolean;
  enableCrossSessionInsights: boolean;
  enableAdvancedExports: boolean;
}

// Default feature flags - start with conservative settings
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableMemoryService: true,
  enableProgressiveDisclosure: true,
  enableCollaborativeFeatures: false, // Enable in Phase 2
  enableArtifactVersioning: false, // Enable in Phase 3
  enableVoiceCommands: false, // Enable in Phase 4
  enableSemanticSearch: true,
  enableCrossSessionInsights: false, // Enable after testing
  enableAdvancedExports: false // Enable in Phase 3
};