#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if everything is ready for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(condition, message) {
  if (condition) {
    log(`✓ ${message}`, 'green');
    return true;
  } else {
    log(`✗ ${message}`, 'red');
    return false;
  }
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

let passed = 0;
let failed = 0;

log('\n🚀 Deployment Verification Checklist\n', 'blue');

// 1. Check Node & pnpm
log('1️⃣  Environment Check', 'blue');
try {
  const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
  check(true, `Node.js ${nodeVersion}`);
  passed++;
} catch {
  check(false, 'Node.js not found');
  failed++;
}

try {
  const pnpmVersion = execSync('pnpm -v', { encoding: 'utf8' }).trim();
  check(true, `pnpm ${pnpmVersion}`);
  passed++;
} catch {
  check(false, 'pnpm not found');
  failed++;
}

// 2. Check Project Files
log('\n2️⃣  Project Structure', 'blue');
const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/test.yml',
  '.env.example',
  '.env.production',
];

requiredFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  check(exists, `${file} exists`);
  if (exists) passed++;
  else failed++;
});

// 3. Check Packages
log('\n3️⃣  Workspace Packages', 'blue');
const packages = [
  'packages/shared',
  'packages/database',
  'packages/google-sheets-sync',
  'packages/puter-sync',
  'packages/ui-components',
  'apps/warlord-crafting-suite',
];

packages.forEach((pkg) => {
  const hasPackageJson = fs.existsSync(`${pkg}/package.json`);
  check(hasPackageJson, `${pkg}/package.json`);
  if (hasPackageJson) passed++;
  else failed++;
});

// 4. Check Dependencies
log('\n4️⃣  Dependencies', 'blue');
try {
  const lockfile = fs.existsSync('pnpm-lock.yaml');
  check(lockfile, 'pnpm-lock.yaml exists');
  if (lockfile) passed++;
  else {
    failed++;
    warn('Run: pnpm install');
  }
} catch {
  check(false, 'pnpm-lock.yaml check failed');
  failed++;
}

const nodeModulesExists = fs.existsSync('node_modules');
check(nodeModulesExists, 'node_modules directory exists');
if (nodeModulesExists) passed++;
else {
  failed++;
  warn('Run: pnpm install');
}

// 5. Check Build Configuration
log('\n5️⃣  Build Configuration', 'blue');
const buildFiles = [
  'apps/warlord-crafting-suite/vitest.config.ts',
  'apps/warlord-crafting-suite/vitest.setup.ts',
  'apps/warlord-crafting-suite/__tests__/server/api.test.ts',
  'apps/warlord-crafting-suite/__tests__/client/components.test.tsx',
];

buildFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  check(exists, file);
  if (exists) passed++;
  else failed++;
});

// 6. Check Database Files
log('\n6️⃣  Database Configuration', 'blue');
const dbFiles = [
  'packages/database/src/schema.ts',
  'packages/database/src/index.ts',
];

dbFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  check(exists, file);
  if (exists) passed++;
  else failed++;
});

// 7. Check Documentation
log('\n7️⃣  Documentation', 'blue');
const docFiles = [
  'README.md',
  'QUICKSTART.md',
  'DEPLOY_TO_PRODUCTION.md',
  'DEPLOYMENT_CHECKLIST.md',
  'DEPLOYMENT_TROUBLESHOOTING.md',
  'docs/TESTING.md',
  'docs/DEPLOYMENT.md',
  'docs/ARCHITECTURE.md',
];

docFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  check(exists, file);
  if (exists) passed++;
  else failed++;
});

// 8. Check Deployment Config
log('\n8️⃣  Platform Configuration', 'blue');
const configFiles = [
  'vercel.json',
  'railway.toml',
  'fly.toml',
];

configFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  check(exists, file);
  if (exists) passed++;
  else failed++;
});

// 9. Environment Configuration
log('\n9️⃣  Environment Setup', 'blue');
const envExample = fs.existsSync('.env.example');
const envProduction = fs.existsSync('.env.production');
const envLocal = fs.existsSync('.env.local');

check(envExample, '.env.example exists');
if (envExample) passed++;
else failed++;

check(envProduction, '.env.production exists');
if (envProduction) passed++;
else failed++;

if (!envLocal) {
  warn('.env.local not found (needed for development)');
}

// 10. Git Configuration
log('\n🔟 Git Configuration', 'blue');
try {
  const gitDir = fs.existsSync('.git');
  check(gitDir, '.git directory exists');
  if (gitDir) passed++;
  else failed++;

  const remotes = execSync('git remote -v', { encoding: 'utf8' });
  const hasOrigin = remotes.includes('origin');
  check(hasOrigin, 'Git remote "origin" configured');
  if (hasOrigin) passed++;
  else failed++;
} catch {
  check(false, 'Git check failed');
  failed++;
}

// Summary
log('\n' + '='.repeat(50), 'blue');
log(`Results: ${passed} passed, ${failed} failed`, passed > failed ? 'green' : 'red');
log('='.repeat(50) + '\n', 'blue');

if (failed === 0) {
  log('✅ All checks passed! Ready for deployment.\n', 'green');
  info('Next steps:');
  info('1. Run: pnpm install (if not already done)');
  info('2. Run: pnpm build');
  info('3. Run: pnpm test');
  info('4. Choose platform and follow: DEPLOY_TO_PRODUCTION.md\n');
  process.exit(0);
} else {
  log('❌ Some checks failed. Fix issues above before deploying.\n', 'red');
  info('Common fixes:');
  info('- Missing packages: run pnpm install');
  info('- Missing files: check SETUP_STATUS.md');
  info('- Build issues: run pnpm build and check errors\n');
  process.exit(1);
}
