import colyseusPackage from 'colyseus';
const { Room } = colyseusPackage;
import { GameState } from './schema/GameState.js';
import { verifyAuthToken, updateTokenUsage } from '../auth.js';
import sql from '../db.cjs';

const WORLD_SIZE = 3200;
const MAX_BULLET_DISTANCE = 800;
const BULLET_HIT_RADIUS = 30;
const SPAWN_POSITIONS = [
  { x: 400, y: 400 },
  { x: WORLD_SIZE - 400, y: 400 },
  { x: 400, y: WORLD_SIZE - 400 },
  { x: WORLD_SIZE - 400, y: WORLD_SIZE - 400 },
  { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }
];

export class BattleArenaRoom extends Room {
  onCreate(options) {
    this.setState(new GameState());
    this.spawnIndex = 0;
    this.playerSessions = new Map(); // Track player session data (userId, accountId, joinTime, kills, deaths)

    // Game loop - update bullets and check collisions
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / 60);

    console.log('Battle Arena room created', this.roomId);
  }

  async onJoin(client, options) {
    console.log(`Player ${client.sessionId} attempting to join`);

    // Verify auth token
    const authToken = options.authToken;
    let userData = null;
    
    if (authToken) {
      userData = await verifyAuthToken(authToken);
      if (userData) {
        await updateTokenUsage(authToken);
      }
    }

    // Get spawn position
    const spawnPos = this.getNextSpawnPosition();
    const playerName = userData?.username || options.name || `Player${this.clients.length}`;

    // Store session data
    this.playerSessions.set(client.sessionId, {
      userId: userData?.userId,
      accountId: userData?.accountId,
      username: userData?.username,
      grudgeId: userData?.grudgeId,
      joinTime: Date.now(),
      kills: 0,
      deaths: 0
    });

    // Create player
    this.state.createPlayer(client.sessionId, spawnPos.x, spawnPos.y, playerName);
    
    console.log(`Player ${playerName} (${userData?.grudgeId || 'Guest'}) joined`);
  }

  onMessage(client, type, message) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    switch (type) {
      case 'move':
        this.state.updatePlayer(
          client.sessionId,
          message.x,
          message.y,
          message.rotation
        );
        break;

      case 'shoot':
        // Validate bullet speed to prevent cheating
        if (Math.abs(message.speedX) <= 100 && Math.abs(message.speedY) <= 100) {
          this.state.createBullet(
            message.x,
            message.y,
            message.angle,
            message.speedX,
            message.speedY,
            client.sessionId
          );
        }
        break;
    }
  }

  async onLeave(client, consented) {
    console.log(`Player ${client.sessionId} left`);
    
    // Save stats to database
    const sessionData = this.playerSessions.get(client.sessionId);
    if (sessionData && sessionData.accountId) {
      const playtimeMinutes = Math.floor((Date.now() - sessionData.joinTime) / 60000);
      
      try {
        // Update total playtime in accounts table
        await sql`
          UPDATE accounts
          SET 
            total_playtime_minutes = total_playtime_minutes + ${playtimeMinutes},
            updated_at = ${Date.now()}
          WHERE id = ${sessionData.accountId}
        `;

        // Update or insert battle arena stats
        const existing = await sql`
          SELECT id FROM battle_arena_stats
          WHERE account_id = ${sessionData.accountId}
          LIMIT 1
        `;

        if (existing.length > 0) {
          await sql`
            UPDATE battle_arena_stats
            SET 
              total_kills = total_kills + ${sessionData.kills},
              total_deaths = total_deaths + ${sessionData.deaths},
              total_matches = total_matches + 1,
              total_playtime_minutes = total_playtime_minutes + ${playtimeMinutes},
              updated_at = ${Date.now()}
            WHERE account_id = ${sessionData.accountId}
          `;
        } else {
          const crypto = require('crypto');
          await sql`
            INSERT INTO battle_arena_stats (
              id,
              account_id,
              total_kills,
              total_deaths,
              total_matches,
              total_playtime_minutes,
              created_at,
              updated_at
            )
            VALUES (
              ${crypto.randomUUID()},
              ${sessionData.accountId},
              ${sessionData.kills},
              ${sessionData.deaths},
              ${1},
              ${playtimeMinutes},
              ${Date.now()},
              ${Date.now()}
            )
          `;
        }
        
        console.log(`Stats saved for ${sessionData.username}: ${sessionData.kills} kills, ${sessionData.deaths} deaths, ${playtimeMinutes} minutes`);
      } catch (error) {
        console.error('Error saving stats:', error);
      }
    }
    
    this.playerSessions.delete(client.sessionId);
    this.state.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log('Battle Arena room disposed');
  }

  update(deltaTime) {
    // Update all bullets
    const bulletsToRemove = [];

    this.state.bullets.forEach((bullet, bulletId) => {
      // Update bullet position
      this.state.updateBullet(bulletId);

      // Check if bullet is out of bounds or traveled too far
      if (
        bullet.x < -10 ||
        bullet.x > WORLD_SIZE + 10 ||
        bullet.y < -10 ||
        bullet.y > WORLD_SIZE + 10 ||
        bullet.distanceTraveled >= MAX_BULLET_DISTANCE
      ) {
        bulletsToRemove.push(bulletId);
        return;
      }

      // Check collision with players
      this.state.players.forEach((player, playerId) => {
        // Don't check collision with bullet owner
        if (playerId === bullet.ownerId) return;

        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < BULLET_HIT_RADIUS) {
          // Hit detected!
          const owner = this.state.players.get(bullet.ownerId);
          
          // Track kill/death stats
          const killerSession = this.playerSessions.get(bullet.ownerId);
          const victimSession = this.playerSessions.get(playerId);
          
          if (killerSession) {
            killerSession.kills++;
          }
          if (victimSession) {
            victimSession.deaths++;
          }
          
          this.broadcast('hit', {
            punishedId: playerId,
            punisherId: bullet.ownerId,
            punisherName: owner ? owner.name : 'Unknown'
          });

          // Remove the hit player and the bullet
          this.state.removePlayer(playerId);
          bulletsToRemove.push(bulletId);
        }
      });
    });

    // Remove marked bullets
    bulletsToRemove.forEach(bulletId => {
      this.state.removeBullet(bulletId);
    });
  }

  getNextSpawnPosition() {
    const pos = SPAWN_POSITIONS[this.spawnIndex % SPAWN_POSITIONS.length];
    this.spawnIndex++;
    return pos;
  }
}
