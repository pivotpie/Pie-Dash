// Feature Toggle Utility
// Use this to safely enable enhanced features over time

import { hybridAIService } from '../services/hybridAIService';

// Enable V2 features gradually
export const enableEnhancedAnalysis = () => {
  hybridAIService.updateConfig({
    useV2Features: true,
    fallbackToV1: true
  });
  console.log('✨ Enhanced analysis enabled');
};

// FAST MODE: Enhanced formatting with V1 speed
export const enableFastEnhancedAnalysis = () => {
  hybridAIService.updateConfig({
    useV2Features: false,  // Keep V1 speed
    enableMemory: false,
    enableProgressiveDisclosure: false,
    fallbackToV1: true
  });
  console.log('⚡ Fast enhanced analysis enabled (V1 speed + enhanced formatting)');
};

// Enable memory service
export const enableMemoryService = () => {
  hybridAIService.updateConfig({
    useV2Features: true,
    enableMemory: true,
    fallbackToV1: true
  });
  console.log('🧠 Memory service enabled');
};

// Enable voice commands
export const enableVoiceCommands = () => {
  hybridAIService.updateConfig({
    useV2Features: true,
    enableMemory: true,
    enableVoiceCommands: true,
    fallbackToV1: true
  });
  console.log('🎤 Voice commands enabled');
};

// Enable all enhanced features
export const enableAllFeatures = () => {
  hybridAIService.updateConfig({
    useV2Features: true,
    enableMemory: true,
    enableVoiceCommands: true,
    enableArtifacts: true,
    enableProgressiveDisclosure: true,
    fallbackToV1: true
  });
  console.log('🚀 All enhanced features enabled');
};

// Quick start - enable most important features for testing
export const enableBestFeatures = () => {
  hybridAIService.updateConfig({
    useV2Features: true,
    enableMemory: false, // Keep disabled for now
    enableVoiceCommands: false, // Keep disabled for now
    enableArtifacts: false, // Keep disabled for now
    enableProgressiveDisclosure: true,
    fallbackToV1: true
  });
  console.log('⚡ Best enhanced features enabled (V2 + Progressive Disclosure)');
};

// Get current configuration
export const getCurrentConfig = () => {
  return hybridAIService.getConfig();
};

// Rollback to original behavior
export const rollbackToV1 = () => {
  hybridAIService.updateConfig({
    useV2Features: false,
    enableMemory: false,
    enableVoiceCommands: false,
    enableArtifacts: false,
    fallbackToV1: true
  });
  console.log('🔄 Rolled back to V1 behavior');
};

// Usage in browser console:
// import('/src/utils/toggleFeatures.js').then(({ enableEnhancedAnalysis }) => enableEnhancedAnalysis());
