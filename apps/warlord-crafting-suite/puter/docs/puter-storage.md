# Puter Storage Systems

Complete guide to storage options in GRUDGE Warlords.

## Storage Overview

| System | Best For | Persistence | Access |
|--------|----------|-------------|--------|
| **KV Store** | Sessions, counters, small JSON | Permanent | By key |
| **File System** | Images, large files, exports | Permanent | By path |
| **Object Storage** | CDN assets, sprites, media | Permanent | By URL |

## 1. Key-Value Store (KV)

Fast, simple key-value storage for structured data.

### When to Use
- User sessions and auth tokens
- Game state and preferences
- Counters and statistics
- Small JSON objects (<1MB)

### API Reference

```javascript
// SET - Store a value
await puter.kv.set('key', 'value');
await puter.kv.set('user_data', JSON.stringify({ name: 'Hero', level: 10 }));

// GET - Retrieve a value
const value = await puter.kv.get('key');
const data = JSON.parse(await puter.kv.get('user_data') || 'null');

// DELETE - Remove a key
await puter.kv.del('key');

// LIST - Find keys by pattern
const allKeys = await puter.kv.list();
const sessionKeys = await puter.kv.list('grudge_session_*');
const withValues = await puter.kv.list('grudge_*', true);

// INCREMENT/DECREMENT - Atomic counters
const newCount = await puter.kv.incr('login_count');
const remaining = await puter.kv.decr('lives');
```

### Worker Context

In workers, use `me.puter.kv` for developer-owned data:

```javascript
router.get('/api/sessions', async () => {
    const sessions = await me.puter.kv.list('grudge_session_*', true);
    return { count: sessions.length };
});
```

### GRUDGE Key Namespaces

| Prefix | Purpose | Example |
|--------|---------|---------|
| `grudge_session_` | Auth sessions | `grudge_session_abc123` |
| `grudge_npc_` | NPC memory | `grudge_npc_blacksmith_memory` |
| `grudge_job_` | Job queue | `grudge_job_sprite_gen_456` |
| `grudge_data_` | Cached data | `grudge_data_weapons` |
| `grudge_asset_` | Asset metadata | `grudge_asset_sword_iron` |

---

## 2. File System (FS)

Cloud file storage for documents, images, and exports.

### When to Use
- Uploaded images and sprites
- JSON exports and backups
- User-generated content
- Large data files (>1MB)

### API Reference

```javascript
// WRITE - Save a file
await puter.fs.write('path/file.txt', 'content');
await puter.fs.write('data.json', JSON.stringify(data));
await puter.fs.write('image.png', imageBlob, { dedupeName: true });
await puter.fs.write('deep/path/file.txt', content, { createMissingParents: true });

// READ - Load a file
const blob = await puter.fs.read('path/file.txt');
const text = await blob.text();
const json = JSON.parse(await (await puter.fs.read('data.json')).text());

// MKDIR - Create directory
await puter.fs.mkdir('sprites');
await puter.fs.mkdir('assets/sprites/chars', { createMissingParents: true });

// READDIR - List contents
const items = await puter.fs.readdir('sprites');
items.forEach(item => {
    console.log(`${item.name} - ${item.is_dir ? 'Dir' : 'File'}`);
});

// FILE OPERATIONS
await puter.fs.rename('old.txt', 'new.txt');
await puter.fs.copy('source.txt', 'dest/');
await puter.fs.move('source.txt', 'dest/');
await puter.fs.delete('unwanted.txt');

// STAT - Get file info
const info = await puter.fs.stat('file.json');
console.log(`Size: ${info.size}, Created: ${info.created}`);
```

### Error Handling

```javascript
try {
    const content = await puter.fs.read('missing.txt');
} catch (error) {
    if (error.code === 'subject_does_not_exist') {
        console.log('File not found');
    }
}
```

### GRUDGE Directory Structure

```
/GRUDACHAIN/
├── workers/
│   └── grudge-server.js      # Worker code
├── grudge-warlords/
│   └── assets/
│       ├── sprites/          # Generated sprites
│       ├── icons/            # UI icons
│       └── backgrounds/      # Scene backgrounds
├── exports/
│   ├── accounts.json         # Account backup
│   └── game-data.json        # Game data export
└── puter-deploy/
    ├── grudge-auth/
    ├── grudge-cloud/
    └── grudge-server/
```

---

## 3. Object Storage

CDN-backed storage for public assets with direct URLs.

### When to Use
- Public game assets (sprites, icons)
- Media files served to users
- Static content with caching

### Integration with Replit

GRUDGE uses Replit Object Storage for primary asset hosting:

```javascript
// Environment variables
process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
process.env.PUBLIC_OBJECT_SEARCH_PATHS
process.env.PRIVATE_OBJECT_DIR
```

### Puter Cloud Backup

Sync assets to Puter for redundancy:

```javascript
// Upload asset to Puter cloud
const assetUrl = 'https://storage.replit.com/...';
const response = await fetch(assetUrl);
const blob = await response.blob();
await puter.fs.write('/grudge-warlords/assets/sprite.png', blob);
```

---

## Storage Best Practices

### 1. Always Serialize JSON

```javascript
// WRONG - stores [object Object]
await puter.kv.set('data', { name: 'Hero' });

// CORRECT - stores valid JSON string
await puter.kv.set('data', JSON.stringify({ name: 'Hero' }));
```

### 2. Handle Missing Data

```javascript
// Safe parsing with fallback
const raw = await puter.kv.get('maybe_missing');
const data = raw ? JSON.parse(raw) : { default: true };
```

### 3. Use Namespaced Keys

```javascript
// WRONG - generic key
await puter.kv.set('session', token);

// CORRECT - namespaced key
await puter.kv.set(`grudge_session_${sessionId}`, JSON.stringify(session));
```

### 4. Browser vs Worker Context

```javascript
// Browser (frontend apps)
await puter.kv.set('key', value);

// Worker (API server) - use me.puter
await me.puter.kv.set('key', value);
```

### 5. Atomic Operations for Counters

```javascript
// WRONG - race condition
const count = await puter.kv.get('count');
await puter.kv.set('count', parseInt(count) + 1);

// CORRECT - atomic increment
await puter.kv.incr('count');
```

---

## Migration & Backup

### Export KV to JSON

```javascript
async function exportKV(prefix = 'grudge_') {
    const items = await puter.kv.list(prefix + '*', true);
    const data = {};
    for (const [key, value] of items) {
        data[key] = JSON.parse(value);
    }
    await puter.fs.write('exports/kv-backup.json', JSON.stringify(data, null, 2));
}
```

### Import JSON to KV

```javascript
async function importKV(filepath) {
    const blob = await puter.fs.read(filepath);
    const data = JSON.parse(await blob.text());
    for (const [key, value] of Object.entries(data)) {
        await puter.kv.set(key, JSON.stringify(value));
    }
}
```

### Sync FS to Local

```bash
# Using Puter CLI
puter shell
pull /GRUDACHAIN/exports/ ./local-backup/
```
