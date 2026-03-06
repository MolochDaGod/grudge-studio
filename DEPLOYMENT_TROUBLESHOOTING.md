# Deployment Troubleshooting Guide

Fix common deployment issues with this guide.

## 🔍 Common Issues & Solutions

### Issue 1: Dependencies Not Installing

**Error**: `npm ERR! code E404` or `pnpm ERR! ...`

**Solution**:
```bash
# Clear cache
pnpm store prune
rm -rf node_modules
rm -rf pnpm-lock.yaml

# Reinstall
pnpm install --no-frozen-lockfile
```

### Issue 2: Build Fails - Cannot Find Module

**Error**: `TS2307: Cannot find module '@grudge/...'`

**Solution**:
```bash
# Ensure dependencies are installed
pnpm install

# Type check to see exact errors
pnpm type-check

# Rebuild all packages
pnpm build
```

### Issue 3: TypeScript Compilation Errors

**Error**: `TS2769`, `TS7031`, `TS7026`

**Solution**:
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm type-check

# If still failing, check individual package
cd packages/shared
pnpm build
```

### Issue 4: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# 1. Check if PostgreSQL is running
# Windows: Services > PostgreSQL
# macOS: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql

# 2. Verify connection string
echo $DATABASE_URL

# 3. Test connection
psql $DATABASE_URL -c "SELECT 1"

# 4. Use Docker if local install issues
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  postgres:16-alpine
```

### Issue 5: Docker Build Fails

**Error**: `error building image` or `COPY failed`

**Solution**:
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild with no cache
docker build --no-cache -t app .

# Check Dockerfile is valid
docker build --dry-run .
```

### Issue 6: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port
lsof -i :5000          # macOS/Linux
netstat -ano | grep 5000  # Windows

# Kill process (get PID first)
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows

# Or use different port
PORT=3000 pnpm dev
```

### Issue 7: Vercel Deployment Fails

**Error**: Build fails on Vercel, works locally

**Solution**:
```bash
# 1. Check Vercel logs
vercel logs

# 2. Ensure all env vars are set
# Go to: Project Settings > Environment Variables
# Add:
#   - DATABASE_URL
#   - NODE_ENV=production
#   - SESSION_SECRET

# 3. Check build command
# Should be: pnpm build

# 4. Check if .env files committed
# They shouldn't be! Remove and commit
git rm --cached .env.local
git commit -m "remove .env files"
```

### Issue 8: Railway Deployment Fails

**Error**: Application crashes or won't start

**Solution**:
```bash
# 1. Check Railway logs
railway logs

# 2. Verify environment variables
railway variables

# 3. Ensure DATABASE_URL is set
railway variables set DATABASE_URL "postgresql://..."

# 4. Restart service
railway restart

# 5. SSH into container and check
railway shell
pnpm db:push
```

### Issue 9: Memory Issues in Production

**Error**: `FATAL: out of memory` or Node crashes

**Solution**:
```bash
# Increase Node heap size
NODE_OPTIONS="--max-old-space-size=2048" pnpm start

# For Docker
docker run -e NODE_OPTIONS="--max-old-space-size=2048" ...

# For Vercel
# Add env var: NODE_OPTIONS=-max-old-space-size=2048
```

### Issue 10: Database Connection Pool Exhausted

**Error**: `FATAL: sorry, too many clients already`

**Solution**:
```bash
# Increase PostgreSQL connections (if self-hosted)
# Edit postgresql.conf:
max_connections = 200

# Or use connection pooling (PgBouncer)
docker run -d \
  -e POOL_MODE=transaction \
  pgbouncer

# For managed databases, contact provider
```

---

## 🧪 Testing Deployment Locally

Before deploying to production:

### Test with Docker
```bash
# Build image
docker build -t grudge-studio:test .

# Run locally
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/grudge_studio" \
  -e NODE_ENV=production \
  grudge-studio:test

# Verify
curl http://localhost:5000/api/health
```

### Test Vercel Build
```bash
# Install Vercel CLI
npm install -g vercel

# Run build locally
vercel build

# Test build output
node .vercel/output/functions/index.js
```

### Test Production Build
```bash
# Build for production
NODE_ENV=production pnpm build

# Check output
ls -la apps/warlord-crafting-suite/dist
ls -la packages/*/dist

# Run production build
NODE_ENV=production pnpm start
```

---

## 🔧 Debugging Tips

### Enable Verbose Logging
```bash
# Turbo verbose output
turbo run build --verbose

# pnpm verbose output
pnpm install --verbose

# Node debug mode
NODE_DEBUG=* pnpm dev
```

### Check Generated Files
```bash
# List build artifacts
find . -name "dist" -type d

# Check TypeScript output
ls -la packages/shared/dist
ls -la packages/database/dist

# Verify exports
cat packages/shared/package.json | grep exports
```

### Validate Configuration
```bash
# Check TypeScript
tsc --noEmit

# Check Turbo
turbo graph

# Check Docker
docker build --dry-run .
```

---

## 🚨 Emergency Procedures

### If Deployment is Stuck

```bash
# 1. Stop current deployment
# Platform specific:
vercel cancel    # Vercel
railway cancel   # Railway
fly releases list && fly releases rollback  # Fly.io

# 2. Revert code
git revert HEAD
git push origin main

# 3. Deploy previous version
vercel --prod    # Vercel (will use previous commit)
```

### If Database is Corrupted

```bash
# 1. Backup existing database
pg_dump $DATABASE_URL > backup.sql

# 2. Drop tables
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Reapply schema
pnpm db:push

# 4. Restore if needed
psql $DATABASE_URL < backup.sql
```

### If Server is Down

```bash
# 1. Check service status
# Platform specific dashboard

# 2. View logs
# Platform logs to identify issue

# 3. Restart service
docker-compose restart
railway restart
fly scale count web=1

# 4. Check health
curl https://your-app-url/api/health
```

---

## 📊 Health Checks

### Verify Deployment
```bash
# Check health endpoint
curl https://your-deployment-url/api/health

# Should return:
# {"status":"healthy","version":"1.0.0","timestamp":"..."}

# Check database connection
curl https://your-deployment-url/api/characters

# Should return character list or auth error (not DB error)

# Check response time
time curl https://your-deployment-url/api/health
# Should be <100ms
```

### Monitor Performance
```bash
# Check memory usage
curl https://your-deployment-url/api/metrics

# Check error rates
# Platform dashboard > Logs > filter for "error"

# Check response times
# Platform dashboard > Analytics
```

---

## 📞 Getting Help

| Issue Type | Resource |
|-----------|----------|
| Vercel | [vercel.com/support](https://vercel.com/support) |
| Railway | [railway.app/support](https://railway.app/support) |
| Fly.io | [fly.io/docs](https://fly.io/docs) |
| Docker | [docs.docker.com](https://docs.docker.com) |
| PostgreSQL | [postgresql.org/support](https://postgresql.org/support) |
| Node.js | [nodejs.org/docs](https://nodejs.org/docs) |

---

## ✅ Deployment Success Checklist

After fixing issues:
- [ ] Build succeeds locally
- [ ] Tests pass: `pnpm test`
- [ ] Type checking passes: `pnpm type-check`
- [ ] Docker image builds: `docker build -t app .`
- [ ] Database schema applies: `pnpm db:push`
- [ ] Health endpoint works: `curl /api/health`
- [ ] Core features work
- [ ] No error logs
- [ ] Response times acceptable
- [ ] Monitoring enabled

---

**Need more help? Check the main deployment guide: `DEPLOY_TO_PRODUCTION.md`**
