# Account Sync with SHA Change Detection

Efficient account synchronization system using SHA-256 hashing and batch updates.

## Overview

The account sync system provides:
1. **SHA-based change detection** - Skip writes when data hasn't changed
2. **Batch update queue** - Coalesce changes before writing to Google Sheets
3. **Activity logging** - Track inventory/equipment changes separately

## Architecture

```
User Action → Backend Queue → SHA Check → Batch Write → Google Sheets
                    ↓
            Activity Buffer
                    ↓
            Puter KV/FS (per-user logs)
```

## Data Storage Strategy

| Data Type | Storage | Update Frequency | Reason |
|-----------|---------|------------------|--------|
| Account profiles | Google Sheet | On change (SHA check) | Low churn, auditable |
| Inventory changes | Puter KV queue | Immediate | High churn, per-user |
| Equipment acquired | Puter FS logs | Append-only | Historical record |
| Activity summary | Backend buffer | In-memory | Real-time display |

## API Endpoints

### Queue Account Update
```
POST /api/sync/account
```

### Force Flush Changes
```
POST /api/sync/flush
```

### Log Activity
```
POST /api/sync/activity
```

Valid actions: `item_acquired`, `item_sold`, `equipment_changed`, `inventory_update`, `skill_unlocked`, `level_up`

## SHA Change Detection Benefits

- **90%+ reduction** in redundant Google Sheets writes
- **Faster response times** - No waiting for API calls on unchanged data
- **Rate limit friendly** - Stay well under Google's 60 writes/minute

## Batch Update Queue

```javascript
const BATCH_DELAY_MS = 30000;  // 30 seconds
const MAX_BATCH_SIZE = 50;     // Max accounts per batch
```

Multiple updates to the same account within the batch window are merged.
