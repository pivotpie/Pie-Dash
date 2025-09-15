#!/usr/bin/env node

/**
 * Enhanced Services Upgrade Script
 * Safely migrates from enhancedAIService to hybridAIService
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Enhanced Services Migration Tool\n');

const COMPONENT_PATH = path.join(__dirname, '../src/components/chat/PieChat.tsx');
const BACKUP_PATH = path.join(__dirname, '../src/components/chat/PieChat.backup.tsx');

function executeStep(step, description, action) {
  console.log(`Step ${step}: ${description}`);
  try {
    action();
    console.log('✅ Success\n');
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    return false;
  }
}

function step1_BackupCurrentFile() {
  if (!fs.existsSync(COMPONENT_PATH)) {
    throw new Error(`PieChat.tsx not found at ${COMPONENT_PATH}`);
  }

  if (fs.existsSync(BACKUP_PATH)) {
    console.log('   Backup already exists, skipping...');
    return;
  }

  fs.copyFileSync(COMPONENT_PATH, BACKUP_PATH);
  console.log('   Created backup: PieChat.backup.tsx');
}

function step2_UpdateImports() {
  let content = fs.readFileSync(COMPONENT_PATH, 'utf8');

  const originalImport = "import { enhancedAIService } from '../../services/enhancedAIService';";
  const newImport = "import { hybridAIService } from '../../services/hybridAIService';";

  if (content.includes(newImport)) {
    console.log('   Import already updated, skipping...');
    return;
  }

  if (!content.includes(originalImport)) {
    throw new Error('Original import not found in PieChat.tsx');
  }

  content = content.replace(originalImport, newImport);
  fs.writeFileSync(COMPONENT_PATH, content, 'utf8');
  console.log('   Updated import statement');
}

function step3_UpdateServiceCalls() {
  let content = fs.readFileSync(COMPONENT_PATH, 'utf8');

  const originalCall = 'enhancedAIService.processQuery';
  const newCall = 'hybridAIService.processQuery';

  if (!content.includes(originalCall)) {
    console.log('   Service calls already updated, skipping...');
    return;
  }

  content = content.replace(new RegExp(originalCall, 'g'), newCall);
  fs.writeFileSync(COMPONENT_PATH, content, 'utf8');
  console.log('   Updated service calls');
}

function step4_AddSafeConfiguration() {
  let content = fs.readFileSync(COMPONENT_PATH, 'utf8');

  const configComment = '// Enhanced services configuration';
  if (content.includes(configComment)) {
    console.log('   Configuration already added, skipping...');
    return;
  }

  // Find the useEffect hook and add configuration
  const useEffectPattern = /useEffect\(\(\) => \{/;
  const match = content.match(useEffectPattern);

  if (!match) {
    throw new Error('Could not find useEffect hook to add configuration');
  }

  const configCode = `
    ${configComment}
    hybridAIService.updateConfig({
      useV2Features: false,      // Start conservative
      enableMemory: false,       // Disable initially
      enableVoiceCommands: false,
      enableArtifacts: false,
      fallbackToV1: true        // Always fallback for safety
    });

    console.log('🔧 Hybrid AI Service configured for safe migration');
`;

  const insertIndex = match.index + match[0].length;
  content = content.slice(0, insertIndex) + configCode + content.slice(insertIndex);

  fs.writeFileSync(COMPONENT_PATH, content, 'utf8');
  console.log('   Added safe configuration');
}

function step5_CreateFeatureToggleScript() {
  const toggleScriptPath = path.join(__dirname, '../src/utils/toggleFeatures.js');

  const toggleScript = `// Feature Toggle Utility
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
    fallbackToV1: true
  });
  console.log('🚀 All enhanced features enabled');
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
`;

  if (fs.existsSync(toggleScriptPath)) {
    console.log('   Feature toggle script already exists, skipping...');
    return;
  }

  fs.writeFileSync(toggleScriptPath, toggleScript, 'utf8');
  console.log('   Created feature toggle utility');
}

function createRollbackScript() {
  const rollbackScript = `#!/usr/bin/env node

/**
 * Rollback Script - Restores original PieChat.tsx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENT_PATH = path.join(__dirname, '../src/components/chat/PieChat.tsx');
const BACKUP_PATH = path.join(__dirname, '../src/components/chat/PieChat.backup.tsx');

console.log('🔄 Rolling back to original PieChat.tsx...');

if (!fs.existsSync(BACKUP_PATH)) {
  console.log('❌ No backup found. Cannot rollback.');
  process.exit(1);
}

fs.copyFileSync(BACKUP_PATH, COMPONENT_PATH);
console.log('✅ Successfully rolled back to original PieChat.tsx');
console.log('🗑️  You can now delete the backup file if desired:');
console.log(\`   rm "\${BACKUP_PATH}"\`);
`;

  const rollbackPath = path.join(__dirname, 'rollback-enhanced.js');
  fs.writeFileSync(rollbackPath, rollbackScript, 'utf8');
  console.log('📝 Created rollback script: scripts/rollback-enhanced.js');
}

// Main execution
console.log('This script will safely upgrade your PieChat to use enhanced services.\n');

const success = [
  () => executeStep(1, 'Backup current PieChat.tsx', step1_BackupCurrentFile),
  () => executeStep(2, 'Update import statements', step2_UpdateImports),
  () => executeStep(3, 'Update service calls', step3_UpdateServiceCalls),
  () => executeStep(4, 'Add safe configuration', step4_AddSafeConfiguration),
  () => executeStep(5, 'Create feature toggle utility', step5_CreateFeatureToggleScript),
].every(step => step());

if (success) {
  createRollbackScript();

  console.log('🎉 Migration completed successfully!\n');
  console.log('📋 What happened:');
  console.log('   • Created backup: PieChat.backup.tsx');
  console.log('   • Updated PieChat.tsx to use hybridAIService');
  console.log('   • Configured conservative settings (V2 features disabled)');
  console.log('   • Created feature toggle utility');
  console.log('   • Created rollback script\n');

  console.log('🔧 Next steps:');
  console.log('   1. Test your app - should work exactly the same');
  console.log('   2. Enable features gradually using browser console:');
  console.log("      import('/src/utils/toggleFeatures.js').then(f => f.enableEnhancedAnalysis())");
  console.log('   3. Monitor for any issues');
  console.log('   4. If problems occur, run: node scripts/rollback-enhanced.js\n');

  console.log('📖 Read the full migration guide: ENHANCED_MIGRATION_PLAN.md');
} else {
  console.log('❌ Migration failed. Please check the errors above and try again.');
  console.log('💡 If you need to start over, run: node scripts/rollback-enhanced.js');
}