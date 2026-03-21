# GRUDGE Warlords - Puter Deployment Package

This folder contains everything needed to deploy companion apps or connect external projects to the GRUDGE Warlords backend.

## What's Included

| File/Folder | Purpose |
|-------------|---------|
| `index.html` | **Main Puter app** - deployable frontend with auth, KV storage, UUID/SHA utilities |
| `sprite-analyzer.html` | **AI Sprite Tool** - analyze sprite sheets with Puter's free AI |
| `puter.config.json` | Puter.com app manifest (v2.5.0) |
| `env.example` | Required environment variables template |
| `api/client.ts` | API client for all endpoints |
| `storage/object-storage.ts` | Object storage access helper |
| `scripts/health-check.ts` | Verify connections are working |

## Quick Start

### 1. Copy Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp puter/env.example .env
```

### 2. Required Secrets

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Replit Secrets tab |
| `YOUR_APP_URL` | Published app URL | After publishing (e.g., `https://api.grudge-studio.com`) |
| `OBJECT_STORAGE_BUCKET` | Replit object storage bucket ID | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` secret |

### 3. Install Dependencies

```bash
npm install drizzle-orm pg dotenv
```

## Connection Options

### Option A: Direct Database Access
Use when you need full read/write access to all data.

1. Copy `schema.ts` from this folder to your project
2. Copy `server/db.ts` from the main project
3. Install dependencies: `npm install drizzle-orm pg`

```typescript
import { db } from './db';
import { users, characters } from './schema';

const allUsers = await db.select().from(users);
```

### Option B: REST API Access
Use when you want to access data through HTTP endpoints.

```typescript
import { GrudgeAPI } from './api/client';

const api = new GrudgeAPI();
const weapons = await api.getWeapons();
const characters = await api.getCharacters('user-id-here'); // userId required
```

### Option C: Object Storage Access
Use when you need game art assets (images, icons).

```typescript
import { GrudgeStorage } from './storage/object-storage';

const storage = new GrudgeStorage();
// Assets are served via /objects route
const imageUrl = storage.getAssetUrl('public/weapons/sword-iron.png');

// Upload new assets
const { uploadURL, objectPath } = await storage.requestUploadUrl('my-image.png');
```

## Centralized Login URL

Use this URL to authenticate users across all GRUDGE apps:

```
https://YOUR_WARLORDS_APP.replit.app/login?return_url=YOUR_APP_URL&app_id=YOUR_APP_NAME
```

After login, users are redirected back with a token that can be exchanged for user data.

See `docs/authentication.md` for the complete integration guide.

## Documentation

### Integration Guides
| Doc | Purpose |
|-----|---------|
| `docs/authentication.md` | Login/registration system, cross-app auth flow |
| `docs/google-sheets-accounts.md` | Cross-app account sync via Google Sheets |

### Puter.js API Reference
| Doc | Purpose |
|-----|---------|
| `docs/puter-fs.md` | Cloud file storage (read, write, upload, directories) |
| `docs/puter-kv.md` | Key-value store (set, get, incr, decr, list) |
| `docs/puter-workers.md` | Serverless functions (router, API endpoints) |
| `docs/puter-hosting.md` | Website deployment (create, update, delete sites) |
| `docs/puter-networking.md` | CORS-free fetch, TCP/TLS sockets |
| `docs/puter-ui.md` | Desktop integration (windows, dialogs, pickers) |
| `docs/puter-apps.md` | App management (create, update, metadata) |
| `docs/puter-storage-sync.md` | Google Sheets to Puter cloud sync |
| `docs/puter-frameworks.md` | React, Next.js, Vue, etc. integration guide |
| `docs/puter-platforms.md` | Websites, Puter Apps, Node.js, Workers |
| `docs/account-sync.md` | SHA change detection and batch updates |

## API Endpoints Reference

### Game Data (Google Sheets - cached 5 min)
- `GET /api/sheets/weapons` - 96 weapons with stats
- `GET /api/sheets/armor` - 239 armor pieces
- `GET /api/sheets/chef` - 240 chef recipes
- `GET /api/sheets/items` - 97 misc items
- `GET /api/sheets/crafting` - All crafting recipes
- `GET /api/sheets/accounts` - All accounts (cross-app sync)
- `GET /api/sheets/accounts/:id` - Single account by ID
- `GET /api/sheets/status` - Cache status for all sheets

### Authentication (Cross-App)
- `GET /login` - Centralized login page (accepts return_url, app_id, mode params)
- `POST /api/auth/exchange` - Exchange login token for user data
- `GET /api/auth/verify` - Verify token is valid

### Characters
- `GET /api/characters` - List all characters
- `GET /api/characters/:id` - Get character by ID
- `POST /api/characters` - Create character

### Skills
- `GET /api/skills/:characterId` - Get unlocked skills
- `POST /api/skills/unlock` - Unlock a skill node

### Shop
- `POST /api/shop/buy-recipe` - Purchase recipe
- `POST /api/shop/buy-material` - Buy materials
- `POST /api/shop/sell-material` - Sell materials
- `POST /api/shop/sell-item` - Sell crafted item
- `GET /api/shop/transactions/:characterId` - Transaction history

### Puter Cloud Sync
- `GET /api/puter/export` - Full data export for Puter FS
- `POST /api/puter/sync` - Sync all sheets to internal store
- `POST /api/puter/sync/:sheetName` - Sync single sheet
- `GET /api/puter/status` - Get sync status
- `GET /api/puter/sheets/:sheetName` - Get synced sheet data
- `GET /api/puter/account-schema` - GrudgeAccount schema definition
- `GET /api/puter/sync-client.js` - Client-side sync code for Puter apps

### Account Sync (SHA Change Detection)
- `POST /api/sync/account` - Queue account update with SHA check
- `POST /api/sync/flush` - Force flush pending changes to sheets
- `POST /api/sync/activity` - Log activity event (item_acquired, etc.)
- `GET /api/sync/activity/:accountId` - Get recent activity for account
- `GET /api/sync/status` - Get sync queue status
- `GET /api/sync/activity-client.js` - Puter activity logging code

### Inventory & Crafting
- `GET /api/inventory/:characterId` - Get inventory items
- `POST /api/inventory` - Add inventory item
- `GET /api/crafted-items/:characterId` - Get crafted items
- `GET /api/recipes/:characterId` - Get unlocked recipes
- `POST /api/craft` - Craft an item
- `POST /api/upgrade` - Upgrade item tier

### Object Storage
- `POST /api/uploads/request-url` - Get presigned upload URL
- `GET /objects/:path` - Retrieve stored objects

## Database Schema

The database includes these tables:

| Table | Description |
|-------|-------------|
| `users` | GrudgeAccounts with cross-app fields |
| `characters` | Player characters per profession |
| `unlocked_skills` | Skill tree progress |
| `inventory_items` | Materials and resources |
| `crafted_items` | Crafted weapons/armor/potions |
| `unlocked_recipes` | Purchased/unlocked recipes |
| `shop_transactions` | Buy/sell history |
| `islands` | Future: Island building |
| `battle_history` | Future: Combat records |
| `account_assets` | Future: Cross-game assets |

Copy `../shared/schema.ts` for full Drizzle schema definitions.

## Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     GRUDGE Warlords Architecture                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚   PUTER.COM (Static Client)          REPLIT (Backend Server)   â”‚
â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚   â”‚  puter/index.html       â”‚        â”‚  Express.js (port 5000) â”‚â”‚
â”‚   â”‚  â”œâ”€ puter.auth          â”‚  HTTP  â”‚  â”œâ”€ /api/auth/*         â”‚â”‚
â”‚   â”‚  â”œâ”€ puter.kv            â”‚â—„â”€â”€â”€â”€â”€â”€â–ºâ”‚  â”œâ”€ /api/sheets/*       â”‚â”‚
â”‚   â”‚  â”œâ”€ UUID/SHA utilities  â”‚        â”‚  â”œâ”€ /api/characters/*   â”‚â”‚
â”‚   â”‚  â””â”€ GrudgeAccount link  â”‚        â”‚  â””â”€ /api/shop/*         â”‚â”‚
â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                  â”‚              â”‚
â”‚                                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚                                      â”‚  PostgreSQL + Google    â”‚â”‚
â”‚                                      â”‚  Sheets + Object Storageâ”‚â”‚
â”‚                                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Why this split?** Puter.com is static-only hosting with built-in APIs. It cannot run Express servers, open custom ports, or connect to PostgreSQL. The backend must run on Replit (or any Node.js host) where we control the server process.

## Puter CLI Deployment

### Quick Deploy Commands

```bash
# Install Puter CLI
npm install -g puter-cli

# Login to Puter
puter login --save

# Build the app
npx tsx puter/deploy/build.ts

# Deploy to Puter (choose one)
puter app:create grudge-warlords ./puter-deploy              # First time
puter app:update grudge-warlords ./puter-deploy              # Update existing
puter site:create grudge-warlords ./puter-deploy --subdomain=grudge-warlords  # Static site
```

### Deploy Scripts

| Script | Purpose |
|--------|---------|
| `npx tsx puter/deploy/build.ts` | Build production + create deploy package |
| `npx tsx puter/deploy/auto-deploy.ts` | Auto-deploy with PUTER_API_KEY |

### AI Agents

| Agent | Purpose |
|-------|---------|
| `puter/agents/assetManager.ts` | AI-powered asset analysis, sprite detection, import/organize |
| `puter/agents/dataOrganizer.ts` | Recipe validation, data categorization, balance checking |

### Cloud Sync

| Module | Purpose |
|--------|---------|
| `puter/sync/cloudSync.ts` | Sync KV â†” Cloud storage, backups, exports |

### Serverless Worker

| File | Purpose |
|------|---------|
| `puter/workers/grudge-api.ts` | Serverless API endpoints for data, assets, AI |

## Puter.com Deployment

Puter.com offers free hosting with:
- Serverless static web apps
- Built-in OAuth (PuterID) via `puter.auth`
- KV storage via `puter.kv` for cross-app data
- Free AI access via `puter.ai`

### Deploy Steps:

1. Create account at [puter.com](https://puter.com)
2. Create new app from dashboard
3. Upload `index.html` (the main deployable file)
4. **Set `BACKEND_URL`** to your published Replit app (e.g., `https://api.grudge-studio.com`)

### Puter.js Features Used

The `index.html` uses these Puter.js APIs:

| API | Purpose |
|-----|---------|
| `puter.auth.signIn()` | Sign in with Puter account |
| `puter.auth.getUser()` | Get current user info (uuid, username) |
| `puter.auth.isSignedIn()` | Check auth status |
| `puter.kv.set(key, value)` | Store data in Puter KV |
| `puter.kv.get(key)` | Retrieve data from KV |
| `puter.kv.del(key)` | Delete KV entry |

### UUID & SHA-256 Utilities

The app includes Web Crypto API utilities:
- `generateUUID()` - Uses `crypto.randomUUID()` with fallback
- `sha256(message)` - Uses `crypto.subtle.digest('SHA-256', ...)`

### GrudgeAccount Linking

Users can link their Puter account to a GrudgeAccount:
1. Sign in with Puter
2. Enter GrudgeAccount credentials OR create new account
3. Link is stored in `puter.kv` as `grudge_linked_account_{puterId}`

This enables cross-app authentication across all GRUDGE apps.

## Centralized Authentication Service

The Puter-hosted `index.html` can act as a **centralized auth endpoint** for all GRUDGE services.

### Auth Redirect URL Format

```
https://YOUR-PUTER-APP.puter.site/?return_url=YOUR_APP&app_id=YOUR_APP_NAME&mode=login&state=OPTIONAL_STATE
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `return_url` | Yes | URL to redirect after auth (must be whitelisted) |
| `app_id` | No | Display name shown to user ("Signing in to: X") |
| `mode` | No | `login` (default) or `register` |
| `state` | No | Opaque value returned after auth (CSRF protection) |

### Integration Example

```javascript
// In your external GRUDGE app
const authUrl = new URL('https://grudge-auth.puter.site/');
authUrl.searchParams.set('return_url', window.location.origin + '/auth/callback');
authUrl.searchParams.set('app_id', 'GRUDGE Island Builder');
authUrl.searchParams.set('mode', 'login');
authUrl.searchParams.set('state', generateRandomState());

// Redirect user to auth
window.location.href = authUrl.toString();
```

### Callback Response

After successful auth, user is redirected to `return_url` with:
- `token` - One-time auth token (10 min expiry)
- `user_id` - User's GrudgeAccount ID
- `username` - User's username
- `state` - Echo of your state parameter

### Exchange Token for User Data

```javascript
// On your callback page
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const response = await fetch('https://api.grudge-studio.com/api/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
});

const { user } = await response.json();
// user = { id, username, displayName, email, avatarUrl, isPremium }
```

### Whitelisted Origins

Only these origins can receive auth redirects:
- `*.replit.app`, `*.replit.dev`
- `*.puter.site`, `*.puter.com`
- `localhost`, `127.0.0.1`

See `puter.config.json` for app manifest configuration.

## Troubleshooting

### Connection Failed
- Check DATABASE_URL is correct
- Ensure Replit app is running/published
- Verify secrets are set in your project

### API Returns Empty
- Check YOUR_APP_URL points to published app
- Google Sheets may need GOOGLE_SHEET_* secrets configured

### Object Storage 403 Error
- Verify OBJECT_STORAGE_BUCKET is correct
- Check asset path exists in bucket

## Environment Variables (Puter Integration)

These environment variables are used by the **Replit backend** (not Puter static apps):

| Variable | Description | Used By |
|----------|-------------|---------|
| `PUTER_CLOUD_URL` | Full URL to your Puter-hosted app (e.g., `https://grudge-warlords.puter.site`) | Backend only |
| `PUTER_CLOUD_INDEX` | Path to the main index file (default: `index.html`) | Backend only |
| `PUTER_APP_ID` | Your Puter app identifier | Backend only |

**Note:** Puter static apps run in the browser and cannot access `process.env`. For browser configuration:
- Use `puter.kv` to store settings
- Use query parameters for dynamic values
- Hardcode URLs in the static HTML/JS files
- Use build-time substitution if using a bundler

### Best Practices

1. **Use KV for cross-app data**: Store linked accounts in `puter.kv` with consistent key prefixes
2. **Validate return URLs**: Only whitelist known origins for auth redirects
3. **Handle offline gracefully**: Fall back to localStorage when Puter is unavailable
4. **Use puter.fs for user files**: Cloud storage with automatic CDN
5. **Leverage free AI**: Use `puter.ai.chat()` for image analysis, text generation
6. **Keep config in localStorage**: Store backend URL in localStorage for user-configurable settings

---
Version: 2.5.0
Generated: 2025-12-29

Branding: "Powered By Grudge Studio" with referral link (T3SIA5X4).

## Referral Program

New users are directed to create accounts via the GRUDGE referral link:
- `https://puter.com/?r=T3SIA5X4`

This is included in:
- "Powered By Grudge Studio" footer link
- "Create Grudge Account" button for new users

Note: Only admin pages show "Powered by Puter" - all user-facing pages show "Powered By Grudge Studio".
