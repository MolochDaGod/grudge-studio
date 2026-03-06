/**
 * Grudge Studio API Server
 * Unified REST API for ObjectStore game data, assets, AI agents, sync, and UUID generation.
 *
 * Endpoints:
 *   GET  /api/v1/status          - Health check + system stats
 *   GET  /api/v1/game-data       - List all ObjectStore datasets
 *   GET  /api/v1/game-data/:ds   - Fetch a specific dataset
 *   GET  /api/v1/game-data/search?q=... - Cross-resource search
 *   CRUD /api/v1/assets          - Asset management
 *   POST /api/v1/ai/query        - AI agent proxy
 *   GET  /api/v1/ai/agents       - List AI agents
 *   POST /api/v1/sync            - Sync from GrudgePuter
 *   POST /api/v1/uuid/generate   - Generate Grudge UUIDs
 *
 * Deploy: Vercel serverless or standalone Node.js
 */

import 'dotenv/config';
import express from 'express';
import { createCorsMiddleware } from './middleware/cors.js';
import { apiRateLimit } from './middleware/rate-limit.js';
import { getCacheStats } from './lib/object-store.js';

// Route imports
import gameDataRoutes from './routes/game-data.js';
import assetRoutes from './routes/assets.js';
import aiRoutes from './routes/ai.js';
import syncRoutes from './routes/sync.js';
import uuidRoutes from './routes/uuid.js';
import githubRoutes from './routes/github.js';

const app = express();
const PORT = process.env.PORT || 3001;
const startTime = Date.now();

// ============================================
// Middleware
// ============================================

app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(apiRateLimit);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' || duration > 1000) {
      console.log(`[${req.method}] ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ============================================
// Routes
// ============================================

/**
 * GET /api/v1/status - Health check
 */
app.get('/api/v1/status', (req, res) => {
  res.json({
    service: 'grudge-api-server',
    version: '1.0.0',
    status: 'online',
    uptime: Math.round((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    objectStore: getCacheStats(),
    endpoints: {
      gameData: '/api/v1/game-data',
      assets: '/api/v1/assets',
      ai: '/api/v1/ai',
      sync: '/api/v1/sync',
      uuid: '/api/v1/uuid',
      github: '/api/v1/github'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
app.use('/api/v1/game-data', gameDataRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/uuid', uuidRoutes);
app.use('/api/v1/github', githubRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api/v1/status');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `No endpoint at ${req.method} ${req.path}`,
    docs: '/api/v1/status'
  });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: 'server_error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ============================================
// Start server (skip in Vercel serverless)
// ============================================

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n⚔️  Grudge Studio API Server`);
    console.log(`   http://localhost:${PORT}/api/v1/status`);
    console.log(`   Game Data:  /api/v1/game-data`);
    console.log(`   Assets:     /api/v1/assets`);
    console.log(`   AI Agents:  /api/v1/ai/agents`);
    console.log(`   Sync:       /api/v1/sync/status`);
    console.log(`   UUID:       /api/v1/uuid/types\n`);
  });
}

// Vercel serverless export
export default app;
