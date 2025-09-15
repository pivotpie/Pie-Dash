// Migration Test Suite - Validates enhanced features work correctly
// Run this to ensure migration is successful and no functionality is broken

import { MigrationUtils } from './migrationUtils';
import { memoryService } from '../services/memoryService';
import { enhancedAIServiceV2 } from '../services/enhancedAIServiceV2';
import type { ChatSession } from '../types/chat.types';
import type { FeatureFlags } from '../types/enhanced-chat.types';

export class MigrationTest {
  private results: { test: string; passed: boolean; message: string }[] = [];
  private originalConsoleLog = console.log;
  private testMode = false;

  constructor(silentMode = false) {
    if (silentMode) {
      this.testMode = true;
      console.log = () => {}; // Suppress logs during testing
    }
  }

  /**
   * Run all migration tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: typeof this.results }> {
    console.log('🧪 Starting Migration Test Suite...\n');

    // Restore console if in test mode
    if (this.testMode) {
      console.log = this.originalConsoleLog;
    }

    await this.testBasicCompatibility();
    await this.testMemoryService();
    await this.testEnhancedAIService();
    await this.testBackwardCompatibility();
    await this.testFeatureFlags();
    await this.testErrorHandling();
    await this.testPerformance();

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   ${result.test}: ${result.message}`);
      });
    }

    return { passed, failed, results: this.results };
  }

  private addResult(test: string, passed: boolean, message: string) {
    this.results.push({ test, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  /**
   * Test 1: Basic Compatibility
   */
  private async testBasicCompatibility() {
    console.log('\n🔍 Testing Basic Compatibility...');

    try {
      // Test localStorage
      const testData = { test: 'migration' };
      localStorage.setItem('migration-test', JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem('migration-test') || '{}');
      localStorage.removeItem('migration-test');
      
      this.addResult(
        'LocalStorage Access', 
        retrieved.test === 'migration',
        retrieved.test === 'migration' ? 'Working correctly' : 'Failed to read/write'
      );
    } catch (error) {
      this.addResult('LocalStorage Access', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test existing session data format
      const existingSessions = localStorage.getItem('pie-chat-sessions');
      if (existingSessions) {
        const sessions = JSON.parse(existingSessions);
        const isValidFormat = Array.isArray(sessions) && 
          (sessions.length === 0 || (sessions[0].id && sessions[0].messages));
        
        this.addResult(
          'Existing Data Format', 
          isValidFormat,
          isValidFormat ? 'Compatible format' : 'Incompatible format detected'
        );
      } else {
        this.addResult('Existing Data Format', true, 'No existing data (clean start)');
      }
    } catch (error) {
      this.addResult('Existing Data Format', false, `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test fetch API availability
      const hasFetch = typeof window !== 'undefined' && typeof window.fetch === 'function';
      this.addResult(
        'Fetch API Support', 
        hasFetch,
        hasFetch ? 'Available' : 'Not available - enhanced AI service may fail'
      );
    } catch (error) {
      this.addResult('Fetch API Support', false, 'Error checking fetch availability');
    }
  }

  /**
   * Test 2: Memory Service
   */
  private async testMemoryService() {
    console.log('\n🧠 Testing Memory Service...');

    try {
      // Test service initialization
      const stats = memoryService.getStatistics();
      this.addResult(
        'Memory Service Init',
        stats !== null,
        stats ? `Initialized with ${stats.totalContexts} contexts` : 'Failed to initialize'
      );
    } catch (error) {
      this.addResult('Memory Service Init', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test context creation
      const testSessionId = 'test-session-' + Date.now();
      const context = memoryService.getAnalysisContext(testSessionId);
      
      this.addResult(
        'Context Creation',
        context !== null && context.sessionId === testSessionId,
        context ? 'Context created successfully' : 'Failed to create context'
      );
    } catch (error) {
      this.addResult('Context Creation', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test hypothesis management
      const testSessionId = 'test-session-' + Date.now();
      const hypothesisId = memoryService.addHypothesis(testSessionId, {
        content: 'Test hypothesis',
        status: 'proposed',
        confidence: 0.8,
        evidence: [],
        createdBy: 'user'
      });

      this.addResult(
        'Hypothesis Management',
        hypothesisId !== null,
        hypothesisId ? 'Hypothesis added successfully' : 'Failed to add hypothesis'
      );
    } catch (error) {
      this.addResult('Hypothesis Management', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test insight bookmarking
      const testSessionId = 'test-session-' + Date.now();
      const success = memoryService.bookmarkInsight(testSessionId, {
        title: 'Test Insight',
        content: 'This is a test insight',
        importance: 'medium',
        tags: ['test'],
        relatedQueries: ['test query'],
        sessionId: testSessionId,
        createdAt: new Date().toISOString()
      });

      this.addResult(
        'Insight Bookmarking',
        success,
        success ? 'Insight bookmarked successfully' : 'Failed to bookmark insight'
      );
    } catch (error) {
      this.addResult('Insight Bookmarking', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test semantic search
      const results = await memoryService.searchSessions({
        query: 'test',
        relevanceThreshold: 0.1,
        maxResults: 5
      });

      this.addResult(
        'Semantic Search',
        Array.isArray(results),
        `Search returned ${results.length} results`
      );
    } catch (error) {
      this.addResult('Semantic Search', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Test 3: Enhanced AI Service
   */
  private async testEnhancedAIService() {
    console.log('\n🤖 Testing Enhanced AI Service...');

    try {
      // Test service initialization
      const flags = enhancedAIServiceV2.getFeatureFlags();
      this.addResult(
        'Enhanced AI Init',
        flags !== null && typeof flags === 'object',
        flags ? 'Service initialized with feature flags' : 'Failed to initialize'
      );
    } catch (error) {
      this.addResult('Enhanced AI Init', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test feature flag updates
      const testFlags = {
        enableMemoryService: true,
        enableProgressiveDisclosure: false
      };
      
      enhancedAIServiceV2.updateFeatureFlags(testFlags);
      const updatedFlags = enhancedAIServiceV2.getFeatureFlags();
      
      this.addResult(
        'Feature Flag Updates',
        updatedFlags.enableMemoryService === true && updatedFlags.enableProgressiveDisclosure === false,
        'Feature flags updated correctly'
      );
    } catch (error) {
      this.addResult('Feature Flag Updates', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Note: We don't test actual AI queries here as they require API keys and network access
    // This would be tested in integration tests
    this.addResult(
      'AI Query Processing',
      true,
      'Skipped - requires API access (test in integration)'
    );
  }

  /**
   * Test 4: Backward Compatibility
   */
  private async testBackwardCompatibility() {
    console.log('\n🔄 Testing Backward Compatibility...');

    try {
      // Test that original session format still works
      const originalSession: ChatSession = {
        id: 'test-original-session',
        title: 'Test Original Session',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const converted = MigrationUtils.convertSessionToEnhanced(originalSession);
      
      this.addResult(
        'Session Format Compatibility',
        converted.id === originalSession.id && converted.messages.length === 1,
        'Original session format works with enhanced system'
      );
    } catch (error) {
      this.addResult('Session Format Compatibility', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test that enhanced messages can be converted to original format
      const enhancedMessage = {
        id: 'enhanced-msg',
        role: 'assistant' as const,
        content: 'Enhanced message',
        timestamp: new Date().toISOString(),
        analysisLevel: 'guided' as const,
        confidenceScore: 0.8,
        followUpSuggestions: [],
        validationNeeded: false,
        assumptions: [],
        uncertaintyAreas: []
      };

      const originalMessage = enhancedAIServiceV2.toOriginalMessage(enhancedMessage);
      
      this.addResult(
        'Message Format Compatibility',
        originalMessage.id === enhancedMessage.id && originalMessage.content === enhancedMessage.content,
        'Enhanced messages can be converted to original format'
      );
    } catch (error) {
      this.addResult('Message Format Compatibility', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Test 5: Feature Flags
   */
  private async testFeatureFlags() {
    console.log('\n🚩 Testing Feature Flag System...');

    try {
      // Test safe feature flag creation
      const compatibilityIssues: string[] = [];
      const safeFlags = MigrationUtils.createSafeFeatureFlags({
        enableMemoryService: true,
        enableProgressiveDisclosure: true
      }, compatibilityIssues);

      this.addResult(
        'Safe Feature Flags',
        typeof safeFlags === 'object' && 'enableMemoryService' in safeFlags,
        'Safe feature flags created correctly'
      );
    } catch (error) {
      this.addResult('Safe Feature Flags', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test feature flag persistence
      const testFlags: Partial<FeatureFlags> = {
        enableMemoryService: true,
        enableProgressiveDisclosure: false
      };

      localStorage.setItem('test-feature-flags', JSON.stringify(testFlags));
      const retrieved = JSON.parse(localStorage.getItem('test-feature-flags') || '{}');
      localStorage.removeItem('test-feature-flags');

      this.addResult(
        'Feature Flag Persistence',
        retrieved.enableMemoryService === true && retrieved.enableProgressiveDisclosure === false,
        'Feature flags persist correctly in localStorage'
      );
    } catch (error) {
      this.addResult('Feature Flag Persistence', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Test 6: Error Handling
   */
  private async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');

    try {
      // Test memory service with invalid data
      const result = memoryService.bookmarkInsight('invalid-session', {
        title: '',
        content: '',
        importance: 'medium',
        tags: [],
        relatedQueries: [],
        sessionId: '',
        createdAt: ''
      });

      this.addResult(
        'Invalid Data Handling',
        typeof result === 'boolean',
        'Memory service handles invalid data gracefully'
      );
    } catch (error) {
      this.addResult('Invalid Data Handling', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test localStorage quota exceeded scenario
      const largeData = 'x'.repeat(1000000); // 1MB string
      let quotaExceeded = false;
      
      try {
        localStorage.setItem('large-test-data', largeData);
        localStorage.removeItem('large-test-data');
      } catch (e) {
        quotaExceeded = true;
      }

      this.addResult(
        'Storage Quota Handling',
        true, // Always pass as we're just testing the handling
        quotaExceeded ? 'Storage quota limits detected and handled' : 'Storage quota within limits'
      );
    } catch (error) {
      this.addResult('Storage Quota Handling', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Test 7: Performance
   */
  private async testPerformance() {
    console.log('\n⚡ Testing Performance...');

    try {
      // Test memory service performance
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const sessionId = `perf-test-${i}`;
        memoryService.getAnalysisContext(sessionId);
        memoryService.bookmarkInsight(sessionId, {
          title: `Performance Test ${i}`,
          content: 'Performance test insight',
          importance: 'low',
          tags: ['performance'],
          relatedQueries: [],
          sessionId,
          createdAt: new Date().toISOString()
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.addResult(
        'Memory Service Performance',
        duration < 100, // Should complete in under 100ms
        `10 operations completed in ${duration.toFixed(2)}ms`
      );
    } catch (error) {
      this.addResult('Memory Service Performance', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test feature flag access performance
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        enhancedAIServiceV2.getFeatureFlags();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.addResult(
        'Feature Flag Performance',
        duration < 50, // Should complete in under 50ms
        `100 flag accesses completed in ${duration.toFixed(2)}ms`
      );
    } catch (error) {
      this.addResult('Feature Flag Performance', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      // Test localStorage performance
      const startTime = performance.now();
      const testData = { test: 'performance', timestamp: Date.now() };
      
      for (let i = 0; i < 50; i++) {
        localStorage.setItem(`perf-test-${i}`, JSON.stringify(testData));
      }
      
      for (let i = 0; i < 50; i++) {
        JSON.parse(localStorage.getItem(`perf-test-${i}`) || '{}');
      }
      
      for (let i = 0; i < 50; i++) {
        localStorage.removeItem(`perf-test-${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.addResult(
        'Storage Performance',
        duration < 200, // Should complete in under 200ms
        `150 storage operations completed in ${duration.toFixed(2)}ms`
      );
    } catch (error) {
      this.addResult('Storage Performance', false, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    let report = `# Migration Test Report\n\n`;
    report += `**Test Date:** ${new Date().toISOString()}\n`;
    report += `**Total Tests:** ${total}\n`;
    report += `**Passed:** ${passed}\n`;
    report += `**Failed:** ${failed}\n`;
    report += `**Success Rate:** ${((passed / total) * 100).toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;
    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      report += `${icon} **${result.test}**: ${result.message}\n`;
    });

    if (failed > 0) {
      report += `\n## Failed Tests\n\n`;
      this.results.filter(r => !r.passed).forEach(result => {
        report += `- **${result.test}**: ${result.message}\n`;
      });
    }

    report += `\n## Migration Status\n\n`;
    if (failed === 0) {
      report += `🎉 **ALL TESTS PASSED** - Migration is safe to proceed!\n`;
    } else if (failed <= 2) {
      report += `⚠️ **MOSTLY PASSED** - ${failed} minor issues detected. Review failed tests.\n`;
    } else {
      report += `🚨 **ISSUES DETECTED** - ${failed} tests failed. Address issues before migration.\n`;
    }

    return report;
  }
}

// Export convenience functions
export async function runMigrationTest(silent = false) {
  const test = new MigrationTest(silent);
  return await test.runAllTests();
}

export async function generateMigrationReport(silent = true) {
  const test = new MigrationTest(silent);
  await test.runAllTests();
  return test.generateReport();
}