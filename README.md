# Grudge Studio Monorepo

Unified repository for Grudge Studio game development — crafting suite, API server, admin tools, Puter cloud apps, and shared packages.

## Live Deployments

| Service | URL | Host |
|---------|-----|------|
| Auth Gateway (API) | https://auth-gateway-flax.vercel.app | Vercel |
| ObjectStore (Data) | https://molochdagod.github.io/ObjectStore/ | GitHub Pages |
| GrudgeStudioNPM | https://molochdagod.github.io/GrudgeStudioNPM/ | GitHub Pages |
| Grudge Studio App | https://grudge-studio-app.puter.site | Puter |
| Command Center | https://grudge-command-center.puter.site | Puter |
| GrudaChain Hub | https://grudachain-ve8e8.puter.site | Puter |

## Project Structure

```
grudge-studio/
├── apps/
│   ├── api-server/                  # REST API (game-data, AI, UUID, sync)
│   ├── admin-dashboard/             # Admin management panel
│   ├── battle-arena-client/         # PvP arena frontend
│   ├── battle-arena-server/         # PvP arena backend (Colyseus)
│   ├── command-center/              # Puter worker/site ops dashboard
│   ├── grudge-studio-app/           # Main studio app (3D editor, AI agents, assets)
│   └── warlord-crafting-suite/      # Crafting, inventory, islands, professions
│
├── packages/
│   ├── auth/                        # Auth token utilities
│   ├── database/                    # Drizzle ORM database layer
│   ├── game-client/                 # Colyseus client helpers
│   ├── google-sheets-sync/          # Google Sheets integration
│   ├── puter-sync/                  # Puter cloud sync
│   ├── shared/                      # Unified schemas & constants
│   └── ui-components/               # Shared React components
│
├── docs/                            # Documentation
├── scripts/                         # Build & automation
├── puter-deploy/                    # Puter site/worker deploy files
├── turbo.json                       # Turbo monorepo config
├── pnpm-workspace.yaml              # pnpm workspaces
└── tsconfig.json                    # Root TypeScript config
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
pnpm dev:warlord      # Start Warlord only
pnpm dev:api          # Start API server only
```

## Packages

| Package | Purpose |
|---------|---------|
| @grudge/shared | Zod schemas, types, tier pricing, profession utils |
| @grudge/database | Drizzle ORM database layer |
| @grudge/auth | Token-based auth (create, verify, revoke) |
| @grudge/google-sheets-sync | Sync game data with Google Sheets |
| @grudge/puter-sync | Puter cloud storage (KV, FS) |
| @grudge/ui-components | Shared React components |
| @grudge/game-client | Colyseus multiplayer client helpers |

## Database

The auth-gateway uses Neon PostgreSQL. The warlord-crafting-suite uses MySQL.

```bash
pnpm db:generate       # Generate migrations
pnpm db:push           # Push schema to database
```

## Scripts

```bash
pnpm dev               # Start all apps
pnpm build             # Build all packages
pnpm type-check        # TypeScript checks
pnpm lint              # Lint all packages
pnpm test              # Run tests
pnpm sheets:sync       # Sync Google Sheets
pnpm clean             # Clean build artifacts
```

## External Repositories

| Repo | Purpose |
|------|---------|
| MolochDaGod/auth-gateway | Auth backend → Vercel |
| MolochDaGod/ObjectStore | Static game data API → GitHub Pages |
| MolochDaGod/GrudgeStudioNPM | Three.js playground → GitHub Pages |
| MolochDaGod/grudachain | GrudaChain node system |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Ecosystem Map](./ECOSYSTEM.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Deploy to Vercel](./DEPLOY_VERCEL.md)
- [Deploy Command Center](./DEPLOY-COMMAND-CENTER.md)

## License

MIT
