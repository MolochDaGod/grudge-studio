# API Reference

## Base URL

```
Development: http://localhost:5000
Production: https://warlord.grudgestudio.com (when deployed)
```

## Authentication

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

### Auth Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player_name",
  "password": "secure_password",
  "email": "player@example.com",
  "displayName": "Player Display"
}

Response:
{
  "success": true,
  "user": { "id", "username", "displayName" },
  "token": "...",
  "expiresIn": 7200000
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player_name",
  "password": "secure_password",
  "generateToken": true
}

Response: Same as register
```

#### Wallet Auth
```http
POST /api/auth/wallet
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "email": "player@example.com",
  "name": "Display Name"
}

Response: User object + token
```

## Characters

### Get All Characters
```http
GET /api/characters?userId=<user_id>
Authorization: Bearer <token>

Response: [{ id, name, level, experience, health, ... }]
```

### Get Character
```http
GET /api/characters/:id
Authorization: Bearer <token>

Response: { id, name, level, ... }
```

### Create Character
```http
POST /api/characters
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id",
  "name": "Character Name",
  "classId": "Warrior",
  "raceId": "Human"
}

Response: Character object with auto-assigned starter recipes
```

### Update Character
```http
PATCH /api/characters/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "health": 80,
  "gold": 5000
}

Response: Updated character object
```

## Inventory

### Get Inventory
```http
GET /api/inventory/:characterId
Authorization: Bearer <token>

Response: [
  {
    "id": "item-uuid",
    "itemName": "Iron Ore",
    "quantity": 50,
    "itemType": "material"
  }
]
```

### Add Item
```http
POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "itemName": "Iron Ore",
  "itemType": "material",
  "quantity": 10
}

Response: Inventory item object
```

### Update Quantity
```http
PATCH /api/inventory/:characterId/:itemName
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 25
}

Response: Updated inventory item
```

## Crafting

### Get Recipes
```http
GET /api/recipes/:characterId
Authorization: Bearer <token>

Response: [
  {
    "id": "recipe-id",
    "name": "Iron Ingot",
    "materials": [{ "name": "Iron Ore", "quantity": 3 }],
    "time": 30,
    "goldCost": 100
  }
]
```

### Craft Item (Instant)
```http
POST /api/craft
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "itemName": "Iron Ingot",
  "profession": "Miner",
  "recipe": { ... }
}

Response: Crafted item object
```

### Start AFK Crafting Job
```http
POST /api/crafting-jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "recipeId": "recipe-id",
  "quantity": 5,
  "duration": 120,
  "profession": "Miner",
  "tier": 2
}

Response: { id, status: "pending", completesAt: "2026-01-03T..." }
```

### Get Crafting Jobs
```http
GET /api/crafting-jobs/:characterId
Authorization: Bearer <token>

Response: [{ id, status, completesAt, ... }]
```

### Claim Completed Job
```http
POST /api/crafting-jobs/:id/claim
Authorization: Bearer <token>

Response: { id, status: "claimed", ... }
```

## Shop

### Buy Recipe
```http
POST /api/shop/buy-recipe
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "recipeId": "recipe-id",
  "recipeName": "Iron Ingot"
}

Response: { success: true, newGold: 4900 }
```

### Buy Material
```http
POST /api/shop/buy-material
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "itemId": "iron-ore",
  "itemName": "Iron Ore",
  "quantity": 10,
  "tier": 2
}

Response: { success: true, newGold: 4000 }
```

### Sell Material
```http
POST /api/shop/sell-material
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "itemName": "Copper Ore",
  "quantity": 5,
  "tier": 1
}

Response: { success: true, newGold: 5075 }
```

### Sell Item
```http
POST /api/shop/sell-item
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "itemId": "crafted-item-uuid"
}

Response: { success: true, newGold: 5400 }
```

## Home Islands

### Get Island
```http
GET /api/home-island?characterId=<char_id>
Authorization: Bearer <token>

Response: {
  "island": { id, name, terrain, buildings, ... },
  "hasHomeIsland": true,
  "seed": 12345
}
```

### Create Island
```http
POST /api/home-island/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "characterId": "char_id",
  "islandName": "My Island",
  "campPosition": { "x": 65, "y": 52 },
  "seed": 12345,
  "width": 130,
  "height": 105
}

Response: { success: true, island: { ... } }
```

### Update Island
```http
PATCH /api/home-island/:islandId
Authorization: Bearer <token>
Content-Type: application/json

{
  "buildings": [ ... ],
  "harvestNodes": [ ... ]
}

Response: { success: true, island: { ... } }
```

## AI Agents

### Get Agents
```http
GET /api/ai-agents?islandId=<island_id>
Authorization: Bearer <token>

Response: [
  {
    "id": "agent-uuid",
    "name": "Worker Bot",
    "agentType": "worker",
    "status": "idle"
  }
]
```

### Create Agent
```http
POST /api/ai-agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Worker Bot",
  "agentType": "worker",
  "personality": "Loyal and hardworking",
  "systemPrompt": "You are a worker...",
  "islandId": "island_id"
}

Response: Agent object
```

### Update Agent
```http
PATCH /api/ai-agents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "harvesting",
  "lastActionAt": "now"
}

Response: Updated agent object
```

## Sheets Integration

### Get Items from Sheet
```http
GET /api/sheets/items

Response: {
  "success": true,
  "count": 150,
  "data": [ ... ]
}
```

### Sync All Sheets
```http
POST /api/sheets/refresh

Response: {
  "success": true,
  "weapons": { "count": 50 },
  "armor": { "count": 40 },
  "items": { "count": 150 }
}
```

## Health Check

### Service Health
```http
GET /api/health

Response: {
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "operational",
    "api": "operational"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Detailed error message",
  "statusCode": 400
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Rate Limiting

Endpoints are rate-limited:
- Auth: 10 requests/minute per IP
- API: 100 requests/minute per user
- Sheets: 5 requests/minute

Header `X-RateLimit-Remaining` indicates remaining requests.

## WebSocket (Future)

Multiplayer features using Colyseus:

```javascript
const client = new Colyseus.Client("ws://localhost:5000");
const room = await client.join("game", { characterId: "..." });
room.onMessage("player_action", (msg) => console.log(msg));
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
