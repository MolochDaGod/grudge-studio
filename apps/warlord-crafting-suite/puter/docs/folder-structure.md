# GRUDGE Warlords - Complete Folder Structure Guide

This document explains the complete folder organization for the GRUDGE Warlords project across Replit (local development) and Puter (cloud hosting).

## Replit Workspace Structure

```
workspace/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React Context providers
│   │   ├── data/                # Game data (professions, items)
│   │   ├── domains/             # Feature domains (barrel exports)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and helpers
│   │   ├── pages/               # Page components (wouter routes)
│   │   └── App.tsx              # Main app with routing
│   ├── index.html               # Entry HTML (includes Puter CDN)
│   └── public/                  # Static assets
│
├── server/                      # Express.js Backend
│   ├── routes.ts                # API route definitions
│   ├── storage.ts               # Database interface (IStorage)
│   ├── accountSync.ts           # SHA change detection system
│   ├── sheetSync.ts             # Google Sheets integration
│   └── index.ts                 # Server entry point
│
├── shared/                      # Shared Code (Frontend + Backend)
│   ├── schema.ts                # Drizzle ORM schema (source of truth)
│   └── statCalculator.ts        # Hero stat calculations
│
├── puter/                       # Puter Integration Source
│   ├── apps/                    # App source files
│   │   ├── grudge-auth/         # Auth service
│   │   ├── grudge-cloud/        # Admin storage tool
│   │   ├── grudge-server/       # API worker
│   │   └── grudge-studio/       # Frontend app
│   ├── agents/                  # AI agent scripts
│   ├── deploy/                  # Deployment scripts
│   ├── docs/                    # This documentation
│   ├── storage/                 # Storage utilities
│   ├── sync/                    # Cloud sync services
│   ├── types/                   # TypeScript types
│   └── workers/                 # Worker code
│
├── puter-deploy/                # Built/Ready-to-Deploy Files
│   ├── grudge-auth/             # Auth app (index.html, manifest)
│   ├── grudge-cloud/            # Admin tool
│   ├── grudge-server/           # API worker (index.js)
│   └── grudge-studio/           # Main frontend
│
├── docs/                        # General Documentation
│   ├── README.md                # Documentation index
│   ├── api-reference.md         # Backend API docs
│   ├── hero-stats-guide.md      # Stats system
│   ├── professions-crafting-guide.md
│   └── network-architecture.md  # Multi-app topology
│
├── attached_assets/             # Uploaded files and generated images
│   ├── generated_images/        # AI-generated sprites
│   └── stock_images/            # Stock photos
│
└── replit.md                    # Project memory file (THIS!)
```

## Puter Cloud Structure

When files are uploaded to Puter, they live in your cloud storage:

```
/                                # Puter Cloud Root
├── GRUDACHAIN/                  # Your project folder
│   ├── puter-deploy/            # Deployment files
│   │   ├── grudge-auth/
│   │   │   ├── index.html
│   │   │   └── puter-manifest.json
│   │   ├── grudge-cloud/
│   │   ├── grudge-server/
│   │   │   └── index.js
│   │   └── grudge-studio/
│   │
│   └── grudge-warlords/         # Game data storage
│       └── assets/
│           └── sprites/
│
└── AppData/                     # App-specific storage (auto-created)
    └── <app-uuid>/              # Each app gets isolated storage
```

## Understanding the Two Folder Types

### Source vs Deploy

| Folder | Purpose | When to Edit |
|--------|---------|--------------|
| `puter/apps/*` | Source files for development | Always edit here first |
| `puter-deploy/*` | Built/copied files for deployment | Never edit directly |

**Workflow:**
1. Edit in `puter/apps/grudge-auth/`
2. Copy to `puter-deploy/grudge-auth/`
3. Upload to Puter cloud
4. Deploy with `site:deploy`

### Local vs Cloud

| Location | Purpose | Access Method |
|----------|---------|---------------|
| Replit `puter/` | Development and source control | File editor, git |
| Puter `/GRUDACHAIN/` | Cloud storage and deployment | Puter CLI, puter.fs API |
| Puter `AppData/` | Per-app isolated storage | puter.fs (sandboxed) |

## App File Requirements

### Static HTML Apps (grudge-auth, grudge-cloud)
```
grudge-auth/
├── index.html              # Required - main entry point
└── puter-manifest.json     # Optional - app configuration
```

### JavaScript Workers (grudge-server)
```
grudge-server/
├── index.js                # Required - worker entry point
└── puter-manifest.json     # Optional - permissions
```

## Key Files by Purpose

### Authentication
- `puter/apps/grudge-auth/index.html` - SSO hub
- `client/src/contexts/AuthContext.tsx` - React auth state
- `server/routes.ts` - Login/register endpoints

### Game Data
- `shared/schema.ts` - Database schema (source of truth)
- `client/src/data/*.ts` - Profession skill trees
- Google Sheets - External data source

### Puter Integration
- `client/index.html` - Loads Puter.js CDN
- `client/src/lib/puter.ts` - TypeScript wrapper
- `puter/workers/*.ts` - Serverless functions

### Documentation
- `replit.md` - Project memory (AI reads this)
- `puter/docs/*.md` - Puter API documentation
- `docs/*.md` - Game system documentation

## Deployment Checklist

1. **Update source files** in `puter/apps/<app>/`
2. **Copy to deploy folder**: `puter-deploy/<app>/`
3. **Upload to Puter cloud**: 
   ```bash
   puter shell
   update ./puter-deploy/grudge-auth /GRUDACHAIN/puter-deploy/grudge-auth
   ```
4. **Deploy to subdomain**:
   ```bash
   cd /GRUDACHAIN/puter-deploy/grudge-auth
   site:deploy . --subdomain=grudge-auth-73v97
   ```
5. **Verify** at https://grudge-auth-73v97.puter.site

## Common Mistakes to Avoid

| Mistake | Solution |
|---------|----------|
| Editing `puter-deploy/` directly | Always edit `puter/apps/` first |
| Wrong path in Puter shell | Use absolute paths or `cd` first |
| Spaces in app names | Use quotes: `"grudge auth"` |
| Relative paths | Navigate to directory first |
| Forgetting to upload before deploy | Run `update` command first |
