# 🚀 GRUDGE Warlords - Deployment Quick Reference

Quick commands for common deployment tasks.

---

## 📍 **Current Setup**

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Process Manager**: PM2
- **Web Server**: Nginx
- **Deployment**: Git-based

---

## 🔧 **Local Development**

```powershell
# Start development server (with hot reload)
npm run dev

# Access app
http://localhost:5000

# Push database changes
npm run db:push

# Type checking
npm run check

# Build for production (test locally)
npm run build
npm run start
```

---

## 🌐 **Production Deployment**

### **Quick Deploy (Linux)**

```bash
# SSH into server
ssh your_username@your_server_ip

# Navigate to app directory
cd /var/www/grudge-warlords

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Restart app
pm2 restart grudge-warlords

# Check status
pm2 status
```

### **One-Command Deploy**

```bash
# Run deployment script
./deploy.sh
```

---

## 📊 **Monitoring**

```bash
# View real-time logs
pm2 logs grudge-warlords

# Monitor CPU/Memory
pm2 monit

# Check app status
pm2 status

# View last 100 lines
pm2 logs grudge-warlords --lines 100

# Clear logs
pm2 flush
```

---

## 🔄 **PM2 Commands**

```bash
# Restart app
pm2 restart grudge-warlords

# Stop app
pm2 stop grudge-warlords

# Start app
pm2 start grudge-warlords

# Delete from PM2
pm2 delete grudge-warlords

# Save PM2 config
pm2 save

# List all apps
pm2 list
```

---

## 🗄️ **Database**

```bash
# Connect to database
psql -U grudge_prod -d grudge_warlords_prod

# Backup database
pg_dump -U grudge_prod grudge_warlords_prod > backup_$(date +%Y%m%d).sql

# Restore database
psql -U grudge_prod -d grudge_warlords_prod < backup_20240103.sql

# View database size
psql -U grudge_prod -d grudge_warlords_prod -c "SELECT pg_size_pretty(pg_database_size('grudge_warlords_prod'));"
```

---

## 🌍 **Nginx**

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🔐 **SSL Certificate**

```bash
# Renew SSL certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# View certificate info
sudo certbot certificates
```

---

## 🐛 **Troubleshooting**

```bash
# Check if app is running
pm2 status

# Check port usage
sudo lsof -i :5000

# Check disk space
df -h

# Check memory usage
free -h

# Check system logs
sudo journalctl -xe

# Restart everything
pm2 restart grudge-warlords
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

---

## 📦 **Environment Files**

### **Development (.env.local)**

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://grudge_dev:password@localhost:5432/grudge_warlords_dev
SESSION_SECRET=dev_secret_here
```

### **Production (.env)**

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://grudge_prod:password@localhost:5432/grudge_warlords_prod
SESSION_SECRET=production_secret_here
BACKEND_URL=https://yourdomain.com
```

---

## 🔗 **Important URLs**

- **Local Dev**: http://localhost:5000
- **Production**: https://yourdomain.com
- **Puter Auth**: https://grudge-auth-73v97.puter.site
- **Puter Cloud**: https://grudgecloud-85c9p.puter.site

---

## 📝 **Git Workflow**

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Pull latest
git pull origin main

# View commit history
git log --oneline -10
```

---

## ⚡ **Performance**

```bash
# Check Node.js memory usage
pm2 show grudge-warlords

# Optimize database
psql -U grudge_prod -d grudge_warlords_prod -c "VACUUM ANALYZE;"

# Clear PM2 logs
pm2 flush

# Restart with zero downtime
pm2 reload grudge-warlords
```

---

## 🎯 **Common Tasks**

### **Update Dependencies**

```bash
npm update
npm audit fix
```

### **Add New Environment Variable**

```bash
# Edit .env
nano .env

# Restart app
pm2 restart grudge-warlords
```

### **View App Metrics**

```bash
pm2 monit
```

### **Emergency Rollback**

```bash
git log --oneline -5
git reset --hard <commit-hash>
npm install --production
npm run build
pm2 restart grudge-warlords
```

---

## 📞 **Support**

- **Full Guide**: See `SELF_HOSTED_DEPLOYMENT_GUIDE.md`
- **PM2 Docs**: https://pm2.keymetrics.io/
- **Nginx Docs**: https://nginx.org/en/docs/

