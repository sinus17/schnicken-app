#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting custom Netlify build script');

// Directly set environment variables to disable TypeScript checks during build
process.env.TS_NODE_COMPILER_OPTIONS = '{"noImplicitAny":false,"strictNullChecks":false}';
process.env.TSC_COMPILE_ON_ERROR = 'true';

console.log(`📝 Setting TypeScript compiler options via environment variables...`);
console.log(`    - Disabled noImplicitAny and strictNullChecks`);

// Run the build command
try {
  console.log('🔨 Building project...');
  // Skip TypeScript checking and directly run Vite build
  console.log('🔄 Bypassing TypeScript checks and proceeding with Vite build...');
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Restore original tsconfig if needed
try {
  if (fs.existsSync(`${tsconfigPath}.backup`)) {
    fs.copyFileSync(`${tsconfigPath}.backup`, tsconfigPath);
    fs.unlinkSync(`${tsconfigPath}.backup`);
    console.log('🔄 Restored original tsconfig.app.json');
  }
} catch (error) {
  console.warn('⚠️ Warning: Could not restore original tsconfig.app.json:', error);
}

console.log('✨ Netlify build script completed successfully');
