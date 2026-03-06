# GRUDGE Warlords - Crafting & Progression System

## Overview
GRUDGE Warlords is a full-stack web application designed to manage a comprehensive crafting and character progression system for a fantasy game. It features profession specialization trees, item tier upgrades (T1-T8), class skill trees, and extensive databases for weapons, armor, and potions. The project aims to provide a persistent and engaging progression experience for players, supporting a rich in-game economy and strategic character development. The business vision is to provide a full-fledged crafting system for fantasy game assets.

## User Preferences
- Profession names should be simple: Miner, Forester, Mystic, Chef, Engineer
- UI should be bright with visible background images
- Application should be embeddable in main GRUDGE Warlords app
- Deploy to Puter for free hosting and AI
- Multi-platform: works on phone, tablet, desktop, and PWA

## System Architecture
The application is built as a full-stack web application with a focus on modularity and multi-platform support.

**Frontend**:
-   **Framework**: React with TypeScript and Vite
-   **Styling**: TailwindCSS, shadcn/ui
-   **Routing**: Wouter
-   **State Management**: React Context + React Query
-   **UI/UX Decisions**: Bright UI with visible background images, designed for multi-platform compatibility (phones, tablets, desktops, PWAs).

**Backend**:
-   **Framework**: Express.js
-   **Database**: PostgreSQL via Drizzle ORM

**Core Features**:
-   **Professions**: Five distinct professions (Miner, Forester, Mystic, Chef, Engineer) with skill trees.
-   **Item System**: Databases for weapons (96 items), armor (240+ items), potions, and crafting materials, including a T1-T8 item tier upgrade system.
-   **Crafting & Inventory**: Interfaces for crafting, recipe browsing, and inventory management, including an AFK crafting queue.
-   **Shop System**: A trading post for buying/selling materials, recipes, and crafted items with tier-based pricing.
-   **Character Progression**: Management of character skill trees, unlocked skills, level, experience, and currency.
-   **Account Management**: User authentication with Puter SSO, character management, and cross-application account synchronization with role-based access control (admin, developer, ai_agent, premium, user, guest).
-   **SSO Security Model**: HMAC-signed tokens with SESSION_SECRET, Puter UUID binding (existing accounts require password login to link), privileged username blocking (admin/developer accounts require direct login), role restrictions (SSO only grants user/premium/guest), rate limiting (10 requests/minute per IP), and account takeover protection (linked accounts verify UUID match).
-   **Data Management**: Raw data files serve as the source of truth, with validation and export scripts.
-   **AI Agents**: Asset analysis, sprite detection, recipe validation, data categorization, and balance checking.
-   **NPC Intelligence**: AI-powered NPCs with KV memory.
-   **P2P Messaging**: Peer-to-peer chat between GrudgeAccounts using KV queues.
-   **Admin Tools**: Admin Map Editor for terrain editing and asset placement, and enhanced Admin page for game management (Economy, Recipes, Items).
-   **Sprite Management**: Expandable sprite grids showing all 172+ local sprites across 22 categories, with click-to-assign modal for linking sprites to items/abilities/skills/UI elements. Supports both local and cloud sprites with Puter KV persistence.

-   **Grudge UUID System**: Human-readable structured identifiers (format: `SLOT-TIER-ITEMID-TIMESTAMP-COUNTER`) for items, sprites, abilities, skills, and UI elements. Supports T0-T8 tiers, base-36 counters, and Texas time timestamps.

**System Design Choices**:
-   **Modularity**: Frontend data and logic are organized into `domains/` with barrel exports.
-   **Asset Management**: Game art assets are stored in cloud object storage.
-   **Deployment**: Optimized for Puter, utilizing a multi-app architecture for authentication, server, storage management, and the main frontend.
-   **API Design**: RESTful API endpoints for character management, skill progression, inventory, shop transactions, and data synchronization.
-   **Puter KV Best Practices**: Strict JSON stringification/parsing and key namespacing (`grudge_session_*`, `grudge_npc_*`, `grudge_job_*`, `grudge_data_*`, `grudge_asset_*`).

## Puter Deployment

**Deployed App URLs** (source of truth: `puter/config/app-urls.json`):
| App | Subdomain | Live URL |
|-----|-----------|----------|
| grudge-auth | grudge-auth-73v97 | https://grudge-auth-73v97.puter.site |
| grudge-apps | grudge-apps | https://grudge-apps.puter.site |
| grudge-cloud | grudgecloud-85c9p | https://grudgecloud-85c9p.puter.site |
| grudge-studio | grudge-crafting | https://grudge-crafting.puter.site |

**Deployment Method**:
1. Open `puter-deploy/quick-deploy.html` as a Puter app to deploy all apps at once
2. Or use browser console: `puter.hosting.update('subdomain', '/path')`

**Deployment Source Files** (in `puter-deploy/`):
- `grudge-auth/` - Auth portal with Puter SSO
- `grudge-apps/` - Apps portal showing all GRUDGE apps  
- `grudge-cloud/` - Cloud admin for asset management
- `grudge-studio/` - Main app (built from Vite)
- `grudge-server/` - API server worker
- `quick-deploy.html` - One-click deployment tool

**Key Configuration**:
- All apps reference `puter/config/app-urls.json` for correct URLs
- AUTH_URL must match the actual deployed auth subdomain (with suffix)
- APPROVED_APPS whitelist controls which hosts can receive redirects

## Project Structure

```
├── client/           # React frontend source
├── server/           # Express.js backend
├── shared/           # Shared types and schemas
├── puter/            # Puter configuration and tools
│   ├── config/       # App URLs and settings
│   ├── agents/       # AI agent definitions
│   ├── workers/      # Puter worker scripts
│   └── docs/         # Puter-specific documentation
├── puter-deploy/     # Deployment-ready files (source of truth)
├── attached_assets/  # Game assets (sprites, images)
├── public/           # Static public assets
├── scripts/          # Utility scripts
├── docs/             # Project documentation
└── data-exports/     # Exported game data (CSV/JSON)
```

## External Dependencies
-   **Cloud Storage**: Replit Object Storage (for game art assets)
-   **Puter**: Free hosting, AI, KV, Workers, Hosting, Networking, UI, Apps for deployment and integration.
-   **PostgreSQL**: Relational database for persistent storage.
-   **Google Sheets**: Used for live synchronization of game data (weapons, armor, recipes, items) and cross-application user accounts.
-   **Vite**: Frontend build tool.
-   **TailwindCSS**: Utility-first CSS framework.
-   **shadcn/ui**: UI component library.
-   **React Query**: Data fetching and caching library.
-   **Drizzle ORM**: TypeScript ORM for PostgreSQL.
-   **Express.js**: Backend web application framework.
-   **bcrypt**: Password hashing library for authentication.