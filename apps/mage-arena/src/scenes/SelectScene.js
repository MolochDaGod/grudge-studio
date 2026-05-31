import Phaser from 'phaser';
import { HEROES, heroKey, DIR } from '../config.js';

export class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark dungeon background
    this.cameras.main.setBackgroundColor('#0d0a15');

    // Background panel (if loaded)
    if (this.textures.exists('ui_panel1')) {
      const panel = this.add.image(w / 2, h / 2, 'ui_panel1');
      panel.setDisplaySize(w - 40, h - 40);
      panel.setAlpha(0.3);
    }

    // Title
    this.add.text(w / 2, 40, 'MAGE ARENA', {
      font: '36px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(w / 2, 78, 'Choose Your Champion', {
      font: '14px monospace', fill: '#aa99cc',
    }).setOrigin(0.5);

    const keys = Object.keys(HEROES);
    const spacing = w / (keys.length + 1);

    keys.forEach((charKey, i) => {
      const cfg = HEROES[charKey];
      const x = spacing * (i + 1);
      const y = h / 2 - 10;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x15101f, 0.85);
      card.fillRoundedRect(x - 70, y - 90, 140, 240, 8);
      card.lineStyle(2, 0x332244, 1);
      card.strokeRoundedRect(x - 70, y - 90, 140, 240, 8);

      // Character icon (portrait)
      if (this.textures.exists(cfg.icon)) {
        const icon = this.add.image(x, y - 65, cfg.icon);
        icon.setDisplaySize(40, 40);
      }

      // Animated idle preview
      const idleKey = heroKey(charKey, 'idle', DIR.down);
      let preview;
      if (this.textures.exists(idleKey)) {
        preview = this.add.sprite(x, y + 10, idleKey);
        preview.setScale(3);
        preview.play(idleKey);
      } else {
        // Fallback colored rect
        const fb = this.add.graphics();
        fb.fillStyle(cfg.color, 0.6);
        fb.fillRect(x - 20, y - 20, 40, 40);
        preview = { setScale: () => {} };
      }

      // Name
      this.add.text(x, y + 65, cfg.name, {
        font: '13px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);

      // Role + Resource
      this.add.text(x, y + 82, `${cfg.role} • ${cfg.resource}`, {
        font: '10px monospace', fill: '#8877aa',
      }).setOrigin(0.5);

      // Stats
      this.add.text(x, y + 98, `HP:${cfg.hp}  MP:${cfg.mp}`, {
        font: '10px monospace', fill: '#888888',
      }).setOrigin(0.5);

      this.add.text(x, y + 112, `SPD:${cfg.speed}  ${cfg.attackType.toUpperCase()}`, {
        font: '9px monospace', fill: '#666666',
      }).setOrigin(0.5);

      // Clickable zone
      const zone = this.add.zone(x, y, 140, 240).setInteractive({ useHandCursor: true });
      const border = this.add.graphics();

      zone.on('pointerover', () => {
        border.clear();
        border.lineStyle(2, cfg.color, 1);
        border.strokeRoundedRect(x - 70, y - 90, 140, 240, 8);
        if (preview.setScale) preview.setScale(3.4);
      });

      zone.on('pointerout', () => {
        border.clear();
        if (preview.setScale) preview.setScale(3);
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

    // Settings summary from Landing
    const difficulty = this.registry.get('difficulty') || 'normal';
    const allyCount = this.registry.get('allyCount') ?? 3;
    this.add.text(w / 2, h - 50, `${difficulty.toUpperCase()} difficulty • ${allyCount} AI allies`, {
      font: '10px monospace', fill: '#888888',
    }).setOrigin(0.5);

    this.add.text(w / 2, h - 30, 'Click a champion to enter the dungeon', {
      font: '11px monospace', fill: '#555555',
    }).setOrigin(0.5);

    // Back to Landing
    const backZone = this.add.text(20, h - 30, '← Settings', {
      font: '10px monospace', fill: '#666688',
    }).setInteractive({ useHandCursor: true });
    backZone.on('pointerdown', () => this.scene.start('Landing'));
    backZone.on('pointerover', () => backZone.setColor('#aaaacc'));
    backZone.on('pointerout', () => backZone.setColor('#666688'));
  }
}
