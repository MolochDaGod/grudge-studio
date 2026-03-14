# Grudge Studio Monorepo

Unified repository for Grudge Studio game development — the core `grudge-warlords` app, battle arena, and shared packages.

## Architecture

**Backend**: VPS at `*.grudge-studio.com` — MySQL, Redis, MinIO, 7 Docker microservices
**Frontend**: Vercel deployments for all web apps
**DNS**: Cloudflare for `grudge-studio.com` subdomains

## Live Deployments

- **Game API**: https://api.grudge-studio.com
- **Auth**: https://id.grudge-studio.com
- **Dashboard**: https://dash.grudge-studio.com
- **ObjectStore**: https://molochdagod.github.io/ObjectStore/
- **Game (WCS)**: https://warlord-crafting-suite.vercel.app

## Project Structure

```
grudge-studio/
├── apps/
│   ├── warlord-crafting-suite/      # grudge-warlords — main game app
│   │   ├── client/                  # React 19 frontend (20+ pages)
│   │   └── server/                  # Express API server
│   │       ├── routes.ts            # All game routes (2400+ lines)
│   │       ├── routes/gameData.ts   # ObjectStore dataset API
│   │       ├── routes/github.ts     # GitHub repo management API
│   │       ├── lib/objectStore.ts   # ObjectStore fetch + cache
│   │       ├── lib/githubApp.ts     # GitHub App/PAT client
│   │       └── storage.ts           # Drizzle ORM data layer
│   ├── battle-arena-client/         # PvP arena frontend (Colyseus)
│   └── battle-arena-server/         # PvP arena backend (Colyseus WebSocket)
│
├── packages/
│   ├── shared/                      # Zod schemas, types, profession utils
│   ├── database/                    # Drizzle ORM schema (16 tables)
│   ├── auth/                        # JWT token utilities
│   ├── game-client/                 # Colyseus client helpers
│   ├── google-sheets-sync/          # Google Sheets data sync
│   ├── puter-sync/                  # Puter cloud storage sync
│   └── ui-components/               # Shared React components
│
├── turbo.json                       # Turbo monorepo pipeline
├── pnpm-workspace.yaml              # pnpm workspaces
└── docker-compose.yml               # VPS deployment
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
pnpm install
pnpm build
pnpm dev              # Start all apps
```

## Database

16 tables via Drizzle ORM: users, characters, inventory_items, crafted_items, unlocked_skills, unlocked_recipes, crafting_jobs, shop_transactions, islands, ai_agents, game_sessions, afk_jobs, uuid_ledger, resource_ledger, auth_tokens, battle_arena_stats

```bash
pnpm db:push           # Push schema to database
```

## Part of [Grudge Studio](https://grudge-studio.com)
