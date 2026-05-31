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
│   ├── warlord-crafting-suite/       # Main game app (React 19 + Express)
│   ├── battle-arena-client/          # PvP arena frontend
│   ├── battle-arena-server/          # PvP arena backend (Colyseus)
│   ├── mage-arena/                   # 2D combat game (Phaser 3, R2 sprites)
│   └── grudge-crafting/              # Standalone crafting tool (Puter deploy)
├── api/
│   └── grudge-builder/              # Vercel serverless API functions
├── packages/
│   ├── auth/                         # Token-based auth utilities
│   ├── combat/                       # Combat engine (AI, weapons, effects)
│   ├── database/                     # Drizzle ORM + PostgreSQL
│   ├── game-client/                  # Colyseus client helpers
│   ├── google-sheets-sync/           # Sheet data sync & caching
│   ├── puter-sync/                   # Puter cloud storage integration
│   ├── shared/                       # Zod schemas, types, constants
│   └── ui-components/                # Shared React components
├── docs/systems/                     # HTML system docs (served by Cloudflare Workers)
├── puter-deploy/                     # Puter-hosted app originals
└── scripts/                          # Automation & deployment
```

## External Services

- **Grudge Backend (Railway)** — Express API at `api.grudge-studio.com`, PostgreSQL database, WebSocket at `ws.grudge-studio.com`
- **Cloudflare** — DNS for `grudge-studio.com`, R2 asset storage at `assets.grudge-studio.com`, Workers for system doc pages
- **ObjectStore (GitHub Pages)** — Static game data API at `molochdagod.github.io/ObjectStore/`
- **Puter Cloud** — User-pays cloud storage, KV, AI, FS, and auth SDK. Hosts lightweight apps (grudge-crafting, command center)

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

### @grudge/combat
**Combat Engine** (ported from annihilatetrainer)
- Framework-agnostic — runs with Three.js/Cannon-ES or server-side Colyseus
- `Ai` base class + 5 archetype AIs (Mutant, Paladin, Robot, RobotBoss, Parrot)
- `Attacker` hitbox manager with collision group bitmasks
- 7 weapon types: Sword, GreatSword, Bullet, Hadouken, Grenade, Shield, Flail
- Effects: Splash (hit VFX), Pop (AoE knockback)
- `RoleControls` input manager with fighting-game combo detection
- Collision groups: SCENE, ROLE, ENEMY, ROLE_ATTACKER, ENEMY_ATTACKER, TRIGGER, ENEMY_SHIELD

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

### 7. Combat Engine (@grudge/combat)
- Base AI with detector sphere, chase/return, auto-attack
- Per-archetype FSMs: attack cooldowns, multi-ability selection, boss phases
- Melee: bone-tracked hitboxes (Sword, GreatSword with shield-block + launch)
- Ranged: Bullet/Hadouken with rebound, Grenade with arc trajectory
- Defense: Shield block collider, knockDown/knockBack pipeline
- Effects: Splash at contact point, Pop AoE burst with knockback
- Input: WASD + combo system (↓→J=hadouken, →↓→J=shoryuken)

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
NODE_ENV=production node apps/warlord-crafting-suite/dist/index.cjs
```

### Database
Uses PostgreSQL with Drizzle ORM. Production database hosted on Railway.

```bash
# Set DATABASE_URL env var (Railway provides this automatically)
pnpm db:push          # Apply schema changes
```

### Environment Variables

See `.env.example` for the full list. Key variables:
- `DATABASE_URL` — PostgreSQL connection (set in Railway/Vercel dashboard, not in repo)
- `VITE_GAME_API_URL` — `https://api.grudge-studio.com`
- `VITE_AUTH_API_URL` — `https://id.grudge-studio.com`
- `SESSION_SECRET` — set in Vercel/Railway dashboard
- `NODE_ENV` — `production`

## Performance Considerations

### Caching
- Google Sheets data cached in memory
- Cache TTL configurable per data source
- Manual refresh endpoint available
- UUID ledger indexed by grudgeUuid

### 2. Database (PostgreSQL)
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
