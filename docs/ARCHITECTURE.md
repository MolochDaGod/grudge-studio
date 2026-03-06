# Architecture

## Overview

Grudge Studio is organized as a monorepo containing multiple applications and shared packages. This design enables:

- **Code reuse** across apps
- **Unified data schemas** with single source of truth
- **Efficient builds** with Turbo caching
- **Easy collaboration** with shared infrastructure

## Monorepo Structure

```
grudge-studio/
├── apps/
│   ├── api-server/                   # REST API (game-data, AI, UUID, sync) — NOT YET DEPLOYED
│   ├── admin-dashboard/              # Admin management panel (Puter site)
│   ├── battle-arena-client/          # PvP arena frontend
│   ├── battle-arena-server/          # PvP arena backend (Colyseus)
│   ├── command-center/               # Ops dashboard → grudge-command-center.puter.site
│   ├── grudge-studio-app/            # Main studio → grudge-studio-app.puter.site
│   └── warlord-crafting-suite/       # Crafting, inventory, islands, professions
├── packages/
│   ├── auth/                         # Token-based auth utilities
│   ├── database/                     # Drizzle ORM layer
│   ├── game-client/                  # Colyseus client helpers
│   ├── google-sheets-sync/           # Sheet data sync & caching
│   ├── puter-sync/                   # Puter cloud storage integration
│   ├── shared/                       # Zod schemas, types, constants
│   └── ui-components/                # Shared React components
└── scripts/                          # Automation & deployment
```

## External Services

- **auth-gateway** (Vercel) — The deployed backend with Neon PostgreSQL + Supabase. Lives in a separate repo: `MolochDaGod/auth-gateway`
- **ObjectStore** (GitHub Pages) — Static game data API at `molochdagod.github.io/ObjectStore/`
- **Puter Cloud** — Hosts studio app, command center, GrudaChain hub. Provides KV, AI, FS, and auth SDK

## Data Flow

### User/Auth Flow
```
SSO/Wallet Auth → Warlord API → Database → Token/Session
     ↓
Apps can exchange token for user info
```

### Crafting Flow
```
Client → Warlord API → Database → UUID Ledger → Puter Sync
  ↓
Character gets new item with unique GrudgeUUID
```

### Sheet Sync Flow
```
Google Sheets → Cached in Memory → Warlord Database → Client UI
     ↓
Periodic sync refreshes cache
```

## Key Concepts

### GrudgeUUID System
Every item, sprite, ability has a unique identifier:
- Format: `GRD-[TYPE]-[SLOT]-[TIER]-[ID]`
- Example: `GRD-EQP-001-03-042` (Weapon, T3, ID 42)
- Tracked in UUID ledger for full audit trail

### Profession System
- 5 professions: Miner, Forester, Mystic, Chef, Engineer
- Each has independent levels and skill trees
- Crafting awards profession XP
- Skills unlock recipes and bonuses

### Item Tiers (1-8)
- Price multipliers: 1x, 2.5x, 5x, 10x, 20x, 40x, 80x, 160x
- Higher tiers require profession progression
- Upgradable with materials and essences

### Home Islands
- Procedurally generated per user
- Persistent state stored in database
- Buildings, harvest nodes, terrain
- AI agents can work on islands (AFK jobs)

## Package Responsibilities

### @grudge/shared
**Schemas & Constants**
- Zod schemas for validation
- Item/recipe definitions
- Profession progression
- Tier pricing multipliers
- Sprite mappings

### @grudge/database
**Data Access Layer**
- Drizzle ORM schema
- Storage class singleton
- Migration management
- Relations & queries

### @grudge/google-sheets-sync
**External Data Integration**
- Fetch weapons, armor, items from sheets
- In-memory caching
- Periodic refresh
- Change detection

### @grudge/puter-sync
**Cloud Storage**
- Export data to Puter filesystem
- Sync account data
- Cross-app data sharing
- Activity logging

### @grudge/ui-components
**Shared UI**
- Inventory component
- Crafting interface
- Shop interface
- Reusable across apps

### warlord-crafting-suite
**Main Application**
- Express backend
- React frontend
- Authentication (local, wallet, SSO)
- All game systems (crafting, inventory, shop)
- Home island generation
- AI agent management
- Game sessions

## Building Blocks

### 1. Authentication
- Local: Username/password with bcrypt
- Wallet: Solana/Web3 wallet address
- SSO: Cross-app single sign-on
- Token exchange for secure cross-app redirects

### 2. Crafting System
- Recipe definitions from Google Sheets or DB
- Tier-based crafting (T1-T8)
- Profession progression with skill trees
- AFK crafting jobs with completion times
- XP rewards per tier

### 3. Inventory Management
- Character-scoped inventory
- Material quantities tracked
- Crafted items with tier/rarity
- Equipment/unequipment system

### 4. Shop
- Buy recipes (unlock crafting)
- Buy/sell materials (server-side pricing)
- Sell crafted items
- Transaction history

### 5. Home Islands
- Server-side terrain generation
- Buildings (camp, workshops)
- Harvest nodes (ore, wood, herbs, fish)
- AI workers for AFK harvesting
- Persistent save state

### 6. AI Agents
- NPC/companion/worker types
- Configurable personality & behavior
- Game knowledge & memory
- Can execute AFK jobs
- Status tracking (idle, busy, harvesting)

## Development Workflow

### Adding a Feature

1. **Update shared schemas** if needed
   ```typescript
   // packages/shared/src/schema.ts
   export const newFeatureSchema = z.object({...});
   ```

2. **Update database schema**
   ```typescript
   // packages/database/src/schema.ts
   export const newTable = pgTable('new_table', {...});
   ```

3. **Create API endpoints**
   ```typescript
   // apps/warlord-crafting-suite/server/routes.ts
   app.get("/api/feature", async (req, res) => {...});
   ```

4. **Build/test locally**
   ```bash
   pnpm build
   pnpm type-check
   ```

## Deployment

### Local Development
```bash
pnpm install
pnpm dev              # Starts on http://localhost:5000
```

### Production Build
```bash
pnpm build
NODE_ENV=production npm run start
```

### Database
Uses PostgreSQL with Drizzle ORM.

```bash
# Set DATABASE_URL env var
export DATABASE_URL="postgresql://user:pass@host/db"

pnpm db:push          # Apply schema changes
```

### Environment Variables

**Warlord App:**
- `DATABASE_URL` - PostgreSQL connection
- `NODE_ENV` - development/production
- `PORT` - Server port (default 5000)
- `SESSION_SECRET` - Auth session secret
- `GOOGLE_SHEET_*` - Google Sheets API
- `PUTER_*` - Puter cloud config

## Performance Considerations

### Caching
- Google Sheets data cached in memory
- Cache TTL configurable per data source
- Manual refresh endpoint available
- UUID ledger indexed by grudgeUuid

### Database
- Proper indexes on frequently queried fields
- Connection pooling via pg
- Drizzle relations for efficient queries
- Transaction support for complex operations

### Turbo Caching
- Build artifacts cached
- TypeScript incremental compilation
- Parallel builds across packages
- Remote caching support (optional)

## Future Enhancements

- [ ] GraphQL API layer
- [ ] Real-time multiplayer with Colyseus
- [ ] Advanced sprite atlas system
- [ ] Scheduled jobs for AFK tasks
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
