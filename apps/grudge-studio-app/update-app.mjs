/**
 * Update Grudge-Game-Editor app metadata via Puter REST API
 */
import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.env.APPDATA, 'puter-cli-nodejs', 'Config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const profile = config.profiles.find(p => p.uuid === config.selected_profile);
if (!profile?.token) { console.error('No token'); process.exit(1); }

const TOKEN = profile.token;
const API = 'https://api.puter.com';
const BASE = 'https://puter.com';
const APP_NAME = 'Grudge-Game-Editor';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
  'Origin': BASE,
  'Referer': `${BASE}/`,
};

// Step 1: Verify app exists
console.log(`Getting app info for ${APP_NAME}...`);
try {
  const resp = await fetch(`${API}/apps/${APP_NAME}`, { headers });
  const text = await resp.text();
  console.log(`Info status: ${resp.status}`);
  if (resp.ok) {
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2).slice(0, 500));
  } else {
    console.log(text.slice(0, 300));
  }
} catch (e) { console.error('Info error:', e.message); }

// Step 2: Use SDK with proper init
import { pathToFileURL } from 'node:url';
const cliModules = 'C:/Users/nugye/npm-global/node_modules/puter-cli/node_modules';
const { puter } = await import(pathToFileURL(`${cliModules}/@heyputer/puter.js/src/index.js`).href);
puter.setAuthToken(TOKEN);

console.log('\nTrying SDK puter.apps.get()...');
try {
  const info = await puter.apps.get(APP_NAME);
  console.log('index_url:', info.index_url);
  console.log('uid:', info.uid);
  console.log('name:', info.name);
} catch (e) { console.error('SDK get error:', e.message || JSON.stringify(e)); }

// Step 3: Call drivers/call with EXACT SDK format
console.log('\nDirect driver call matching SDK format...');
const driverHeaders = {
  'Content-Type': 'text/plain;actually=json',
  'Authorization': `Bearer ${TOKEN}`,
  'Origin': BASE,
  'Referer': `${BASE}/`,
};
try {
  const resp = await fetch(`${API}/drivers/call`, {
    method: 'POST',
    headers: driverHeaders,
    body: JSON.stringify({
      interface: 'puter-apps',
      driver: 'es:app',
      method: 'update',
      args: {
        id: { name: APP_NAME },
        object: {
          index_url: 'https://grudge-studio-app.puter.site',
          title: 'Grudge Studio',
          maximize_on_start: true,
          metadata: {
            window_size: { width: 1200, height: 800 },
            window_resizable: true,
          },
        },
      },
      auth_token: TOKEN,
    }),
  });
  const text = await resp.text();
  console.log(`Status: ${resp.status}`);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 800)); } catch { console.log(text.slice(0, 400)); }
} catch (e) { console.error('Driver error:', e.message); }
