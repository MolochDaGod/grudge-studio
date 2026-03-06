const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, 'AppData/Roaming/puter-cli-nodejs/Config/config.json');
try {
  const d = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const ps = d.profiles || [];
  ps.forEach(p => {
    console.log('Profile:', p.username, '@', p.host);
    console.log('  hasToken:', p.token ? 'YES' : 'NO');
  });
  console.log('Selected:', d.selected_profile);
} catch (e) {
  console.error('Error:', e.message);
}
