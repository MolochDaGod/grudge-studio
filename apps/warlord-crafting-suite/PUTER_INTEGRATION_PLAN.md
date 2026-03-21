# ðŸš€ Puter Integration Plan for GRUDGE Warlords

## ðŸ“‹ **Current Architecture Overview**

### **What You Have**

1. **Express Backend** (`server/index.ts`, `server/routes.ts`)
   - PostgreSQL database via Drizzle ORM
   - Full auth system (username/password, wallet, Puter SSO)
   - All game APIs (characters, crafting, inventory, etc.)
   - Deployed on Replit: `https://api.grudge-studio.com`

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

## ðŸŽ¯ **Integration Strategy**

### **Hybrid Architecture** (Recommended)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Frontend (Puter.com)                                    â”‚
â”‚  â€¢ Built React app deployed to Puter                     â”‚
â”‚  â€¢ Uses Puter SDK for auth                               â”‚
â”‚  â€¢ Connects to BOTH backends                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â†“
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â†“                                  â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Express Backend â”‚            â”‚  Puter Worker    â”‚
â”‚  (Replit/Railway)â”‚            â”‚  (Puter.com)     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤            â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â€¢ PostgreSQL DB  â”‚            â”‚ â€¢ Puter KV       â”‚
â”‚ â€¢ User accounts  â”‚            â”‚ â€¢ AI features    â”‚
â”‚ â€¢ Characters     â”‚            â”‚ â€¢ Sprite gen     â”‚
â”‚ â€¢ Inventory      â”‚            â”‚ â€¢ NPC chat       â”‚
â”‚ â€¢ Crafting       â”‚            â”‚ â€¢ Sessions       â”‚
â”‚ â€¢ Shop           â”‚            â”‚                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### **Why Hybrid?**

âœ… **Best of Both Worlds**:
- PostgreSQL for complex game data (characters, inventory, crafting)
- Puter KV for sessions and AI features
- Puter AI for free AI capabilities
- Existing backend keeps working

âœ… **Deployment**:
- Frontend: Puter.com (free hosting)
- Express Backend: Replit/Railway (PostgreSQL support)
- Puter Worker: Puter.com (AI features)

---

## ðŸ“ **Implementation Steps**

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
  EXPRESS_API: process.env.BACKEND_URL || 'https://api.grudge-studio.com',
  
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

## ðŸ”§ **Configuration Files Needed**

### **1. Environment Variables**

**Express Backend** (`.env`):
```env
DATABASE_URL=postgresql://...
PUTER_AUTH_TOKEN=your_puter_token  # Optional
PUTER_WORKER_URL=https://grudge-server.puter.site
```

**Puter Frontend** (set in Puter dashboard):
```env
VITE_BACKEND_URL=https://api.grudge-studio.com
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

## ðŸ“¦ **Deployment Checklist**

### **Frontend (Puter.com)**
- [ ] Build React app: `npm run build`
- [ ] Upload `dist/public/` to Puter
- [ ] Set `BACKEND_URL` environment variable
- [ ] Test login and basic features

### **Express Backend (Replit/Railway)**
- [ ] Already deployed âœ…
- [ ] Add CORS for `*.puter.site`
- [ ] Test `/api/health` endpoint
- [ ] Verify PostgreSQL connection

### **Puter Worker (Puter.com)**
- [ ] Deploy `puter-deploy/grudge-server/index.js`
- [ ] Test `/api/health` endpoint
- [ ] Verify AI features work
- [ ] Test session management

---

## ðŸŽ® **User Flow**

1. User visits `https://grudge-warlords.puter.site`
2. Puter SDK auto-authenticates user
3. Frontend sends Puter UUID to Express backend
4. Express creates/links account in PostgreSQL
5. User plays game (all data in PostgreSQL)
6. AI features route to Puter Worker
7. Sessions stored in Puter KV

---

## ðŸš€ **Next Steps**

**Want me to:**
1. âœ… Build the React app for Puter deployment?
2. âœ… Create deployment scripts?
3. âœ… Update CORS settings in Express?
4. âœ… Create a simple index.html launcher for Puter?

**Choose one and I'll implement it!**
