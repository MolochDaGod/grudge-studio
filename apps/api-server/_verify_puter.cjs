const fs = require('fs');
const path = require('path');

// Load token from puter-cli config
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, 'AppData/Roaming/puter-cli-nodejs/Config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const profile = config.profiles.find(p => p.uuid === config.selected_profile);

if (!profile || !profile.token) {
  console.error('No valid Puter token found. Run: puter login');
  process.exit(1);
}

// Export for reuse
process.env.PUTER_API_KEY = profile.token;
console.log('✓ Logged in as:', profile.username);
console.log('✓ Host:', profile.host);
console.log('✓ Token loaded (length:', profile.token.length, ')');

// Test the API
async function testAPI() {
  try {
    // Test user info
    const resp = await fetch('https://api.puter.com/whoami', {
      headers: {
        'Authorization': 'Bearer ' + profile.token,
        'Content-Type': 'application/json',
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      console.log('✓ API verified - username:', data.username);
      console.log('  email_confirmed:', data.email_confirmed);
      console.log('  storage used:', data.used, '/', data.capacity);
    } else {
      console.error('✗ API call failed:', resp.status, await resp.text());
    }
  } catch (e) {
    console.error('✗ Network error:', e.message);
  }
}

testAPI();
