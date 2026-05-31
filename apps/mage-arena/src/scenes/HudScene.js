import Phaser from 'phaser';
import { HEROES, SKILLS } from '../config.js';

export class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  create() {
    const heroId = this.registry.get('selectedHero') || 'lich';
    const cfg = HEROES[heroId];
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // ── Health Bar ──
    this.add.text(12, 10, cfg.name, { font: '13px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2 });

    // HP background
    this.add.graphics().fillStyle(0x333333, 0.8).fillRoundedRect(12, 28, 200, 16, 3);
    // HP fill
    this.hpBar = this.add.graphics();
    this.drawHpBar(cfg.hp, cfg.hp);
    // HP text
    this.hpText = this.add.text(112, 36, `${cfg.hp}/${cfg.hp}`, {
      font: '10px monospace', fill: '#ffffff',
    }).setOrigin(0.5);

    // ── Mana Bar ──
    this.add.graphics().fillStyle(0x222244, 0.8).fillRoundedRect(12, 48, 200, 12, 3);
    this.mpBar = this.add.graphics();
    this.mpBar.fillStyle(0x4444ff, 1).fillRoundedRect(14, 50, 196 * (cfg.mp / cfg.mp), 8, 2);
    this.mpText = this.add.text(112, 54, `${cfg.mp}/${cfg.mp}`, {
      font: '9px monospace', fill: '#aaaaff',
    }).setOrigin(0.5);

    // ── Action Bar (bottom center) ──
    const barWidth = 340;
    const barX = (w - barWidth) / 2;
    const barY = h - 55;

    // Action bar background
    const abBg = this.add.graphics();
    abBg.fillStyle(0x111122, 0.9);
    abBg.fillRoundedRect(barX - 5, barY - 5, barWidth + 10, 50, 6);
    abBg.lineStyle(1, 0x444466, 1);
    abBg.strokeRoundedRect(barX - 5, barY - 5, barWidth + 10, 50, 6);

    const skills = SKILLS[heroId] || ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'];
    const slotSize = 38;
    const gap = 4;

    // 4 skill slots
    for (let i = 0; i < 4; i++) {
      const sx = barX + i * (slotSize + gap);

      // Slot frame
      const frame = this.add.graphics();
      frame.fillStyle(0x222244, 1);
      frame.fillRoundedRect(sx, barY, slotSize, slotSize, 4);
      frame.lineStyle(1, cfg.color, 0.8);
      frame.strokeRoundedRect(sx, barY, slotSize, slotSize, 4);

      // Skill letter
      this.add.text(sx + slotSize / 2, barY + slotSize / 2, `${i + 1}`, {
        font: '18px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);

      // Skill name below
      this.add.text(sx + slotSize / 2, barY + slotSize + 4, skills[i], {
        font: '7px monospace', fill: '#888888',
      }).setOrigin(0.5);
    }

    // Empty slot 5
    const emptyX = barX + 4 * (slotSize + gap);
    this.add.graphics().fillStyle(0x181818, 0.5).fillRoundedRect(emptyX, barY, slotSize, slotSize, 4);

    // 3 consumable slots
    const consumables = ['HP Pot', 'MP Pot', 'Elixir'];
    for (let i = 0; i < 3; i++) {
      const cx = barX + (5 + i) * (slotSize + gap);
      const cf = this.add.graphics();
      cf.fillStyle(0x332211, 1);
      cf.fillRoundedRect(cx, barY, slotSize, slotSize, 4);
      cf.lineStyle(1, 0x665533, 0.6);
      cf.strokeRoundedRect(cx, barY, slotSize, slotSize, 4);

      this.add.text(cx + slotSize / 2, barY + slotSize / 2, `${6 + i}`, {
        font: '14px monospace', fill: '#aa8866',
      }).setOrigin(0.5);

      this.add.text(cx + slotSize / 2, barY + slotSize + 4, consumables[i], {
        font: '7px monospace', fill: '#666644',
      }).setOrigin(0.5);
    }

    // ── Kill Counter (top right) ──
    this.killText = this.add.text(w - 15, 12, 'Kills: 0', {
      font: '14px monospace', fill: '#ff6600', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0);

    // ── Listen to arena events ──
    const arena = this.scene.get('Arena');
    arena.events.on('hp', (current, max) => {
      this.drawHpBar(current, max);
      this.hpText.setText(`${Math.max(0, current)}/${max}`);
    });
    arena.events.on('kill', (count) => {
      this.killText.setText(`Kills: ${count}`);
    });
  }

  drawHpBar(current, max) {
    this.hpBar.clear();
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xccaa22 : 0xcc2222;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRoundedRect(14, 30, 196 * pct, 12, 2);
  }
}
