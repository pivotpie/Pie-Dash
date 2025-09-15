#!/usr/bin/env node

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
console.log(`   rm "${BACKUP_PATH}"`);
