/**
 * Deploy GRUDGE Workers to Puter
 * Run with: npx tsx scripts/deploy-worker.ts [worker-name]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WORKERS = {
  'grudge-api': {
    source: 'puter/workers/grudge-api.ts',
    compiled: 'puter-deploy/grudge-server/grudge-api.js',
    remotePath: '/GRUDACHAIN/workers/grudge-api.js',
    description: 'Main API worker for game data and AI features'
  },
  'sprite-generator': {
    source: 'puter/workers/sprite-generator.js',
    compiled: 'puter/workers/sprite-generator.js',
    remotePath: '/GRUDACHAIN/workers/sprite-generator.js',
    description: 'AI-powered sprite generation worker'
  }
};

async function getPuterToken(): Promise<string> {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const configPath = path.join(homeDir, '.config', 'puter-cli-nodejs', 'config.json');
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const token = config.profiles?.[0]?.token || '';
    if (!token) {
      throw new Error('No token found in config');
    }
    return token;
  } catch (error) {
    console.error('❌ Failed to read Puter config:', error);
    console.log('\n💡 Please run: puter login');
    process.exit(1);
  }
}

async function compileTypeScript(sourcePath: string, outputPath: string): Promise<void> {
  console.log(`📦 Compiling TypeScript: ${sourcePath}`);
  
  const { execSync } = await import('child_process');
  const outputDir = path.dirname(outputPath);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    execSync(`npx tsc ${sourcePath} --outDir ${outputDir} --target ES2020 --module ES2020 --moduleResolution node`, {
      stdio: 'inherit'
    });
    console.log('✅ TypeScript compiled successfully');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    throw error;
  }
}

async function uploadToPuter(localPath: string, remotePath: string, token: string): Promise<void> {
  console.log(`📤 Uploading to Puter: ${remotePath}`);
  
  const code = fs.readFileSync(localPath, 'utf-8');
  
  try {
    const response = await fetch('https://api.puter.com/write', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: remotePath,
        content: code,
        create_missing_parents: true
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }
    
    console.log('✅ File uploaded to Puter cloud');
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

async function createWorker(name: string, remotePath: string, token: string): Promise<void> {
  console.log(`🔧 Creating Puter worker: ${name}`);
  console.log('\n⚠️  Worker creation must be done via Puter dashboard:');
  console.log(`1. Go to https://puter.com`);
  console.log(`2. Open browser console (F12)`);
  console.log(`3. Run this code:\n`);
  console.log(`await puter.workers.create({`);
  console.log(`  name: '${name}',`);
  console.log(`  code: await puter.fs.read('${remotePath}')`);
  console.log(`});\n`);
  console.log(`4. Worker will be available at: https://${name}.puter.work`);
}

async function deployWorker(workerName: string): Promise<void> {
  const worker = WORKERS[workerName as keyof typeof WORKERS];
  
  if (!worker) {
    console.error(`❌ Unknown worker: ${workerName}`);
    console.log('\nAvailable workers:');
    Object.keys(WORKERS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }
  
  console.log(`\n=== Deploying ${workerName} ===`);
  console.log(`Description: ${worker.description}\n`);
  
  const token = await getPuterToken();
  
  // Compile TypeScript if needed
  if (worker.source.endsWith('.ts')) {
    await compileTypeScript(worker.source, worker.compiled);
  }
  
  // Upload to Puter
  await uploadToPuter(worker.compiled, worker.remotePath, token);
  
  // Instructions for creating worker
  await createWorker(workerName, worker.remotePath, token);
  
  console.log('\n✅ Worker deployment complete!');
}

// Main execution
const workerName = process.argv[2] || 'grudge-api';

deployWorker(workerName).catch(error => {
  console.error('\n❌ Deployment failed:', error);
  process.exit(1);
});

