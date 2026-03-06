# Build Guide - Grudge Studio

Complete guide to building the entire monorepo.

---

## 🚀 Quick Build

### Windows
```batch
.\build.bat
```

### macOS/Linux
```bash
./build.sh
```bash
node build.js
# or
pnpm build:full
```

---

## 📋 Build Steps

### Step 1: Verify Dependencies
Checks if `node_modules/` exists. If not, installs via `pnpm install`.

```bash
pnpm install
```

### Step 2: TypeScript Type Check
Validates all TypeScript files across all packages.

```bash
pnpm type-check
```

Expected: No type errors

### Step 3: Clean
Removes all previous build artifacts.

```bash
pnpm clean
```

Removes:
- All `dist/` directories
- All `.turbo/` caches
- Build artifacts

### Step 4: Build
Builds all packages using Turbo build system.

```bash
pnpm build
```

Builds in order:
1. @grudge/shared (types, schemas, constants)
2. @grudge/database (Drizzle ORM, schemas)
3. @grudge/google-sheets-sync (Google integration)
4. @grudge/puter-sync (Cloud storage integration)
5. @grudge/ui-components (React components)
6. warlord-crafting-suite (Main application)

### Step 5: Verify Artifacts
Checks that all build output files exist.

Expected files:
- `packages/shared/dist/index.js`
- `packages/shared/dist/index.d.ts`
- `packages/database/dist/index.js`
- `packages/database/dist/schema.js`
- etc.

### Step 6: Run Tests
Runs all 50+ tests.

```bash
pnpm test
```

---

## 📊 Build Output

### Build Artifacts Location

```
grudge-studio/
├── packages/shared/dist/
│   ├── index.js           ← Exports all types
│   ├── schema/
│   ├── constants/
│   └── types/
├── packages/database/dist/
│   ├── index.js           ← Drizzle DB instance
│   └── schema.js
├── packages/google-sheets-sync/dist/
├── packages/puter-sync/dist/
├── packages/ui-components/dist/
└── apps/warlord-crafting-suite/dist/
    ├── index.cjs          ← Node.js entry point
    └── client/            ← Frontend assets
```

---

## 🔧 Individual Package Builds

Build specific packages:

```bash
# Build one package
pnpm build --filter=@grudge/shared

# Build app only
pnpm build --filter=warlord-crafting-suite

# Build multiple
pnpm build --filter={@grudge/shared,@grudge/database}
```

---

## 🧪 Testing During Build

### Include Tests
```bash
pnpm build:full  # Includes tests
```

### Skip Tests
```bash
pnpm build  # Build only
```

### Run Tests Separately
```bash
pnpm test              # All tests
pnpm test:server       # Server tests only
pnpm test:client       # Client tests only
pnpm test:coverage     # With coverage
```

---

## 🔍 Troubleshooting Build Issues

### Issue: "Cannot find module"

**Cause**: Dependencies not installed

**Fix**:
```bash
pnpm install
pnpm build
```

### Issue: "TypeScript compilation error"

**Cause**: Type errors in code

**Fix**:
```bash
pnpm type-check  # See detailed errors
# Fix errors
pnpm build
```

### Issue: "Out of memory"

**Cause**: Large build consuming too much memory

**Fix**:
```bash
# Increase Node heap
set NODE_OPTIONS=--max-old-space-size=4096
pnpm build
```

### Issue: "Build takes too long"

**Cause**: First build takes longer

**Fix**:
- First build caches TypeScript information (~2 min)
- Subsequent builds are faster (~30 sec)
- Use `pnpm build --filter=<package>` for single package

### Issue: "Port already in use"

**Cause**: Previous dev server still running

**Fix**:
```bash
# Find and kill process on port 5000
# Windows: netstat -ano | findstr 5000
# macOS/Linux: lsof -i :5000

# Or use different port
PORT=3000 pnpm dev
```

---

## 📈 Build Performance

### Typical Build Times

| Scenario | Time |
|----------|------|
| First build (cold) | 2-3 min |
| Rebuild (warm cache) | 30-60 sec |
| Single package | 5-10 sec |
| Type check only | 10-20 sec |

### Optimize Build Speed

```bash
# Clear Turbo cache (last resort)
pnpm clean

# Rebuild specific package
pnpm build --filter=@grudge/shared

# Build in parallel (default)
pnpm build  # Uses turbo parallelization
```

---

## ✅ Build Checklist

Before considering build complete:

- [ ] No build errors (errors shown in red)
- [ ] No TypeScript errors (should pass type-check)
- [ ] All dist/ directories created
- [ ] Tests pass (or skipped intentionally)
- [ ] Build artifacts are correct size (>0 bytes)

---

## 🚀 What's Built

### @grudge/shared
- Type definitions
- Zod schemas
- Game constants
- Utility functions

### @grudge/database
- Drizzle ORM client
- Database schema
- 16 table definitions
- Relations between tables

### @grudge/google-sheets-sync
- Google Sheets API integration
- Data sync utilities

### @grudge/puter-sync
- Puter cloud storage integration
- File sync utilities

### @grudge/ui-components
- React components
- Tailwind CSS styles
- UI utilities

### warlord-crafting-suite
- Express.js server
- React frontend
- Socket.io real-time
- Game logic

---

## 📝 Next Steps After Build

### 1. Development
```bash
pnpm dev
# Runs on http://localhost:5000
```

### 2. Database
```bash
# Setup PostgreSQL first
pnpm db:push  # Apply schema
```

### 3. Deployment
```bash
pnpm deploy:check  # Final check before deploy
# See: DEPLOY_TO_PRODUCTION.md
```

---

## 💡 Advanced Build Commands

### Monitor Build
```bash
# See what Turbo is doing
pnpm build --verbose
```

### Rebuild Single Package
```bash
pnpm build --filter=@grudge/database --force
```

### Clean and Rebuild
```bash
pnpm clean
pnpm build
```

### Build with Different Target
```bash
# Build for production
NODE_ENV=production pnpm build

# Build with source maps
pnpm build --
```

---

## 🎯 Build Success Indicators

✅ **All green**:
- `pnpm build` exits with code 0
- No red error messages
- `dist/` directories are not empty
- `pnpm type-check` passes
- Tests pass (or intentionally skipped)

❌ **Build failed**:
- Non-zero exit code
- Red error messages
- Missing `dist/` files
- TypeScript errors
- Test failures

---

## 📞 Getting Help

| Issue | Command |
|-------|---------|
| See build errors | `pnpm build --verbose` |
| Check types | `pnpm type-check` |
| View test output | `pnpm test` |
| Rebuild one package | `pnpm build --filter=<name>` |
| Force rebuild | `pnpm clean && pnpm build` |

---

## 🎉 Build Complete!

After successful build, you have:
- ✅ All packages compiled
- ✅ All dependencies resolved
- ✅ Type safety verified
- ✅ Tests passing
- ✅ Ready for development or deployment

**Next**: `pnpm dev` or follow deployment guide

---

**Happy building!** 🚀
