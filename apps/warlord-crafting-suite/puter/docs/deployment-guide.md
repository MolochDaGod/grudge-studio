# GRUDGE Deployment Guide

Complete guide for deploying GRUDGE apps to Puter.com.

## App Types

| App | Type | URL | Deploy Method |
|-----|------|-----|---------------|
| **grudge-studio** | Static | .puter.site | `site:deploy` |
| **grudge-auth** | Static | .puter.site | `site:deploy` |
| **grudge-cloud** | Static | .puter.site | `site:deploy` |
| **grudge-server** | Worker | .puter.work | `puter.workers.create()` |

**Important:** Workers (.puter.work) can only be deployed via browser-side Puter.js SDK.

---

## Prerequisites

### Install Puter CLI

```bash
npm install -g puter-cli
puter login --save
```

### Verify Login

```bash
puter whoami
```

---

## Static Site Deployment

For **grudge-auth**, **grudge-cloud**, and **grudge-studio**.

### Option 1: Puter CLI

```bash
# Enter Puter shell
puter shell

# Upload files
cd /GRUDACHAIN
update ./puter-deploy/grudge-auth puter-deploy/grudge-auth

# Deploy
cd /GRUDACHAIN/puter-deploy/grudge-auth
site:deploy . --subdomain=grudge-auth
```

### Option 2: Puter.js (Browser)

```javascript
// Upload file
const html = await fetch('/local/index.html').then(r => r.text());
await puter.fs.write('/GRUDACHAIN/puter-deploy/grudge-auth/index.html', html);

// Deploy to subdomain
await puter.hosting.update('grudge-auth', '/GRUDACHAIN/puter-deploy/grudge-auth');
```

### Option 3: Create New Site

```javascript
// Create new static site
const site = await puter.hosting.create('my-app', '/path/to/files');
console.log('URL:', site.url);
```

---

## Worker Deployment

For **grudge-server** only.

### Method 1: Puppeteer Script (Recommended)

```bash
# From workspace root
node puppeteer-deploy-worker.mjs
```

This script:
1. Reads `puter-deploy/grudge-server/index.js`
2. Uploads to Puter cloud
3. Creates/updates worker
4. Tests health endpoint

### Method 2: Browser Console

```javascript
// 1. Upload worker code
const workerCode = `...your worker code...`;
await puter.fs.write('/GRUDACHAIN/workers/grudge-server.js', workerCode);

// 2. Create worker
const result = await puter.workers.create(
    'grudge-server',
    '/GRUDACHAIN/workers/grudge-server.js'
);
console.log('Deployed:', result.url);

// 3. Wait and test (5-10 seconds)
setTimeout(async () => {
    const health = await fetch(result.url + '/api/health');
    console.log(await health.json());
}, 5000);
```

### Method 3: Update Existing Worker

```javascript
// Just recreate with same name
await puter.workers.create('grudge-server', '/GRUDACHAIN/workers/grudge-server.js');
```

---

## File Locations

### Local (Workspace)

```
workspace/
├── puter-deploy/
│   ├── grudge-auth/
│   │   └── index.html
│   ├── grudge-cloud/
│   │   └── index.html
│   └── grudge-server/
│       └── index.js        ← Worker source
└── puppeteer-deploy-worker.mjs
```

### Puter Cloud

```
/GRUDACHAIN/
├── workers/
│   └── grudge-server.js    ← Deployed worker code
├── puter-deploy/
│   ├── grudge-auth/
│   └── grudge-cloud/
└── grudge-warlords/
    └── assets/
```

---

## Live URLs

| App | Subdomain | URL |
|-----|-----------|-----|
| grudge-studio | grudge-warlords | https://grudge-warlords.puter.site |
| grudge-auth | grudge-auth | https://grudge-auth.puter.site |
| grudge-cloud | grudge-cloud | https://grudge-cloud.puter.site |
| grudge-server | grudge-server | https://grudge-server.puter.work |

---

## Deployment Checklist

### Before Deploy
- [ ] Code tested locally
- [ ] APP_CONFIG URLs correct
- [ ] Puter app context handled
- [ ] Files in `puter-deploy/` updated

### Static Site
1. [ ] Upload to Puter cloud
2. [ ] Run `site:deploy`
3. [ ] Test at `.puter.site` URL

### Worker
1. [ ] Upload `.js` to `/GRUDACHAIN/workers/`
2. [ ] Run `puter.workers.create()`
3. [ ] Wait 5-10 seconds
4. [ ] Test `/api/health`

---

## Quick Deploy Commands

### All Static Sites

```bash
puter shell << 'EOF'
cd /GRUDACHAIN/puter-deploy/grudge-auth && site:deploy . --subdomain=grudge-auth
cd /GRUDACHAIN/puter-deploy/grudge-cloud && site:deploy . --subdomain=grudge-cloud
EOF
```

### Worker Only

```bash
node puppeteer-deploy-worker.mjs
```

### Test All Endpoints

```bash
echo "=== Static Sites ==="
curl -sI https://grudge-auth.puter.site | head -1
curl -sI https://grudge-cloud.puter.site | head -1

echo "=== Worker ==="
curl -s https://grudge-server.puter.work/api/health
```

---

## Troubleshooting

### "Cannot read properties of null"

**Cause:** Calling `puter.auth.signIn()` inside Puter app context.

**Fix:**
```javascript
if (new URLSearchParams(location.search).has('puter.app_instance_id')) {
    const user = await puter.auth.getUser();
} else {
    const user = await puter.auth.signIn();
}
```

### Worker Returns 404

**Cause:** No route defined for path.

**Fix:** Add root route:
```javascript
router.get('/', async () => ({ app: 'My API' }));
```

### Worker Not Updating

**Cause:** Edge cache (5-10 seconds).

**Fix:** Wait and retry. Check file was actually uploaded:
```javascript
const info = await puter.workers.get('grudge-server');
console.log(info.file_path, info.created_at);
```

### Static Site MIME Error

**Cause:** Deploying bundled Vite/React app.

**Fix:** Puter static sites only support plain HTML/CSS/JS. Don't deploy Vite builds directly.
