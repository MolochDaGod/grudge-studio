import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const root = path.resolve(__dirname, '..');

function log(message: string) {
  console.log(`\n📦 ${message}`);
}

function logError(message: string) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function run(cmd: string, cwd: string = root) {
  try {
    console.log(`   $ ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    log('Building Grudge Studio Monorepo');
    log('Step 1: Installing dependencies...');
    run('pnpm install');

    log('Step 2: Building packages...');
    run('turbo run build');

    log('Step 3: Type checking...');
    run('turbo run type-check');

    log('Step 4: Checking build artifacts...');
    const artifacts = [
      'packages/shared/dist',
      'packages/database/dist',
      'packages/google-sheets-sync/dist',
      'packages/puter-sync/dist',
      'packages/ui-components/dist',
      'apps/warlord-crafting-suite/dist',
    ];

    for (const artifact of artifacts) {
      const fullPath = path.join(root, artifact);
      if (!fs.existsSync(fullPath)) {
        console.warn(`   ⚠️  Missing: ${artifact}`);
      } else {
        console.log(`   ✅ ${artifact}`);
      }
    }

    log('✨ Build completed successfully!');
    process.exit(0);
  } catch (error) {
    logError(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

main();
