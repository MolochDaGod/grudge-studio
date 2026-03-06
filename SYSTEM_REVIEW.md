# Grudge Studio - Complete System Review & Deployment Plan

## 📊 System Architecture Overview

### Monorepo Structure
```
grudge-studio/
├── apps/
│   ├── warlord-crafting-suite/     # Main crafting/RPG app (Port 5000)
│   ├── battle-arena-server/        # Multiplayer PvP server (Port 2567)
│   └── battle-arena-client/        # Battle Arena game client
├── packages/
│   ├── database/                   # MySQL + Drizzle ORM (UNIFIED)
│   ├── auth/                       # Authentication utilities (UNIFIED)
│   ├── shared/                     # Zod schemas + profession utils (UNIFIED)
│   ├── game-client/                # Colyseus client helpers
│   ├── google-sheets-sync/         # Google Sheets integration
│   ├── puter-sync/                 # Puter cloud storage
│   └── ui-components/              # Shared React components
```

---

## 🗄️ Database Architecture

### Connection Details
- **Type**: MySQL 8.0
- **Host**: <DB_HOST>:<DB_PORT>
- **Database**: <DB_NAME>
- **Credentials**: <DB_USER> / <DB_PASSWORD>
- **ORM**: Drizzle ORM with mysql2 driver

### Schema Tables (18 total)

#### Core User System
1. **users** - Central user accounts
   - UUID primary key
   - username, email, password (bcrypt)
   - walletAddress, puterId (OAuth integrations)
   - isPremium, isGuest, emailVerified
   - hasHomeIsland flag

2. **authTokens** - Session tokens
   - Linked to users
   - token (unique 255 chars)
   - tokenType: standard | guest | wallet | puter
   - expiresAt (bigint timestamp)
   - deviceInfo (JSON), ipAddress

#### Character & Progression System
3. **characters** - Player characters (Level 1-20)
   - userId reference
   - name, classId, raceId, profession
   - level, experience, gold
   - attributes (JSON): Strength, Vitality, Endurance, Intellect, Wisdom, Dexterity, Agility, Tactics
   - equipment (JSON): 10 slots
   - professionProgression (JSON)
   - currentHealth, currentMana, currentStamina

4. **inventoryItems** - Character inventory
   - characterId reference
   - itemType, itemName, quantity

5. **craftedItems** - Player-crafted equipment
   - characterId reference
   - itemName, profession, tier (1-8)
   - equipped flag

6. **unlockedSkills** - Profession skill tree unlocks
   - characterId reference
   - nodeId, profession, skillName, tier

7. **unlockedRecipes** - Crafting recipes
   - characterId reference
   - recipeId, source

8. **craftingJobs** - Active crafting queues
   - characterId reference
   - recipeId, quantity, duration
   - completesAt, status (pending/completed/claimed)
   - inputItems (JSON)

9. **shopTransactions** - Buy/sell history
   - characterId reference
   - transactionType, itemCategory
   - unitPrice, totalPrice, tier

#### Island & World System
10. **islands** - Player-owned islands
    - userId reference
    - name, islandType, seed
    - width (130), height (105)
    - terrain, buildings, harvestNodes (JSON)
    - campPosition (JSON)

11. **aiAgents** - NPC characters
    - userId, characterId, islandId references
    - personality, systemPrompt
    - temperature (10-100), maxTokens (50-500)
    - gameKnowledge, behaviorFlags, units (JSON)
    - memory (JSON): shortTerm, longTerm, goals

12. **gameSessions** - Active play sessions
    - userId, islandId, characterId references
    - checkpoint, pendingResources (JSON)
    - isActive flag

13. **afkJobs** - AFK resource gathering
    - userId, islandId, sessionId, characterId
    - jobType, targetNodeId, targetBuildingId
    - projectedYield, actualYield (JSON)
    - startedAt, endsAt, completedAt

#### Tracking & Ledgers
14. **uuidLedger** - Item/asset tracking
    - grudgeUuid, eventType
    - accountId, characterId references
    - relatedUuids, outputUuid
    - previousState, newState, metadata (JSON)

15. **resourceLedger** - Resource transaction log
    - accountId, characterId references
    - resourceName, quantity, source
    - isCommitted flag

#### Battle Arena System
16. **battleArenaStats** - PvP statistics
    - userId reference
    - totalKills, totalDeaths, totalMatches
    - totalPlaytimeMinutes, highestKillstreak

---

## 🔐 Authentication Flow

### Token-Based Auth
```typescript
// Login Flow
1. POST /auth/login { username, password }
2. Verify password with bcrypt
3. Create auth token (7-day expiry)
4. Return: { token, userId, grudgeId, accountId }

// Token Verification (Middleware)
1. Extract token from Authorization header
2. Query authTokens table (check expiry)
3. Load user data
4. Attach to request context
```

### Auth Functions (@grudge/auth)
- `verifyAuthToken(token)` → UserData | null
- `createAuthToken(userId, type, days)` → token string
- `updateLastLogin(userId)`
- `updateTokenUsage(token)`
- `revokeAuthToken(token)`
- `revokeAllUserTokens(userId)`
- `generateGrudgeId(userId)` → "GRUDGE_XXXXXXXXXXXX"

### Supported Auth Methods
1. **Standard**: username + password
2. **Guest**: Temporary accounts
3. **Wallet**: Crossmint blockchain wallet
4. **Puter**: Puter.com OAuth integration

---

## 🎮 Game Systems

### Profession System (Levels 1-100)
**Professions**: Miner, Forester, Mystic, Chef, Engineer

**Progression** (@grudge/shared/utils):
- XP gained through: crafting, harvesting activities
- Exponential XP curve: `100 * 1.5^(level-1)`
- Skill points awarded at milestones:
  - Level 1: 1 point
  - Every 5 levels (5-45): +1 point each (9 total)
  - Every 10 levels (50-100): +1 point each (6 total)
  - **Maximum: 16 skill points at level 100**

**Functions**:
- `calculateProfessionPoints(level)` → total points
- `getAvailableProfessionPoints(entry)` → unspent points
- `getProfessionXpForNextLevel(level)` → XP needed
- `addProfessionXp(entry, xp)` → updated entry

### Character System (Levels 1-20)
**Heroes, Allies, Enemies**: Combat-focused characters

**Attributes** (8 core stats):
- Strength, Vitality, Endurance, Intellect
- Wisdom, Dexterity, Agility, Tactics

**Equipment Slots** (10 total):
- head, chest, legs, feet, hands, shoulders
- mainHand, offHand, accessory1, accessory2

**Derived Stats**:
- health, mana, stamina
- damage, defense, blockChance, blockFactor
- criticalChance, criticalFactor, accuracy
- resistance, defenseReduction

### Crafting System
**Tiers**: 1-8 (item quality levels)

**Workflow**:
1. Check unlocked recipes
2. Verify material inventory
3. Create crafting job (duration-based)
4. Queue job with completesAt timestamp
5. Claim completed items

### Island System
**Types**: home, adventure, etc.
**Generation**: Procedural with seed value
**Size**: 130x105 tiles
**Features**:
- Terrain generation (JSON grid)
- Building placement (JSON)
- Harvest nodes (JSON)
- Camp position (spawn point)

---

## 🎯 Application Endpoints

### Warlord Crafting Suite (Port 5000)
**Frontend**: Vite + React + TypeScript
**Backend**: Express + Drizzle ORM

**API Routes**:
```
GET  /api/user              # User profile
GET  /api/characters        # List characters
POST /api/characters        # Create character
GET  /api/inventory/:id     # Character inventory
POST /api/craft             # Start crafting job
GET  /api/recipes           # Available recipes
POST /api/shop/buy          # Purchase item
POST /api/shop/sell         # Sell item
GET  /api/islands           # User islands
GET  /api/sessions          # Active sessions
```

### Battle Arena Server (Port 2567)
**Framework**: Colyseus + Express
**Protocol**: WebSocket + HTTP

**Colyseus Rooms**:
```typescript
// BattleArenaRoom.ts
- maxClients: 8
- State sync: 60 FPS
- Player spawn, movement, combat
- Kill/death tracking
```

**HTTP Routes**:
```
POST /auth/register         # Create account
POST /auth/login            # Login
POST /auth/guest            # Guest account
POST /auth/verify           # Verify token
GET  /stats/:userId         # Battle stats
POST /wallet/create         # Crossmint wallet
```

### Battle Arena Client (Vite + Phaser)
**Game Engine**: Phaser 3.80.1
**Networking**: colyseus.js

**Scenes**:
- Boot, Preloader
- MainMenu
- BattleArena (multiplayer)

---

## 🔌 External Integrations

### 1. Crossmint (Blockchain Wallets)
```typescript
// Server-side wallet creation
POST https://api.crossmint.com/v1/wallets
Headers: { X-API-KEY: process.env.CROSSMINT_API_KEY }
Body: { type: 'solana-mpc-wallet', linkedUser: email }
Response: { id, address }
```

### 2. Google Sheets (Data Sync)
**Package**: @grudge/google-sheets-sync
**Sheets**: weapons, armor, items, crafting, account
**Service Account**: JSON credentials in .env

### 3. Puter Cloud (Storage)
**Package**: @grudge/puter-sync
**Features**: Cloud file storage, OAuth
**API**: puter.com cloud API

### 4. OpenAI (AI Agents)
**Usage**: NPC personality/behavior
**Model**: GPT (configurable temperature/tokens)
**Context**: gameKnowledge, memory, goals

---

## 📦 Package Dependencies

### Production Dependencies
```json
{
  "database": {
    "drizzle-orm": "^0.39.3",
    "mysql2": "^3.16.1"
  },
  "server": {
    "express": "^4.22.1",
    "colyseus": "^0.15.26",
    "cors": "^2.8.5",
    "bcrypt": "^6.0.0",
    "dotenv": "^17.2.3"
  },
  "client": {
    "react": "^19.2.3",
    "phaser": "^3.80.1",
    "vite": "^7.1.9"
  },
  "validation": {
    "zod": "^3.25.76",
    "drizzle-zod": "^0.7.1"
  }
}
```

---

## 🚀 Deployment Strategy

### Option 1: Vercel (Recommended for Frontend + API)
**Best For**: Warlord Crafting Suite

**Architecture**:
```
Vercel Edge
├── Frontend (Vite React SPA)
└── Serverless Functions (/api/*)
    └── Express handlers (wrapped)
```

**Challenges**:
- ❌ No WebSocket support (Battle Arena won't work)
- ❌ Serverless functions timeout (10s max)
- ❌ No persistent connections for Colyseus
- ✅ Great for static site + REST API

**Solution**: Deploy Battle Arena separately

### Option 2: Railway/Render (Recommended for Battle Arena)
**Best For**: Battle Arena Server (WebSocket)

**Features**:
- ✅ Persistent processes
- ✅ WebSocket support
- ✅ Direct MySQL connection
- ✅ Environment variables

### Option 3: Hybrid Deployment (RECOMMENDED)
```
Vercel:
  - Warlord Crafting Suite (frontend + API)
  - Static assets, React app
  - REST endpoints

Railway/Render:
  - Battle Arena Server (Colyseus)
  - WebSocket server on port 2567
  - Persistent connection to MySQL

Shared:
  - MySQL Database (<DB_HOST>)
  - @grudge/* packages (published to npm or private registry)
```

---

## ⚠️ Critical Issues to Resolve

### 🔴 BLOCKER: Warlord Schema Duplicate
**File**: `apps/warlord-crafting-suite/shared/schema.ts`
**Status**: Still using PostgreSQL types (pgTable)
**Impact**: Will cause runtime errors with MySQL database

**Fix Required**:
1. Delete `apps/warlord-crafting-suite/shared/schema.ts`
2. Find all imports: `from '@shared/schema'`
3. Replace with: `from '@grudge/database'`
4. Update tsconfig paths

### 🔴 BLOCKER: Battle Arena Routes
**Files**: 
- `apps/battle-arena-server/routes/auth.js`
- `apps/battle-arena-server/routes/wallet.js`
- `apps/battle-arena-server/index.js`

**Status**: Still importing `sql from '../db.cjs'` (deleted file)
**Impact**: Server won't start

**Fix Required**:
1. Update to: `import { db } from '@grudge/database'`
2. Convert raw SQL to Drizzle queries
3. Replace auth.js imports with `@grudge/auth`

### 🟡 WARNING: Package Publishing
**Issue**: Workspace packages won't resolve in production

**Fix Options**:
1. Bundle packages into each app (simpler)
2. Publish to private npm registry
3. Use pnpm deploy command

---

## 📋 Pre-Deployment Checklist

### Code Cleanup
- [ ] Delete warlord-crafting-suite/shared/schema.ts
- [ ] Update all warlord imports to @grudge/database
- [ ] Convert battle-arena routes to Drizzle
- [ ] Update battle-arena index.js

### Testing
- [ ] Build all packages: `pnpm build`
- [ ] Test warlord DB connection
- [ ] Test battle-arena DB connection  
- [ ] Verify auth flow works
- [ ] Test profession XP calculation
- [ ] Test crafting system

### Environment Setup
- [ ] Create production .env files
- [ ] Secure database credentials
- [ ] Set up CORS origins
- [ ] Configure session secrets
- [ ] Add Crossmint API key (optional)
- [ ] Add OpenAI API key (optional)

### Deployment Config
- [ ] Create vercel.json for warlord
- [ ] Create Procfile for battle-arena
- [ ] Set up environment variables in platforms
- [ ] Configure build commands
- [ ] Set up custom domains

---

## 🎯 Deployment Commands

### Build for Production
```bash
# Build all packages
pnpm build

# Build specific apps
pnpm --filter warlord-crafting-suite build
pnpm --filter battle-arena-client build

# Type check
pnpm type-check
```

### Local Testing
```bash
# Start warlord dev server
pnpm --filter warlord-crafting-suite dev

# Start battle-arena server
pnpm --filter battle-arena-server start

# Start battle-arena client
pnpm --filter battle-arena-client dev
```

### Deploy to Vercel (Warlord)
```bash
cd apps/warlord-crafting-suite
vercel --prod

# Or via GitHub integration
git push origin master
```

### Deploy to Railway (Battle Arena)
```bash
# Link project
railway link

# Deploy
railway up

# Set environment
railway variables set DB_HOST=<DB_HOST>
railway variables set DB_PORT=<DB_PORT>
# ... etc
```

---

## 📊 Performance Metrics

### Database Indexing
```sql
-- Existing indexes
users: username, email, wallet_address
auth_tokens: token, user_id, expires_at
characters: user_id
battle_arena_stats: user_id
```

### Connection Pooling
```typescript
// packages/database/src/index.ts
mysql.createPool({
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true
})
```

### Expected Load
- **Concurrent Users**: 100-1000
- **DB Connections**: 10 pool max
- **API Response Time**: <100ms
- **WebSocket Latency**: <50ms
- **Crafting Job Duration**: 5s - 5min

---

## 🔒 Security Considerations

### Authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Token expiry (7 days default)
- ✅ UUID for all IDs (prevents enumeration)
- ⚠️ Add rate limiting
- ⚠️ Add CSRF protection

### Database
- ✅ Parameterized queries (Drizzle ORM)
- ✅ Connection pooling
- ⚠️ Enable SSL for production
- ⚠️ Implement backup strategy

### API
- ✅ CORS configured
- ⚠️ Add API key authentication
- ⚠️ Implement request validation
- ⚠️ Add logging/monitoring

---

## 📈 Next Steps for Production

### Immediate (Must-Do)
1. Fix warlord schema duplicate
2. Convert battle-arena routes to Drizzle
3. Test full auth flow
4. Set up production .env files
5. Deploy to staging environment

### Short-term (1-2 weeks)
1. Add rate limiting middleware
2. Implement error logging (Sentry)
3. Set up database backups
4. Add health check endpoints
5. Configure CI/CD pipeline

### Long-term (1-3 months)
1. Add admin dashboard
2. Implement analytics
3. Set up CDN for assets
4. Add Redis caching
5. Implement load balancing

---

## 💡 Recommendations

### Architecture
- ✅ Hybrid deployment (Vercel + Railway)
- ✅ MySQL remains external (not in container)
- ✅ Shared packages remain in monorepo
- ⚠️ Consider Redis for session storage
- ⚠️ Consider separate read replicas

### Scaling
- Start with single server (Railway)
- Add horizontal scaling when users > 1000
- Consider Cloudflare for DDoS protection
- Monitor DB connection pool usage

### Monitoring
- Set up uptime monitoring (UptimeRobot)
- Add error tracking (Sentry/LogRocket)
- Monitor database slow queries
- Track API response times
- Monitor WebSocket connections

---

## 🎮 Game Design Notes

### Progression Balance
- **Professions**: 100 levels, 16 skill points max
- **Characters**: 20 levels, combat-focused
- **Crafting Tiers**: 1-8 (exponential difficulty)
- **XP Curve**: 1.5x exponential growth

### Economy
- **Starting Gold**: 1000
- **Shop Markup**: ~20-30% (configurable)
- **Crafting Costs**: Materials + time
- **Premium Currency**: Optional blockchain integration

### Social Features
- **Islands**: Player-owned spaces
- **AI Agents**: NPC companions
- **Battle Arena**: 8-player PvP
- **Trade System**: (Future implementation)
