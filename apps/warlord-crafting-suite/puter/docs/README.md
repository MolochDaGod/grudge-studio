# GRUDGE Warlords - Puter Documentation

Complete documentation for deploying and managing GRUDGE Warlords on Puter.com.

## Live Apps

| App | URL | Type | Purpose |
|-----|-----|------|---------|
| **grudge-studio** | https://grudge-warlords.puter.site | Static | Main frontend |
| **grudge-auth** | https://grudge-auth.puter.site | Static | SSO login hub |
| **grudge-cloud** | https://grudge-cloud.puter.site | Static | Admin storage tool |
| **grudge-server** | https://grudge-server.puter.work | Worker | API & AI backend |

## Documentation Index

### Quick Reference
| Document | Description |
|----------|-------------|
| [Quick Reference](./quick-reference.md) | One-page cheat sheet |

### Deployment & Operations
| Document | Description |
|----------|-------------|
| [Deployment Guide](./deployment-guide.md) | Deploy static sites and workers |
| [Workers Reference](./puter-workers.md) | Serverless functions API |
| [Folder Structure](./folder-structure.md) | Project organization |

### Storage Systems
| Document | Description |
|----------|-------------|
| [Storage Overview](./puter-storage.md) | Complete storage guide |
| [Key-Value Store](./puter-kv.md) | KV database API |
| [File System](./puter-fs.md) | Cloud file operations |

### Authentication & Accounts
| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | GrudgeAccount system |
| [Account Sync](./account-sync.md) | Google Sheets sync |

### Puter APIs
| Document | Description |
|----------|-------------|
| [Platforms](./puter-platforms.md) | Website, App, Node.js, Worker |
| [Hosting](./puter-hosting.md) | Static site deployment |
| [Networking](./puter-networking.md) | CORS-free fetch |
| [UI](./puter-ui.md) | Desktop integration |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GRUDGE Warlords System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│   │ grudge-studio│     │  grudge-auth │     │grudge-cloud│  │
│   │  (Frontend)  │     │    (SSO)     │     │  (Admin)   │  │
│   │  .puter.site │     │  .puter.site │     │ .puter.site│  │
│   └──────┬───────┘     └──────┬───────┘     └─────┬──────┘  │
│          │                    │                   │         │
│          └────────────────────┼───────────────────┘         │
│                               │                              │
│                    ┌──────────▼──────────┐                  │
│                    │    grudge-server    │                  │
│                    │   (API Worker)      │                  │
│                    │   .puter.work       │                  │
│                    └──────────┬──────────┘                  │
│                               │                              │
│          ┌────────────────────┼────────────────────┐        │
│          │                    │                    │        │
│   ┌──────▼──────┐     ┌───────▼──────┐    ┌───────▼─────┐  │
│   │   Puter KV  │     │  Puter FS    │    │  Puter AI   │  │
│   │   Storage   │     │  (Files)     │    │  (GPT-4o)   │  │
│   └─────────────┘     └──────────────┘    └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Puter CLI
```bash
npm install -g puter-cli
puter login --save
```

### 2. Deploy Static Site
```bash
puter shell
cd /GRUDACHAIN/puter-deploy/grudge-auth
site:deploy . --subdomain=grudge-auth
```

### 3. Deploy Worker
```javascript
// In Puter browser console
await puter.fs.write('/GRUDACHAIN/workers/grudge-server.js', workerCode);
await puter.workers.create('grudge-server', '/GRUDACHAIN/workers/grudge-server.js');
```

### 4. Test
```bash
curl https://grudge-server.puter.work/api/health
```

## Key Namespacing

All Puter KV keys use prefixes:

```
grudge_session_*   - Auth sessions (2 hour TTL)
grudge_npc_*       - NPC memory and state
grudge_job_*       - Background job queue
grudge_data_*      - Cached game data
grudge_asset_*     - Asset metadata
```

## Best Practices

### Browser Context
```javascript
await puter.kv.set('key', JSON.stringify(value));
const data = JSON.parse(await puter.kv.get('key'));
```

### Worker Context
```javascript
await me.puter.kv.set('key', JSON.stringify(value));
const data = JSON.parse(await me.puter.kv.get('key'));
```

## Support

- [Puter.js Documentation](https://docs.puter.com)
- [Puter Discord](https://discord.gg/puter)
