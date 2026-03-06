# GRUDGE Account System - Authentication & Registration

This document covers the centralized GrudgeAccount system used across all GRUDGE apps.

## Overview

GrudgeAccounts provide a unified identity system for all GRUDGE games and apps:
- GRUDGE Warlords (Crafting & Progression)
- GRUDGE Islands (Future: Island Building)
- GRUDGE Battles (Future: Combat System)
- Other GRUDGE companion apps

## Account Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique account identifier |
| `username` | string | Unique login name |
| `password` | string | Hashed password (bcrypt) |
| `email` | string? | Optional email address |
| `displayName` | string? | Public display name |
| `puterId` | string? | Puter.com account ID (for SSO) |
| `avatarUrl` | string? | Profile picture URL |
| `isPremium` | boolean | Premium subscription status |
| `premiumUntil` | timestamp? | Premium expiration date |
| `createdAt` | timestamp | Account creation date |
| `lastLoginAt` | timestamp? | Last login timestamp |
| `settings` | JSONB | User preferences and settings |

## Authentication Methods

### 1. Local Authentication (Guest Accounts)

Create accounts with username/password stored in PostgreSQL.

**Register:**
```typescript
POST /api/auth/register
{
  "username": "player123",
  "password": "securePassword",
  "email": "optional@email.com",
  "displayName": "Player One"
}
```

**Login:**
```typescript
POST /api/auth/login
{
  "username": "player123",
  "password": "securePassword"
}
```

### 2. Puter.com SSO (Recommended for Web Apps)

Use Puter's built-in authentication for seamless login.

```javascript
// In browser
const user = await puter.auth.getUser();
if (user) {
  // User is logged in via Puter
  const grudgeAccount = await api.linkPuterAccount(user.id);
}
```

## Google Sheets Sync (GOOGLE_SHEET_ACCOUNT)

For cross-app account synchronization, account data can be synced to a Google Sheet.

### Environment Setup

Add this secret to your Replit project:
```
GOOGLE_SHEET_ACCOUNT=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

### Sheet Structure

Create a Google Sheet with these columns:

| Column | Header Name |
|--------|-------------|
| A | id |
| B | username |
| C | email |
| D | displayName |
| E | puterId |
| F | avatarUrl |
| G | isPremium |
| H | premiumUntil |
| I | createdAt |
| J | lastLoginAt |
| K | settings |

### API Endpoints

**Get all accounts from sheet:**
```typescript
GET /api/sheets/accounts
```

**Get single account from sheet:**
```typescript
GET /api/sheets/accounts/:id
```

**Check configuration status:**
```typescript
GET /api/sheets/status
// Response includes accountsConfigured: boolean
```

> Note: The sheet is read-only via API. To add/update accounts, manually edit the Google Sheet or use the PostgreSQL database directly.

## Cross-App Usage

### From Another GRUDGE App

1. Add secrets to your app:
   - `DATABASE_URL` - PostgreSQL connection (for direct access)
   - `YOUR_APP_URL` - GRUDGE Warlords API URL (for API access)
   - `GOOGLE_SHEET_ACCOUNT` - Shared account sheet URL

2. Use the API client:
```typescript
import { GrudgeAPI } from './puter/api/client';

const api = new GrudgeAPI();

// Get all accounts from shared sheet
const { data: accounts } = await api.getSheetAccounts();

// Get specific account by ID
const { data: account } = await api.getSheetAccount('uuid-here');
```

### Shared Account Fields

These fields are available across all GRUDGE apps:

| Field | Shared Across Apps |
|-------|-------------------|
| `id` | Primary identifier |
| `username` | Login/display |
| `displayName` | In-game name |
| `avatarUrl` | Profile picture |
| `isPremium` | Premium features |
| `settings` | App-specific preferences |

### App-Specific Data

Each app stores its own data linked to the account:
- **Warlords**: characters, skills, inventory, crafted items
- **Islands**: islands, buildings, resources
- **Battles**: battle history, rankings, achievements

## Security Notes

1. **Passwords** are never stored in Google Sheets (only in PostgreSQL)
2. **API Keys** should never be exposed to clients
3. Use **HTTPS** for all API calls in production
4. Implement **rate limiting** for login attempts
5. Consider **2FA** for premium accounts

## Cross-App Login Flow

### Direct Login URL

Other GRUDGE apps can redirect users to the centralized login page:

```
https://your-warlords-app.replit.app/login?return_url=YOUR_APP_URL&app_id=YOUR_APP_NAME&mode=login
```

Query parameters:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `return_url` | Yes | URL to redirect after login (must be whitelisted) |
| `app_id` | No | Display name for your app |
| `mode` | No | `login` or `register` (default: login) |

### Token Exchange Flow

1. User clicks login link → redirected to GRUDGE Warlords `/login`
2. User logs in or registers
3. Redirect back to `return_url?token=xxx&user_id=xxx&username=xxx`
4. Your app exchanges the token for full user data:

```typescript
import { GrudgeAPI } from './puter/api/client';

const api = new GrudgeAPI();

// Get token from URL params after redirect
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  const { user } = await api.exchangeAuthToken(token);
  // user contains: id, username, displayName, email, avatarUrl, isPremium
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new account (returns user + token) |
| `/api/auth/login` | POST | Login with credentials (returns user + optional token) |
| `/api/auth/token` | POST | Generate auth token (requires credentials) |
| `/api/auth/exchange` | POST | Exchange token for user data (one-time use) |
| `/api/auth/verify` | GET | Verify token is valid (non-consuming) |

### Security Features

- **bcrypt password hashing** - Passwords are hashed with bcrypt (10 rounds) before storage
- **Cryptographically secure tokens** - Auth tokens are generated using `crypto.randomBytes(32)`
- **Server-side credential validation** - All authentication happens server-side with database verification
- **Token expiry** - Auth tokens expire after 10 minutes
- **One-time token use** - Exchange tokens are consumed after use for security
- **Origin whitelisting** - Cross-app redirects are limited to trusted domains

## Implementation Status

| Feature | Status |
|---------|--------|
| Local registration | ✅ Implemented |
| Local login | ✅ Implemented |
| Password hashing | ✅ Implemented |
| Session management | ✅ Implemented |
| Cross-app login | ✅ Implemented |
| Token exchange | ✅ Implemented |
| Puter SSO | 🔄 Ready to integrate |
| Google Sheets sync | 📋 Requires setup |

---
Version: 1.1.0
Last Updated: 2025-12-29
