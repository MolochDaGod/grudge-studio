# Migration Guide: Grudge-Builder → Grudge-Studio

This guide explains how to migrate data and code from the old Grudge-Builder repository into the unified grudge-studio monorepo.

## Overview

The consolidation process involves:
1. **Data Migration** - Transfer existing game data to unified schema
2. **Code Consolidation** - Merge schemas and utilities
3. **Dependency Updates** - Update imports to use monorepo packages
4. **Testing & Validation** - Ensure everything works

## Timeline

- **Phase 1** (Week 1-2): Data audit and schema alignment
- **Phase 2** (Week 2-3): Database migration
- **Phase 3** (Week 3-4): Code consolidation
- **Phase 4** (Week 4): Testing and validation

## Pre-Migration Checklist

- [ ] Backup all existing data
- [ ] Document current schema
- [ ] List all active features in Grudge-Builder
- [ ] Identify any custom logic unique to Grudge-Builder
- [ ] Coordinate with team on migration window

## Phase 1: Schema Alignment

### 1.1 Compare Schemas

Grudge-Builder likely has custom schemas for:
- Items and weapons
- Crafting recipes
- Inventory systems
- Character progression

**Action**: Review `/Grudge-Builder/Grudge-Builder/` and document any custom fields.

### 1.2 Update Shared Schema

If Grudge-Builder has fields not in `@grudge/shared`:

```typescript
// packages/shared/src/schema.ts
export const itemSchema = z.object({
  // ... existing fields
  customGrudgeBuilderField: z.string().optional(),
});
```

### 1.3 Update Database Schema

```typescript
// packages/database/src/schema.ts
export const items = pgTable('items', {
  // ... existing fields
  customGrudgeBuilderField: text('custom_grudge_builder_field'),
});
```

## Phase 2: Database Migration

### 2.1 Backup Existing Data

```bash
# Backup old database
pg_dump grudge_builder_db > backup_grudge_builder.sql

# Export as JSON for migration
psql grudge_builder_db -c "\copy (SELECT * FROM items) TO 'items_export.json' WITH (FORMAT json);"
```

### 2.2 Create Migration Script

Create `scripts/migrate-grudge-builder.ts`:

```typescript
import { storage } from '@grudge/database';
import * as fs from 'fs';

async function migrateItems() {
  const data = JSON.parse(fs.readFileSync('items_export.json', 'utf-8'));
  
  for (const item of data) {
    await storage.db.insert(items).values({
      id: item.id,
      name: item.name,
      // Map old schema to new
      ...mapLegacyItem(item),
    });
  }
  
  console.log(`Migrated ${data.length} items`);
}

async function migrateCharacters() {
  // Similar process for characters, inventory, etc.
}

async function main() {
  try {
    await migrateItems();
    await migrateCharacters();
    // ... other migrations
    console.log('✅ Migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
```

### 2.3 Run Migration

```bash
# Test in development
DATABASE_URL="postgresql://dev:dev@localhost/grudge_studio_dev" tsx scripts/migrate-grudge-builder.ts

# Validate
pnpm db:studio
```

### 2.4 Verify Data Integrity

```typescript
// scripts/verify-migration.ts
async function verifyMigration() {
  const oldCount = await getOldDbItemCount();
  const newCount = await storage.db.select().from(items);
  
  if (oldCount !== newCount.length) {
    throw new Error('Item count mismatch!');
  }
  
  console.log(`✅ Verified: ${oldCount} items migrated`);
}
```

## Phase 3: Code Consolidation

### 3.1 Identify Duplicated Code

**Items and Recipes**:
- `Grudge-Builder/shared/schema.ts` → merge into `@grudge/shared`
- Recipe definitions → `@grudge/shared/constants`
- Sprite mappings → `@grudge/shared/constants`

**Utilities**:
- `grudgeUUID.ts` → already in Warlord, consolidate if different
- Pricing logic → `@grudge/shared/utils`
- Crafting helpers → `@grudge/shared/utils`

### 3.2 Extract to Shared

Copy and refactor unique Grudge-Builder code:

```typescript
// packages/shared/src/grudge-builder-utils.ts
// New file for any Grudge-Builder specific utilities

export function grudgeBuilderSpecificFunction() {
  // Implementation
}
```

### 3.3 Update Warlord Imports

Update `apps/warlord-crafting-suite/` to use shared packages:

**Before**:
```typescript
import { insertCharacterSchema } from '../../shared/schema';
```

**After**:
```typescript
import { insertCharacterSchema } from '@grudge/shared';
```

Use search/replace:
```bash
# Find all local imports
grep -r "from '\./.*shared" apps/warlord-crafting-suite/

# Update to use path aliases
sed -i "s|from '\.\./shared|from '@grudge/shared|g" apps/warlord-crafting-suite/**/*.ts
```

## Phase 4: Testing & Validation

### 4.1 API Testing

Test all endpoints that changed:

```bash
# Auth
curl http://localhost:5000/api/health

# Characters
curl http://localhost:5000/api/characters?userId=test-user

# Items/Crafting
curl http://localhost:5000/api/items
curl http://localhost:5000/api/recipes
```

### 4.2 Data Consistency

```typescript
// scripts/validate-data.ts
async function validateData() {
  const characters = await storage.getCharactersByUserId('test-user');
  for (const char of characters) {
    const inventory = await storage.getInventory(char.id);
    // Verify quantities > 0, valid item names, etc.
  }
  
  console.log('✅ Data consistency validated');
}
```

### 4.3 Performance Testing

```bash
# Build and measure
time pnpm build

# Run Turbo with profiling
turbo run build --profile=profile.json

# Check cache hit rates
```

## Rollback Plan

If migration fails:

1. **Restore from backup**:
```bash
psql grudge_studio_db < backup_grudge_builder.sql
```

2. **Revert commits**:
```bash
git revert <commit-hash>
git push origin main
```

3. **Notify team** and coordinate next attempt

## After Migration

### Cleanup

1. Archive Grudge-Builder repository:
```bash
git tag grudge-builder-archived-$(date +%Y%m%d)
```

2. Add deprecation notice to GitHub repo

3. Update documentation to reference grudge-studio

### Monitoring

- [ ] Monitor API error rates
- [ ] Watch database query performance
- [ ] Check user data integrity reports
- [ ] Review crash logs

### Decommission Old Repo

Once verified in production:

1. Keep old repo as archive (readonly)
2. Update README with migration notice
3. Point issues to new repo
4. Update CI/CD pipelines

## Troubleshooting

### Data Mismatch

```typescript
async function findMismatch() {
  const oldData = await queryOldDatabase();
  const newData = await storage.getAll();
  
  const missing = oldData.filter(item => 
    !newData.find(n => n.id === item.id)
  );
  
  console.log('Missing items:', missing);
}
```

### Schema Conflicts

If new schema can't represent old data:

1. Add optional fields to schema
2. Create data transformation function
3. Document legacy format handling

### Import Issues

```bash
# Check for circular dependencies
pnpm dlx madge --circular packages/*/src/index.ts

# Verify all paths resolve
pnpm type-check
```

## Communication

### Team Notifications

1. **Pre-migration** (1 week before):
   - Announcement in team chat
   - Expected downtime window
   - Testing checklist

2. **During migration** (live updates):
   - Progress updates every 30 mins
   - Issues and fixes
   - ETA for completion

3. **Post-migration** (validation phase):
   - Data integrity results
   - Performance comparison
   - Known issues

## Documentation Updates

Update these docs after migration:

- [ ] README.md - Remove old setup instructions
- [ ] ARCHITECTURE.md - Document consolidated systems
- [ ] API.md - List all endpoints
- [ ] DATABASE.md - Schema documentation

## Success Criteria

✅ Migration is successful when:

- [ ] All data migrated without loss
- [ ] All tests passing
- [ ] No performance degradation
- [ ] All APIs responding correctly
- [ ] Users can log in and access data
- [ ] Crafting system works end-to-end
- [ ] Database queries optimized

---

**Questions?** See [Architecture docs](./docs/ARCHITECTURE.md) or create an issue.
