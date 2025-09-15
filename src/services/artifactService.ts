// Artifact Service - Phase 3 Implementation
// Manages versioned artifacts, collaborative editing, and advanced exports

import type {
  VersionedArtifact,
  ArtifactVersion,
  ArtifactContent,
  ArtifactPermissions,
  ArtifactMetadata,
  ExportConfiguration,
  ExportSection,
  BrandingOptions
} from '../types/enhanced-chat.types';
import type { VisualizationResponse, EnhancedQueryResult } from '../types/chat.types';

export class ArtifactService {
  private artifacts: Map<string, VersionedArtifact> = new Map();
  private exportTemplates: Map<string, ExportConfiguration> = new Map();
  private collaborators: Map<string, string[]> = new Map(); // artifactId -> collaborator IDs
  
  constructor() {
    this.loadPersistedData();
    this.initializeDefaultTemplates();
  }

  // === ARTIFACT CREATION & MANAGEMENT ===

  /**
   * Create a new artifact from analysis results
   */
  createArtifact(
    type: 'chart' | 'table' | 'insight' | 'report',
    content: ArtifactContent,
    metadata: Partial<ArtifactMetadata>,
    permissions: Partial<ArtifactPermissions> = {}
  ): string {
    const artifactId = `artifact_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultMetadata: ArtifactMetadata = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
      description: 'Generated from analysis results',
      category: 'analysis',
      tags: [type, 'generated'],
      qualityScore: this.calculateQualityScore(content),
      usageCount: 0,
      lastAccessed: new Date().toISOString(),
      ...metadata
    };

    const defaultPermissions: ArtifactPermissions = {
      owner: 'current_user',
      viewers: [],
      editors: [],
      publiclyVisible: false,
      ...permissions
    };

    const initialVersion: ArtifactVersion = {
      version: 1,
      content,
      changelog: 'Initial creation',
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      tags: ['initial']
    };

    const artifact: VersionedArtifact = {
      id: artifactId,
      type,
      currentVersion: 1,
      versions: [initialVersion],
      collaborators: [defaultPermissions.owner],
      permissions: defaultPermissions,
      metadata: defaultMetadata,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.artifacts.set(artifactId, artifact);
    this.persistArtifacts();

    return artifactId;
  }

  /**
   * Create artifact from query result
   */
  createArtifactFromQueryResult(
    queryResult: EnhancedQueryResult,
    type: 'chart' | 'table' | 'insight' | 'report' = 'insight'
  ): string {
    const content: ArtifactContent = {
      data: queryResult.results,
      visualization: queryResult.visualization,
      analysis: queryResult.detailedResponse,
      insights: this.extractInsights(queryResult),
      methodology: this.extractMethodology(queryResult),
      assumptions: this.extractAssumptions(queryResult),
      limitations: this.extractLimitations(queryResult)
    };

    const metadata: Partial<ArtifactMetadata> = {
      title: `Analysis: ${queryResult.question}`,
      description: queryResult.naturalResponse.substring(0, 200) + '...',
      category: queryResult.metadata.queryType || 'general',
      tags: [type, queryResult.metadata.queryType, 'auto-generated'],
      qualityScore: this.calculateQueryResultQuality(queryResult)
    };

    return this.createArtifact(type, content, metadata);
  }

  /**
   * Update existing artifact with new version
   */
  updateArtifact(
    artifactId: string,
    updates: Partial<ArtifactContent>,
    changelog: string,
    userId: string = 'current_user'
  ): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    // Check permissions
    if (!this.canEdit(artifactId, userId)) {
      console.warn('User does not have edit permissions for artifact');
      return false;
    }

    const currentContent = artifact.versions[artifact.currentVersion - 1].content;
    const newContent: ArtifactContent = {
      ...currentContent,
      ...updates
    };

    const newVersion: ArtifactVersion = {
      version: artifact.currentVersion + 1,
      content: newContent,
      changelog,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      tags: ['update'],
      parentVersion: artifact.currentVersion
    };

    artifact.versions.push(newVersion);
    artifact.currentVersion = newVersion.version;
    artifact.lastModified = new Date().toISOString();
    artifact.metadata.qualityScore = this.calculateQualityScore(newContent);

    this.artifacts.set(artifactId, artifact);
    this.persistArtifacts();

    return true;
  }

  /**
   * Branch artifact to create alternative version
   */
  branchArtifact(
    artifactId: string,
    fromVersion: number,
    branchName: string,
    userId: string = 'current_user'
  ): string | null {
    const originalArtifact = this.artifacts.get(artifactId);
    if (!originalArtifact) return null;

    const sourceVersion = originalArtifact.versions.find(v => v.version === fromVersion);
    if (!sourceVersion) return null;

    // Create new artifact as branch
    const branchId = `${artifactId}_branch_${Date.now()}`;
    const branchVersion: ArtifactVersion = {
      version: 1,
      content: { ...sourceVersion.content },
      changelog: `Branched from ${artifactId} v${fromVersion}: ${branchName}`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      tags: ['branch', branchName],
      parentVersion: fromVersion
    };

    const branchArtifact: VersionedArtifact = {
      id: branchId,
      type: originalArtifact.type,
      currentVersion: 1,
      versions: [branchVersion],
      collaborators: [userId],
      permissions: {
        ...originalArtifact.permissions,
        owner: userId
      },
      metadata: {
        ...originalArtifact.metadata,
        title: `${originalArtifact.metadata.title} (${branchName})`,
        tags: [...originalArtifact.metadata.tags, 'branch']
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.artifacts.set(branchId, branchArtifact);
    this.persistArtifacts();

    return branchId;
  }

  // === VERSION MANAGEMENT ===

  /**
   * Get specific version of artifact
   */
  getArtifactVersion(artifactId: string, version?: number): ArtifactVersion | null {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    if (version) {
      return artifact.versions.find(v => v.version === version) || null;
    }
    
    return artifact.versions[artifact.currentVersion - 1];
  }

  /**
   * Compare two artifact versions
   */
  compareVersions(
    artifactId: string, 
    version1: number, 
    version2: number
  ): {
    changes: Array<{
      field: string;
      type: 'added' | 'removed' | 'modified';
      oldValue?: any;
      newValue?: any;
    }>;
    summary: string;
  } | null {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    const v1 = artifact.versions.find(v => v.version === version1);
    const v2 = artifact.versions.find(v => v.version === version2);
    
    if (!v1 || !v2) return null;

    const changes: any[] = [];
    const fields = ['data', 'analysis', 'insights', 'methodology', 'assumptions', 'limitations'];

    fields.forEach(field => {
      const val1 = (v1.content as any)[field];
      const val2 = (v2.content as any)[field];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        if (val1 && !val2) {
          changes.push({ field, type: 'removed', oldValue: val1 });
        } else if (!val1 && val2) {
          changes.push({ field, type: 'added', newValue: val2 });
        } else {
          changes.push({ field, type: 'modified', oldValue: val1, newValue: val2 });
        }
      }
    });

    const summary = `${changes.length} changes between v${version1} and v${version2}`;
    
    return { changes, summary };
  }

  /**
   * Revert to previous version
   */
  revertToVersion(
    artifactId: string,
    targetVersion: number,
    userId: string = 'current_user'
  ): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    if (!this.canEdit(artifactId, userId)) return false;

    const targetVersionData = artifact.versions.find(v => v.version === targetVersion);
    if (!targetVersionData) return false;

    // Create new version with reverted content
    const revertVersion: ArtifactVersion = {
      version: artifact.currentVersion + 1,
      content: { ...targetVersionData.content },
      changelog: `Reverted to version ${targetVersion}`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      tags: ['revert'],
      parentVersion: artifact.currentVersion
    };

    artifact.versions.push(revertVersion);
    artifact.currentVersion = revertVersion.version;
    artifact.lastModified = new Date().toISOString();

    this.artifacts.set(artifactId, artifact);
    this.persistArtifacts();

    return true;
  }

  // === COLLABORATION ===

  /**
   * Add collaborator to artifact
   */
  addCollaborator(
    artifactId: string,
    collaboratorId: string,
    role: 'viewer' | 'editor',
    requesterId: string = 'current_user'
  ): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    // Check if requester has permission to add collaborators (owner or editor)
    if (!this.canEdit(artifactId, requesterId) && artifact.permissions.owner !== requesterId) {
      return false;
    }

    if (!artifact.collaborators.includes(collaboratorId)) {
      artifact.collaborators.push(collaboratorId);
    }

    if (role === 'editor' && !artifact.permissions.editors.includes(collaboratorId)) {
      artifact.permissions.editors.push(collaboratorId);
    } else if (role === 'viewer' && !artifact.permissions.viewers.includes(collaboratorId)) {
      artifact.permissions.viewers.push(collaboratorId);
    }

    artifact.lastModified = new Date().toISOString();

    this.artifacts.set(artifactId, artifact);
    this.persistArtifacts();

    return true;
  }

  /**
   * Remove collaborator from artifact
   */
  removeCollaborator(
    artifactId: string,
    collaboratorId: string,
    requesterId: string = 'current_user'
  ): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    // Only owner can remove collaborators
    if (artifact.permissions.owner !== requesterId) {
      return false;
    }

    artifact.collaborators = artifact.collaborators.filter(id => id !== collaboratorId);
    artifact.permissions.viewers = artifact.permissions.viewers.filter(id => id !== collaboratorId);
    artifact.permissions.editors = artifact.permissions.editors.filter(id => id !== collaboratorId);

    artifact.lastModified = new Date().toISOString();

    this.artifacts.set(artifactId, artifact);
    this.persistArtifacts();

    return true;
  }

  /**
   * Generate shareable link for artifact
   */
  generateShareableLink(
    artifactId: string,
    permissions: 'view' | 'edit' | 'public',
    expiresIn?: number // hours
  ): string | null {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    const linkId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = expiresIn ? 
      new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString() : 
      null;

    // Store shareable link configuration
    const shareConfig = {
      artifactId,
      permissions,
      expiresAt,
      createdAt: new Date().toISOString(),
      accessCount: 0
    };

    localStorage.setItem(`artifact-share-${linkId}`, JSON.stringify(shareConfig));

    // Update artifact with share link
    if (permissions === 'public') {
      artifact.permissions.publiclyVisible = true;
      artifact.permissions.shareableLink = linkId;
      this.persistArtifacts();
    }

    return `${window.location.origin}/shared/${linkId}`;
  }

  // === EXPORT SYSTEM ===

  /**
   * Export artifact in specified format
   */
  async exportArtifact(
    artifactId: string,
    config: ExportConfiguration
  ): Promise<Blob | string | null> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    const currentVersion = this.getArtifactVersion(artifactId);
    if (!currentVersion) return null;

    // Update usage metrics
    artifact.metadata.usageCount++;
    artifact.metadata.lastAccessed = new Date().toISOString();
    this.persistArtifacts();

    switch (config.format) {
      case 'json':
        return this.exportAsJSON(currentVersion, config);
      case 'csv':
        return this.exportAsCSV(currentVersion, config);
      case 'pdf':
        return await this.exportAsPDF(currentVersion, config);
      case 'png':
        return await this.exportAsPNG(currentVersion, config);
      case 'svg':
        return await this.exportAsSVG(currentVersion, config);
      case 'pptx':
        return await this.exportAsPPTX(currentVersion, config);
      case 'docx':
        return await this.exportAsDOCX(currentVersion, config);
      default:
        return null;
    }
  }

  /**
   * Create export template
   */
  createExportTemplate(
    name: string,
    config: ExportConfiguration,
    isDefault: boolean = false
  ): void {
    this.exportTemplates.set(name, config);
    
    if (isDefault) {
      localStorage.setItem('default-export-template', name);
    }
    
    this.persistExportTemplates();
  }

  /**
   * Get export templates
   */
  getExportTemplates(): Map<string, ExportConfiguration> {
    return new Map(this.exportTemplates);
  }

  // === SEARCH & DISCOVERY ===

  /**
   * Search artifacts
   */
  searchArtifacts(
    query: string,
    filters: {
      type?: string[];
      category?: string[];
      tags?: string[];
      dateRange?: { start: string; end: string };
      qualityThreshold?: number;
      userId?: string;
    } = {}
  ): VersionedArtifact[] {
    const results: VersionedArtifact[] = [];
    const queryLower = query.toLowerCase();

    this.artifacts.forEach((artifact) => {
      // Check permissions
      if (filters.userId && !this.canView(artifact.id, filters.userId)) {
        return;
      }

      // Text search
      const matchesText = !query || 
        artifact.metadata.title.toLowerCase().includes(queryLower) ||
        artifact.metadata.description.toLowerCase().includes(queryLower) ||
        artifact.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower));

      // Filter by type
      const matchesType = !filters.type || filters.type.includes(artifact.type);
      
      // Filter by category
      const matchesCategory = !filters.category || filters.category.includes(artifact.metadata.category);
      
      // Filter by tags
      const matchesTags = !filters.tags || filters.tags.some(tag => 
        artifact.metadata.tags.includes(tag)
      );
      
      // Filter by date range
      const matchesDateRange = !filters.dateRange || (
        artifact.createdAt >= filters.dateRange.start &&
        artifact.createdAt <= filters.dateRange.end
      );
      
      // Filter by quality
      const matchesQuality = !filters.qualityThreshold || 
        artifact.metadata.qualityScore >= filters.qualityThreshold;

      if (matchesText && matchesType && matchesCategory && matchesTags && matchesDateRange && matchesQuality) {
        results.push(artifact);
      }
    });

    // Sort by relevance and quality
    return results.sort((a, b) => {
      // Prioritize by quality score and recent access
      const scoreA = a.metadata.qualityScore + (new Date(a.metadata.lastAccessed).getTime() / 1e12);
      const scoreB = b.metadata.qualityScore + (new Date(b.metadata.lastAccessed).getTime() / 1e12);
      return scoreB - scoreA;
    });
  }

  // === PERMISSION HELPERS ===

  private canView(artifactId: string, userId: string): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    return artifact.permissions.publiclyVisible ||
           artifact.permissions.owner === userId ||
           artifact.permissions.viewers.includes(userId) ||
           artifact.permissions.editors.includes(userId);
  }

  private canEdit(artifactId: string, userId: string): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    return artifact.permissions.owner === userId ||
           artifact.permissions.editors.includes(userId);
  }

  // === EXPORT IMPLEMENTATIONS ===

  private exportAsJSON(version: ArtifactVersion, config: ExportConfiguration): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: version.version,
        format: 'json'
      },
      content: config.includeData ? version.content.data : undefined,
      analysis: config.includeAnalysis ? version.content.analysis : undefined,
      insights: version.content.insights,
      visualization: config.includeVisualization ? version.content.visualization : undefined,
      customSections: config.customSections
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportAsCSV(version: ArtifactVersion, config: ExportConfiguration): string {
    if (!config.includeData || !version.content.data) {
      return 'No data to export';
    }

    const data = version.content.data;
    if (data.length === 0) return 'No data available';

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Convert to CSV
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private async exportAsPDF(version: ArtifactVersion, config: ExportConfiguration): Promise<string> {
    // In a real implementation, this would use a PDF generation library
    // For now, return HTML that can be converted to PDF
    let html = `
      <html>
        <head>
          <title>Analysis Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; }
            h2 { color: #555; margin-top: 30px; }
            .insight { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
            .data-table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .data-table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
    `;

    html += `<h1>Analysis Report</h1>`;
    html += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;

    if (config.includeAnalysis && version.content.analysis) {
      html += `<h2>Analysis</h2>`;
      html += `<div>${version.content.analysis.replace(/\n/g, '<br>')}</div>`;
    }

    if (version.content.insights && version.content.insights.length > 0) {
      html += `<h2>Key Insights</h2>`;
      version.content.insights.forEach((insight, index) => {
        html += `<div class="insight"><strong>Insight ${index + 1}:</strong> ${insight}</div>`;
      });
    }

    if (config.includeData && version.content.data && version.content.data.length > 0) {
      html += `<h2>Data Summary</h2>`;
      html += `<p>Total records: ${version.content.data.length}</p>`;
      
      // Sample data table (first 10 rows)
      const sampleData = version.content.data.slice(0, 10);
      if (sampleData.length > 0) {
        const headers = Object.keys(sampleData[0]);
        html += `<table class="data-table">`;
        html += `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        sampleData.forEach(row => {
          html += `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`;
        });
        html += `</table>`;
      }
    }

    html += `</body></html>`;
    return html;
  }

  private async exportAsPNG(version: ArtifactVersion, config: ExportConfiguration): Promise<string> {
    // This would require chart rendering to canvas and conversion to PNG
    // For now, return a data URL placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }

  private async exportAsSVG(version: ArtifactVersion, config: ExportConfiguration): Promise<string> {
    // This would render charts as SVG
    return '<svg width="400" height="300"><text x="50%" y="50%" text-anchor="middle">Chart Export Placeholder</text></svg>';
  }

  private async exportAsPPTX(version: ArtifactVersion, config: ExportConfiguration): Promise<string> {
    // This would use a PowerPoint generation library
    return 'PowerPoint export not implemented yet';
  }

  private async exportAsDOCX(version: ArtifactVersion, config: ExportConfiguration): Promise<string> {
    // This would use a Word document generation library
    return 'Word document export not implemented yet';
  }

  // === HELPER METHODS ===

  private calculateQualityScore(content: ArtifactContent): number {
    let score = 0.5; // Base score

    // Data quality
    if (content.data && content.data.length > 0) {
      score += 0.1;
      if (content.data.length > 100) score += 0.1;
    }

    // Analysis quality
    if (content.analysis && content.analysis.length > 200) {
      score += 0.1;
    }

    // Insights quality
    if (content.insights && content.insights.length > 0) {
      score += 0.1;
      if (content.insights.length > 3) score += 0.1;
    }

    // Visualization
    if (content.visualization) {
      score += 0.1;
    }

    // Methodology
    if (content.methodology && content.methodology.length > 100) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  private calculateQueryResultQuality(result: EnhancedQueryResult): number {
    let score = 0.6; // Base score for query results

    // Data volume
    if (result.results.length > 50) score += 0.1;
    if (result.results.length > 200) score += 0.1;

    // Response quality
    if (result.naturalResponse.length > 100) score += 0.05;
    if (result.detailedResponse.length > 500) score += 0.1;

    // Visualization
    if (result.visualization) score += 0.1;
    if (result.multiVisualization) score += 0.05;

    // Performance
    if (result.executionTime < 5000) score += 0.05;

    return Math.min(1.0, score);
  }

  private extractInsights(result: EnhancedQueryResult): string[] {
    // Extract key insights from response
    const insights: string[] = [];
    
    // Look for bullet points or numbered lists in the response
    const bulletPattern = /[•\-\*]\s*(.+)/g;
    const numberPattern = /\d+\.\s*(.+)/g;
    
    let match;
    while ((match = bulletPattern.exec(result.detailedResponse)) !== null) {
      insights.push(match[1].trim());
    }
    
    while ((match = numberPattern.exec(result.detailedResponse)) !== null) {
      insights.push(match[1].trim());
    }
    
    // If no structured insights found, extract key sentences
    if (insights.length === 0) {
      const sentences = result.detailedResponse.split(/[.!?]+/);
      const keysentences = sentences.filter(s => 
        s.length > 50 && 
        (s.includes('shows') || s.includes('indicates') || s.includes('reveals'))
      );
      insights.push(...keysentences.slice(0, 3));
    }
    
    return insights;
  }

  private extractMethodology(result: EnhancedQueryResult): string {
    return `SQL Query Analysis: ${result.sqlQuery}\n\nExecution Time: ${result.executionTime}ms\nRecords Analyzed: ${result.results.length}`;
  }

  private extractAssumptions(result: EnhancedQueryResult): string[] {
    return [
      'Data represents complete and accurate records',
      'Analysis period is representative of typical operations',
      'No significant external factors affecting the data during analysis period'
    ];
  }

  private extractLimitations(result: EnhancedQueryResult): string[] {
    const limitations: string[] = [];
    
    if (result.results.length < 30) {
      limitations.push('Small sample size may limit statistical significance');
    }
    
    if (result.executionTime > 10000) {
      limitations.push('Query complexity may indicate data quality considerations');
    }
    
    limitations.push('Analysis based on historical data and may not reflect future trends');
    
    return limitations;
  }

  private initializeDefaultTemplates(): void {
    // Executive Summary Template
    this.exportTemplates.set('executive-summary', {
      format: 'pdf',
      includeVisualization: true,
      includeData: false,
      includeAnalysis: true,
      includeMetadata: true,
      customSections: [
        { id: 'exec-summary', title: 'Executive Summary', content: '', type: 'text', order: 1, includedInExport: true },
        { id: 'key-findings', title: 'Key Findings', content: '', type: 'insight', order: 2, includedInExport: true },
        { id: 'recommendations', title: 'Recommendations', content: '', type: 'text', order: 3, includedInExport: true }
      ],
      branding: {
        companyName: 'Dubai Municipality',
        colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745' },
        fonts: { heading: 'Arial', body: 'Arial' }
      }
    });

    // Data Report Template
    this.exportTemplates.set('data-report', {
      format: 'csv',
      includeVisualization: false,
      includeData: true,
      includeAnalysis: true,
      includeMetadata: true
    });

    // Presentation Template
    this.exportTemplates.set('presentation', {
      format: 'pptx',
      includeVisualization: true,
      includeData: false,
      includeAnalysis: true,
      includeMetadata: false,
      customSections: [
        { id: 'title-slide', title: 'Analysis Results', content: '', type: 'text', order: 1, includedInExport: true },
        { id: 'charts', title: 'Visualizations', content: '', type: 'chart', order: 2, includedInExport: true },
        { id: 'insights', title: 'Key Insights', content: '', type: 'insight', order: 3, includedInExport: true }
      ]
    });
  }

  private persistArtifacts(): void {
    try {
      const data = Object.fromEntries(this.artifacts);
      localStorage.setItem('artifact-service-artifacts', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist artifacts:', error);
    }
  }

  private persistExportTemplates(): void {
    try {
      const data = Object.fromEntries(this.exportTemplates);
      localStorage.setItem('artifact-service-templates', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist export templates:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      // Load artifacts
      const artifactData = localStorage.getItem('artifact-service-artifacts');
      if (artifactData) {
        const parsed = JSON.parse(artifactData);
        this.artifacts = new Map(Object.entries(parsed));
      }

      // Load export templates
      const templateData = localStorage.getItem('artifact-service-templates');
      if (templateData) {
        const parsed = JSON.parse(templateData);
        this.exportTemplates = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load persisted artifact data:', error);
    }
  }

  // === PUBLIC API ===

  /**
   * Get artifact by ID
   */
  getArtifact(artifactId: string, userId?: string): VersionedArtifact | null {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    if (userId && !this.canView(artifactId, userId)) {
      return null;
    }

    return artifact;
  }

  /**
   * List all artifacts for user
   */
  listArtifacts(userId: string): VersionedArtifact[] {
    const userArtifacts: VersionedArtifact[] = [];
    
    this.artifacts.forEach((artifact) => {
      if (this.canView(artifact.id, userId)) {
        userArtifacts.push(artifact);
      }
    });

    return userArtifacts.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  /**
   * Delete artifact
   */
  deleteArtifact(artifactId: string, userId: string): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    // Only owner can delete
    if (artifact.permissions.owner !== userId) {
      return false;
    }

    this.artifacts.delete(artifactId);
    this.persistArtifacts();
    
    // Clean up related data
    const shareKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('artifact-share-') && 
      localStorage.getItem(key)?.includes(artifactId)
    );
    shareKeys.forEach(key => localStorage.removeItem(key));

    return true;
  }

  /**
   * Get artifact statistics
   */
  getStatistics() {
    const totalArtifacts = this.artifacts.size;
    let totalVersions = 0;
    let totalCollaborators = 0;
    const typeStats: Record<string, number> = {};

    this.artifacts.forEach((artifact) => {
      totalVersions += artifact.versions.length;
      totalCollaborators += artifact.collaborators.length;
      typeStats[artifact.type] = (typeStats[artifact.type] || 0) + 1;
    });

    return {
      totalArtifacts,
      totalVersions,
      avgVersionsPerArtifact: totalVersions / Math.max(totalArtifacts, 1),
      totalCollaborators,
      avgCollaboratorsPerArtifact: totalCollaborators / Math.max(totalArtifacts, 1),
      typeDistribution: typeStats,
      exportTemplates: this.exportTemplates.size
    };
  }
}

// Export singleton instance
export const artifactService = new ArtifactService();