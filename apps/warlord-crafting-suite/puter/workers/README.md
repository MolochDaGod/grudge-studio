# GRUDGE Warlords Puter Workers

Serverless API endpoints deployed on Puter's edge network.

## Available Endpoints

### Health & Status
- `GET /api/health` - Service health check
- `GET /api/sync/status` - Get sync status

### Game Data
- `GET /api/data/:type` - Get data (recipes, materials, weapons, armor, items)
- `POST /api/data/:type` - Save data to KV and cloud

### Assets
- `GET /api/assets/list/:category` - List assets in category
- `GET /api/assets/catalog` - Get full asset catalog

### AI Features
- `POST /api/ai/analyze-asset` - Analyze game asset with AI
- `POST /api/ai/validate-recipe` - Validate recipe balance
- `POST /api/ai/generate-description` - Generate item description

### Backup & Sync
- `POST /api/backup/create` - Create backup
- `GET /api/backup/list` - List backups
- `POST /api/sync/kv-to-cloud` - Sync KV to cloud storage

## Deployment

```bash
# Login to Puter CLI
puter login --save

# Deploy the worker
puter worker:deploy grudge-api ./puter/workers/grudge-api.ts
```

## Usage Examples

```javascript
// Health check
const health = await fetch('https://grudge-api.puter.site/api/health');

// Get weapons data
const weapons = await fetch('https://grudge-api.puter.site/api/data/weapons');

// Analyze asset with AI
const analysis = await fetch('https://grudge-api.puter.site/api/ai/analyze-asset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'A glowing blue sword with ice crystals' })
});

// Create backup
const backup = await fetch('https://grudge-api.puter.site/api/backup/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'my-backup' })
});
```
