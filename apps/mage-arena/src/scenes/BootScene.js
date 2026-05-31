import Phaser from 'phaser';
import { HEROES, ANIMS, FRAME, heroSpriteUrl, heroKey } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Loading bar
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const bar = this.add.graphics();
    const box = this.add.graphics();
    box.fillStyle(0x222222, 0.8);
    box.fillRect(w / 4, h / 2 - 15, w / 2, 30);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x8844ff, 1);
      bar.fillRect(w / 4 + 4, h / 2 - 11, (w / 2 - 8) * v, 22);
    });

    const txt = this.add.text(w / 2, h / 2 - 40, 'Loading Mage Arena...', {
      font: '18px monospace', fill: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('complete', () => { bar.destroy(); box.destroy(); txt.destroy(); });

    // Load all hero sprite sheets from R2
    for (const [charKey, cfg] of Object.entries(HEROES)) {
      for (const anim of ANIMS) {
        const frameCount = cfg[anim]?.frames ?? 4;
        this.load.spritesheet(heroKey(charKey, anim), heroSpriteUrl(charKey, anim, cfg.tier), {
          frameWidth: FRAME.w,
          frameHeight: FRAME.h,
          // Total frames = frameCount * 4 directions
        });
      }
    }

    // Load effect sprites (use a few key ones)
    this.load.spritesheet('fx_slash', `https://assets.grudge-studio.com/sprites/effects/slash/PNG/1/1.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('fx_flame', `https://assets.grudge-studio.com/sprites/effects/flame/flame1/images/Sek_00001.png`, { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    // Create animations for all heroes
    for (const [charKey, cfg] of Object.entries(HEROES)) {
      for (const anim of ANIMS) {
        const frameCount = cfg[anim]?.frames ?? 4;
        const rate = cfg[anim]?.rate ?? 8;

        // Create one animation per direction (row)
        for (let dir = 0; dir < 4; dir++) {
          const startFrame = dir * frameCount;
          const frames = [];
          for (let i = 0; i < frameCount; i++) {
            frames.push(startFrame + i);
          }

          const repeat = (anim === 'idle' || anim === 'walk' || anim === 'run') ? -1 : 0;
          this.anims.create({
            key: `${charKey}_${anim}_${dir}`,
            frames: this.anims.generateFrameNumbers(heroKey(charKey, anim), { frames }),
            frameRate: rate,
            repeat,
          });
        }
      }
    }

    this.scene.start('Select');
  }
}
