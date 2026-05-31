import Phaser from 'phaser';
import { HEROES, SKILLS, CONSUMABLES, EQUIPMENT_SLOTS, BOSSES } from '../config.js';

export class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  create() {
    const heroId = this.registry.get('selectedHero') || 'sorceress';
    const cfg = HEROES[heroId];
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.heroId = heroId;
    this.heroCfg = cfg;
    this.panelOpen = false;

    // ── Character Portrait + Name (top left) ──
    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(0x1a1020, 0.9);
    portraitBg.fillRoundedRect(8, 6, 220, 60, 6);
    portraitBg.lineStyle(1, 0x443355, 0.8);
    portraitBg.strokeRoundedRect(8, 6, 220, 60, 6);

    // Character icon
    if (this.textures.exists(cfg.icon)) {
      const icon = this.add.image(34, 36, cfg.icon);
      icon.setDisplaySize(36, 36);
    }

    this.add.text(58, 12, cfg.name, {
      font: '12px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
    });

    this.add.text(58, 26, cfg.role, {
      font: '9px monospace', fill: '#8877aa',
    });

    // HP bar background
    this.add.graphics().fillStyle(0x333333, 0.8).fillRoundedRect(58, 38, 160, 10, 3);
    this.hpBar = this.add.graphics();
    this.drawHpBar(cfg.hp, cfg.hp);
    this.hpText = this.add.text(138, 43, `${cfg.hp}/${cfg.hp}`, {
      font: '8px monospace', fill: '#ffffff',
    }).setOrigin(0.5);

    // MP bar background
    this.add.graphics().fillStyle(0x222244, 0.8).fillRoundedRect(58, 51, 160, 8, 3);
    this.mpBar = this.add.graphics();
    this.drawMpBar(cfg.mp, cfg.mp);
    this.mpText = this.add.text(138, 55, `${cfg.mp}/${cfg.mp}`, {
      font: '7px monospace', fill: '#aaaaff',
    }).setOrigin(0.5);

    // ── Action Bar (bottom center) ──
    const skills = SKILLS[heroId] || [];
    const slotSize = 38;
    const gap = 4;
    const totalSlots = 8; // 4 skills + 1 empty + 3 consumables
    const barWidth = totalSlots * (slotSize + gap) - gap;
    const barX = (w - barWidth) / 2;
    const barY = h - 58;

    // Action bar background
    const abBg = this.add.graphics();
    abBg.fillStyle(0x0d0a14, 0.92);
    abBg.fillRoundedRect(barX - 8, barY - 6, barWidth + 16, slotSize + 22, 6);
    abBg.lineStyle(1, 0x332244, 0.8);
    abBg.strokeRoundedRect(barX - 8, barY - 6, barWidth + 16, slotSize + 22, 6);

    // Hotbar image overlay (if loaded)
    if (this.textures.exists('ui_hotbar')) {
      const hotbar = this.add.image(w / 2, barY + slotSize / 2, 'ui_hotbar');
      hotbar.setDisplaySize(barWidth + 20, slotSize + 16);
      hotbar.setAlpha(0.3);
    }

    // 4 skill slots
    this.skillCooldowns = [];
    for (let i = 0; i < 4; i++) {
      const sx = barX + i * (slotSize + gap);
      const skill = skills[i];

      const frame = this.add.graphics();
      frame.fillStyle(0x1a1430, 1);
      frame.fillRoundedRect(sx, barY, slotSize, slotSize, 4);
      frame.lineStyle(1, cfg.color, 0.7);
      frame.strokeRoundedRect(sx, barY, slotSize, slotSize, 4);

      // Key number
      this.add.text(sx + 4, barY + 2, `${i + 1}`, {
        font: '9px monospace', fill: '#666688',
      });

      // Skill name
      if (skill) {
        this.add.text(sx + slotSize / 2, barY + slotSize / 2 + 2, skill.name.split(' ')[0], {
          font: '8px monospace', fill: '#cccccc',
        }).setOrigin(0.5);

        // Cost
        this.add.text(sx + slotSize / 2, barY + slotSize + 4, `${skill.cost}`, {
          font: '7px monospace', fill: '#6666aa',
        }).setOrigin(0.5);
      }

      // Cooldown overlay (hidden initially)
      const cdOverlay = this.add.graphics();
      cdOverlay.setAlpha(0);
      this.skillCooldowns.push(cdOverlay);
    }

    // Empty slot 5
    const emptyX = barX + 4 * (slotSize + gap);
    const emptyG = this.add.graphics();
    emptyG.fillStyle(0x0a0a0a, 0.5);
    emptyG.fillRoundedRect(emptyX, barY, slotSize, slotSize, 4);
    emptyG.lineStyle(1, 0x222222, 0.4);
    emptyG.strokeRoundedRect(emptyX, barY, slotSize, slotSize, 4);

    // 3 consumable slots
    for (let i = 0; i < CONSUMABLES.length; i++) {
      const cx = barX + (5 + i) * (slotSize + gap);
      const cf = this.add.graphics();
      cf.fillStyle(0x221810, 1);
      cf.fillRoundedRect(cx, barY, slotSize, slotSize, 4);
      cf.lineStyle(1, 0x554422, 0.6);
      cf.strokeRoundedRect(cx, barY, slotSize, slotSize, 4);

      this.add.text(cx + 4, barY + 2, `${CONSUMABLES[i].slot}`, {
        font: '9px monospace', fill: '#665544',
      });

      this.add.text(cx + slotSize / 2, barY + slotSize / 2 + 2, CONSUMABLES[i].name, {
        font: '7px monospace', fill: '#998866',
      }).setOrigin(0.5);
    }

    // ── Kill Counter (top right) ──
    this.killText = this.add.text(w - 12, 12, 'Kills: 0', {
      font: '13px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0);

    // ── Controls hint ──
    this.add.text(w - 12, 30, 'LMB:Attack  RMB:Parry  Space:Dash', {
      font: '8px monospace', fill: '#444444',
    }).setOrigin(1, 0);

    this.add.text(w - 12, 42, '1-4:Skills  5-7:Items  C:Panel', {
      font: '8px monospace', fill: '#444444',
    }).setOrigin(1, 0);

    // ── Boss Health Bar (hidden until boss spawns) ──
    this.bossContainer = this.add.container(w / 2, 20);
    this.bossContainer.setVisible(false);

    const bossBg = this.add.graphics();
    bossBg.fillStyle(0x220000, 0.9);
    bossBg.fillRoundedRect(-160, -8, 320, 24, 4);
    this.bossContainer.add(bossBg);

    this.bossHpBar = this.add.graphics();
    this.bossContainer.add(this.bossHpBar);

    this.bossNameText = this.add.text(0, -5, '', {
      font: '11px monospace', fill: '#ff8800', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.bossContainer.add(this.bossNameText);

    // ── Character Panel (C key toggle, hidden initially) ──
    this.panelContainer = this.add.container(w / 2, h / 2);
    this.panelContainer.setVisible(false);
    this.panelContainer.setDepth(50);
    this.createCharacterPanel();

    // ── Listen to arena events ──
    const arena = this.scene.get('Arena');

    arena.events.on('hp', (current, max) => {
      this.drawHpBar(current, max);
      this.hpText.setText(`${Math.max(0, current)}/${max}`);
    });

    arena.events.on('mp', (current, max) => {
      this.drawMpBar(current, max);
      this.mpText.setText(`${Math.max(0, Math.floor(current))}/${max}`);
    });

    arena.events.on('kill', (count) => {
      this.killText.setText(`Kills: ${count}`);
    });

    arena.events.on('bossSpawn', (bossId, bossCfg) => {
      this.bossContainer.setVisible(true);
      this.bossNameText.setText(bossCfg.name);
      this.drawBossHpBar(bossCfg.hp, bossCfg.hp);
    });

    arena.events.on('bossHp', (current, max) => {
      this.drawBossHpBar(current, max);
    });

    arena.events.on('bossDead', () => {
      this.bossContainer.setVisible(false);
    });

    arena.events.on('togglePanel', () => {
      this.panelOpen = !this.panelOpen;
      this.panelContainer.setVisible(this.panelOpen);
    });

    arena.events.on('skillUsed', (index) => {
      // Flash cooldown overlay
      if (this.skillCooldowns[index]) {
        const cd = this.skillCooldowns[index];
        cd.clear();
        cd.fillStyle(0x000000, 0.5);
        cd.setAlpha(0.6);
        this.tweens.add({
          targets: cd,
          alpha: 0,
          duration: 800,
        });
      }
    });
  }

  drawHpBar(current, max) {
    this.hpBar.clear();
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xccaa22 : 0xcc2222;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRoundedRect(60, 39, 156 * pct, 8, 2);
  }

  drawMpBar(current, max) {
    this.mpBar.clear();
    const pct = Math.max(0, current / max);
    this.mpBar.fillStyle(0x4444dd, 1);
    this.mpBar.fillRoundedRect(60, 52, 156 * pct, 6, 2);
  }

  drawBossHpBar(current, max) {
    this.bossHpBar.clear();
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? 0xcc4400 : pct > 0.25 ? 0xaa2200 : 0x880000;
    this.bossHpBar.fillStyle(color, 1);
    this.bossHpBar.fillRoundedRect(-156, -4, 312 * pct, 16, 3);
  }

  createCharacterPanel() {
    const cfg = this.heroCfg;

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a14, 0.95);
    bg.fillRoundedRect(-200, -180, 400, 360, 10);
    bg.lineStyle(2, 0x443366, 1);
    bg.strokeRoundedRect(-200, -180, 400, 360, 10);
    this.panelContainer.add(bg);

    // Title
    const title = this.add.text(0, -165, 'CHARACTER', {
      font: '16px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    // Character info
    const infoTexts = [
      `Name: ${cfg.name}`,
      `Role: ${cfg.role}`,
      `Resource: ${cfg.resource}`,
      `HP: ${cfg.hp}  MP: ${cfg.mp}`,
      `Speed: ${cfg.speed}`,
      `Attack: ${cfg.attackType}`,
    ];

    infoTexts.forEach((text, i) => {
      const t = this.add.text(-180, -135 + i * 18, text, {
        font: '10px monospace', fill: '#cccccc',
      });
      this.panelContainer.add(t);
    });

    // Equipment section
    const eqTitle = this.add.text(0, -20, '── Equipment ──', {
      font: '11px monospace', fill: '#8877aa',
    }).setOrigin(0.5);
    this.panelContainer.add(eqTitle);

    EQUIPMENT_SLOTS.forEach((slot, i) => {
      const row = i % 3;
      const col = Math.floor(i / 3);
      const sx = -170 + col * 200;
      const sy = 5 + row * 36;

      // Slot background
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x1a1430, 1);
      slotBg.fillRoundedRect(sx, sy, 180, 30, 4);
      slotBg.lineStyle(1, 0x332244, 0.6);
      slotBg.strokeRoundedRect(sx, sy, 180, 30, 4);
      this.panelContainer.add(slotBg);

      const slotLabel = this.add.text(sx + 8, sy + 8, `[${slot}]`, {
        font: '10px monospace', fill: '#666688',
      });
      this.panelContainer.add(slotLabel);

      const itemLabel = this.add.text(sx + 90, sy + 8, 'Empty', {
        font: '10px monospace', fill: '#444444',
      });
      this.panelContainer.add(itemLabel);
    });

    // Skills section
    const skillTitle = this.add.text(0, 120, '── Skills ──', {
      font: '11px monospace', fill: '#8877aa',
    }).setOrigin(0.5);
    this.panelContainer.add(skillTitle);

    const skills = SKILLS[this.heroId] || [];
    skills.forEach((skill, i) => {
      const sy = 140 + i * 16;
      const t = this.add.text(-180, sy, `[${i + 1}] ${skill.name} - ${skill.type} (${skill.cost} ${cfg.resource})`, {
        font: '9px monospace', fill: '#aaaacc',
      });
      this.panelContainer.add(t);
    });

    // Close hint
    const closeHint = this.add.text(0, 165, 'Press C to close', {
      font: '9px monospace', fill: '#555555',
    }).setOrigin(0.5);
    this.panelContainer.add(closeHint);
  }
}
