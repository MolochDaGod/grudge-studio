import Phaser from 'phaser';
import { HEROES, heroKey, DIR } from '../config.js';

export class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.text(w / 2, 50, 'MAGE ARENA', {
      font: '32px monospace', fill: '#ff6600', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(w / 2, 90, 'Choose Your Champion', {
      font: '16px monospace', fill: '#cccccc',
    }).setOrigin(0.5);

    const keys = Object.keys(HEROES);
    const spacing = w / (keys.length + 1);

    keys.forEach((charKey, i) => {
      const cfg = HEROES[charKey];
      const x = spacing * (i + 1);
      const y = h / 2 - 20;

      // Animated idle preview (front-facing)
      const preview = this.add.sprite(x, y, heroKey(charKey, 'idle'));
      preview.setScale(3);
      preview.play(`${charKey}_idle_${DIR.down}`);

      // Name
      this.add.text(x, y + 70, cfg.name, {
        font: '14px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);

      // Role
      this.add.text(x, y + 88, cfg.role, {
        font: '11px monospace', fill: '#aaaaaa',
      }).setOrigin(0.5);

      // Stats
      this.add.text(x, y + 108, `HP:${cfg.hp}  MP:${cfg.mp}  SPD:${cfg.speed}`, {
        font: '9px monospace', fill: '#888888',
      }).setOrigin(0.5);

      // Clickable zone
      const zone = this.add.zone(x, y, 120, 160).setInteractive({ useHandCursor: true });

      // Highlight border
      const border = this.add.graphics();

      zone.on('pointerover', () => {
        border.clear();
        border.lineStyle(2, cfg.color, 1);
        border.strokeRect(x - 60, y - 70, 120, 180);
        preview.setScale(3.3);
      });

      zone.on('pointerout', () => {
        border.clear();
        preview.setScale(3);
      });

      zone.on('pointerdown', () => {
        this.registry.set('selectedHero', charKey);
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('Arena');
          this.scene.launch('Hud');
        });
      });
    });

    // Instructions
    this.add.text(w / 2, h - 40, 'Click a champion to enter the arena', {
      font: '12px monospace', fill: '#666666',
    }).setOrigin(0.5);
  }
}
