# Puter Cloud Storage Sync

Sync all Google Sheets data to Puter cloud storage for backup and cross-app access.

## Overview

The GRUDGE Warlords backend provides a sync service that:
1. Fetches all game data from Google Sheets
2. Caches it in-memory for fast access via `/api/puter/sheets/*`
3. Exports JSON for Puter FS storage via `/api/puter/export`
4. Keeps Google Sheets as the source of truth

**Important:** The backend cannot write directly to Puter FS (requires client-side authentication). Instead, it provides data export endpoints that Puter apps can use to store data in their Puter cloud storage.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google Sheets  │────►│  Replit Backend  │────►│  Puter Apps     │
│  (Source/Truth) │     │  (API + Cache)   │     │  (Client-Side)  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   Puter FS      │
                                                 │  (User Cloud)   │
                                                 └─────────────────┘
```

**Data Flow:**
1. Backend fetches data from Google Sheets (cached 5 min)
2. `/api/puter/export` provides JSON export
3. Puter app fetches export and writes to `puter.fs`
4. Each user's data is stored in their own Puter cloud

## API Endpoints

### Export All Data
```
GET /api/puter/export
```
Returns all sheet data in a format ready for Puter FS storage:
```json
{
  "timestamp": "2025-12-29T12:00:00Z",
  "sheets": {
    "weapons": [...],
    "armor": [...],
    "chef": [...],
    "items": [...],
    "crafting": [...],
    "accounts": [...]
  },
  "meta": {
    "totalItems": 912,
    "sheetCounts": {
      "weapons": 96,
      "armor": 239,
      ...
    }
  }
}
```

### Sync All Sheets
```
POST /api/puter/sync
```
Triggers a full sync of all Google Sheets to the internal store.

### Sync Single Sheet
```
POST /api/puter/sync/:sheetName
```
Syncs a specific sheet (weapons, armor, chef, items, crafting, accounts).

### Get Sync Status
```
GET /api/puter/status
```
Returns current sync status and Puter configuration.

### Get Sheet Data
```
GET /api/puter/sheets/:sheetName
```
Returns data for a specific sheet (syncs if not cached).

### Get Account Schema
```
GET /api/puter/account-schema
```
Returns the GrudgeAccount schema definition for sheets.

### Get Sync Client Code
```
GET /api/puter/sync-client.js
```
Returns JavaScript code for Puter apps to sync data.

## Puter FS Storage Structure

```
grudge/
└── sheets/
    ├── weapons.json      # All weapons data
    ├── armor.json        # All armor data
    ├── chef.json         # Chef recipes
    ├── items.json        # Miscellaneous items
    ├── crafting.json     # Crafting recipes
    ├── accounts.json     # User accounts (no passwords)
    └── meta.json         # Sync metadata
```

## Client-Side Sync (Puter Apps)

Include the sync client in your Puter app:

```html
<script src="https://grudge-warlords.replit.app/api/puter/sync-client.js"></script>
<script>
  // Initial sync
  await GrudgeSync.fetchAndStoreSheets();
  
  // Load specific sheet
  const weapons = await GrudgeSync.loadSheetFromPuter('weapons');
</script>
```

Or copy the sync code manually:

```javascript
const BACKEND_URL = 'https://grudge-warlords.replit.app';
const SHEETS_PATH = 'grudge/sheets';

async function syncToPuter() {
    const response = await fetch(BACKEND_URL + '/api/puter/export');
    const data = await response.json();
    
    await puter.fs.mkdir(SHEETS_PATH, { createMissingParents: true });
    
    for (const [name, items] of Object.entries(data.sheets)) {
        await puter.fs.write(`${SHEETS_PATH}/${name}.json`, JSON.stringify(items));
    }
}
```

## GrudgeAccount Schema

The accounts sheet must match this schema:

| Column | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| A | id | UUID | Yes | Unique account identifier |
| B | username | string | Yes | Login username |
| C | email | string | No | Email address |
| D | displayName | string | No | Public display name |
| E | puterId | string | No | Puter.com user ID |
| F | avatarUrl | URL | No | Profile picture |
| G | isPremium | boolean | No | TRUE/FALSE |
| H | premiumUntil | ISO date | No | Premium expiration |
| I | createdAt | ISO date | Yes | Account creation |
| J | lastLoginAt | ISO date | No | Last login |
| K | settings | JSON | No | User preferences |

**Important:** Password is NEVER stored in Google Sheets (only in PostgreSQL with bcrypt).

## Daily Sync Schedule

For automated daily backups:

1. Set up a cron job or scheduled task
2. Call `POST /api/puter/sync` to refresh internal cache
3. Call `GET /api/puter/export` to get data
4. Use Google Sheets API to write back any changes

Example cron (using a worker or scheduled task):
```javascript
// Daily at midnight
schedule('0 0 * * *', async () => {
    await fetch(BACKEND_URL + '/api/puter/sync', { method: 'POST' });
    console.log('Daily sync complete');
});
```

## Best Practices

1. **Sync on startup**: Call `/api/puter/sync` when your app initializes
2. **Cache locally**: Store sheet data in localStorage for offline access
3. **Use Puter FS for persistence**: Store in `grudge/sheets/` for cloud backup
4. **Google as source of truth**: Manual edits should be made in Google Sheets
5. **Handle errors gracefully**: Fall back to cached data if sync fails
