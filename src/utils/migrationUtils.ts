// Migration Utilities - Ensures smooth transition to enhanced features
// Provides validation, compatibility checks, and rollback mechanisms

import type { ChatSession } from '../types/chat.types';
import type { 
  FeatureFlags,
  MigrationCompatibleSession
} from '../types/enhanced-chat.types';
import { DEFAULT_FEATURE_FLAGS } from '../types/enhanced-chat.types';

export class MigrationUtils {
  /**
   * Validate that enhanced features can be safely enabled
   * Returns array of issues found, empty array if all good
   */
  static validateEnhancedFeatureCompatibility(): string[] {
    const issues: string[] = [];

    try {
      // Check localStorage capacity
      const testData = JSON.stringify({ test: 'migration' });
      localStorage.setItem('migration-test', testData);
      localStorage.removeItem('migration-test');
    } catch (error) {
      issues.push('LocalStorage not available for memory service persistence');
    }

    // Check existing session data format
    try {
      const existingSessions = localStorage.getItem('pie-chat-sessions');
      if (existingSessions) {
        const sessions = JSON.parse(existingSessions);
        if (!Array.isArray(sessions)) {
          issues.push('Existing session data format is incompatible');
        } else {
          // Validate session structure
          sessions.forEach((session: any, index: number) => {
            if (!session.id || !session.messages || !Array.isArray(session.messages)) {
              issues.push(`Session at index ${index} has invalid structure`);
            }
          });
        }
      }
    } catch (error) {
      issues.push('Unable to read existing session data');
    }

    // Check browser support for enhanced features
    if (!window.fetch) {
      issues.push('Fetch API not supported - enhanced AI service may fail');
    }

    if (!window.localStorage) {
      issues.push('LocalStorage not supported - memory service will be disabled');
    }

    return issues;
  }

  /**
   * Create safe feature flags for migration
   * Gradually enables features based on compatibility
   */
  static createSafeFeatureFlags(
    targetFlags: Partial<FeatureFlags> = {},
    compatibility: string[] = []
  ): FeatureFlags {
    const safeFlags = { ...DEFAULT_FEATURE_FLAGS };

    // Disable features if compatibility issues found
    if (compatibility.length > 0) {
      console.warn('Compatibility issues found, using conservative feature flags:', compatibility);
      
      if (compatibility.some(issue => issue.includes('LocalStorage'))) {
        safeFlags.enableMemoryService = false;
        safeFlags.enableSemanticSearch = false;
      }
      
      if (compatibility.some(issue => issue.includes('session data'))) {
        safeFlags.enableProgressiveDisclosure = false;
      }
    }

    // Apply target flags carefully
    Object.entries(targetFlags).forEach(([key, value]) => {
      if (key in safeFlags && typeof value === 'boolean') {
        (safeFlags as any)[key] = value;
      }
    });

    return safeFlags;
  }

  /**
   * Convert old session format to enhanced format safely
   * BACKWARD COMPATIBLE: Does not modify original data
   */
  static convertSessionToEnhanced(session: ChatSession): MigrationCompatibleSession {
    try {
      // Already in correct format - return as is
      return session;
    } catch (error) {
      console.warn('Session conversion failed, using original format:', error);
      return session;
    }
  }

  /**
   * Backup existing data before migration
   */
  static backupExistingData(): boolean {
    try {
      const timestamp = new Date().toISOString();
      
      // Backup sessions
      const sessions = localStorage.getItem('pie-chat-sessions');
      if (sessions) {
        localStorage.setItem(`pie-chat-sessions-backup-${timestamp}`, sessions);
      }
      
      // Backup current session
      const currentSession = localStorage.getItem('pie-chat-current-session');
      if (currentSession) {
        localStorage.setItem(`pie-chat-current-session-backup-${timestamp}`, currentSession);
      }

      console.log(`Data backed up with timestamp: ${timestamp}`);
      return true;
    } catch (error) {
      console.error('Failed to backup existing data:', error);
      return false;
    }
  }

  /**
   * Restore data from backup if migration fails
   */
  static restoreFromBackup(timestamp?: string): boolean {
    try {
      let backupTimestamp = timestamp;
      
      if (!backupTimestamp) {
        // Find most recent backup
        const keys = Object.keys(localStorage);
        const backupKeys = keys.filter(key => key.startsWith('pie-chat-sessions-backup-'));
        if (backupKeys.length === 0) {
          console.warn('No backups found');
          return false;
        }
        backupTimestamp = backupKeys.sort().pop()!.replace('pie-chat-sessions-backup-', '');
      }

      // Restore sessions
      const sessionsBackup = localStorage.getItem(`pie-chat-sessions-backup-${backupTimestamp}`);
      if (sessionsBackup) {
        localStorage.setItem('pie-chat-sessions', sessionsBackup);
      }

      // Restore current session
      const currentSessionBackup = localStorage.getItem(`pie-chat-current-session-backup-${backupTimestamp}`);
      if (currentSessionBackup) {
        localStorage.setItem('pie-chat-current-session', currentSessionBackup);
      }

      console.log(`Data restored from backup: ${backupTimestamp}`);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Clean up old backup data
   */
  static cleanupOldBackups(olderThanDays: number = 7): number {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const keys = Object.keys(localStorage);
      const backupKeys = keys.filter(key => 
        key.startsWith('pie-chat-sessions-backup-') || 
        key.startsWith('pie-chat-current-session-backup-')
      );
      
      let removedCount = 0;
      backupKeys.forEach(key => {
        try {
          const timestamp = key.replace(/^pie-chat-.*-backup-/, '');
          const backupDate = new Date(timestamp);
          if (backupDate < cutoffDate) {
            localStorage.removeItem(key);
            removedCount++;
          }
        } catch (error) {
          // Invalid timestamp format, remove anyway
          localStorage.removeItem(key);
          removedCount++;
        }
      });

      console.log(`Cleaned up ${removedCount} old backups`);
      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return 0;
    }
  }

  /**
   * Test migration without actually migrating
   * Returns success/failure and any issues found
   */
  static testMigration(): { success: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      // Test 1: Compatibility check
      const compatibilityIssues = this.validateEnhancedFeatureCompatibility();
      issues.push(...compatibilityIssues);

      // Test 2: Feature flag creation
      try {
        const testFlags = this.createSafeFeatureFlags({
          enableMemoryService: true,
          enableProgressiveDisclosure: true
        });
        
        if (!testFlags.enableMemoryService && !testFlags.enableProgressiveDisclosure) {
          issues.push('All enhanced features would be disabled');
        }
      } catch (error) {
        issues.push('Feature flag creation failed');
      }

      // Test 3: Data backup
      try {
        const backupSuccess = this.backupExistingData();
        if (!backupSuccess) {
          issues.push('Data backup failed');
        }
      } catch (error) {
        issues.push('Backup test failed');
      }

      // Test 4: Memory service initialization
      try {
        const { memoryService } = require('../services/memoryService');
        const stats = memoryService.getStatistics();
        if (!stats) {
          issues.push('Memory service initialization failed');
        }
      } catch (error) {
        issues.push('Memory service test failed');
      }

      return {
        success: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        success: false,
        issues: [...issues, `Migration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Perform safe migration with automatic rollback on failure
   */
  static performSafeMigration(targetFeatures: Partial<FeatureFlags> = {}): {
    success: boolean;
    issues: string[];
    rollbackInfo?: string;
  } {
    const backupTimestamp = new Date().toISOString();
    
    try {
      // Step 1: Test migration
      console.log('🔍 Testing migration compatibility...');
      const testResult = this.testMigration();
      if (!testResult.success) {
        return {
          success: false,
          issues: ['Migration test failed', ...testResult.issues]
        };
      }

      // Step 2: Backup data
      console.log('💾 Backing up existing data...');
      const backupSuccess = this.backupExistingData();
      if (!backupSuccess) {
        return {
          success: false,
          issues: ['Failed to backup existing data - migration aborted for safety']
        };
      }

      // Step 3: Apply migration
      console.log('🚀 Applying migration...');
      const compatibilityIssues = this.validateEnhancedFeatureCompatibility();
      const safeFlags = this.createSafeFeatureFlags(targetFeatures, compatibilityIssues);
      
      // Store migration flags
      localStorage.setItem('pie-enhanced-features', JSON.stringify({
        enabled: true,
        flags: safeFlags,
        migratedAt: backupTimestamp,
        version: '2.0.0'
      }));

      // Step 4: Initialize services with new flags
      const { memoryService } = require('../services/memoryService');
      const { enhancedAIServiceV2 } = require('../services/enhancedAIServiceV2');
      
      memoryService.updateFeatureFlags(safeFlags);
      enhancedAIServiceV2.updateFeatureFlags(safeFlags);

      console.log('✅ Migration completed successfully');
      
      // Cleanup old backups
      setTimeout(() => {
        this.cleanupOldBackups(7);
      }, 5000);

      return {
        success: true,
        issues: compatibilityIssues, // Report issues but still success
        rollbackInfo: backupTimestamp
      };

    } catch (error) {
      console.error('❌ Migration failed, attempting rollback...');
      
      const rollbackSuccess = this.restoreFromBackup(backupTimestamp);
      
      return {
        success: false,
        issues: [
          `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rollbackSuccess ? 'Data restored from backup' : 'Failed to restore backup - manual intervention required'
        ],
        rollbackInfo: rollbackSuccess ? backupTimestamp : undefined
      };
    }
  }

  /**
   * Check if enhanced features are currently enabled
   */
  static areEnhancedFeaturesEnabled(): boolean {
    try {
      const stored = localStorage.getItem('pie-enhanced-features');
      if (!stored) return false;
      
      const config = JSON.parse(stored);
      return config.enabled === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current feature configuration
   */
  static getCurrentFeatureFlags(): FeatureFlags | null {
    try {
      const stored = localStorage.getItem('pie-enhanced-features');
      if (!stored) return null;
      
      const config = JSON.parse(stored);
      return config.flags || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Disable enhanced features (rollback to standard mode)
   */
  static disableEnhancedFeatures(): boolean {
    try {
      localStorage.removeItem('pie-enhanced-features');
      console.log('Enhanced features disabled');
      return true;
    } catch (error) {
      console.error('Failed to disable enhanced features:', error);
      return false;
    }
  }
}

// Export utility functions for easy import
export const {
  validateEnhancedFeatureCompatibility,
  createSafeFeatureFlags,
  backupExistingData,
  restoreFromBackup,
  testMigration,
  performSafeMigration,
  areEnhancedFeaturesEnabled,
  getCurrentFeatureFlags,
  disableEnhancedFeatures
} = MigrationUtils;