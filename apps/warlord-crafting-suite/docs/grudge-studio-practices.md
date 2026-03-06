# GRUDGE Studio Best Practices & Network Architecture

> Technical Architecture & Deployment Guide v2025

## 1. Network Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GRUDGE STUDIO NETWORK                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     Auth Code     ┌─────────────┐                 │
│  │ GRUDGE-AUTH │ ←───────────────→ │GRUDGE-STUDIO│                 │
│  │  (SSO Hub)  │                   │ (Frontend)  │                 │
│  │ puter.site  │                   │ puter.site  │                 │
│  └──────┬──────┘                   └──────┬──────┘                 │
│         │                                  │                        │
│         │ Session KV                       │ API Calls              │
│         ▼                                  ▼                        │
│  ┌─────────────────────────────────────────────────────┐           │
│  │              PUTER KEY-VALUE STORE                  │           │
│  │   grudge_session_*  grudge_npc_*  grudge_data_*    │           │
│  └─────────────────────────────────────────────────────┘           │
│         ▲                                  ▲                        │
│         │                                  │                        │
│  ┌──────┴──────┐                   ┌──────┴──────┐                 │
│  │GRUDGE-SERVER│                   │GRUDGE-CLOUD │                 │
│  │  (Node.js)  │                   │   (Admin)   │                 │
│  │   AI/API    │                   │   Storage   │                 │
│  └─────────────┘                   └─────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. App Responsibilities

### grudge-auth (SSO Hub)
**App ID**: `app-78a6cac4-afb0-45a2-8074-90d687b41770`
**URL**: `https://grudge-auth.puter.site`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Login page with Puter SSO |
| `/login` | GET | Redirect to Puter SSO |
| `/callback` | GET | Handle SSO callback |
| `/logout` | GET | Terminate session |
| `/verify?code=` | GET | Verify session code |

**KV Keys Used**:
- `grudge_session_{code}` - Session data (JSON)
- `grudge_sessions_index` - List of active session codes

### grudge-server (API Backend)
**App ID**: `app-f9ad7ff9-1a2e-4bb0-a20a-8db9db03a620`
**URL**: `https://grudge-server.puter.site`

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | No | Health check |
| `/api/auth/consume` | POST | No | Exchange auth code |
| `/api/auth/verify` | GET | Yes | Verify session |
| `/api/ai/chat` | POST | Yes | AI chat |
| `/api/ai/vision` | POST | Admin | Image analysis |
| `/api/sprites/generate` | POST | Admin | Generate sprites |
| `/api/jobs/:jobId` | GET | Yes | Job status |
| `/api/data/sync` | POST | Admin | Sync game data |

### grudge-cloud (Admin Storage)
**App ID**: `app-72f20857-03d2-4551-b6fd-7bf1f90a2cf0`
**URL**: `https://grudge-cloud.puter.site`

Admin-only tool for:
- Browsing Puter file system
- Managing KV store entries
- Viewing sprite library
- Data backup/restore

### grudge-studio (Frontend)
**App ID**: `grudge-warlords`
**URL**: `https://grudge-warlords.puter.site`

Main application with:
- 5 Profession skill trees
- 518 crafting recipes
- Character management
- Shop & inventory
- Command Center
- NPC Chat

## 3. Authentication Flow

```
User → Studio → Auth → Puter SSO → Auth → Studio (with code)
                                      ↓
                                 KV Session
                                      ↓
                              Server Validates
```

### Step-by-Step Flow

1. **User visits Studio** (`grudge-warlords.puter.site`)
2. **Clicks "Sign In"** → Redirected to Auth with `returnUrl`
3. **Auth initiates Puter SSO** → `puter.auth.signIn()`
4. **Puter authenticates** → Returns user object
5. **Auth creates session** → Stores in KV with code
6. **Auth redirects** → Back to Studio with `auth_code`
7. **Studio consumes code** → Calls Server `/api/auth/consume`
8. **Server validates** → Returns user data + role

### Session Data Structure

```javascript
{
  userId: "puter-uuid-here",
  username: "player123",
  role: "premium",  // admin | developer | ai_agent | premium | user | guest
  createdAt: 1735570000000,
  expiresAt: 1735656400000,  // 24 hours
  source: "puter_sso"
}
```

## 4. API Best Practices

### Request Headers

```javascript
// All authenticated requests
{
  "Authorization": "Bearer {auth_code}",
  "Content-Type": "application/json"
}
```

### Response Format

```javascript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "error": "Error message",
  "status": 400  // HTTP status code
}
```

### Rate Limiting

- AI endpoints: 60 requests/minute
- Data endpoints: 120 requests/minute
- Auth endpoints: 30 requests/minute

## 5. Puter.js Usage Patterns

### In Browser (Studio Frontend)

```javascript
// CDN loaded - puter is global
const user = await puter.auth.getUser();
await puter.kv.set('key', JSON.stringify(value));
const data = await puter.kv.get('key');
```

### In Workers (Server/Cloud)

```javascript
// Use me.puter for developer resources
await me.puter.kv.set('grudge_key', JSON.stringify(value));
const data = await me.puter.kv.get('grudge_key');

// Use user.puter for user resources (if authenticated)
if (user && user.puter) {
  await user.puter.ai.chat(message);
}
```

### Key Namespacing

| Prefix | Purpose | Example |
|--------|---------|---------|
| `grudge_session_` | Auth sessions | `grudge_session_sc_abc123` |
| `grudge_npc_` | NPC memory | `grudge_npc_blacksmith_memory` |
| `grudge_job_` | Job queue | `grudge_job_sprite_xyz` |
| `grudge_data_` | Game data | `grudge_data_weapons` |
| `grudge_account_` | User accounts | `grudge_account_user123` |
| `grudge_chat_` | Chat history | `grudge_chat_room_general` |

### JSON Serialization (CRITICAL)

```javascript
// ALWAYS stringify objects before storing
await puter.kv.set('key', JSON.stringify({ name: 'value' }));

// ALWAYS parse when reading
const data = await puter.kv.get('key');
const parsed = data ? JSON.parse(data) : null;
```

## 6. AI Agent Patterns

### AI Chat Endpoint

```javascript
router.post("/api/ai/chat", async ({ request }) => {
  const { message, context } = await request.json();
  
  const systemPrompts = {
    command: "You are GRUDGE Command AI. Control workers and manage data.",
    npc: "You are an NPC in GRUDGE Warlords. Stay in character.",
    general: "You are a helpful assistant for GRUDGE Warlords."
  };
  
  const response = await me.puter.ai.chat(message, {
    system: systemPrompts[context] || systemPrompts.general,
    model: "claude-sonnet-4"
  });
  
  return { response };
});
```

### Vision Analysis

```javascript
router.post("/api/ai/vision", async ({ request }) => {
  const { imageUrl, question } = await request.json();
  
  const analysis = await me.puter.ai.chat(question, {
    vision: { url: imageUrl }
  });
  
  return { analysis };
});
```

### Sprite Generation Job Queue

```javascript
// Create job
const jobId = `job_${crypto.randomUUID()}`;
await me.puter.kv.set(`grudge_job_${jobId}`, JSON.stringify({
  status: 'queued',
  type: 'sprite_generation',
  prompt: userPrompt,
  createdAt: Date.now()
}));

// Process async
generateSpriteAsync(jobId);

// Return immediately
return { jobId, status: 'queued' };
```

## 7. File System Organization

```
/grudge-warlords/
├── assets/
│   ├── sprites/
│   │   ├── characters/
│   │   ├── items/
│   │   ├── ui/
│   │   └── effects/
│   ├── audio/
│   └── data/
├── backups/
│   ├── daily/
│   └── manual/
└── exports/
    ├── accounts/
    └── game-data/
```

## 8. Deployment Checklist

### Pre-Deployment

- [ ] All API endpoints tested
- [ ] Session management verified
- [ ] Role-based access working
- [ ] KV namespacing correct
- [ ] Error handling in place
- [ ] Logging configured

### Deployment Commands

```bash
# 1. Build all apps
npx tsx puter/deploy/multi-app-deploy.ts

# 2. Login to Puter CLI
puter login --save

# 3. Deploy all apps
npx tsx puter/deploy/auto-deploy-all.ts

# Or deploy individually:
puter app:update grudge-auth ./puter-deploy/grudge-auth
puter app:update grudge-server ./puter-deploy/grudge-server
puter app:update grudge-cloud ./puter-deploy/grudge-cloud
puter app:update grudge-studio ./puter-deploy/grudge-studio
```

### Post-Deployment

- [ ] Health check endpoints responding
- [ ] Auth flow end-to-end working
- [ ] Admin panel accessible
- [ ] AI endpoints responding
- [ ] Assets loading correctly

## 9. Security Best Practices

### Never Do

- ❌ Hard-code API keys or tokens
- ❌ Trust client-side role claims
- ❌ Store sensitive data unencrypted
- ❌ Skip input validation
- ❌ Expose internal errors to users

### Always Do

- ✅ Use environment variables for secrets
- ✅ Validate sessions server-side
- ✅ Sanitize user input
- ✅ Use HTTPS for all communications
- ✅ Implement proper error handling
- ✅ Log security events

## 10. Monitoring & Health

### Health Check Endpoint

```javascript
router.get("/api/health", async () => {
  return {
    status: "healthy",
    app: "grudge-server",
    version: "2.5.0",
    timestamp: new Date().toISOString(),
    services: {
      kv: "operational",
      ai: "operational",
      fs: "operational"
    }
  };
});
```

### Metrics to Track

- Request latency
- Error rates
- Active sessions
- AI usage
- Storage usage

---

*© 2025 GRUDGE Studio. Built for Puter.com integration.*
