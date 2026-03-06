# API Reference

Complete reference for GRUDGE Warlords backend API endpoints.

## Base URL

Development: `http://localhost:5000`

## Authentication

### Register Account
```
POST /api/auth/register
```

**Request:**
```json
{
  "username": "string (3-20 chars)",
  "password": "string (min 4 chars)",
  "email": "string (optional)",
  "displayName": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "displayName": "string",
    "email": "string",
    "avatarUrl": "string",
    "isPremium": false
  }
}
```

### Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "username": "string",
  "password": "string",
  "generateToken": true  // optional, for cross-app auth
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "string (if generateToken=true)",
  "expiresIn": 600000  // 10 minutes
}
```

### Generate Auth Token
```
POST /api/auth/token
```

For cross-application authentication.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "hex-string",
  "expiresIn": 600000
}
```

### Exchange Token
```
POST /api/auth/exchange
```

Trade token for user info (consumes token).

**Request:**
```json
{
  "token": "string"
}
```

### Verify Token
```
GET /api/auth/verify?token=xxx
```

Check token validity without consuming.

**Response:**
```json
{
  "valid": true,
  "userId": "uuid",
  "username": "string"
}
```

## Characters

### Create Character
```
POST /api/characters
```

**Request:**
```json
{
  "userId": "uuid",
  "name": "string",
  "profession": "Miner|Forester|Mystic|Chef|Engineer",
  "raceId": "string (optional)",
  "classId": "string (optional)"
}
```

### Get Character
```
GET /api/characters/:id
```

### Get User's Characters
```
GET /api/characters?userId=xxx
```

### Update Character
```
PATCH /api/characters/:id
```

**Request (partial):**
```json
{
  "level": 10,
  "experience": 5000,
  "gold": 15000,
  "skillPoints": 3,
  "attributePoints": 20,
  "attributes": {
    "Strength": 15,
    "Vitality": 10,
    ...
  },
  "equipment": {
    "mainHand": "item-id",
    "chest": "item-id",
    ...
  }
}
```

### Delete Character
```
DELETE /api/characters/:id
```

## Skills

### Unlock Skill
```
POST /api/skills/unlock
```

**Request:**
```json
{
  "characterId": "uuid",
  "nodeId": "string",
  "profession": "Miner|Forester|Mystic|Chef|Engineer"
}
```

Costs 1 skill point.

### Get Unlocked Skills
```
GET /api/skills/:characterId
```

**Response:**
```json
[
  {
    "id": "uuid",
    "characterId": "uuid",
    "nodeId": "1",
    "profession": "Miner",
    "unlockedAt": "timestamp"
  }
]
```

## Inventory

### Get Inventory
```
GET /api/inventory/:characterId
```

**Response:**
```json
[
  {
    "id": "uuid",
    "characterId": "uuid",
    "itemType": "ore",
    "itemName": "Iron Ore",
    "quantity": 50
  }
]
```

### Add Inventory Item
```
POST /api/inventory
```

**Request:**
```json
{
  "characterId": "uuid",
  "itemType": "ore|ingot|wood|plank|cloth|leather|essence|gem",
  "itemName": "string",
  "quantity": 10
}
```

### Update Quantity
```
PATCH /api/inventory/:characterId/:itemName
```

**Request:**
```json
{
  "quantity": 100
}
```

## Crafted Items

### Get Crafted Items
```
GET /api/crafted-items/:characterId
```

### Create Crafted Item
```
POST /api/crafted-items
```

**Request:**
```json
{
  "characterId": "uuid",
  "itemName": "Bloodfeud Blade",
  "itemType": "sword",
  "tier": 3,
  "profession": "Miner",
  "stats": {
    "damage": 25,
    "crit": 5
  }
}
```

### Update Crafted Item
```
PATCH /api/crafted-items/:id
```

### Equip Item
```
POST /api/crafted-items/:id/equip
```

**Request:**
```json
{
  "characterId": "uuid"
}
```

### Delete Crafted Item
```
DELETE /api/crafted-items/:id
```

## Crafting

### Craft Item
```
POST /api/craft
```

Validates recipe, checks materials, deducts gold.

**Request:**
```json
{
  "characterId": "uuid",
  "itemName": "Iron Sword",
  "profession": "Miner",
  "recipe": {
    "goldCost": 200,
    "materials": [
      { "name": "Iron Ingot", "quantity": 3 }
    ]
  }
}
```

## Recipes

### Unlock Recipe
```
POST /api/recipes/unlock
```

**Request:**
```json
{
  "characterId": "uuid",
  "recipeId": "string"
}
```

### Get Unlocked Recipes
```
GET /api/recipes/:characterId
```

## Shop

### Buy Recipe
```
POST /api/shop/buy-recipe
```

**Request:**
```json
{
  "characterId": "uuid",
  "recipeId": "string",
  "recipeName": "string"
}
```

Price calculated by category and tier.

### Buy Material
```
POST /api/shop/buy-material
```

**Request:**
```json
{
  "characterId": "uuid",
  "itemId": "string",
  "itemName": "Iron Ore",
  "quantity": 10,
  "tier": 2
}
```

Price: Base (50) × Tier Multiplier × Quantity

### Sell Material
```
POST /api/shop/sell-material
```

Sell price = 30% of buy price.

### Sell Item
```
POST /api/shop/sell-item
```

Sell crafted items for gold.

## Google Sheets Sync

### Fetch Weapons Data
```
GET /api/sheets/weapons
```

### Fetch Armor Data
```
GET /api/sheets/armor
```

### Fetch Items Data
```
GET /api/sheets/items
```

### Fetch Accounts Data
```
GET /api/sheets/accounts
```

### Cache Status
```
GET /api/sheets/status
```

### Clear Cache
```
POST /api/sheets/clear-cache
```

## Puter Sync

### Export All Data
```
GET /api/puter/export
```

### Sync Status
```
GET /api/puter/status
```

### Sync Single Sheet
```
POST /api/puter/sync/:sheetName
```

Valid sheets: weapons, armor, items, crafting, chef, accounts

### Generate Puter Code
```
GET /api/puter/code
```

## Account Sync

### Queue Account Change
```
POST /api/sync/account
```

Changes are batched and written to Google Sheets.

### Log Activity
```
POST /api/sync/activity
```

**Request:**
```json
{
  "username": "string",
  "activityType": "inventory|equipment|craft|shop",
  "details": { ... }
}
```

### Get Recent Activity
```
GET /api/sync/activity/:username
```

### Sync Status
```
GET /api/sync/status
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "success": false
}
```

Common status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Resource not found
- `500` - Server error

## Data Formats

### Tier Multipliers

| Tier | Multiplier | Material Base | Recipe Base |
|------|------------|---------------|-------------|
| 1 | 1× | 50 | 300-750 |
| 2 | 2.5× | 125 | 750-1875 |
| 3 | 5× | 250 | 1500-3750 |
| 4 | 10× | 500 | 3000-7500 |
| 5 | 20× | 1000 | 6000-15000 |
| 6 | 40× | 2000 | 12000-30000 |
| 7 | 80× | 4000 | 24000-60000 |
| 8 | 160× | 8000 | 48000-120000 |

### Attribute Points Schema

```json
{
  "Strength": 0,
  "Vitality": 0,
  "Endurance": 0,
  "Intellect": 0,
  "Wisdom": 0,
  "Dexterity": 0,
  "Agility": 0,
  "Tactics": 0
}
```

### Equipment Slots Schema

```json
{
  "head": null,
  "chest": null,
  "legs": null,
  "feet": null,
  "hands": null,
  "shoulders": null,
  "mainHand": null,
  "offHand": null,
  "accessory1": null,
  "accessory2": null
}
```

## Storage Interface

The server uses a storage abstraction (`server/storage.ts`) with these methods:

**Users:**
- `getUser(id)` / `getUserByUsername(username)`
- `createUser(data)` / `updateUser(id, data)`

**Characters:**
- `getCharacter(id)` / `getCharactersByUserId(userId)`
- `createCharacter(data)` / `updateCharacter(id, data)`
- `deleteCharacter(id)`

**Skills:**
- `unlockSkill(data)` / `getUnlockedSkills(characterId)`
- `isSkillUnlocked(characterId, nodeId)`

**Inventory:**
- `getInventory(characterId)`
- `addInventoryItem(data)` / `updateInventoryQuantity(characterId, itemName, qty)`

**Crafted Items:**
- `getCraftedItems(characterId)`
- `createCraftedItem(data)` / `updateCraftedItem(id, data)`
- `equipItem(characterId, itemId)` / `deleteCraftedItem(id)`

**Recipes:**
- `unlockRecipe(data)` / `getUnlockedRecipes(characterId)`
- `isRecipeUnlocked(characterId, recipeId)`
