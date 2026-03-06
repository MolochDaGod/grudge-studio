/**
 * Deploy GRUDGE Sprite Worker to Puter
 * Run with: npx tsx scripts/deploy-puter-worker.ts
 */

import fs from 'fs';
import path from 'path';

const WORKER_NAME = 'grudge-sprites';
const WORKER_FILE_PATH = '/grudge-warlords/workers/sprite-generator.js';

async function deployWorker() {
  console.log('=== GRUDGE Sprite Worker Deployment ===\n');
  
  // Read the worker code
  const workerCodePath = path.join(process.cwd(), 'puter/workers/sprite-generator.js');
  const workerCode = fs.readFileSync(workerCodePath, 'utf-8');
  console.log('Worker code loaded from:', workerCodePath);
  console.log('Code size:', workerCode.length, 'bytes\n');
  
  // Check for Puter config
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const puterConfigPath = path.join(homeDir, '.puter', 'config.json');
  
  let token = '';
  try {
    const config = JSON.parse(fs.readFileSync(puterConfigPath, 'utf-8'));
    token = config.profiles?.[0]?.token || config.authToken || '';
    if (token) {
      console.log('Found Puter auth token');
    }
  } catch (e) {
    console.log('No Puter config found at', puterConfigPath);
  }
  
  if (!token) {
    console.log('\nNo auth token found. Using Puter API directly...');
  }
  
  // Use Puter API to deploy
  console.log('\nUploading worker code to Puter cloud storage...');
  
  try {
    // Upload the file first
    const uploadResponse = await fetch('https://api.puter.com/write', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: WORKER_FILE_PATH,
        content: workerCode,
        create_missing_parents: true
      })
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.log('Upload failed:', error);
      console.log('\nTrying alternative method...');
      
      // Try using puter CLI to push the file
      const { execSync } = await import('child_process');
      try {
        execSync(`puter push ${workerCodePath} ${WORKER_FILE_PATH}`, { stdio: 'inherit' });
        console.log('File uploaded via CLI');
      } catch (cliError) {
        console.log('CLI upload also failed');
      }
    } else {
      console.log('Worker code uploaded to:', WORKER_FILE_PATH);
    }
    
    // Create the worker
    console.log('\nCreating worker...');
    const createResponse = await fetch('https://api.puter.com/workers/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: WORKER_NAME,
        path: WORKER_FILE_PATH
      })
    });
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('\n=== Worker Deployed Successfully! ===');
      console.log('URL:', result.url);
      console.log('\nTest with:');
      console.log(`  curl ${result.url}/api/health`);
    } else {
      const error = await createResponse.text();
      console.log('Worker creation response:', error);
    }
    
  } catch (error) {
    console.error('Deployment error:', error);
  }
}

deployWorker().catch(console.error);
