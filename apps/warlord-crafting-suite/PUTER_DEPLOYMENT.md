# GRUDGE Warlords - Puter Deployment Guide

## Overview

This guide explains how to deploy GRUDGE Warlords to [Puter](https://puter.com) for **free** hosting with integrated AI capabilities.

## Prerequisites
- puter-cli installed: `npm install -g puter-cli`
- Puter account (free at https://puter.com)

## Quick CLI Deployment

### 1. Login to Puter
```bash
puter login
```
Follow the prompts to authenticate.

### 2. Deploy All Apps
```bash
./deploy-puter.sh
```

Or deploy individually:
```bash
# Apps Portal
puter app:create grudge-apps puter-deploy/grudge-apps --description="GRUDGE Warlords Apps Portal"

# Authentication
puter app:create grudge-auth puter-deploy/grudge-auth --description="GRUDGE Authentication Portal"

# Cloud Admin
puter app:create grudge-cloud puter-deploy/grudge-cloud --description="GRUDGE Cloud Asset Manager"
```

### 3. Update Existing Apps
```bash
# Enter interactive shell
puter shell

# Update apps
puter> app:update grudge-apps puter-deploy/grudge-apps
puter> app:update grudge-auth puter-deploy/grudge-auth
puter> app:update grudge-cloud puter-deploy/grudge-cloud
```

### 4. List Your Apps
```bash
puter shell
puter> apps
puter> sites
```

## Deployed App URLs

| App | URL | Description |
|-----|-----|-------------|
| Apps Portal | https://grudge-apps.puter.site | Main launcher for all apps |
| Auth | https://grudge-auth-73v97.puter.site | SSO authentication |
| Cloud | https://grudgecloud-85c9p.puter.site | Asset management |
| Crafting | https://grudge-crafting.puter.site | Puter-hosted frontend |
| Platform | https://grudgeplatform.puter.site | Platform hub |
| Islands | https://islands-cu83xisb0g.puter.site | Home Islands RTS |
| Launcher | https://grudge-launcher-xu9q5.puter.site | Quick launcher |
| Editor | https://colorful-puppy-4769-zilvf.puter.site | Map editor |

## Backend
The Replit backend is at: **https://api.grudge-studio.com**

All Puter apps connect to this backend for:
- Authentication (SSO with HMAC-signed tokens)
- Game data (weapons, armor, recipes)
- Character management
- Crafting system

## SSO Security Model

| Protection | Description |
|------------|-------------|
| HMAC Signing | Tokens signed with SESSION_SECRET |
| Account Linking | Existing accounts require password to link Puter |
| Role Restrictions | SSO only grants user/premium/guest roles |
| Privileged Accounts | admin/developer require direct login |
| Rate Limiting | 10 requests/minute per IP |
| Token Expiry | 5-minute tokens, 2-hour sessions |

### SSO Flow
1. User authenticates on Puter (grudge-auth)
2. Apps portal requests signed token from Replit backend
3. Token includes HMAC signature with expiry
4. Target app verifies token signature
5. Backend creates session only if signature valid

## puter-cli Commands Reference

```bash
# Authentication
puter login          # Login to Puter
puter logout         # Logout

# Apps (outside shell)
puter app:create <name> <dir> [--description="..."]

# Apps (inside shell)
puter shell
puter> app:update <name> <dir>
puter> app:delete <name>
puter> apps

# Sites
puter> site:create <name> <dir> [--subdomain=<name>]
puter> site:deploy <dir> [--subdomain=<name>]
puter> sites
puter> site:delete <uid>

# Files
puter> push <local>   # Upload to current remote dir
puter> pull <remote>  # Download to current local dir
puter> ls, cd, mkdir, rm, cp, mv
puter> update <local_dir> <remote_dir> [-r] [--delete]
```

## Features on Puter

- **Free Hosting**: No credit card required, instant deployment
- **Free AI**: Access to GPT, Claude, and other AI models at no cost
- **Cloud Save**: Character data persists across sessions using Puter KV storage
- **Cross-Device**: Play on any device with your Puter account

## Deploy Folder Structure

```
puter-deploy/
â”œâ”€â”€ grudge-apps/        # Apps Portal
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ grudge-logo.png
â”‚   â””â”€â”€ login-bg.png
â”œâ”€â”€ grudge-auth/        # Authentication
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ puter-manifest.json
â”‚   â”œâ”€â”€ grudge-logo.png
â”‚   â””â”€â”€ login-bg.png
â”œâ”€â”€ grudge-cloud/       # Cloud Admin
â”‚   â”œâ”€â”€ index.html
â”‚   â””â”€â”€ puter-manifest.json
â””â”€â”€ grudge-server/      # Backend Worker
    â”œâ”€â”€ index.js
    â””â”€â”€ puter-manifest.json
```

## Troubleshooting

### "Please login first"
Run `puter login` and authenticate.

### App already exists
Use `app:update` instead of `app:create`:
```bash
puter shell
puter> app:update grudge-apps puter-deploy/grudge-apps
```

### Permission denied
Check you're logged into the correct Puter account.

### SSO not working
1. Verify backend is running at grudge-crafting.replit.app
2. Check browser console for errors
3. Try clearing localStorage and re-authenticating

### "Account exists but not linked"
For existing accounts, login with password first at:
https://api.grudge-studio.com/login

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes (Replit) |
| `SESSION_SECRET` | HMAC signing key | Yes |
| `PUTER_APP_ID` | Puter app identifier | Optional |

## Links

- **Puter Developer Docs**: https://docs.puter.com
- **Puter GitHub**: https://github.com/HeyPuter/puter
- **puter-cli GitHub**: https://github.com/HeyPuter/puter-cli
- **Replit Backend**: https://api.grudge-studio.com
