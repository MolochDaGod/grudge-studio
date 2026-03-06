# 🗄️ GRUDGE Warlords - Database & Authentication Architecture

## 📍 **Where You Are Now**

### **Database Storage**
Your database is **PostgreSQL** and it's configured via environment variable:

**Location**: `server/db.ts`
```typescript
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

**Connection String Format**:
```
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**Current Setup**:
- ✅ Using **Drizzle ORM** for type-safe database access
- ✅ Schema defined in `shared/schema.ts` (shared across all apps)
- ✅ Storage layer abstraction in `server/storage.ts`
- ✅ Migrations in `migrations/` directory

---

## 🔐 **Current Authentication Methods**

You have **3 working auth methods** + 1 to add:

### **1. Username/Password Auth** ✅ WORKING
- **Endpoint**: `POST /api/auth/login`
- **Endpoint**: `POST /api/auth/register`
- **Storage**: Passwords hashed with bcrypt (10 rounds)
- **Used by**: Direct login on `/login` page

### **2. Puter ID SSO** ✅ WORKING
- **Endpoint**: `POST /api/auth/sso`
- **Endpoint**: `POST /api/auth/sso/token`
- **Storage**: Links `puterId` field in users table
- **Used by**: Puter.com deployments (your main deployment target)

### **3. Wallet Auth (Basic)** ✅ WORKING
- **Endpoint**: `POST /api/auth/wallet`
- **Current**: Creates user with wallet address
- **Storage**: `walletAddress` field in users table
- **Issue**: No signature verification - just accepts wallet address

### **4. Solana Sign-In (SIWS)** ⚠️ TO ADD
- **Package**: `sign-in-with-solana-5.0.0.zip` (extracted)
- **Standard**: Based on EIP-4361 (Sign-In with Ethereum)
- **Purpose**: Cryptographically verify wallet ownership
- **Integration**: Replace basic wallet auth with SIWS

---

## 📊 **Database Schema Overview**

### **Core Tables** (in `shared/schema.ts`)

#### **users** (Central Account System)
```typescript
{
  id: UUID (auto-generated)
  username: string (unique)
  password: string (bcrypt hashed)
  email: string (optional)
  displayName: string (optional)
  puterId: string (optional) ← Links to Puter.com account
  walletAddress: string (optional) ← Links to Solana wallet
  avatarUrl: string (optional)
  isPremium: boolean
  premiumUntil: timestamp
  hasHomeIsland: boolean
  createdAt: timestamp
  lastLoginAt: timestamp
  settings: jsonb
}
```

#### **characters** (Player Characters)
```typescript
{
  id: UUID
  userId: UUID (FK → users.id)
  name: string
  classId, raceId, profession: string
  level, experience, gold: integer
  skillPoints, attributePoints: integer
  attributes: jsonb (Strength, Vitality, etc.)
  professionProgression: jsonb (Miner, Forester, etc.)
  ...
}
```

#### **Other Tables**
- `inventory_items` - Character inventory
- `crafted_items` - Player-crafted equipment
- `unlocked_skills` - Skill tree progression
- `unlocked_recipes` - Crafting recipes
- `islands` - Player home islands
- `ai_agents` - AI NPCs
- `game_sessions` - Active play sessions
- `afk_jobs` - Background tasks
- `resource_ledger` - Resource tracking
- `uuid_ledger` - UUID event history

---

## 🌐 **Cross-App Architecture**

### **How Apps Connect**

```
┌─────────────────────────────────────────────────────────┐
│  GRUDGE Network Apps (All use same database)            │
├─────────────────────────────────────────────────────────┤
│  • Grudge Warlords (Main game)                          │
│  • Grudge Studio (Asset creator)                        │
│  • Grudge Social (Friends/Chat)                         │
│  • Grudge Multiplayer (PvP/Lobbies)                     │
│  • Grudge Launcher (App hub)                            │
└─────────────────────────────────────────────────────────┘
                         ↓
              All connect to same backend
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Server (Express + Drizzle)                     │
│  • server/routes.ts - API endpoints                     │
│  • server/storage.ts - Database operations              │
│  • server/db.ts - PostgreSQL connection                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                    │
│  • Single source of truth                               │
│  • Shared schema (shared/schema.ts)                     │
│  • All apps read/write same data                        │
└─────────────────────────────────────────────────────────┘
```

### **Shared Schema Benefits**
- ✅ One account works across all apps
- ✅ Characters accessible everywhere
- ✅ Inventory synced automatically
- ✅ Type-safe with TypeScript
- ✅ Migrations managed centrally

---

## 🎯 **Puter Deployment Focus**

You're right - you want **Puter deployments only**. Here's why I created multiple deployment options:

### **What You Actually Need**
1. **Puter.com** - Frontend apps (already set up in `puter/` folder)
2. **Backend Server** - Can be deployed anywhere that supports Node.js + PostgreSQL:
   - Replit (current)
   - Railway
   - Render
   - Your own server

### **What You DON'T Need** (I over-built)
- ❌ Docker/Kubernetes (unless you want it for backend)
- ❌ Multiple deployment guides
- ❌ Complex infrastructure

### **Simplified Deployment**
```
Puter Apps (Frontend) → Backend API → PostgreSQL Database
     ↓                      ↓              ↓
  puter.com            Replit/Railway   Managed DB
```

---

## 🔧 **What Needs to Be Done**

### **1. Integrate Solana Sign-In with Solana (SIWS)**

**Current Issue**: `/api/auth/wallet` doesn't verify wallet ownership

**Solution**: Use the `sign-in-with-solana` package

**Steps**:
1. Install the package
2. Update `/api/auth/wallet` endpoint
3. Verify signature on backend
4. Update `/login` page to use SIWS

### **2. Ensure Schema Works Across Apps**

**Already Done!** ✅
- Schema is in `shared/schema.ts`
- All apps import from `@shared/schema`
- Database connection via `DATABASE_URL`

---

## 📝 **Next Steps**

1. **Integrate SIWS** - Replace basic wallet auth
2. **Test cross-app auth** - Verify login works across Grudge apps
3. **Document API** - For other apps to connect
4. **Setup Puter deployments** - Use existing `puter/` folder

---

## 🔗 **Key Files**

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database schema (shared across all apps) |
| `server/db.ts` | PostgreSQL connection |
| `server/storage.ts` | Database operations layer |
| `server/routes.ts` | API endpoints (auth, characters, etc.) |
| `puter/` | Puter.com deployment files |
| `sign-in-with-solana-5.0.0/` | SIWS package to integrate |

---

**Ready to integrate Solana auth?** Let me know and I'll help you implement SIWS properly!
