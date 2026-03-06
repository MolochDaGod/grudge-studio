import 'dotenv/config';
import colyseusPackage from 'colyseus';
const { Server } = colyseusPackage;
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import monitorPackage from '@colyseus/monitor';
const { monitor } = monitorPackage;
import { BattleArenaRoom } from './rooms/BattleArenaRoom.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';

const port = process.env.PORT || 2567;
const app = express();

// Enable CORS for development
app.use(cors());
app.use(express.json());

const gameServer = new Server({
  server: createServer(app)
});

// Register the Battle Arena room
gameServer.define('battle_arena', BattleArenaRoom);

// Auth routes
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);

// Colyseus monitor (for development)
app.use('/colyseus', monitor());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

gameServer.listen(port);
console.log(`🎮 Grudge Studio Battle Arena Server`);
console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📊 Monitor available at http://localhost:${port}/colyseus`);
