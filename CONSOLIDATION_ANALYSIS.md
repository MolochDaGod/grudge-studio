# Grudge Studio Monorepo - Consolidation Analysis

## Critical Issues Found - Duplicate & Conflicting Systems

### 🔴 CRITICAL: Multiple Schema Definitions (MUST CONSOLIDATE)

#### 1. Database Schema Files
**Location Conflict:**
- ✅ **PRIMARY (KEEP)**: `packages/database/src/schema.ts` - MySQL Drizzle schema
- ❌ **DUPLICATE**: `apps/warlord-crafting-suite/shared/schema.ts` - Old PostgreSQL schema (REMOVE)
- ⚠️ **DIFFERENT PURPOSE**: `packages/shared/src/schema.ts` - Zod validation schemas (KEEP)

**Problem:**
- `warlord-crafting-suite/shared/schema.ts` still uses PostgreSQL types (`pgTable`, `gen_random_uuid()`)
- Creates confusion - which schema is source of truth?
- Imports throughout warlord-crafting-suite reference `@shared/schema` which is the OLD local file

**Solution:**
1. DELETE `apps/warlord-crafting-suite/shared/schema.ts` entirely
2. Update ALL imports in warlord-crafting-suite from `@shared/schema` to `@grudge/database`
3. Keep `packages/shared/src/schema.ts` for Zod validation only (rename exports to avoid conflicts)

---

### 🔴 CRITICAL: Duplicate Auth Systems

#### 2. Auth Implementation Files
**Location Conflict:**
- ✅ **PRIMARY (KEEP)**: `packages/auth/src/index.ts` - Workspace auth package
- ❌ **DUPLICATE**: `apps/battle-arena-server/auth.js` - Local auth file (CONSOLIDATE)

**Problem:**
- Both implement same functions: `verifyAuthToken`, `generateGrudgeId`, `updateLastLogin`, `updateTokenUsage`
- `battle-arena-server/auth.js` uses raw SQL queries (old MySQL db.cjs)
- `packages/auth/src/index.ts` has stub implementations waiting for Drizzle

**Differences:**
```javascript
// battle-arena-server/auth.js - RETURNS ACCOUNT DATA
return {
  userId, username, displayName, isPremium, isGuest,
  accountId, grudgeId, walletAddress, crossmintWalletId, crossmintEmail
};

// packages/auth/src/index.ts - HAS INTERFACE BUT NO IMPLEMENTATION
export interface UserData {
  userId, username, displayName, isPremium, isGuest,
  accountId, grudgeId, walletAddress, crossmintWalletId, crossmintEmail
}
```

**Solution:**
1. MOVE logic from `battle-arena-server/auth.js` to `packages/auth/src/index.ts`
2. Convert SQL queries to Drizzle queries using `@grudge/database`
3. DELETE `apps/battle-arena-server/auth.js`
4. Update `routes/auth.js` to import from `@grudge/auth`

---

### 🔴 CRITICAL: Profession Progression Logic Duplication

#### 3. Profession Point Calculation
**Location Conflict:**
- `apps/warlord-crafting-suite/shared/schema.ts`:
  ```typescript
  export function calculateProfessionPoints(level: number): number {
    // Complex logic: 1 point at level 1
    // 1 point every 5 levels from 5-45 (9 points)
    // 1 point every 10 levels from 50-100 (6 points)
    // Total at level 100 = 16 points
  }
  ```

- `packages/shared/src/schema.ts`:
  ```typescript
  export function getAvailableProfessionPoints(professionData): number {
    // Simpler logic: 1 point per level
    return professionData.level - professionData.pointsSpent;
  }
  ```

**Problem:**
- TWO DIFFERENT ALGORITHMS for the same concept
- Warlord uses complex milestone system (16 points max at level 100)
- Shared package uses simple 1:1 system (100 points at level 100)
- Will cause data inconsistency!

**Solution:**
1. DECIDE which system to use (recommend warlord's milestone system - more game design friendly)
2. Move chosen logic to `packages/shared/src/utils/profession.ts`
3. Delete from both schema files
4. Export from `@grudge/shared`

---

### 🟡 MEDIUM: Schema Type Conflicts

#### 4. Profession Progression Schema Definitions
**Both define same interface differently:**

`warlord-crafting-suite/shared/schema.ts`:
```typescript
export const PROFESSION_NAMES = ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'] as const;
export const professionProgressionSchema = z.object({
  Miner: professionProgressionEntrySchema.default({ level: 1, xp: 0, pointsSpent: 0 }),
  Forester: professionProgressionEntrySchema.default({ level: 1, xp: 0, pointsSpent: 0 }),
  // ... exact object shape
});
```

`packages/shared/src/schema.ts`:
```typescript
export const professionNameSchema = z.enum(['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer']);
export const professionProgressionSchema = z.record(
  professionNameSchema,
  z.object({ level, xp, pointsSpent })
);
// ... generic record type
```

**Problem:**
- Same name, different structure
- Warlord uses specific object with known keys
- Shared uses generic record type
- TypeScript will complain on imports

**Solution:**
1. Use packages/shared version (more flexible)
2. Delete from warlord schema
3. Add to database schema as type annotation

---

### 🟡 MEDIUM: Database Connection Duplication

#### 5. DB Connection Files
**Removed but may still be referenced:**
- ❌ DELETED: `apps/battle-arena-server/db.cjs` (removed in migration)
- ✅ PRIMARY: `packages/database/src/index.ts` (MySQL connection)
- ✅ UPDATED: `apps/warlord-crafting-suite/server/db.ts` (now re-exports from @grudge/database)

**Remaining Issues:**
- Battle Arena routes still import `sql from '../db.cjs'` (will break!)
- Need to update ALL route files

---

### 🟢 LOW: Puter Schema File

#### 6. Puter Integration Schema
**Location:**
- `apps/warlord-crafting-suite/puter/schema.ts`

**Analysis:**
- Appears to be Puter-specific cloud storage schema
- NOT duplicate - different purpose
- **ACTION**: Leave as-is (domain-specific)

---

## Consolidation Action Plan

### Phase 1: Schema Consolidation (CRITICAL)
1. ✅ Delete `apps/warlord-crafting-suite/shared/schema.ts`
2. ✅ Update warlord imports from `@shared/schema` → `@grudge/database`
3. ✅ Move profession logic to `packages/shared/src/utils/profession.ts`
4. ✅ Add Zod schemas to `packages/shared/src/schema.ts`

### Phase 2: Auth Consolidation (CRITICAL)
1. ✅ Implement Drizzle queries in `packages/auth/src/index.ts`
2. ✅ Copy logic from `battle-arena-server/auth.js`
3. ✅ Delete `apps/battle-arena-server/auth.js`
4. ✅ Update battle-arena routes to use `@grudge/auth`

### Phase 3: Route Updates (CRITICAL)
1. ✅ Convert `battle-arena-server/routes/auth.js` to use Drizzle
2. ✅ Update `battle-arena-server/routes/wallet.js`
3. ✅ Update `battle-arena-server/index.js` main file
4. ✅ Remove all `sql from '../db.cjs'` imports

### Phase 4: Type System Cleanup
1. ✅ Export unified types from `@grudge/shared`
2. ✅ Add type exports to `@grudge/database`
3. ✅ Ensure no circular dependencies

### Phase 5: Testing
1. ✅ Build all packages
2. ✅ Test warlord-crafting-suite database connection
3. ✅ Test battle-arena-server database connection
4. ✅ Verify auth flow works end-to-end

---

## Import Map After Consolidation

### Database Tables & ORM
```typescript
import { db, users, characters, authTokens } from '@grudge/database';
```

### Zod Validation Schemas
```typescript
import { itemSchema, recipeSchema, insertCharacterSchema } from '@grudge/shared';
```

### Auth Functions
```typescript
import { verifyAuthToken, generateGrudgeId } from '@grudge/auth';
```

### Profession Utils
```typescript
import { calculateProfessionPoints, getAvailableProfessionPoints } from '@grudge/shared/utils';
```

---

## Files to Delete

### Confirmed Deletions
1. ❌ `apps/warlord-crafting-suite/shared/schema.ts` - DUPLICATE
2. ❌ `apps/battle-arena-server/auth.js` - DUPLICATE
3. ❌ `apps/battle-arena-server/db.cjs` - ALREADY DELETED

### Files to Keep (Not Duplicates)
1. ✅ `packages/database/src/schema.ts` - PRIMARY DATABASE SCHEMA
2. ✅ `packages/shared/src/schema.ts` - ZOD VALIDATION SCHEMAS
3. ✅ `packages/auth/src/index.ts` - PRIMARY AUTH PACKAGE
4. ✅ `apps/warlord-crafting-suite/puter/schema.ts` - PUTER-SPECIFIC
5. ✅ `apps/warlord-crafting-suite/server/db.ts` - RE-EXPORTS @grudge/database

---

## Priority Order

1. **IMMEDIATE (Breaking Changes)**:
   - Delete `warlord-crafting-suite/shared/schema.ts`
   - Update warlord imports
   - Implement `@grudge/auth` with Drizzle

2. **HIGH (Data Consistency)**:
   - Consolidate profession point calculations
   - Update battle-arena routes

3. **MEDIUM (Type Safety)**:
   - Unify profession progression schemas
   - Clean up type exports

4. **LOW (Optimization)**:
   - Documentation updates
   - Type system improvements
