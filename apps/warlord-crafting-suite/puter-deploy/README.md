# GRUDGE Warlords - Puter Deployment Package

This folder contains production-ready apps for deployment to Puter.com.

## 📦 What's Included

| App | Path | Status | URL |
|-----|------|--------|-----|
| **grudge-auth** | `./grudge-auth/` | ✅ Ready | https://grudge-auth-73v97.puter.site |
| **grudge-cloud** | `./grudge-cloud/` | ✅ Ready | https://grudgecloud-85c9p.puter.site |
| **grudge-apps** | `./grudge-apps/` | ✅ Ready | https://grudge-apps.puter.site |
| **grudge-launcher** | `./grudge-launcher/` | ✅ Ready | https://grudge-launcher-xu9q5.puter.site |
| **grudge-server** | `./grudge-server/` | 🔧 Worker | Requires manual setup |
| **grudge-studio** | `./grudge-studio/` | 📦 Main App | Build from `/client` |

## 🚀 Quick Deploy

### From VSCode

**Option 1: Use VSCode Tasks** (Recommended)
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select "Puter: Deploy Auth" or "Deploy All to Puter"

**Option 2: Use Terminal**
```bash
# Deploy grudge-auth
puter app:update grudge-auth puter-deploy/grudge-auth

# Deploy grudge-cloud
puter app:update grudge-cloud puter-deploy/grudge-cloud

# Deploy all
.\scripts\deploy-to-puter.ps1 -Update
```

### From Command Line

```bash
# Login first (if needed)
puter login

# Update existing apps
puter app:update grudge-auth puter-deploy/grudge-auth
puter app:update grudge-cloud puter-deploy/grudge-cloud
puter app:update grudge-apps puter-deploy/grudge-apps
```

## 📁 App Details

### grudge-auth
**Purpose:** Centralized authentication portal with SSO  
**Features:**
- Puter SSO integration
- Web3 wallet support (Web3Auth)
- Session management via KV store
- Cross-app authentication

**Files:**
- `index.html` - Main auth interface
- `puter-manifest.json` - App configuration
- `assets/` - Images and resources

**Deploy:**
```bash
puter app:update grudge-auth puter-deploy/grudge-auth
```

### grudge-cloud
**Purpose:** Admin panel for cloud storage management  
**Features:**
- Puter FS file browser
- KV store viewer/editor
- Asset management
- Backup/restore tools

**Deploy:**
```bash
puter app:update grudge-cloud puter-deploy/grudge-cloud
```

### grudge-apps
**Purpose:** App launcher portal  
**Features:**
- Links to all GRUDGE apps
- Quick navigation
- App status indicators

**Deploy:**
```bash
puter app:update grudge-apps puter-deploy/grudge-apps
```

### grudge-server (Worker)
**Purpose:** Serverless API worker  
**Source:** `../puter/workers/grudge-api.ts`  
**Deploy:** See [Worker Deployment](#worker-deployment)

## 🔧 Worker Deployment

Workers require special deployment:

### 1. Compile Worker (if TypeScript)
```bash
npx tsx scripts/deploy-worker.ts grudge-api
```

### 2. Create Worker in Puter Dashboard
1. Go to https://puter.com
2. Open Console (F12)
3. Run:
```javascript
await puter.workers.create({
  name: 'grudge-api',
  code: await puter.fs.read('/GRUDACHAIN/workers/grudge-api.js')
});
```

### 3. Test Worker
```bash
curl https://grudge-api.puter.work/api/health
```

## 🔄 Update Workflow

### When you change grudge-auth:

1. **Edit files** in `puter-deploy/grudge-auth/`
2. **Deploy update:**
   ```bash
   puter app:update grudge-auth puter-deploy/grudge-auth
   ```
3. **Test:** Visit https://grudge-auth-73v97.puter.site
4. **Verify:** Check browser console for errors

### When you change worker code:

1. **Edit** `puter/workers/grudge-api.ts`
2. **Deploy:**
   ```bash
   npx tsx scripts/deploy-worker.ts grudge-api
   ```
3. **Recreate worker** in Puter dashboard (see above)
4. **Test:** `curl https://grudge-api.puter.work/api/health`

## 🌐 App URLs

All apps are live at:

- **Auth:** https://grudge-auth-73v97.puter.site
- **Cloud:** https://grudgecloud-85c9p.puter.site
- **Apps Portal:** https://grudge-apps.puter.site
- **Launcher:** https://grudge-launcher-xu9q5.puter.site
- **Main App:** https://grudge-crafting.puter.site

## 📚 Documentation

- **Quick Reference:** [../PUTER_QUICK_REFERENCE.md](../PUTER_QUICK_REFERENCE.md)
- **VSCode Workflow:** [../docs/vscode-puter-workflow.md](../docs/vscode-puter-workflow.md)
- **Full Deployment Guide:** [../PUTER_DEPLOYMENT.md](../PUTER_DEPLOYMENT.md)
- **Puter Docs:** https://docs.puter.com

## ✅ Checklist

- [x] Puter CLI installed
- [x] Logged in as GRUDACHAIN
- [x] grudge-auth deployed
- [x] grudge-cloud deployed
- [ ] Workers deployed
- [ ] All apps tested
- [ ] Auth flow verified

## 🆘 Need Help?

See [../PUTER_QUICK_REFERENCE.md](../PUTER_QUICK_REFERENCE.md) for common commands and troubleshooting.

