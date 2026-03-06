# Google Sheets Account Sync - Setup Guide

This guide explains how to set up Google Sheets integration for centralized GRUDGE account management.

## Purpose

The Google Sheets account sync provides:
- **Centralized account registry** accessible by all GRUDGE apps
- **Real-time visibility** into account data without database access
- **Easy data export** for analytics and reporting
- **Backup** of account information

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "GRUDGE Accounts"
3. Set up the header row (Row 1):

| Column | Header |
|--------|--------|
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

## Step 2: Make Sheet Public for Reading

1. Click **Share** button
2. Under "General access", change to **Anyone with the link**
3. Set permission to **Viewer**
4. Copy the spreadsheet URL

## Step 3: Configure Environment

Add the sheet URL to your Replit secrets:

**Secret Name:** `GOOGLE_SHEET_ACCOUNT`
**Value:** `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

## Step 4: Verify Connection

Test the connection with the API:

```bash
curl https://your-app.replit.app/api/sheets/status
```

Expected response:
```json
{
  "success": true,
  "accountsConfigured": true,
  "cache": {
    "accounts": {
      "cached": true,
      "count": 42,
      "configured": true
    }
  }
}
```

## API Endpoints

### Get All Accounts (from sheet)
```
GET /api/sheets/accounts
```

Response:
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "uuid-1",
      "username": "player1",
      "email": "player1@example.com",
      "displayName": "Player One",
      "isPremium": "TRUE",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Get Single Account
```
GET /api/sheets/accounts/:id
```

### Check Sheet Status
```
GET /api/sheets/status
```

Returns configuration and cache status for all sheets including accounts.

## Write Operations (Requires Service Account)

To enable write operations (syncing new accounts and updates to the sheet), you need a Google Cloud service account:

### Setup Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Go to **IAM & Admin > Service Accounts**
5. Create a service account with a descriptive name
6. Create a JSON key and download it
7. Copy the entire JSON content to Replit secret: `GOOGLE_SERVICE_ACCOUNT_JSON`
8. Share your Google Sheet with the service account email (found in the JSON as `client_email`)

### Write API Endpoints

**Sync New Account to Sheet (on registration):**
```
POST /api/sheets/accounts/sync
```
```json
{
  "id": "uuid-here",
  "username": "player1",
  "email": "player1@example.com",
  "displayName": "Player One",
  "isPremium": false,
  "createdAt": "2025-12-29T00:00:00Z"
}
```

**Update Account in Sheet:**
```
PATCH /api/sheets/accounts/:id
```
```json
{
  "lastLoginAt": "2025-12-29T12:00:00Z",
  "isPremium": true
}
```

**Get Schema Information:**
```
GET /api/sheets/accounts/schema
```
Returns column definitions and configuration status.

## Usage from Other Apps

### Option 1: Read from Sheet Directly

Any GRUDGE app can read account data from the shared sheet:

```typescript
const SHEET_URL = process.env.GOOGLE_SHEET_ACCOUNT;

async function getAccountFromSheet(accountId: string) {
  const response = await fetch(
    `https://your-warlords-app.replit.app/api/sheets/accounts/${accountId}`
  );
  return response.json();
}
```

### Option 2: Use API Client

```typescript
import { GrudgeAPI } from './puter/api/client';

const api = new GrudgeAPI();

// Get all accounts
const accounts = await api.getSheetAccounts();

// Get specific account
const account = await api.getSheetAccount('uuid-here');
```

## Sheet Structure Example

| id | username | email | displayName | puterId | avatarUrl | isPremium | premiumUntil | createdAt | lastLoginAt | settings |
|----|----------|-------|-------------|---------|-----------|-----------|--------------|-----------|-------------|----------|
| abc-123 | player1 | p1@email.com | Player One | puter-1 | https://... | TRUE | 2026-01-01 | 2025-01-01 | 2025-12-29 | {} |
| def-456 | player2 | | Player Two | puter-2 | | FALSE | | 2025-06-15 | 2025-12-28 | {"theme":"dark"} |

## Best Practices

1. **Don't store passwords** - Never write passwords to the sheet (passwords stay in PostgreSQL only)
2. **Cache reads** - API caches sheet data for 5 minutes, no need to throttle requests
3. **Handle errors** - Sheet may be temporarily unavailable
4. **Keep sheet updated** - Manually update the sheet when accounts change in the database

## Troubleshooting

### "GOOGLE_SHEET_ACCOUNT not configured"
- Check `GOOGLE_SHEET_ACCOUNT` secret is set correctly
- Ensure URL includes the full path with `/edit`

### "Permission denied"
- Make sure sheet is shared as "Anyone with link can view"
- Check the URL is for the correct sheet

### "Account not found in sheet"
- Account may not have been added to the sheet yet
- Manually add the account row to the Google Sheet

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SHEET_ACCOUNT` | Yes | URL to Google Sheet for accounts |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | For writes | Full JSON of service account credentials |

---
Version: 2.0.0
Last Updated: 2025-12-29
