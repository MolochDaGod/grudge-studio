// Shared game client utilities for Grudge Studio
import * as Colyseus from 'colyseus.js';

export interface GameConnectionConfig {
  serverUrl: string;
  roomName: string;
  authToken?: string;
  playerName?: string;
}

/**
 * Create and connect to a Colyseus game server
 */
export async function connectToGameServer(config: GameConnectionConfig) {
  const client = new Colyseus.Client(config.serverUrl);
  
  const options: any = {};
  
  if (config.authToken) {
    options.authToken = config.authToken;
  }
  
  if (config.playerName) {
    options.name = config.playerName;
  }
  
  try {
    const room = await client.joinOrCreate(config.roomName, options);
    console.log('Connected to game server:', room.id);
    return { client, room };
  } catch (error) {
    console.error('Failed to connect to game server:', error);
    throw error;
  }
}

/**
 * Disconnect from game server
 */
export function disconnectFromGameServer(room: Colyseus.Room) {
  if (room) {
    room.leave();
  }
}

export { Colyseus };
