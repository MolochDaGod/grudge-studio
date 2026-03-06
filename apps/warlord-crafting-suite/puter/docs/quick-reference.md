# GRUDGE Puter Quick Reference

One-page reference for common operations.

## Live URLs

```
https://grudge-warlords.puter.site  → Main frontend
https://grudge-auth.puter.site      → SSO login
https://grudge-cloud.puter.site     → Admin tool
https://grudge-server.puter.work    → API worker
```

## CLI Commands

```bash
# Login
puter login --save

# Enter shell
puter shell

# Upload files
update ./local-dir cloud-dir

# Deploy static site
site:deploy . --subdomain=my-app

# List sites
sites

# List files
ls /GRUDACHAIN/
```

## Puter.js (Browser)

### KV Store

```javascript
// Save
await puter.kv.set('key', JSON.stringify(data));

// Load
const data = JSON.parse(await puter.kv.get('key') || 'null');

// Delete
await puter.kv.del('key');

// List
const keys = await puter.kv.list('prefix_*');
```

### File System

```javascript
// Write
await puter.fs.write('path/file.json', JSON.stringify(data));

// Read
const blob = await puter.fs.read('path/file.json');
const data = JSON.parse(await blob.text());

// List directory
const items = await puter.fs.readdir('path');
```

### Workers

```javascript
// Deploy
await puter.fs.write('/path/worker.js', code);
const result = await puter.workers.create('name', '/path/worker.js');

// List
const workers = await puter.workers.list();

// Get info
const worker = await puter.workers.get('name');

// Delete
await puter.workers.delete('name');
```

### Auth

```javascript
// Check if in Puter app
const isPuterApp = location.search.includes('puter.app_instance_id');

// Get current user
const user = await puter.auth.getUser();

// Sign in (not in app context)
const user = await puter.auth.signIn();
```

## Worker Context

```javascript
// Use me.puter for developer resources
await me.puter.kv.set('key', JSON.stringify(value));
await me.puter.fs.write('path', content);
const response = await me.puter.ai.chat('prompt');
```

## Key Namespaces

```
grudge_session_*   → Auth sessions
grudge_npc_*       → NPC memory
grudge_job_*       → Background jobs
grudge_data_*      → Cached data
grudge_asset_*     → Asset metadata
```

## API Endpoints

```
GET  /                      → App info
GET  /api/health            → Health check
POST /api/auth/consume      → Exchange auth code
GET  /api/auth/verify       → Verify session
POST /api/ai/chat           → AI chat
POST /api/ai/vision         → AI image analysis
POST /api/sprites/generate  → Generate sprite
GET  /api/jobs/:id          → Job status
GET  /api/data/game         → All game data
POST /api/npc/chat          → NPC conversation
```

## Deploy Commands

```bash
# Static sites
puter shell
site:deploy /GRUDACHAIN/puter-deploy/grudge-auth --subdomain=grudge-auth

# Worker (from workspace)
node puppeteer-deploy-worker.mjs

# Test
curl https://grudge-server.puter.work/api/health
```

## Common Fixes

| Problem | Solution |
|---------|----------|
| Worker returns 404 | Add `router.get('/', ...)` route |
| JSON stored as [object Object] | Use `JSON.stringify()` |
| Auth fails in Puter app | Use `getUser()` not `signIn()` |
| Worker not updating | Wait 5-10 seconds, check file path |
