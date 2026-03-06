# Google Sheets Account Sync - Setup Guide

Google Sheets integration for centralized GRUDGE account management.

## Purpose

- **Centralized account registry** accessible by all GRUDGE apps
- **Real-time visibility** into account data without database access
- **Easy data export** for analytics and reporting
- **Backup** of account information

## Step 1: Create the Google Sheet

Headers (Row 1):
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

## Step 2: Make Sheet Public

1. Click **Share** button
2. Under "General access", set to **Anyone with the link**
3. Set permission to **Viewer**

## Step 3: Configure Environment

Add to Replit secrets:
- **Name:** `GOOGLE_SHEET_ACCOUNT`
- **Value:** `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sheets/accounts` | Get all accounts |
| `GET /api/sheets/accounts/:id` | Get single account |
| `GET /api/sheets/status` | Check configuration status |
| `POST /api/sheets/accounts/sync` | Sync new account (requires service account) |
| `PATCH /api/sheets/accounts/:id` | Update account (requires service account) |

## Security Notes

1. **Don't store passwords** - Never write passwords to the sheet
2. **Cache reads** - API caches sheet data for 5 minutes
3. **Handle errors** - Sheet may be temporarily unavailable
