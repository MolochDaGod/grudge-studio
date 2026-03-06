#!/usr/bin/env node

/**
 * Verify Drizzle ORM and PostgreSQL Driver Installation
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Drizzle ORM & PostgreSQL Installation\n');

const packages = [
  'drizzle-orm',
  'drizzle-kit',
  'pg',
];

let allInstalled = true;

packages.forEach((pkg) => {
  const pkgPath = path.join(__dirname, 'node_modules', pkg);
  const exists = fs.existsSync(pkgPath);
  
  if (exists) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8')
    );
    console.log(`✅ ${pkg} v${packageJson.version}`);
  } else {
    console.log(`❌ ${pkg} NOT INSTALLED`);
    allInstalled = false;
  }
});

console.log('\n' + '='.repeat(50) + '\n');

if (allInstalled) {
  console.log('✅ All dependencies installed!\n');
  console.log('Next steps:');
  console.log('1. pnpm type-check    # Verify TypeScript');
  console.log('2. pnpm build         # Build packages');
  console.log('3. pnpm db:push       # Apply schema\n');
  process.exit(0);
} else {
  console.log('❌ Some dependencies missing!\n');
  console.log('Run:  pnpm install\n');
  process.exit(1);
}
