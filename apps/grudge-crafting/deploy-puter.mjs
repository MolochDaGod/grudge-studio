/**
 * Deploy Grudge Crafting to Puter
 * Usage: node apps/grudge-crafting/deploy-puter.mjs
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
const subdomain = process.argv[2] || 'crafting';

// Single-file deploy
const scriptDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const localPath = path.join(scriptDir, 'index.html');

// IMPORTANT: Use forward slashes for Puter paths
const remoteBase = `/${username}/sites/${subdomain}/deployment`;

async function deploy() {
  console.log(`Deploying to ${subdomain}.puter.site ...`);
  console.log(`Remote base: ${remoteBase}`);

  // Ensure remote directory exists
  try {
    await puter.fs.stat(remoteBase);
    console.log(`  Dir exists: ${remoteBase}`);
  } catch {
    console.log(`  Creating dir: ${remoteBase}`);
    await puter.fs.mkdir(remoteBase, { createMissingParents: true, dedupeName: false, overwrite: false });
  }

  // Upload index.html
  console.log(`  Uploading index.html -> ${remoteBase}/index.html`);
  const content = fs.readFileSync(localPath);
  const blob = new Blob([content], { type: 'text/html' });

  try {
    const result = await puter.fs.upload(blob, remoteBase, {
      overwrite: true,
      dedupeName: false,
      name: 'index.html',
    });
    console.log(`    OK: ${result.path || result.name || 'uploaded'}`);
  } catch (e) {
    console.error(`    FAIL: ${e.message}`);
  }

  // Link subdomain
  console.log(`\nLinking subdomain "${subdomain}" -> ${remoteBase}`);
  try {
    await puter.hosting.create(subdomain, remoteBase);
    console.log(`  Subdomain linked!`);
  } catch (e) {
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
