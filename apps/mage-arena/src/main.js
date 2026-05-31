import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { LandingScene } from './scenes/LandingScene.js';
import { SelectScene } from './scenes/SelectScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
import { HudScene } from './scenes/HudScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 640,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, LandingScene, SelectScene, ArenaScene, HudScene],
};

new Phaser.Game(config);
