const fs = require('fs');
const path = require('path');
const http = require('http');

const configPath = path.join(
  process.env.HOME || process.env.USERPROFILE,
  'AppData/Roaming/puter-cli-nodejs/Config/config.json'
);

const guiOrigin = 'https://puter.com';

console.log('Opening browser for Puter authentication...');
console.log('Sign in at puter.com, then the token will be captured automatically.\n');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html><html><body>
    <h1 style="font-family:sans-serif;text-align:center;margin-top:100px;color:#2563eb">
      ✓ Authentication Successful!
    </h1>
    <p style="font-family:sans-serif;text-align:center;color:#666">
      You can close this window and return to your terminal.
    </p>
  </body></html>`);

  const token = new URL(req.url, 'http://localhost/').searchParams.get('token');
  if (token) {
    // Update config with new token
    let config = {};
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}

    const profiles = config.profiles || [];
    const existing = profiles.find(p => p.host === guiOrigin);

    if (existing) {
      existing.token = token;
      console.log('✓ Updated token for profile:', existing.username);
    } else {
      const { randomUUID } = require('crypto');
      const uuid = randomUUID();
      profiles.push({ uuid, token, host: guiOrigin, username: 'GRUDACHAIN' });
      config.selected_profile = uuid;
      console.log('✓ Created new profile');
    }

    config.profiles = profiles;
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✓ Token saved to config');

    // Verify the token
    fetch('https://api.puter.com/whoami', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json()).then(data => {
      if (data.username) {
        // Update username if we get it
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const prof = cfg.profiles.find(p => p.token === token);
        if (prof) { prof.username = data.username; }
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
        console.log('✓ Verified - logged in as:', data.username);
      }
      console.log('\nYou are ready to use Puter CLI and AI services!');
      server.close();
      process.exit(0);
    }).catch(() => {
      console.log('✓ Token saved (verification skipped)');
      server.close();
      process.exit(0);
    });
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  const url = `${guiOrigin}/?action=authme&redirectURL=${encodeURIComponent('http://localhost:' + port)}`;
  console.log('If browser does not open, visit:\n' + url + '\n');

  // Dynamic import for ESM-only 'open' package
  try {
    const open = await import('open');
    (open.default || open)(url);
  } catch {
    // Fallback for Windows
    require('child_process').exec(`start "" "${url}"`);
  }
});

// Timeout after 2 minutes
setTimeout(() => {
  console.error('Timeout: No authentication received after 2 minutes.');
  server.close();
  process.exit(1);
}, 120000);
