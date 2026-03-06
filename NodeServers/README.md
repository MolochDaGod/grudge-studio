# GRUDGE Local Node Services

Local testing environment for stable backend services before Puter deployment.

## Services

- **combat-math** - Combat calculation engine
- **messaging** - Communication/chat services  
- **state-manager** - Game state management
- **game-logic** - Core game rules and mechanics

## Setup

Each service is an independent Node.js package:

```bash
cd <service-name>
npm install
npm start
```

## Testing

Run tests for each service:

```bash
npm test
```

## Deployment Flow

1. **Local Testing** (Here) → 2. **Puter Workers** → 3. **Production**

## Configuration

Set `.env` in each service folder with:

```env
PORT=<port-number>
GBUX_TOKEN_ADDRESS=55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray
DATABASE_URL=<your-db-url>
```
