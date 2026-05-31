# Grudge Studio Monorepo

Unified repository for Grudge Studio game development — the core `grudge-warlords` app, battle arena, crafting tools, and shared packages.

Created by **Racalvin The Pirate King**.

## Production Stack

- **Frontend (Vercel)**: Warlord Crafting Suite + static web apps
- **Backend (Railway)**: Express API server + Colyseus WebSocket
- **DNS / CDN / R2 (Cloudflare)**: `grudge-studio.com` subdomains, asset storage, Workers
- **Database**: PostgreSQL via Drizzle ORM (Railway)
- **Cloud Storage / Auth SDK**: Puter.js (user-pays model)
- **Static Game Data**: ObjectStore on GitHub Pages

## Live Deployments

- **Game API**: https://api.grudge-studio.com
- **Auth**: https://id.grudge-studio.com
- **Dashboard**: https://dash.grudge-studio.com
- **Assets CDN**: https://assets.grudge-studio.com (Cloudflare R2)
- **ObjectStore**: https://molochdagod.github.io/ObjectStore/
- **Game (WCS)**: https://warlord-crafting-suite.vercel.app
- **WebSocket**: wss://ws.grudge-studio.com

## Project Structure

```
grudge-studio/
├── apps/
│   ├── warlord-crafting-suite/      # Main game app (React 19 + Express)
│   │   ├── client/                  # React frontend (20+ pages)
│   │   └── server/                  # Express API server
│   │       ├── routes.ts            # Game routes (2400+ lines)
│   │       ├── routes/gameData.ts   # ObjectStore dataset API
│   │       ├── routes/github.ts     # GitHub repo management API
│   │       ├── lib/objectStore.ts   # ObjectStore fetch + cache
│   │       ├── lib/githubApp.ts     # GitHub App/PAT client
│   │       └── storage.ts           # Drizzle ORM data layer
│   ├── battle-arena-client/         # PvP arena frontend (Colyseus)
│   ├── battle-arena-server/         # PvP arena backend (Colyseus WebSocket)
│   ├── mage-arena/                  # 2D combat game (Phaser 3, R2 sprites)
│   └── grudge-crafting/             # Standalone crafting tool (Puter deploy)
│
├── api/
│   └── grudge-builder/              # Vercel serverless API functions
│
├── packages/
│   ├── shared/                      # Zod schemas, types, profession utils
│   ├── combat/                      # Combat engine — AI, weapons, effects, input
│   ├── database/                    # Drizzle ORM + PostgreSQL (16 tables)
│   ├── auth/                        # JWT token utilities
│   ├── game-client/                 # Colyseus client helpers
│   ├── google-sheets-sync/          # Google Sheets data sync
│   ├── puter-sync/                  # Puter cloud storage sync
│   └── ui-components/               # Shared React components
│
├── docs/                            # Architecture, API, deployment docs
│   └── systems/                     # HTML system docs (Cloudflare Workers)
├── puter-deploy/                    # Puter-hosted app originals
├── scripts/                         # Automation & sync scripts
├── turbo.json                       # Turbo monorepo pipeline
├── vercel.json                      # Vercel deployment config
├── Dockerfile                       # Docker production image
└── pnpm-workspace.yaml              # pnpm workspaces
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL (local dev) or `DATABASE_URL` pointing to Railway

### Installation

```bash
pnpm install
pnpm build
pnpm dev              # Start all apps
```

### Environment

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `VITE_GAME_API_URL` — production: `https://api.grudge-studio.com`
- `VITE_AUTH_API_URL` — production: `https://id.grudge-studio.com`
- See `.env.example` for the full list.

## Database

16 tables via Drizzle ORM (PostgreSQL): users, characters, inventory_items, crafted_items, unlocked_skills, unlocked_recipes, crafting_jobs, shop_transactions, islands, ai_agents, game_sessions, afk_jobs, uuid_ledger, resource_ledger, auth_tokens, battle_arena_stats

```bash
pnpm db:push           # Push schema to database
pnpm db:generate       # Generate migrations
```

## Deployment

### Vercel (Frontend)

The WCS React client auto-deploys on push to `master`. Config lives in `vercel.json`.

```bash
# Manual deploy
vercel deploy --prod
```

Set secrets in the Vercel dashboard using `@` prefix:
- `SESSION_SECRET` → `@session_secret`
- `GRUDGE_AUTH_URL` → `@grudge_auth_url`
- `GRUDGE_API_URL` → `@grudge_api_url`

### Railway (Backend + DB + WebSocket)

1. Connect the GitHub repo in the Railway dashboard.
2. Add a **PostgreSQL** service — Railway auto-injects `DATABASE_URL`.
3. Set env vars: `NODE_ENV=production`, `SESSION_SECRET`, `GRUDGE_AUTH_URL`, `GRUDGE_API_URL`.
4. Railway auto-deploys on push to `master`.

```bash
# Push schema to production DB
DATABASE_URL="<railway-url>" pnpm db:push
```

### Cloudflare (DNS + R2 + Workers)

- **DNS**: `grudge-studio.com` managed via Cloudflare. Subdomains point to Vercel/Railway via CNAME.
- **R2**: Asset storage at `assets.grudge-studio.com` (images, models, sprites).
- **Workers**: System doc pages served from `grudge-studio-site` Worker (`/backend`, `/client`, `/infra`, `/systems`).

```bash
# Deploy system doc Worker
npx wrangler deploy  # from cloudflare/workers/site/
```

### Puter (Lightweight Apps)

Standalone apps (grudge-crafting, command center) deploy to `*.puter.site` via the Puter CLI.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full guide.

## Part of [Grudge Studio](https://grudge-studio.com)
