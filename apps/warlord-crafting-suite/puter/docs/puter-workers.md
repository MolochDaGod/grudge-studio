# Puter Workers Reference

Complete guide to serverless JavaScript functions on Puter.

## Overview

Workers are serverless functions that run on Puter's edge network. Unlike static sites, workers execute JavaScript on the server and can access Puter APIs.

| Feature | Static Site | Worker |
|---------|-------------|--------|
| URL | `.puter.site` | `.puter.work` |
| Execution | Client-side | Server-side |
| Storage | User's account | Developer's account |
| Use Case | UI, forms | API, AI, jobs |

## Deployment

### Step 1: Upload Worker Code

```javascript
// In Puter browser console
const workerCode = `
router.get('/api/health', async () => {
    return { status: 'healthy' };
});
`;

await puter.fs.write('/path/to/worker.js', workerCode);
```

### Step 2: Create Worker

```javascript
const result = await puter.workers.create('my-worker', '/path/to/worker.js');
console.log('URL:', result.url); // https://my-worker.puter.work
```

### Step 3: Test

```bash
curl https://my-worker.puter.work/api/health
```

## Worker Management

```javascript
// List all workers
const workers = await puter.workers.list();

// Get specific worker
const worker = await puter.workers.get('my-worker');
console.log(worker.url, worker.file_path);

// Update worker (recreate with same name)
await puter.workers.create('my-worker', '/path/to/updated.js');

// Delete worker
await puter.workers.delete('my-worker');
```

---

## Router API

Workers define endpoints using the global `router` object.

### GET Requests

```javascript
router.get('/api/hello', async () => {
    return { message: 'Hello, World!' };
});

// With query parameters
router.get('/api/search', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    return { query, results: [] };
});
```

### POST Requests

```javascript
router.post('/api/data', async ({ request }) => {
    const body = await request.json();
    return { received: body };
});
```

### URL Parameters

```javascript
router.get('/api/users/:userId', async ({ params }) => {
    const { userId } = params;
    return { userId };
});

router.get('/api/items/:category/:itemId', async ({ params }) => {
    const { category, itemId } = params;
    return { category, itemId };
});
```

### Custom Responses

```javascript
router.get('/api/error', async () => {
    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
});

router.get('/api/redirect', async () => {
    return new Response(null, {
        status: 302,
        headers: { 'Location': 'https://example.com' }
    });
});
```

### Wildcard Routes

```javascript
router.get('/*path', async ({ params }) => {
    return { path: params.path };
});
```

---

## Runtime Globals

Workers have access to these global objects:

| Global | Description |
|--------|-------------|
| `router` | Express-like router |
| `me` | Developer context |
| `me.puter` | Puter APIs (KV, FS, AI) |
| `user` | User context (if authenticated) |
| `Response` | Fetch API Response |
| `crypto` | Crypto utilities |
| `console` | Logging |

### Developer Resources (me.puter)

Use `me.puter` for developer-owned storage:

```javascript
// KV Store - ALWAYS stringify/parse JSON
await me.puter.kv.set('key', JSON.stringify({ data: true }));
const data = JSON.parse(await me.puter.kv.get('key'));

// File System
await me.puter.fs.write('/path/file.json', JSON.stringify(data));
const blob = await me.puter.fs.read('/path/file.json');
const content = await blob.text();

// AI Chat
const response = await me.puter.ai.chat('Hello!');
```

---

## GRUDGE Server Endpoints

The `grudge-server` worker provides these APIs:

### Health & Info

```
GET /                    → App info and endpoint list
GET /api/health          → Service status
```

### Authentication

```
POST /api/auth/consume   → Exchange auth code for session
GET  /api/auth/verify    → Verify session token
```

### AI Features

```
POST /api/ai/chat        → Chat with AI (requires auth)
POST /api/ai/vision      → Analyze image with AI (requires auth)
```

### Sprites

```
POST /api/sprites/generate  → Generate sprite (queues job)
GET  /api/jobs/:jobId       → Check job status
GET  /api/jobs              → List all jobs
```

### Game Data

```
GET  /api/data/game         → All game data
GET  /api/data/:dataType    → Specific data (weapons, armor, etc)
POST /api/data/sync         → Sync data to KV store
```

### NPC System

```
POST /api/npc/chat          → Chat with AI NPC (memory persists)
```

---

## Example: Complete Worker

```javascript
/**
 * Example Puter Worker
 */

/* global router, me, Response */

// Root route
router.get('/', async () => {
    return {
        app: 'My API',
        version: '1.0.0',
        endpoints: ['GET /api/health', 'GET /api/data', 'POST /api/data']
    };
});

// Health check
router.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Get data from KV
router.get('/api/data', async () => {
    try {
        const raw = await me.puter.kv.get('my_data');
        const data = raw ? JSON.parse(raw) : { items: [] };
        return { success: true, data };
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

// Save data to KV
router.post('/api/data', async ({ request }) => {
    try {
        const body = await request.json();
        await me.puter.kv.set('my_data', JSON.stringify(body));
        return { success: true, saved: body };
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

// Catch-all 404
router.get('/*path', async ({ params }) => {
    return new Response(JSON.stringify({
        error: 'Not found',
        path: '/' + (params.path || '')
    }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
});

console.log('Worker initialized');
```

---

## Common Issues

### "Path not found" on root

Workers need explicit route for `/`:

```javascript
router.get('/', async () => {
    return { app: 'My API' };
});
```

### JSON not saved correctly

Always stringify before saving:

```javascript
// WRONG
await me.puter.kv.set('data', { key: 'value' });

// CORRECT
await me.puter.kv.set('data', JSON.stringify({ key: 'value' }));
```

### Worker not updating

Workers cache for a few seconds. Wait 5-10 seconds after deploy.

### CORS errors

Workers automatically handle CORS. If issues persist, add headers:

```javascript
return new Response(JSON.stringify(data), {
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
});
```
