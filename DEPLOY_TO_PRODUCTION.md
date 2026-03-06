# Complete Deployment Guide

Deploy Grudge Studio to production with step-by-step instructions for multiple platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Building for Production](#building-for-production)
- [Platform Guides](#platform-guides)
  - [Docker](#docker)
  - [Vercel](#vercel)
  - [Railway](#railway)
  - [Fly.io](#flyio)
  - [Heroku](#heroku)
- [Verification](#verification)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- Node.js 20+
- pnpm 8+
- PostgreSQL 13+ (or use managed database)
- Git repository access

### Recommended
- Docker & Docker Compose
- GitHub Actions (for CI/CD)
- Monitoring service (Sentry, DataDog)

---

## Local Setup

### 1. Install Dependencies

```bash
cd grudge-studio
pnpm install
```

### 2. Create Production Environment File

```bash
cp .env.example .env.production
```

Edit `.env.production`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/grudge_studio_prod
NODE_ENV=production
SESSION_SECRET=your-very-secret-key
ADMIN_PASSWORD=your-secure-password
```

### 3. Build Application

```bash
pnpm build
```

### 4. Test Production Build

```bash
# Build Docker image
docker build -t grudge-studio:latest .

# Run locally
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV=production \
  grudge-studio:latest
```

---

## Building for Production

### Step 1: Prepare Code

```bash
# Ensure all tests pass
pnpm test

# Check types
pnpm type-check

# Lint code
pnpm lint

# Build all packages
pnpm build
```

### Step 2: Verify Build Artifacts

```bash
# Check build outputs
ls -la packages/shared/dist
ls -la packages/database/dist
ls -la apps/warlord-crafting-suite/dist

# Expected: .js and .d.ts files
```

### Step 3: Create Production Image

```bash
# Build Docker image
docker build -t grudge-studio:1.0.0 .

# Tag for registry
docker tag grudge-studio:1.0.0 your-registry/grudge-studio:1.0.0
```

---

## Platform Guides

### DOCKER

**Easiest for self-hosted deployment**

#### Local Docker Compose

```bash
# Setup database
docker-compose up -d postgres

# Wait for database to be ready
sleep 5

# Run migrations
docker-compose exec postgres psql \
  -U grudge_user \
  -d grudge_studio \
  -f /docker-entrypoint-initdb.d/schema.sql

# Start application
docker-compose up -d app
```

#### Verify

```bash
# Check if running
docker-compose ps

# View logs
docker-compose logs -f app

# Test endpoint
curl http://localhost:5000/api/health
```

#### Deploy to Docker Registry

```bash
# Login to registry
docker login your-registry.com

# Build & push
docker build -t your-registry/grudge-studio:1.0.0 .
docker push your-registry/grudge-studio:1.0.0

# Pull & run on server
ssh your-server
docker pull your-registry/grudge-studio:1.0.0
docker run -d -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  your-registry/grudge-studio:1.0.0
```

---

### VERCEL

**Best for: Full-stack JavaScript, auto-scaling, CDN**

#### Step 1: Connect GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select `grudge-studio` repository
5. Import project

#### Step 2: Configure

In Vercel dashboard:

1. **Project Settings > General**
   - Framework: Other
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install --frozen-lockfile`

2. **Environment Variables**
   ```
   DATABASE_URL = [PostgreSQL connection string]
   NODE_ENV = production
   SESSION_SECRET = [random secret]
   ADMIN_PASSWORD = [secure password]
   ```

3. **Database**
   - Option A: Use Vercel Postgres (recommended)
   - Option B: External PostgreSQL

#### Step 3: Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from local
vercel --prod
```

#### Step 4: Setup Database

```bash
# Connect to Vercel Postgres
vercel env pull

# Run migrations
pnpm db:push
```

#### Verify

```bash
# Get deployment URL
vercel ls

# Test health endpoint
curl https://your-app.vercel.app/api/health
```

---

### RAILWAY

**Best for: Simplicity, integrated PostgreSQL, GitHub sync**

#### Step 1: Connect GitHub

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `grudge-studio`

#### Step 2: Add Services

1. **PostgreSQL**
   - Click "Add Service"
   - Select "Postgres"
   - Configure database

2. **Application**
   - Auto-detects from `railway.toml`
   - Sets up build & start commands

#### Step 3: Configure Environment

In Railway dashboard:

1. Click on app service
2. Go to "Variables"
3. Add:
   ```
   NODE_ENV = production
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   SESSION_SECRET = [generate random]
   ADMIN_PASSWORD = [secure password]
   ```

#### Step 4: Deploy

```bash
# Auto-deploys on push to main
git push origin main

# Or deploy from CLI
railway up
```

#### Step 5: Database Setup

```bash
# SSH into Railway container
railway shell

# Run migrations
pnpm db:push
```

#### Verify

```bash
# Get public URL
railway status

# Test endpoint
curl https://your-app.up.railway.app/api/health
```

---

### FLY.IO

**Best for: Global deployment, low latency, reliable**

#### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

#### Step 2: Authenticate

```bash
fly auth login
```

#### Step 3: Create App

```bash
fly launch
# Follow prompts:
# - App name: grudge-studio
# - Select region
# - Create Postgres: Yes
```

#### Step 4: Set Environment Variables

```bash
fly secrets set \
  NODE_ENV=production \
  SESSION_SECRET=your-secret \
  ADMIN_PASSWORD=your-password
```

#### Step 5: Deploy

```bash
fly deploy
```

#### Step 6: Database Setup

```bash
# SSH into app
fly ssh console

# Run migrations
pnpm db:push
```

#### Verify

```bash
# Get app status
fly status

# View logs
fly logs

# Test endpoint
curl https://your-app.fly.dev/api/health
```

---

### HEROKU

**Best for: Traditional hobby projects, simplicity**

#### Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
Download from heroku.com/
```

#### Step 2: Create App

```bash
heroku login
heroku create grudge-studio
```

#### Step 3: Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:standard-0
```

#### Step 4: Set Environment Variables

```bash
heroku config:set \
  NODE_ENV=production \
  SESSION_SECRET=your-secret \
  ADMIN_PASSWORD=your-password
```

#### Step 5: Deploy

```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/grudge-studio.git

# Deploy
git push heroku main
```

#### Step 6: Database Setup

```bash
# Run migrations
heroku run pnpm db:push
```

#### Verify

```bash
# View logs
heroku logs --tail

# Open app
heroku open

# Test endpoint
curl https://grudge-studio.herokuapp.com/api/health
```

---

## Verification

### Health Check

Every platform should respond to:
```bash
curl https://your-app-url/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-03T12:00:00Z"
}
```

### Database Connection

```bash
# Test database access
curl https://your-app-url/api/characters
# Should return character list or auth error (not database error)
```

### Performance

```bash
# Check response time
time curl https://your-app-url/api/health

# Should be <100ms
```

---

## Monitoring

### Enable Logging

```bash
# Platform logs
vercel logs          # Vercel
railway logs         # Railway
fly logs             # Fly.io
heroku logs --tail   # Heroku

# Docker logs
docker-compose logs -f app
```

### Add Error Tracking (Optional)

1. **Sentry**
   ```bash
   npm install @sentry/node
   ```
   - Add SENTRY_DSN to environment

2. **DataDog**
   ```bash
   npm install dd-trace
   ```
   - Add DataDog API key

### Database Monitoring

```bash
# Connect to database
psql $DATABASE_URL

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm build

# Check for errors
pnpm type-check
```

### Database Connection Error

```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check credentials
# - Username correct?
# - Password escaped?
# - Host accessible?
```

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Test locally
NODE_ENV=production pnpm dev

# Check environment variables
# - DATABASE_URL set?
# - NODE_ENV=production?
```

### High Memory Usage

```bash
# Check Node heap
node --max-old-space-size=2048 apps/warlord-crafting-suite/dist/index.cjs

# Optimize in production
NODE_OPTIONS="--max-old-space-size=2048"
```

### Slow Responses

```bash
# Check database queries
# Add logging to database calls

# Check network
# - Latency between app and database
# - CDN caching for static files

# Optimize
# - Use database indexes
# - Cache frequently accessed data
```

---

## Rollback

If deployment fails:

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Platform will auto-redeploy
# Or manually redeploy previous image
docker pull your-registry/grudge-studio:previous-tag
```

---

## Scaling

### Horizontal Scaling

Most platforms support multiple replicas:

```bash
# Vercel: Auto-scaling (included)
# Railway: Increase replicas in dashboard
# Fly.io: Scale regions
# Heroku: `heroku ps:scale web=3`
```

### Vertical Scaling

Increase server resources:

```bash
# Railway: Upgrade machine type
# Fly.io: Increase memory
# Heroku: Upgrade dyno type
```

### Database Scaling

```bash
# Increase PostgreSQL resources
# - Connection pool size
# - Max connections
# - Memory allocation

# Add read replicas (advanced)
# - Geographic distribution
# - Load balancing
```

---

## Next Steps

1. ✅ Choose platform
2. ✅ Follow platform guide
3. ✅ Deploy application
4. ✅ Verify health check
5. ✅ Setup monitoring
6. ✅ Configure backups
7. ✅ Setup alerts

---

## Support

- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Railway: [railway.app/docs](https://railway.app/docs)
- Fly.io: [fly.io/docs](https://fly.io/docs)
- Heroku: [devcenter.heroku.com](https://devcenter.heroku.com)
- Docker: [docs.docker.com](https://docs.docker.com)

---

**You're ready to deploy!** 🚀
