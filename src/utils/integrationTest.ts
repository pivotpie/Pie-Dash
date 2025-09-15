// Quick Integration Test - Validates enhanced features work together
// This is a simplified test that checks basic functionality

import { memoryService } from '../services/memoryService';
import { enhancedAIServiceV2 } from '../services/enhancedAIServiceV2';
import { collaborationService } from '../services/collaborationService';
import { artifactService } from '../services/artifactService';
import { VoiceService } from '../services/voiceService';
import { DEFAULT_FEATURE_FLAGS } from '../types/enhanced-chat.types';

export class IntegrationTest {
  private results: Array<{ test: string; passed: boolean; error?: string }> = [];

  async runBasicIntegrationTests(): Promise<boolean> {
    console.log('🔧 Running Integration Tests...\n');

    // Test 1: Memory Service Basic Functions
    await this.testMemoryService();
    
    // Test 2: Enhanced AI Service
    await this.testEnhancedAIService();
    
    // Test 3: Collaboration Service
    await this.testCollaborationService();
    
    // Test 4: Artifact Service
    await this.testArtifactService();
    
    // Test 5: Voice Service (without audio)
    await this.testVoiceService();
    
    // Test 6: Feature Flags
    this.testFeatureFlags();

    // Report results
    this.reportResults();
    
    return this.results.every(r => r.passed);
  }

  private async testMemoryService(): Promise<void> {
    try {
      // Test context creation
      const contextId = await memoryService.createAnalysisContext('test-session', 'test-dataset');
      
      // Test hypothesis tracking
      const hypothesis = await memoryService.addHypothesis(contextId, {
        content: 'Test hypothesis',
        createdBy: 'user'
      });
      
      // Test insight bookmarking
      await memoryService.bookmarkInsight(contextId, {
        title: 'Test Insight',
        content: 'Test content',
        importance: 'medium',
        tags: ['test']
      });

      this.results.push({ test: 'Memory Service', passed: true });
    } catch (error) {
      this.results.push({ 
        test: 'Memory Service', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testEnhancedAIService(): Promise<void> {
    try {
      // Test enhanced query processing
      const result = await enhancedAIServiceV2.processEnhancedQuery(
        'Show me waste collection data', 
        'test-session'
      );
      
      // Should have confidence score and analysis level
      if (result.confidence && result.analysisLevel) {
        this.results.push({ test: 'Enhanced AI Service', passed: true });
      } else {
        this.results.push({ 
          test: 'Enhanced AI Service', 
          passed: false, 
          error: 'Missing confidence or analysis level'
        });
      }
    } catch (error) {
      this.results.push({ 
        test: 'Enhanced AI Service', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testCollaborationService(): Promise<void> {
    try {
      // Test validation checkpoint creation
      const checkpoint = await collaborationService.createValidationCheckpoint(
        'test-message-id',
        'assumption_check',
        'Is this assumption correct?',
        [
          { id: '1', label: 'Yes', value: 'yes', impact: 'Continue analysis' },
          { id: '2', label: 'No', value: 'no', impact: 'Revise approach' }
        ]
      );

      if (checkpoint.id) {
        this.results.push({ test: 'Collaboration Service', passed: true });
      } else {
        this.results.push({ 
          test: 'Collaboration Service', 
          passed: false, 
          error: 'Failed to create checkpoint'
        });
      }
    } catch (error) {
      this.results.push({ 
        test: 'Collaboration Service', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testArtifactService(): Promise<void> {
    try {
      // Test artifact creation
      const artifact = await artifactService.createArtifact(
        'test-session',
        'Test Artifact',
        'Test description',
        {
          data: [{ test: 'data' }],
          analysis: 'Test analysis',
          insights: ['Test insight'],
          methodology: 'Test methodology',
          assumptions: ['Test assumption'],
          limitations: ['Test limitation']
        }
      );

      if (artifact.id) {
        this.results.push({ test: 'Artifact Service', passed: true });
      } else {
        this.results.push({ 
          test: 'Artifact Service', 
          passed: false, 
          error: 'Failed to create artifact'
        });
      }
    } catch (error) {
      this.results.push({ 
        test: 'Artifact Service', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testVoiceService(): Promise<void> {
    try {
      // Test voice service initialization (without actual speech recognition)
      const voiceService = new VoiceService({ enabled: false });
      
      // Test command registration
      voiceService.registerCommand({
        id: 'test-command',
        patterns: ['test command'],
        description: 'Test command',
        action: () => ({ success: true, data: null })
      });

      // Test command matching
      const commands = voiceService.getCommands();
      
      if (commands.length > 0) {
        this.results.push({ test: 'Voice Service', passed: true });
      } else {
        this.results.push({ 
          test: 'Voice Service', 
          passed: false, 
          error: 'No commands registered'
        });
      }
    } catch (error) {
      this.results.push({ 
        test: 'Voice Service', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private testFeatureFlags(): void {
    try {
      // Test that default feature flags are properly structured
      const flags = DEFAULT_FEATURE_FLAGS;
      
      const requiredFlags = [
        'enableMemoryService',
        'enableProgressiveDisclosure',
        'enableCollaboration',
        'enableArtifactVersioning',
        'enableVoiceCommands'
      ];

      const missingFlags = requiredFlags.filter(flag => !(flag in flags));
      
      if (missingFlags.length === 0) {
        this.results.push({ test: 'Feature Flags', passed: true });
      } else {
        this.results.push({ 
          test: 'Feature Flags', 
          passed: false, 
          error: `Missing flags: ${missingFlags.join(', ')}`
        });
      }
    } catch (error) {
      this.results.push({ 
        test: 'Feature Flags', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private reportResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log(`\n📊 Integration Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  • ${r.test}: ${r.error}`));
    }

    if (passed === this.results.length) {
      console.log('\n🎉 All integration tests passed! Enhanced features are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }
}

// Export a simple function to run tests
export async function runIntegrationTests(): Promise<boolean> {
  const tester = new IntegrationTest();
  return await tester.runBasicIntegrationTests();
}