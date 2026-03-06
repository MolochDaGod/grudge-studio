/**
 * Direct Puter deploy script — bypasses the puter-cli Windows backslash bug.
 * Usage: node deploy-puter.mjs [subdomain]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Dynamic import from puter-cli's node_modules
const cliModules = 'C:/Users/nugye/npm-global/node_modules/puter-cli/node_modules';
const { puter } = await import(pathToFileURL(`${cliModules}/@heyputer/puter.js/src/index.js`).href);

// Read config directly
const configPath = path.join(process.env.APPDATA, 'puter-cli-nodejs', 'Config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const uuid = config.selected_profile;
const profiles = config.profiles || [];
const profile = profiles.find(p => p.uuid === uuid);
if (!profile?.token) {
  console.error('No Puter auth token found. Run: puter login');
  process.exit(1);
}

puter.setAuthToken(profile.token);
const username = profile.username || 'MolochDaDev';
const subdomain = process.argv[2] || 'grudge-studio-app';

// Files to deploy (relative to this script's directory)
const scriptDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const filesToDeploy = [
  { local: 'index.html',      remote: 'index.html' },
  { local: 'css/studio.css',  remote: 'css/studio.css' },
  { local: 'js/app.js',       remote: 'js/app.js' },
  { local: 'js/editor3d.js',  remote: 'js/editor3d.js' },
  { local: 'js/agents.js',    remote: 'js/agents.js' },
  { local: 'js/assets.js',    remote: 'js/assets.js' },
];

// IMPORTANT: Use forward slashes for Puter paths
const remoteBase = `/${username}/sites/${subdomain}/deployment`;

async function deploy() {
  console.log(`Deploying to ${subdomain}.puter.site ...`);
  console.log(`Remote base: ${remoteBase}`);

  // Ensure remote directories exist (forward slashes only)
  const dirs = [`${remoteBase}/css`, `${remoteBase}/js`];
  for (const dir of dirs) {
    try {
      await puter.fs.stat(dir);
      console.log(`  Dir exists: ${dir}`);
    } catch {
      console.log(`  Creating dir: ${dir}`);
      await puter.fs.mkdir(dir, { createMissingParents: true, dedupeName: false, overwrite: false });
    }
  }

  // Upload each file
  for (const file of filesToDeploy) {
    const localPath = path.join(scriptDir, file.local);
    const remoteDirPath = remoteBase + '/' + (file.remote.includes('/') ? file.remote.split('/').slice(0, -1).join('/') : '');
    const fileName = file.remote.includes('/') ? file.remote.split('/').pop() : file.remote;

    console.log(`  Uploading ${file.local} -> ${remoteDirPath}/${fileName}`);

    const content = fs.readFileSync(localPath);
    const blob = new Blob([content], { type: 'application/octet-stream' });

    try {
      const result = await puter.fs.upload(blob, remoteDirPath, {
        overwrite: true,
        dedupeName: false,
        name: fileName,
      });
      console.log(`    OK: ${result.path || result.name || 'uploaded'}`);
    } catch (e) {
      console.error(`    FAIL: ${e.message}`);
    }
  }

  // Update subdomain to point to deployment directory
  console.log(`\nLinking subdomain "${subdomain}" -> ${remoteBase}`);
  try {
    await puter.hosting.create(subdomain, remoteBase);
    console.log(`  Subdomain linked!`);
  } catch (e) {
    // If already exists, try update
    try {
      await puter.hosting.update(subdomain, remoteBase);
      console.log(`  Subdomain updated!`);
    } catch (e2) {
      console.error(`  Subdomain link failed: ${e2.message}`);
      console.error(`  (Original: ${e.message})`);
    }
  }

  console.log(`\nDone! https://${subdomain}.puter.site/`);
}

deploy().catch(e => { console.error(e); process.exit(1); });
