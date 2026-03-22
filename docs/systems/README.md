# Grudge Studio — System Documentation Pages

These are the corrected HTML documentation pages deployed to `grudge-studio.com`.

## Live URLs

| Page | URL | Description |
|------|-----|-------------|
| Backend Roadmap | [grudge-studio.com/backend](https://grudge-studio.com/backend) | Backend architecture, DB schema, API patterns, GBux ledger, Crossmint integration |
| Client Portal | [grudge-studio.com/client](https://grudge-studio.com/client) | Player login hub, account management, connected services, AI console |
| Infrastructure Bible | [grudge-studio.com/infra](https://grudge-studio.com/infra) | Full project registry, Vercel config, env vars, shared libs, audit checklist |
| Systems Master | [grudge-studio.com/systems](https://grudge-studio.com/systems) | Ecosystem overview, Docker services, shared auth/UI/backend patterns |

### Subdomains

| Subdomain | Description |
|-----------|-------------|
| [client.grudge-studio.com](https://client.grudge-studio.com) | Client Portal (same as /client) — player login + account management |
| [wallet.grudge-studio.com](https://wallet.grudge-studio.com) | Server-side Solana wallet viewer, auth via id.grudge-studio.com |

## Corrections Applied (March 2026)

The originals referenced Supabase, NeonDB, and Next.js App Router. These were corrected to match the **actual** Grudge Studio infrastructure:

- **Database**: MySQL 8 (Docker container on VPS 74.208.155.229)
- **Auth**: Web3Auth + Discord OAuth + JWT via `id.grudge-studio.com`
- **Backend**: Express.js services in Docker (Coolify + Traefik)
- **Cache**: Redis 7 (Docker)
- **CDN**: Cloudflare R2 via `assets.grudge-studio.com`
- **Removed**: Exposed API keys, localStorage usage, wrong endpoint URLs

## Directory Structure

```
docs/systems/
├── backend-roadmap.html     # Corrected — deployed at /backend
├── client-portal.html       # Corrected — deployed at /client + client.grudge-studio.com
├── infra-bible.html         # Corrected — deployed at /infra
├── systems-master.html      # Corrected — deployed at /systems
├── originals/               # Pre-correction versions for reference
│   ├── backend-roadmap-original.html
│   ├── client-portal-original.html
│   ├── infra-bible-original.html
│   └── systems-master-original.html
└── README.md                # This file
```

## Deployment

These pages are served by the `grudge-studio-site` Cloudflare Worker. The HTML files are imported as text modules:

```
cloudflare/workers/site/pages/backend.html → grudge-studio.com/backend
cloudflare/workers/site/pages/client.html  → grudge-studio.com/client
cloudflare/workers/site/pages/infra.html   → grudge-studio.com/infra
cloudflare/workers/site/pages/systems.html → grudge-studio.com/systems
```

To update: edit the HTML files in `grudge-studio-backend/cloudflare/workers/site/pages/`, then run `npx wrangler deploy` from that directory.
