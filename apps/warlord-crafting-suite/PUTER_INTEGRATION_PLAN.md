# 🚀 Puter Integration Plan for GRUDGE Warlords

## 📋 **Current Architecture Overview**

### **What You Have**

1. **Express Backend** (`server/index.ts`, `server/routes.ts`)
   - PostgreSQL database via Drizzle ORM
   - Full auth system (username/password, wallet, Puter SSO)
   - All game APIs (characters, crafting, inventory, etc.)
   - Deployed on Replit: `https://grudge-crafting.replit.app`

2. **Puter Worker** (`puter-deploy/grudge-server/index.js`)
   - Lightweight API for AI features
   - Uses Puter KV for session storage
   - AI chat, sprite generation, NPC conversations
   - Designed for Puter.com deployment

3. **React Frontend** (`client/`)
   - Full game UI with all features
   - Needs to be built with Vite
   - Currently connects to Express backend

---

## 🎯 **Integration Strategy**

### **Hybrid Architecture** (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Puter.com)                                    │
│  • Built React app deployed to Puter                     │
│  • Uses Puter SDK for auth                               │
│  • Connects to BOTH backends                             │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                  ↓
┌──────────────────┐            ┌──────────────────┐
│  Express Backend │            │  Puter Worker    │
│  (Replit/Railway)│            │  (Puter.com)     │
├──────────────────┤            ├──────────────────┤
│ • PostgreSQL DB  │            │ • Puter KV       │
│ • User accounts  │            │ • AI features    │
│ • Characters     │            │ • Sprite gen     │
│ • Inventory      │            │ • NPC chat       │
│ • Crafting       │            │ • Sessions       │
│ • Shop           │            │                  │
└──────────────────┘            └──────────────────┘
```

### **Why Hybrid?**

✅ **Best of Both Worlds**:
- PostgreSQL for complex game data (characters, inventory, crafting)
- Puter KV for sessions and AI features
- Puter AI for free AI capabilities
- Existing backend keeps working

✅ **Deployment**:
- Frontend: Puter.com (free hosting)
- Express Backend: Replit/Railway (PostgreSQL support)
- Puter Worker: Puter.com (AI features)

---

## 📝 **Implementation Steps**

### **Step 1: Build React App for Puter**

```bash
# Build the production app
npm run build

# This creates dist/public/ with all static files
```

### **Step 2: Deploy to Puter**

Upload `dist/public/` contents to Puter.com:
- `index.html` - Main app
- `assets/` - JS, CSS, images

### **Step 3: Configure Backend URLs**

Update `client/src/lib/api.ts` (or create it):

```typescript
// Detect if running on Puter
const isPuter = window.location.hostname.includes('puter');

export const API_CONFIG = {
  // Main backend (PostgreSQL, game data)
  EXPRESS_API: process.env.BACKEND_URL || 'https://grudge-crafting.replit.app',
  
  // Puter worker (AI features)
  PUTER_API: isPuter 
    ? 'https://grudge-server.puter.site' 
    : 'https://grudge-server.puter.site',
};

// Use EXPRESS_API for:
// - /api/auth/login, /api/auth/register
// - /api/characters/*
// - /api/inventory/*
// - /api/crafting/*
// - /api/shop/*

// Use PUTER_API for:
// - /api/ai/chat
// - /api/sprites/generate
// - /api/npc/chat
```

### **Step 4: Integrate Puter Auth**

Update `client/src/contexts/AuthContext.tsx`:

```typescript
import { useEffect } from 'react';

// Check if user is logged in via Puter
useEffect(() => {
  if (window.puter) {
    puter.auth.getUser().then(puterUser => {
      if (puterUser) {
        // Authenticate with Express backend using Puter ID
        fetch(`${EXPRESS_API}/api/auth/sso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puterUuid: puterUser.uuid,
            username: puterUser.username,
            email: puterUser.email
          })
        }).then(res => res.json())
          .then(data => {
            // Store session token
            localStorage.setItem('authToken', data.token);
          });
      }
    });
  }
}, []);
```

### **Step 5: Update Express Backend**

Add Puter.js SDK to Express (optional - for advanced features):

```bash
npm install @heyputer/puter-js
```

Update `server/index.ts`:

```typescript
import puter from '@heyputer/puter-js';

// Initialize Puter (optional - for server-side Puter features)
if (process.env.PUTER_AUTH_TOKEN) {
  puter.setAuthToken(process.env.PUTER_AUTH_TOKEN);
}
```

---

## 🔧 **Configuration Files Needed**

### **1. Environment Variables**

**Express Backend** (`.env`):
```env
DATABASE_URL=postgresql://...
PUTER_AUTH_TOKEN=your_puter_token  # Optional
PUTER_WORKER_URL=https://grudge-server.puter.site
```

**Puter Frontend** (set in Puter dashboard):
```env
VITE_BACKEND_URL=https://grudge-crafting.replit.app
VITE_PUTER_WORKER_URL=https://grudge-server.puter.site
```

### **2. Puter Manifest** (`puter/puter.config.json`)

Already exists! Just needs backend URL updated:

```json
{
  "name": "grudge-warlords",
  "version": "2.5.0",
  "main": "index.html",
  "type": "web",
  "runtime": "static",
  "env": {
    "BACKEND_URL": {
      "required": true,
      "description": "Express backend URL"
    }
  }
}
```

---

## 📦 **Deployment Checklist**

### **Frontend (Puter.com)**
- [ ] Build React app: `npm run build`
- [ ] Upload `dist/public/` to Puter
- [ ] Set `BACKEND_URL` environment variable
- [ ] Test login and basic features

### **Express Backend (Replit/Railway)**
- [ ] Already deployed ✅
- [ ] Add CORS for `*.puter.site`
- [ ] Test `/api/health` endpoint
- [ ] Verify PostgreSQL connection

### **Puter Worker (Puter.com)**
- [ ] Deploy `puter-deploy/grudge-server/index.js`
- [ ] Test `/api/health` endpoint
- [ ] Verify AI features work
- [ ] Test session management

---

## 🎮 **User Flow**

1. User visits `https://grudge-warlords.puter.site`
2. Puter SDK auto-authenticates user
3. Frontend sends Puter UUID to Express backend
4. Express creates/links account in PostgreSQL
5. User plays game (all data in PostgreSQL)
6. AI features route to Puter Worker
7. Sessions stored in Puter KV

---

## 🚀 **Next Steps**

**Want me to:**
1. ✅ Build the React app for Puter deployment?
2. ✅ Create deployment scripts?
3. ✅ Update CORS settings in Express?
4. ✅ Create a simple index.html launcher for Puter?

**Choose one and I'll implement it!**
