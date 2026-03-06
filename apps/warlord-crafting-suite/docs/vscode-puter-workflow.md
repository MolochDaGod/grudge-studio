# VSCode + Puter CLI Workflow Guide

Complete guide for deploying GRUDGE Warlords apps to Puter from VSCode on Windows.

## Prerequisites

✅ **Already Configured:**
- Puter CLI installed
- Logged in as GRUDACHAIN
- Config at: `C:\Users\nugye\.config\puter-cli-nodejs\config.json`

## Quick Commands

### Deploy Apps

```powershell
# Deploy all apps
.\scripts\deploy-to-puter.ps1

# Deploy specific app
.\scripts\deploy-to-puter.ps1 -Target auth
.\scripts\deploy-to-puter.ps1 -Target cloud

# Update existing app
.\scripts\deploy-to-puter.ps1 -Target auth -Update
```

### Manual Puter CLI Commands

```powershell
# Check status
puter whoami

# List your apps
puter shell
puter> apps
puter> sites

# Update grudge-auth
puter app:update grudge-auth puter-deploy/grudge-auth

# Update grudge-cloud
puter app:update grudge-cloud puter-deploy/grudge-cloud

# Exit shell
puter> exit
```

## Current Deployment Status

| App | Status | URL |
|-----|--------|-----|
| grudge-auth | Deployed | https://grudge-auth-73v97.puter.site |
| grudge-cloud | Deployed | https://grudgecloud-85c9p.puter.site |
| grudge-apps | Deployed | https://grudge-apps.puter.site |
| grudge-launcher | Deployed | https://grudge-launcher-xu9q5.puter.site |

## Worker Deployment

Puter workers require a different deployment process:

### Option 1: Via Puter Dashboard (Recommended)

1. Go to https://puter.com
2. Open File Manager
3. Navigate to `/GRUDACHAIN/workers/`
4. Upload worker files:
   - `grudge-api.ts` → compile to `.js` first
   - `sprite-generator.js`
5. Open Console (F12)
6. Run:
```javascript
await puter.workers.create({
  name: 'grudge-api',
  code: await puter.fs.read('/GRUDACHAIN/workers/grudge-api.js')
});
```

### Option 2: Via Script (Automated)

```powershell
# Build and deploy worker
npx tsx scripts/deploy-puter-worker.ts
```

## VSCode Tasks Setup

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Deploy to Puter: Auth",
      "type": "shell",
      "command": ".\\scripts\\deploy-to-puter.ps1 -Target auth -Update",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Deploy to Puter: All",
      "type": "shell",
      "command": ".\\scripts\\deploy-to-puter.ps1 -Update",
      "group": "build"
    },
    {
      "label": "Puter Shell",
      "type": "shell",
      "command": "puter shell",
      "isBackground": true,
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

Run tasks: `Ctrl+Shift+P` → "Tasks: Run Task"

## Development Workflow

### 1. Make Changes to grudge-auth

```powershell
# Edit files in: puter-deploy/grudge-auth/
code puter-deploy/grudge-auth/index.html

# Deploy update
.\scripts\deploy-to-puter.ps1 -Target auth -Update

# Test
start https://grudge-auth-73v97.puter.site
```

### 2. Update Worker Code

```powershell
# Edit worker
code puter/workers/grudge-api.ts

# Compile TypeScript to JavaScript
npx tsc puter/workers/grudge-api.ts --outDir puter-deploy/grudge-server

# Deploy via script
npx tsx scripts/deploy-puter-worker.ts
```

### 3. Test Locally Before Deploy

```powershell
# Start local dev server
npm run dev

# Test auth flow
start http://localhost:5000/login
```

## Troubleshooting

### "puter: command not found"

```powershell
# Reinstall globally
npm install -g puter-cli

# Verify installation
puter --version
```

### "Not logged in"

```powershell
puter login
# Follow browser prompts
```

### "App already exists"

Use `-Update` flag:
```powershell
.\scripts\deploy-to-puter.ps1 -Target auth -Update
```

### Worker not responding

1. Check worker exists:
```javascript
await puter.workers.list()
```

2. Check worker logs (if available)
3. Redeploy worker with fresh code

## File Structure

```
Warlord-Crafting-Suite/
├── puter-deploy/           # Ready-to-deploy apps
│   ├── grudge-auth/        # Auth portal
│   ├── grudge-cloud/       # Admin panel
│   ├── grudge-apps/        # App launcher
│   └── grudge-server/      # Worker (compiled)
├── puter/
│   └── workers/            # Worker source code
│       ├── grudge-api.ts
│       └── sprite-generator.js
└── scripts/
    ├── deploy-to-puter.ps1 # Main deployment script
    └── deploy-puter-worker.ts
```

## Next Steps

1. ✅ Verify Puter CLI: `puter whoami`
2. ✅ Deploy grudge-auth: `.\scripts\deploy-to-puter.ps1 -Target auth -Update`
3. ⏳ Set up worker deployment
4. ⏳ Configure VSCode tasks
5. ⏳ Test full auth flow

## Resources

- **Puter Dashboard**: https://puter.com
- **Puter Docs**: https://docs.puter.com
- **CLI Docs**: https://github.com/HeyPuter/puter-cli
- **Your Apps**: https://puter.com/app

