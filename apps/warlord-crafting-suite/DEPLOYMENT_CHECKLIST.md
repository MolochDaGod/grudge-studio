# ✅ GRUDGE Warlords - Deployment Checklist

## 🎯 **Pre-Deployment**

### **1. Code Preparation**
- [ ] All code committed to Git
- [ ] No sensitive data in code (API keys, passwords)
- [ ] Environment variables documented
- [ ] Dependencies up to date
- [ ] Build process tested locally

### **2. Environment Variables**

#### **Backend (Replit/Railway/Render):**
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret-key
ADMIN_PASSWORD=secure-admin-password
PUTER_API_KEY=your-puter-api-key
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
```

#### **Frontend (Vercel/Netlify):**
```env
VITE_API_URL=https://your-backend.replit.app
VITE_PUTER_WORKER_URL=https://puter.com/app/grudge-api
VITE_PUTER_APP_ID=your-puter-app-id
```

#### **Grudge Builder:**
```env
VITE_API_URL=https://your-backend.replit.app
VITE_CDN_URL=https://cdn.puter.com/grudge
```

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Backend** ⏱️ 10 minutes

#### **Option A: Replit (Recommended)**
1. [ ] Go to https://replit.com
2. [ ] Import from GitHub
3. [ ] Set environment variables in Secrets
4. [ ] Click "Deploy"
5. [ ] Note deployment URL: `https://your-repl.replit.app`

#### **Option B: Railway**
1. [ ] Go to https://railway.app
2. [ ] New Project → Deploy from GitHub
3. [ ] Add PostgreSQL service
4. [ ] Set environment variables
5. [ ] Deploy

#### **Option C: Render**
1. [ ] Go to https://render.com
2. [ ] New Web Service
3. [ ] Connect GitHub repo
4. [ ] Add PostgreSQL database
5. [ ] Set environment variables
6. [ ] Deploy

### **Step 2: Deploy Frontend** ⏱️ 5 minutes

#### **Vercel (Recommended)**
1. [ ] Go to https://vercel.com
2. [ ] New Project → Import from GitHub
3. [ ] Framework: Vite
4. [ ] Build Command: `npm run build`
5. [ ] Output Directory: `dist/public`
6. [ ] Set environment variables
7. [ ] Deploy
8. [ ] Note deployment URL: `https://your-app.vercel.app`

#### **Netlify**
1. [ ] Go to https://netlify.com
2. [ ] New Site → Import from GitHub
3. [ ] Build Command: `npm run build`
4. [ ] Publish Directory: `dist/public`
5. [ ] Set environment variables
6. [ ] Deploy

### **Step 3: Deploy Puter Worker** ⏱️ 5 minutes

```bash
# Deploy worker
npm run deploy:worker

# Verify deployment
npm run puter:status
```

### **Step 4: Database Setup** ⏱️ 5 minutes

```bash
# Run migrations (in Replit Shell or locally)
npm run db:push

# Verify connection
curl https://your-backend.replit.app/api/health
```

### **Step 5: Connect Everything** ⏱️ 5 minutes

1. [ ] Update frontend `VITE_API_URL` with backend URL
2. [ ] Update backend `FRONTEND_URL` with frontend URL
3. [ ] Update backend `CORS_ORIGIN` with frontend URL
4. [ ] Redeploy both frontend and backend
5. [ ] Test full flow

---

## ✅ **Post-Deployment Verification**

### **Health Checks:**

```bash
# Backend
curl https://your-backend.replit.app/api/health

# Frontend
curl https://your-app.vercel.app

# Puter Worker
curl https://puter.com/app/grudge-api/api/health
```

### **Functional Tests:**

1. [ ] **Authentication**
   - [ ] Can create account
   - [ ] Can login
   - [ ] Session persists

2. [ ] **Character System**
   - [ ] Can create character
   - [ ] Character data loads
   - [ ] Stats calculate correctly

3. [ ] **Inventory**
   - [ ] Can view inventory
   - [ ] Can add/remove items
   - [ ] Quantities update

4. [ ] **Crafting**
   - [ ] Recipes load
   - [ ] Can craft items
   - [ ] Materials consumed

5. [ ] **Sprite Generation**
   - [ ] Can generate sprites
   - [ ] Jobs complete
   - [ ] Images display

6. [ ] **Admin Panel**
   - [ ] Can access with password
   - [ ] Stats display correctly
   - [ ] User management works

---

## 🎮 **Grudge Builder Deployment**

### **Option 1: Separate Deployment**
```bash
cd grudge-builder
npm install
npm run build

# Deploy to Vercel/Netlify as separate app
```

### **Option 2: Integrated Deployment**
- Add to main app as `/builder` route
- Share assets and API client
- Deploy together with main app

---

## 📊 **Monitoring**

### **Set up monitoring for:**
- [ ] Backend uptime (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics, Plausible)
- [ ] Database backups (automated)

### **Monitor these metrics:**
- [ ] API response times
- [ ] Database query performance
- [ ] Asset loading times
- [ ] User session duration
- [ ] Error rates

---

## 🚨 **Rollback Plan**

If deployment fails:

1. **Frontend:** Revert to previous deployment in Vercel dashboard
2. **Backend:** Revert to previous deployment in Replit/Railway
3. **Database:** Restore from backup
4. **Puter Worker:** Redeploy previous version

---

## 📝 **Post-Deployment Tasks**

- [ ] Update documentation with live URLs
- [ ] Share deployment URLs with team
- [ ] Set up monitoring alerts
- [ ] Schedule database backups
- [ ] Plan first update/hotfix

---

## 🎉 **You're Live!**

**Frontend:** https://your-app.vercel.app  
**Backend:** https://your-backend.replit.app  
**Admin:** https://your-app.vercel.app/admin  
**Builder:** https://your-app.vercel.app/builder  

**Total Deployment Time:** ~30 minutes

**Next Steps:**
1. Test all features in production
2. Monitor for errors
3. Gather user feedback
4. Plan next iteration

**Ready to iterate and improve!** 🚀

