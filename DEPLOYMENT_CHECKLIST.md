# 🚀 DEPLOYMENT CHECKLIST

Complete this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All tests passing: `pnpm test`
- [ ] Type checking passing: `pnpm type-check`
- [ ] Linting passing: `pnpm lint`
- [ ] No console.error/warnings in logs
- [ ] All TODOs resolved
- [ ] Code reviewed

### Dependencies
- [ ] `pnpm install` succeeds
- [ ] No security vulnerabilities: `pnpm audit`
- [ ] All dependencies up to date
- [ ] Lock file committed

### Configuration
- [ ] `.env.production` created
- [ ] All environment variables set
- [ ] Database URL verified
- [ ] Session secret generated
- [ ] Admin password set
- [ ] NODE_ENV=production

### Database
- [ ] PostgreSQL 13+ running
- [ ] Database accessible
- [ ] Schema migrations ready
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### Build
- [ ] `pnpm build` succeeds
- [ ] No build errors
- [ ] Output files verified
- [ ] Docker image builds: `docker build -t app .`
- [ ] Image runs locally: `docker run ...`

### Security
- [ ] No secrets in code
- [ ] No API keys in .env.example
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation enabled

### Performance
- [ ] Build size reasonable (<50MB)
- [ ] Startup time <5 seconds
- [ ] Health check responds <100ms
- [ ] Database indexes created
- [ ] Caching configured

### Documentation
- [ ] README up to date
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Known issues listed
- [ ] Troubleshooting guide available

---

## Platform Selection

Choose one and complete that section:

### Docker
- [ ] Dockerfile reviewed
- [ ] docker-compose.yml valid
- [ ] Registry account created
- [ ] Image pushed successfully
- [ ] Server SSH access confirmed

### Vercel
- [ ] GitHub account connected
- [ ] Project imported
- [ ] Build settings correct
- [ ] Environment variables added
- [ ] Domain configured
- [ ] Custom domain DNS ready

### Railway
- [ ] GitHub connected
- [ ] PostgreSQL added
- [ ] Environment variables set
- [ ] Health check path configured
- [ ] Domain ready
- [ ] Team/organization created

### Fly.io
- [ ] CLI installed and authenticated
- [ ] App created
- [ ] PostgreSQL provisioned
- [ ] Secrets set
- [ ] Regions selected
- [ ] Domain configured

### Heroku
- [ ] CLI installed and authenticated
- [ ] App created
- [ ] PostgreSQL addon added
- [ ] Config variables set
- [ ] Buildpacks configured
- [ ] Domain configured

---

## Deployment Steps

### 1. Final Code Commit
- [ ] All changes committed
- [ ] Commit message descriptive
- [ ] Tag created: `git tag v1.0.0`
- [ ] Pushed to main branch

### 2. Database Setup
- [ ] Database created
- [ ] Migrations applied: `pnpm db:push`
- [ ] Tables visible in database
- [ ] Connection string working
- [ ] Backups scheduled

### 3. Deploy Application
- [ ] Run platform-specific deploy command
- [ ] Build succeeds
- [ ] Deployment succeeds
- [ ] No errors in logs

### 4. Verify Deployment
- [ ] Health check responds
- [ ] Website loads
- [ ] API endpoints working
- [ ] Database queries working
- [ ] No 500 errors in logs

### 5. Post-Deployment
- [ ] Logs being collected
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Team notified
- [ ] Status page updated

---

## Post-Deployment

### Monitoring (First 24 hours)
- [ ] Check logs every hour
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor database connections
- [ ] Monitor disk usage
- [ ] Monitor memory usage

### Monitoring (First Week)
- [ ] Check logs daily
- [ ] Review error patterns
- [ ] Review performance metrics
- [ ] Check database growth rate
- [ ] Monitor user activity
- [ ] Verify backups working

### Monitoring (Ongoing)
- [ ] Weekly log review
- [ ] Monthly performance review
- [ ] Monthly security audit
- [ ] Database maintenance
- [ ] Dependency updates
- [ ] Backup verification

### Maintenance
- [ ] Schedule database backups
- [ ] Setup automated scaling
- [ ] Configure alerts
- [ ] Document runbooks
- [ ] Plan updates
- [ ] Plan security patches

---

## Rollback Plan

If deployment fails:
- [ ] Identify failure cause
- [ ] Revert commit: `git revert <hash>`
- [ ] Redeploy previous version
- [ ] Verify old version works
- [ ] Debug failure
- [ ] Fix issue locally
- [ ] Retest thoroughly
- [ ] Deploy fixed version

---

## Success Criteria

Deployment is successful when:
- ✅ Health check responds
- ✅ Website loads in <2s
- ✅ All APIs working
- ✅ Database connected
- ✅ No error logs
- ✅ Monitoring enabled
- ✅ Team can access
- ✅ Users can use app

---

## Post-Launch

### Day 1
- [ ] Monitor continuously
- [ ] Be available for issues
- [ ] Check user feedback
- [ ] Verify backups working

### Week 1
- [ ] Monitor performance
- [ ] Fix any bugs found
- [ ] Optimize slow queries
- [ ] Document issues
- [ ] Plan improvements

### Month 1
- [ ] Performance review
- [ ] Security audit
- [ ] Scalability assessment
- [ ] User satisfaction survey
- [ ] Plan next release

---

## Emergency Contacts

- On-call: [Your Name] - [Phone]
- Database Admin: [Name] - [Phone]
- DevOps: [Name] - [Phone]
- Manager: [Name] - [Phone]

---

## Deployment Log

**Deployment Date**: [Date]
**Deployed By**: [Your Name]
**Version**: 1.0.0
**Platform**: [Docker/Vercel/Railway/Fly.io/Heroku]

**Pre-deployment Status**:
- [ ] Tests: PASS
- [ ] Build: PASS
- [ ] Security: PASS

**Deployment Status**:
- [ ] Database: OK
- [ ] Application: OK
- [ ] Health Check: OK

**Post-deployment Status**:
- [ ] Monitoring: ENABLED
- [ ] Logs: FLOWING
- [ ] Users: ACTIVE

**Notes**:
[Any issues or notes]

**Issues Found**:
[List any bugs or issues]

**Follow-up**:
[Any follow-up tasks]

---

**Ready to deploy!** ✅
