# Grudge Studio Ecosystem

## Overview

Grudge Studio is a distributed game development platform powering the Grudge Warlords universe. It spans Vercel, Puter, and GitHub Pages, unified through a common auth gateway and shared ObjectStore data layer.

Last verified: 2026-02-28

## Architecture

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚       Grudge Studio App               â”‚
                    â”‚   (grudge-studio-app.puter.site)      â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                 â”‚ orchestrates
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
         â”‚                       â”‚                       â”‚
    â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”           â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”
    â”‚  Puter  â”‚           â”‚   Vercel    â”‚         â”‚   GitHub    â”‚
    â”‚  Sites  â”‚           â”‚  auth-gw    â”‚         â”‚   Pages     â”‚
    â”‚ + AI/KV â”‚           â”‚   (API)     â”‚         â”‚  (Static)   â”‚
    â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
         â”‚                       â”‚                       â”‚
    Puter SSO              Neon PostgreSQL          ObjectStore
    puter.kv / ai          + Supabase               icon-index.json
```

## Deployed Backend: auth-gateway (âœ… LIVE)

The only deployed backend with a database.

- **URL**: https://id.grudge-studio.com
- **Repo**: github.com/MolochDaGod/auth-gateway (private)
- **Local**: `Warlord-Crafting-Suite/auth-gateway`
- **Runtime**: Vercel Serverless Functions (Node.js)
- **DB**: Neon PostgreSQL (pooled) + Supabase

### API Endpoints (`/api/*`)

- `GET /api/health` â€” Health check
- `POST /api/login` â€” Username/password auth
- `POST /api/register` â€” New account creation
- `POST /api/verify` â€” Token verification
- `POST /api/guest` â€” Guest session
- `GET /api/discord` â€” Discord OAuth callback
- `GET /api/github` â€” GitHub App OAuth callback
- `GET /api/google` â€” Google OAuth callback
- `POST /api/puter` â€” Puter auth bridge
- `POST /api/connect-wallet` â€” Crossmint wallet linking
- `POST /api/create-crossmint-wallet` â€” New Crossmint wallet
- `GET /api/db-test` â€” DB connectivity check
- `POST /api/migrate` â€” Run schema migrations

## Local-Only Backend: api-server (âŒ NOT DEPLOYED)

- **Local**: `grudge-studio/apps/api-server/`
- **Purpose**: REST API for game-data, AI agents, sync, UUID generation
- **Has `vercel.json`** but no Vercel project or GitHub repo exists for it
- Endpoints: `/api/v1/game-data`, `/api/v1/assets`, `/api/v1/ai`, `/api/v1/sync`, `/api/v1/uuid`, `/api/v1/github`

## GitHub Pages: ObjectStore (âœ… LIVE)

- **URL**: https://molochdagod.github.io/ObjectStore/
- **Repo**: github.com/MolochDaGod/ObjectStore (public)
- **Index**: `icons/icon-index.json`
- **Content**: Sprite PNGs for weapons, materials, professions, attributes
- Static-only, no auth required. All games fetch from here.

## GitHub Pages: GrudgeStudioNPM (âœ… LIVE)

- **URL**: https://molochdagod.github.io/GrudgeStudioNPM/
- **Repo**: github.com/MolochDaGod/GrudgeStudioNPM (public)
- **Content**: playground.html â€” Three.js r150 with 4 race models, 15 weapons, admin panel, hotbar, ObjectStore integration

## Puter Sites (âœ… LIVE)

- **grudge-studio-app.puter.site** â€” Main studio app: 3D editor, AI agents, asset browser, KV storage, service monitor
- **grudge-command-center.puter.site** â€” Worker/site ops dashboard with 7 AI agents
- **grudachain-ve8e8.puter.site** â€” GrudaChain Hub (node explorer)

## Puter Sites (âŒ DOWN / UNVERIFIED)

- **grudge-admin.puter.site** â€” Returns 404 (orphaned subdomain)
- **authgrudge.puter.site** â€” Status unknown (legacy auth page)
- **grudge-attack-system.puter.site** â€” Status unknown (combat demo)

## Puter App

- **puter.com/app/Grudge-Game-Editor** â€” Registered to GRUDACHAIN, but `index_url` still points to old VJS fork (`colorful-puppy-4769-zilvf.puter.site`). Puter API does not allow programmatic update of forked app metadata.

### Puter SDK Features Used

- **puter.kv** â€” Key-value storage for game state, user prefs, scene saves
- **puter.fs** â€” Cloud filesystem for deploy scripts, site hosting
- **puter.ai** â€” AI chat powering the 7 studio agents
- **puter.auth** â€” SSO (signIn, getUser) used by studio app and command center
- **puter.hosting** â€” Subdomain management (create/update sites)

## Puter-Hosted Games

| Game | URL | Description |
|------|-----|-------------|
| Grudge Angler | puter.com/app/grudge-angler | Fishing game |
| Beta GRUDA | puter.com/app/betagamegruda | Core game beta |
| Grudge RPG | puter.com/app/grudgeRPG | RPG progression |
| DiGrudge | puter.com/app/DiGrudge | Card/battle mode |
| Nexus-3 | puter.com/app/nexus-3 | Multiplayer hub |
| Game Editor | puter.com/app/Grudge-Game-Editor | Studio app (needs URL fix) |
| Grudge GRUDA | puter.com/app/grudgegruda | GRUDA game app |

## Vercel Deployments

- **auth-gateway-flax.vercel.app** â€” Auth backend (the real deployed API)
- **starwaygruda-webclient-as2n.vercel.app** â€” Starway GRUDA web client
- **grudachain-rho.vercel.app** â€” GRUDA Legion Standalone AI System

## Deploy Scripts

### Puter Sites (via deploy-puter.mjs)

```bash
# Each app has its own deploy-puter.mjs that bypasses the puter-cli Windows backslash bug
node apps/command-center/deploy-puter.mjs          # â†’ grudge-command-center.puter.site
node apps/grudge-studio-app/deploy-puter.mjs       # â†’ grudge-studio-app.puter.site
```

### Vercel (auth-gateway)

```bash
cd Warlord-Crafting-Suite/auth-gateway
git add -A && git commit -m "update"
git push origin master
# Vercel auto-deploys from master branch
```

### GitHub Pages (ObjectStore / GrudgeStudioNPM)

```bash
cd ObjectStore && git push origin main
cd GrudgeStudioNPM && git push origin main
# GitHub Pages auto-deploys
```

## Key Integration Points

1. **Auth**: Puter SSO for studio/command-center apps; auth-gateway for Discord/GitHub/wallet login
2. **Game Data**: All apps fetch sprites and stats from ObjectStore (GitHub Pages)
3. **State**: Puter KV stores session data, scene saves, user prefs
4. **AI**: puter.ai powers 7 specialized agents in studio app and command center
5. **Accounts**: auth-gateway stores users in Neon PostgreSQL + Supabase

## Local Directory Map

```
Documents/
â”œâ”€â”€ 1111111/
â”‚   â”œâ”€â”€ grudge-studio/             # Monorepo (apps + packages + docs)
â”‚   â”‚   â”œâ”€â”€ apps/                  # 7 apps (api-server, studio, arena, etc.)
â”‚   â”‚   â”œâ”€â”€ packages/              # 7 packages (shared, auth, db, etc.)
â”‚   â”‚   â””â”€â”€ puter-deploy/          # Legacy Puter deploy files
â”‚   â”œâ”€â”€ ObjectStore/               # â†’ molochdagod.github.io/ObjectStore/
â”‚   â””â”€â”€ Warlord-Crafting-Suite/
â”‚       â””â”€â”€ auth-gateway/          # â†’ auth-gateway-flax.vercel.app
â””â”€â”€ GitHub/
    â””â”€â”€ GrudgeStudioNPM/           # â†’ molochdagod.github.io/GrudgeStudioNPM/
```
