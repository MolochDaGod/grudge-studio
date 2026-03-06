# 🚀 Puter CLI Quick Reference - VSCode

Keep this file open for quick copy-paste commands!

## ⚡ Quick Deploy Commands

### Deploy grudge-auth (Update existing)

```bash
# Option 1: Using npm scripts (recommended)
npm run deploy:auth

# Option 2: Direct puter command
puter app:update grudge-auth puter-deploy/grudge-auth
```

### Deploy grudge-cloud (Update existing)

```bash
# Option 1: Using npm scripts
npm run deploy:cloud

# Option 2: Direct puter command
puter app:update grudge-cloud puter-deploy/grudge-cloud
```

### Deploy Worker

```bash
# Option 1: Using npm scripts
npm run deploy:worker

# Option 2: Using npx (npx runs local packages)
npx tsx scripts/deploy-worker.ts grudge-api
```

### Deploy Everything

```bash
npm run deploy:all
```

## 📋 VSCode Tasks (Ctrl+Shift+P → "Tasks: Run Task")

- **Puter: Deploy Auth** - Update grudge-auth app
- **Puter: Deploy Cloud** - Update grudge-cloud app
- **Puter: Deploy Worker (grudge-api)** - Deploy main API worker
- **Puter: Open Shell** - Interactive Puter shell
- **Deploy All to Puter** - Deploy auth + cloud together

## 🔍 Status & Info Commands

```bash
# Check who you're logged in as
puter whoami

# List all your apps
puter shell
> apps
> exit

# List all your sites
puter shell
> sites
> exit
```

## 🌐 Your Deployed Apps

| App | URL | Status |
|-----|-----|--------|
| grudge-auth | <https://grudge-auth-73v97.puter.site> | ✅ Live |
| grudge-cloud | <https://grudgecloud-85c9p.puter.site> | ✅ Live |
| grudge-apps | <https://grudge-apps.puter.site> | ✅ Live |
| grudge-launcher | <https://grudge-launcher-xu9q5.puter.site> | ✅ Live |

## 🔧 Worker Management

### Upload Worker Code

```bash
# Compile and upload grudge-api worker
npx tsx scripts/deploy-worker.ts grudge-api

# Upload sprite-generator worker
npx tsx scripts/deploy-worker.ts sprite-generator
```

### Create Worker (via Puter Dashboard)

1. Go to <https://puter.com>
2. Open Console (F12)
3. Run:

```javascript
// Create grudge-api worker
await puter.workers.create({
  name: 'grudge-api',
  code: await puter.fs.read('/GRUDACHAIN/workers/grudge-api.js')
});

// List workers
await puter.workers.list();

// Test worker
await fetch('https://grudge-api.puter.work/api/health');
```

## 📁 File Operations

```bash
# Enter Puter shell
puter shell

# Navigate
> cd /GRUDACHAIN
> ls
> pwd

# Upload file
> push local-file.txt /GRUDACHAIN/remote-file.txt

# Download file
> pull /GRUDACHAIN/remote-file.txt local-file.txt

# Create directory
> mkdir /GRUDACHAIN/new-folder

# Exit shell
> exit
```

## 🔐 Authentication

```bash
# Login (if needed)
puter login

# Logout
puter logout

# Check current user
puter whoami
```

## 🛠️ Development Workflow

### 1. Edit grudge-auth locally

```bash
code puter-deploy/grudge-auth/index.html
# Make changes...
```

### 2. Deploy update

```bash
puter app:update grudge-auth puter-deploy/grudge-auth
```

### 3. Test

```bash
start https://grudge-auth-73v97.puter.site
```

## 📦 App Creation (First Time Only)

```bash
# Create new app (only if doesn't exist)
puter app:create grudge-auth puter-deploy/grudge-auth --description="GRUDGE Authentication Portal"

# Create new site
puter site:create grudge-auth puter-deploy/grudge-auth --subdomain=grudge-auth
```

## 🐛 Troubleshooting

### "Command not found: puter"

```bash
npm install -g puter-cli
```

### "Not logged in"

```bash
puter login
```

### "App already exists"

Use `app:update` instead of `app:create`

### Check Puter CLI config

```bash
cat $env:USERPROFILE\.config\puter-cli-nodejs\config.json
```

## 📚 Documentation Links

- **Puter Dashboard**: <https://puter.com>
- **Your Apps**: <https://puter.com/app>
- **Puter Docs**: <https://docs.puter.com>
- **CLI GitHub**: <https://github.com/HeyPuter/puter-cli>
- **Full Workflow Guide**: [docs/vscode-puter-workflow.md](docs/vscode-puter-workflow.md)

## 🎯 Next Steps

1. ✅ Verify login: `puter whoami`
2. ✅ Deploy grudge-auth: Run VSCode task or `puter app:update grudge-auth puter-deploy/grudge-auth`
3. ⏳ Deploy workers: `npx tsx scripts/deploy-worker.ts grudge-api`
4. ⏳ Test auth flow: Visit <https://grudge-auth-73v97.puter.site>
5. ⏳ Set up worker in Puter dashboard

---

**Logged in as:** GRUDACHAIN  
**Config:** `C:\Users\nugye\.config\puter-cli-nodejs\config.json`
