# GRUDGE Account System

Complete authentication and user management for GRUDGE Warlords.

## Overview

GRUDGE uses a unified account system across all apps:

```
┌─────────────────────────────────────────────────────────┐
│                   Authentication Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌─────────────┐     ┌─────────────┐                   │
│   │   Studio    │     │   Cloud     │                   │
│   │  Frontend   │     │   Admin     │                   │
│   └──────┬──────┘     └──────┬──────┘                   │
│          │                   │                           │
│          └─────────┬─────────┘                          │
│                    │                                     │
│                    ▼                                     │
│          ┌─────────────────┐                            │
│          │   grudge-auth   │  ← SSO Hub                 │
│          │  .puter.site    │                            │
│          └────────┬────────┘                            │
│                   │                                      │
│          ┌────────┴────────┐                            │
│          │                 │                             │
│          ▼                 ▼                             │
│   ┌─────────────┐   ┌─────────────┐                     │
│   │   Puter     │   │   Local     │                     │
│   │   SSO       │   │  Accounts   │                     │
│   └─────────────┘   └─────────────┘                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Account Types

### 1. GrudgeAccount (Local)

Traditional username/password accounts stored in PostgreSQL.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `username` | string | Login name (unique) |
| `password` | string | bcrypt hash |
| `email` | string? | Optional email |
| `displayName` | string? | Public name |
| `avatarUrl` | string? | Profile picture |
| `role` | string | User role (see below) |
| `isPremium` | boolean | Premium status |
| `createdAt` | timestamp | Creation date |
| `lastLoginAt` | timestamp? | Last login |

### 2. Puter SSO

Automatic authentication via Puter.com account.

```javascript
// In Puter app context
const user = await puter.auth.getUser();
if (user) {
    // User is logged in via Puter
    const { username, uuid, email } = user;
}
```

## User Roles

| Role | Access Level | Features |
|------|-------------|----------|
| `admin` | Full | All features, Admin panel, Sprites |
| `developer` | High | Admin panel, Command Center |
| `premium` | Medium | Command Center, Gallery |
| `user` | Standard | Basic game features |
| `guest` | Limited | View only, no saves |

### Role Checking

```javascript
// Frontend role check
const hasAccess = (userRole, requiredRoles) => {
    return requiredRoles.includes(userRole);
};

// Protected routes
const ADMIN_ROLES = ['admin', 'developer'];
const PREMIUM_ROLES = ['admin', 'developer', 'premium'];
```

---

## Authentication Methods

### 1. Local Registration

```javascript
// POST /api/auth/register
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'NewPlayer',
        password: 'SecurePass123',
        email: 'player@example.com'
    })
});

const { user, token } = await response.json();
```

### 2. Local Login

```javascript
// POST /api/auth/login
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'ExistingPlayer',
        password: 'MyPassword'
    })
});

const { user, token } = await response.json();
localStorage.setItem('auth_token', token);
```

### 3. Puter SSO

```javascript
// Check if in Puter app context
const isPuterApp = new URLSearchParams(window.location.search)
    .has('puter.app_instance_id');

if (isPuterApp) {
    // Already authenticated via Puter
    const user = await puter.auth.getUser();
    console.log('Puter user:', user.username);
} else {
    // Standalone - trigger Puter sign-in
    const user = await puter.auth.signIn();
}
```

---

## Cross-App Authentication

### SSO Redirect Flow

Apps redirect to `grudge-auth` for centralized login:

```
https://grudge-auth.puter.site?return_url=APP_URL&app_id=APP_NAME&mode=login
```

| Parameter | Description |
|-----------|-------------|
| `return_url` | URL to redirect after login |
| `app_id` | Requesting app identifier |
| `mode` | `login` or `register` |

### Token Exchange

1. User logs in at `grudge-auth`
2. Auth creates exchange token (valid 2 hours)
3. User redirected to `return_url?auth_code=TOKEN`
4. App exchanges token for session

```javascript
// At grudge-auth after login
const exchangeToken = crypto.randomBytes(32).toString('hex');
await me.puter.kv.set(`grudge_session_${exchangeToken}`, JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
}));

window.location.href = `${returnUrl}?auth_code=${exchangeToken}`;
```

```javascript
// At requesting app
const authCode = new URLSearchParams(window.location.search).get('auth_code');
if (authCode) {
    const response = await fetch(`${WORKER_URL}/api/auth/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
    });
    const session = await response.json();
    localStorage.setItem('session', JSON.stringify(session));
}
```

---

## Worker API Endpoints

### POST /api/auth/consume

Exchange auth code for session.

```javascript
// Request
{ "code": "abc123..." }

// Response
{
    "success": true,
    "userId": "uuid",
    "username": "Player",
    "role": "user"
}
```

### GET /api/auth/verify

Verify existing session.

```javascript
// Request
GET /api/auth/verify?auth_code=TOKEN
// or
Authorization: Bearer TOKEN

// Response
{
    "valid": true,
    "userId": "uuid",
    "username": "Player",
    "role": "user"
}
```

---

## Security Features

### Password Hashing

```javascript
import bcrypt from 'bcrypt';

// Hash password (10 rounds)
const hash = await bcrypt.hash(password, 10);

// Verify password
const valid = await bcrypt.compare(password, hash);
```

### Token Generation

```javascript
import crypto from 'crypto';

// Generate cryptographically secure token
const token = crypto.randomBytes(32).toString('hex');
```

### Session Management

```javascript
// Store session with expiry
const session = {
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
};

await me.puter.kv.set(`grudge_session_${token}`, JSON.stringify(session));

// Verify session
const verify = async (token) => {
    const data = await me.puter.kv.get(`grudge_session_${token}`);
    if (!data) return null;
    
    const session = JSON.parse(data);
    if (session.expiresAt < Date.now()) {
        await me.puter.kv.del(`grudge_session_${token}`);
        return null;
    }
    return session;
};
```

---

## Frontend Integration

### AuthContext (React)

```javascript
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for Puter SSO
        const checkAuth = async () => {
            try {
                const puterUser = await puter.auth.getUser();
                if (puterUser) {
                    setUser({
                        username: puterUser.username,
                        role: puterUser.is_puter_user ? 'premium' : 'user'
                    });
                }
            } catch (e) {
                // Check local session
                const session = localStorage.getItem('session');
                if (session) setUser(JSON.parse(session));
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
```

### Protected Routes

```javascript
function ProtectedRoute({ children, requiredRoles }) {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" />;
    if (!requiredRoles.includes(user.role)) return <Navigate to="/" />;
    
    return children;
}

// Usage
<Route path="/admin" element={
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
        <AdminPanel />
    </ProtectedRoute>
} />
```
