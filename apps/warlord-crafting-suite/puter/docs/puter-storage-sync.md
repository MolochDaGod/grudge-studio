# Puter Cloud Storage Sync

Sync all Google Sheets data to Puter cloud storage for backup and cross-app access.

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

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/puter/export` | Export all sheet data as JSON |
| `POST /api/puter/sync` | Trigger full sync of all sheets |
| `POST /api/puter/sync/:sheetName` | Sync specific sheet |
| `GET /api/puter/status` | Get sync status |
| `GET /api/puter/sheets/:sheetName` | Get sheet data |

## Puter FS Storage Structure

```
grudge/
└── sheets/
    ├── weapons.json
    ├── armor.json
    ├── chef.json
    ├── items.json
    ├── crafting.json
    ├── accounts.json
    └── meta.json
```

## Client-Side Sync

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

## Best Practices

1. **Sync on startup**: Call `/api/puter/sync` when app initializes
2. **Cache locally**: Store in localStorage for offline access
3. **Use Puter FS for persistence**: Store in `grudge/sheets/`
4. **Google as source of truth**: Manual edits in Google Sheets
