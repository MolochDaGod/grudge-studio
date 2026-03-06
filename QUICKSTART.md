# Quick Start Guide

Get the Grudge Studio monorepo running in minutes!

## 1️⃣ Clone & Install

```bash
git clone https://github.com/GrudgeDaDev/grudge-studio.git
cd grudge-studio
pnpm install
```

## 2️⃣ Configure Environment

```bash
# Copy example env
cp .env.example .env.local

# Edit with your database URL
# DATABASE_URL=postgresql://user:pass@localhost/grudge_studio
```

## 3️⃣ Setup Database

```bash
# Push schema to PostgreSQL
pnpm db:push

# Optional: Open Drizzle Studio for visualization
pnpm db:studio
```

## 4️⃣ Start Development

```bash
# Start all apps
pnpm dev

# Or just Warlord-Crafting-Suite
pnpm dev:warlord
```

Open http://localhost:5000 in your browser!

## 📁 Project Layout

```
grudge-studio/
├── apps/warlord-crafting-suite/    ← Main application
├── packages/shared/                ← Shared types & schemas
├── packages/database/              ← Database layer
├── packages/google-sheets-sync/    ← Sheet integration
├── packages/puter-sync/            ← Cloud storage
└── packages/ui-components/         ← React components
```

## 🔧 Common Commands

```bash
# Development
pnpm dev              # Start all
pnpm dev:warlord     # Start main app only
pnpm type-check      # Check TypeScript
pnpm lint            # Lint code

# Build & Deploy
pnpm build           # Build all packages
pnpm clean           # Clean artifacts

# Database
pnpm db:push         # Apply schema changes
pnpm db:generate     # Generate migrations
pnpm db:studio       # GUI database editor

# Data Sync
pnpm sheets:sync     # Sync Google Sheets
pnpm sheets:refresh  # Force refresh
```

## 📚 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design & data flow
- **[API Reference](./docs/API.md)** - All endpoints
- **[Contributing](./CONTRIBUTING.md)** - Development guidelines
- **[Integration](./docs/INTEGRATION.md)** - Migration from Grudge-Builder

## 🚀 First Steps

1. **Create a character**:
```bash
curl -X POST http://localhost:5000/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "name": "My Hero",
    "classId": "Warrior",
    "raceId": "Human"
  }'
```

2. **Check the game**:
   - Go to http://localhost:5000
   - Sign up or login
   - Create character
   - View inventory
   - Unlock recipes
   - Start crafting!

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port
PORT=3000 pnpm dev
```

**Database connection error?**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Dependencies won't install?**
```bash
# Clear and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

## 📦 Packages Overview

| Package | Purpose | Status |
|---------|---------|--------|
| `@grudge/shared` | Schemas, types, constants | ✅ Ready |
| `@grudge/database` | Drizzle ORM + DB | ✅ Ready |
| `@grudge/google-sheets-sync` | Sheet integration | 🔄 In Progress |
| `@grudge/puter-sync` | Cloud storage | 🔄 In Progress |
| `@grudge/ui-components` | React components | 📋 Planned |
| `warlord-crafting-suite` | Main app | ✅ Ready |

## 🔄 Monorepo Commands

These work across all packages:

```bash
# Build everything
pnpm build

# Check types everywhere
pnpm type-check

# Format code
pnpm format

# Run tests
pnpm test

# Clean all
pnpm clean
```

## 📝 File Structure

```
grudge-studio/
├── .gitignore              # Git ignore rules
├── .editorconfig           # Editor formatting
├── turbo.json             # Turbo config
├── pnpm-workspace.yaml    # Workspace config
├── tsconfig.json          # Root TypeScript
├── package.json           # Root dependencies
│
├── apps/
│   └── warlord-crafting-suite/
│       ├── client/        # React frontend
│       ├── server/        # Express backend
│       ├── shared/        # App-specific types
│       └── package.json
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── schema.ts       # Zod schemas
│   │   │   ├── constants.ts    # Game constants
│   │   │   └── index.ts        # Exports
│   │   └── package.json
│   │
│   ├── database/
│   │   ├── src/
│   │   │   ├── schema.ts       # Drizzle tables
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── [other packages]
│
├── scripts/
│   └── [automation scripts]
│
└── docs/
    ├── ARCHITECTURE.md    # System design
    ├── API.md            # Endpoint reference
    └── INTEGRATION.md    # Migration guide
```

## 🎯 Next: What to Build?

After setup, consider:

1. **Consolidate Grudge-Builder** schemas into @grudge/shared
2. **Create data migration** script for existing items
3. **Build UI components** (Inventory, Shop, Crafting)
4. **Set up CI/CD** with GitHub Actions
5. **Deploy** to Vercel or Replit

## 💡 Tips

- Use `--filter` to rebuild specific packages:
  ```bash
  turbo run build --filter=@grudge/shared
  ```

- Watch mode during development:
  ```bash
  pnpm dev:warlord  # Auto-rebuilds on changes
  ```

- Check what changed:
  ```bash
  git diff
  git log --oneline
  ```

## 🤝 Need Help?

- Check [docs/](./docs/) for guides
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)
- Check existing code for patterns
- Create an issue on GitHub

---

**Happy coding! 🚀**
