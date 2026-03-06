import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MenuScene } from './scenes/MenuScene';
import { BuilderScene } from './scenes/BuilderScene';
import { GAME_CONFIG } from './config/game-config';

/**
 * Grudge Builder - Main Entry Point
 * 
 * This game mode integrates with the main GRUDGE Warlords app:
 * - Shares character data
 * - Uses inventory system
 * - Integrates crafting
 * - Accesses sprites and assets
 */

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [LoadingScene, MenuScene, BuilderScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Initialize game
const game = new Phaser.Game(config);

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Game error:', event.error);
});

// Export for debugging
if (import.meta.env.DEV) {
  (window as any).game = game;
}

export default game;

