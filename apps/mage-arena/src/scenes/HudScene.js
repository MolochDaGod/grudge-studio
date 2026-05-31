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

    // ══════════════════════════════════════════════════════════════════════
    // PLAYER FRAME — top left with HP/MP orbs
    // ══════════════════════════════════════════════════════════════════════
    const frameBg = this.add.graphics();
    frameBg.fillStyle(0x0d0a14, 0.92);
    frameBg.fillRoundedRect(6, 4, 240, 66, 6);
    frameBg.lineStyle(1, 0x332244, 0.8);
    frameBg.strokeRoundedRect(6, 4, 240, 66, 6);

    // Character icon
    if (this.textures.exists(cfg.icon)) {
      this.add.image(32, 37, cfg.icon).setDisplaySize(38, 38);
    }

    // Name + Role
    this.add.text(56, 8, cfg.name, { font: 'bold 12px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2 });
    this.add.text(56, 23, `${cfg.role} • ${cfg.resource}`, { font: '9px monospace', fill: '#8877aa' });

    // HP orb (red sphere)
    const hpOrbX = 72, hpOrbY = 50, orbR = 12;
    this.add.graphics().fillStyle(0x331111, 0.8).fillCircle(hpOrbX, hpOrbY, orbR);
    this.hpOrb = this.add.graphics();
    this.drawOrb(this.hpOrb, hpOrbX, hpOrbY, orbR, 1, 0xcc2222);
    // SphereMask overlay
    if (this.textures.exists('ui_mainBars')) {
      const mask = this.add.image(hpOrbX, hpOrbY, 'ui_mainBars').setDisplaySize(orbR * 2.5, orbR * 2.5).setAlpha(0.4);
    }
    this.hpText = this.add.text(hpOrbX, hpOrbY, `${cfg.hp}`, { font: 'bold 9px monospace', fill: '#ff8888' }).setOrigin(0.5);

    // MP orb (blue sphere)
    const mpOrbX = 102, mpOrbY = 50;
    this.add.graphics().fillStyle(0x111133, 0.8).fillCircle(mpOrbX, mpOrbY, orbR);
    this.mpOrb = this.add.graphics();
    this.drawOrb(this.mpOrb, mpOrbX, mpOrbY, orbR, 1, 0x2244cc);
    this.mpText = this.add.text(mpOrbX, mpOrbY, `${cfg.mp}`, { font: 'bold 9px monospace', fill: '#8888ff' }).setOrigin(0.5);

    // HP/MP bar strips (right of orbs)
    this.add.graphics().fillStyle(0x222222, 0.6).fillRoundedRect(120, 40, 120, 8, 2);
    this.hpBar = this.add.graphics();
    this.drawHpBar(cfg.hp, cfg.hp);

    this.add.graphics().fillStyle(0x111133, 0.6).fillRoundedRect(120, 52, 120, 6, 2);
    this.mpBar = this.add.graphics();
    this.drawMpBar(cfg.mp, cfg.mp);

    // ══════════════════════════════════════════════════════════════════════
    // PARTY FRAMES — below player frame, one per ally
    // ══════════════════════════════════════════════════════════════════════
    this.partyFrames = {};
    const otherHeroes = Object.keys(HEROES).filter(k => k !== heroId);
    otherHeroes.slice(0, 3).forEach((charKey, i) => {
      const allyCfg = HEROES[charKey];
      const fy = 78 + i * 44;

      const bg = this.add.graphics();
      bg.fillStyle(0x0d0a14, 0.85);
      bg.fillRoundedRect(6, fy, 180, 38, 4);
      bg.lineStyle(1, 0x223322, 0.6);
      bg.strokeRoundedRect(6, fy, 180, 38, 4);

      // Icon
      if (this.textures.exists(allyCfg.icon)) {
        this.add.image(26, fy + 19, allyCfg.icon).setDisplaySize(24, 24);
      }

      // Name
      this.add.text(42, fy + 4, allyCfg.name, { font: '9px monospace', fill: '#88ff88' });

      // HP bar background
      this.add.graphics().fillStyle(0x222222, 0.6).fillRoundedRect(42, fy + 18, 130, 8, 2);

      // HP bar fill
      const hpBar = this.add.graphics();
      const maxHp = allyCfg.hp;
      hpBar.fillStyle(0x44aa44, 1);
      hpBar.fillRoundedRect(42, fy + 18, 130, 8, 2);

      // HP text
      const hpText = this.add.text(107, fy + 22, `${maxHp}/${maxHp}`, { font: '7px monospace', fill: '#aaffaa' }).setOrigin(0.5);

      // Click zone for selection
      const zone = this.add.zone(96, fy + 19, 180, 38).setInteractive({ useHandCursor: true });
      const selBorder = this.add.graphics();
      zone.on('pointerdown', () => {
        // Emit event to arena scene to select this ally
        const arena = this.scene.get('Arena');
        arena.events.emit('selectAllyByKey', charKey);
      });

      this.partyFrames[charKey] = { hpBar, hpText, maxHp, fy, selBorder };
    });

    // ══════════════════════════════════════════════════════════════════════
    // ACTION BAR — bottom center using Hotbar.png
    // ══════════════════════════════════════════════════════════════════════
    const skills = SKILLS[heroId] || [];
    const slotSize = 38;
    const gap = 4;
    const totalSlots = 8;
    const barWidth = totalSlots * (slotSize + gap) - gap;
    const barX = (w - barWidth) / 2;
    const barY = h - 58;

    // Hotbar image as background
    if (this.textures.exists('ui_hotbar')) {
      const hotbar = this.add.image(w / 2, barY + slotSize / 2 + 2, 'ui_hotbar');
      hotbar.setDisplaySize(barWidth + 24, slotSize + 20);
      hotbar.setAlpha(0.85);
    } else {
      // Fallback generative
      const abBg = this.add.graphics();
      abBg.fillStyle(0x0d0a14, 0.92);
      abBg.fillRoundedRect(barX - 8, barY - 6, barWidth + 16, slotSize + 22, 6);
    }

    // 4 skill slots
    this.skillCooldowns = [];
    for (let i = 0; i < 4; i++) {
      const sx = barX + i * (slotSize + gap);
      const skill = skills[i];

      const frame = this.add.graphics();
      frame.fillStyle(0x1a1430, 0.9);
      frame.fillRoundedRect(sx, barY, slotSize, slotSize, 4);
      frame.lineStyle(1, skill?.dual ? 0x44ff44 : cfg.color, 0.7);
      frame.strokeRoundedRect(sx, barY, slotSize, slotSize, 4);

      this.add.text(sx + 4, barY + 2, `${i + 1}`, { font: '9px monospace', fill: '#666688' });

      if (skill) {
        this.add.text(sx + slotSize / 2, barY + slotSize / 2, skill.name.split(' ')[0], { font: '8px monospace', fill: '#cccccc' }).setOrigin(0.5);
        const costColor = skill.dual ? '#44ff88' : '#6666aa';
        this.add.text(sx + slotSize / 2, barY + slotSize + 3, `${skill.cost}`, { font: '7px monospace', fill: costColor }).setOrigin(0.5);
        if (skill.dual) {
          this.add.text(sx + slotSize - 4, barY + 2, '⚕', { font: '8px monospace', fill: '#44ff44' }).setOrigin(1, 0);
        }
      }

      const cdOverlay = this.add.graphics();
      cdOverlay.setAlpha(0);
      this.skillCooldowns.push(cdOverlay);
    }

    // Empty slot 5
    const emptyX = barX + 4 * (slotSize + gap);
    this.add.graphics().fillStyle(0x0a0a0a, 0.5).fillRoundedRect(emptyX, barY, slotSize, slotSize, 4);

    // 3 consumable slots
    for (let i = 0; i < CONSUMABLES.length; i++) {
      const cx = barX + (5 + i) * (slotSize + gap);
      const cf = this.add.graphics();
      cf.fillStyle(0x221810, 0.9);
      cf.fillRoundedRect(cx, barY, slotSize, slotSize, 4);
      cf.lineStyle(1, 0x554422, 0.6);
      cf.strokeRoundedRect(cx, barY, slotSize, slotSize, 4);
      this.add.text(cx + 4, barY + 2, `${CONSUMABLES[i].slot}`, { font: '9px monospace', fill: '#665544' });
      this.add.text(cx + slotSize / 2, barY + slotSize / 2 + 2, CONSUMABLES[i].name, { font: '7px monospace', fill: '#998866' }).setOrigin(0.5);
    }

    // ══════════════════════════════════════════════════════════════════════
    // KILL COUNTER + CONTROLS (top right — single line, no duplication)
    // ══════════════════════════════════════════════════════════════════════
    this.killText = this.add.text(w - 12, 10, 'Kills: 0', { font: '13px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
    this.add.text(w - 12, 28, 'LMB:Attack  RMB:Block  Space:Dash  1-4:Skills  C:Panel', { font: '7px monospace', fill: '#444444' }).setOrigin(1, 0);

    // ══════════════════════════════════════════════════════════════════════
    // BOSS HEALTH BAR — uses BossHealthBar.png
    // ══════════════════════════════════════════════════════════════════════
    this.bossContainer = this.add.container(w / 2, 18);
    this.bossContainer.setVisible(false);

    if (this.textures.exists('ui_bossHealthBar')) {
      const bossFrame = this.add.image(0, 0, 'ui_bossHealthBar').setDisplaySize(340, 30);
      this.bossContainer.add(bossFrame);
    } else {
      const bossBg = this.add.graphics();
      bossBg.fillStyle(0x220000, 0.9);
      bossBg.fillRoundedRect(-165, -10, 330, 24, 4);
      this.bossContainer.add(bossBg);
    }

    this.bossHpBar = this.add.graphics();
    this.bossContainer.add(this.bossHpBar);

    this.bossNameText = this.add.text(0, -6, '', { font: '10px monospace', fill: '#ff8800', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0);
    this.bossContainer.add(this.bossNameText);

    // ══════════════════════════════════════════════════════════════════════
    // CHARACTER PANEL (C key toggle)
    // ══════════════════════════════════════════════════════════════════════
    this.panelContainer = this.add.container(w / 2, h / 2);
    this.panelContainer.setVisible(false);
    this.panelContainer.setDepth(50);
    this.createCharacterPanel();

    // ══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ══════════════════════════════════════════════════════════════════════
    const arena = this.scene.get('Arena');

    arena.events.on('hp', (current, max) => {
      this.drawHpBar(current, max);
      this.drawOrb(this.hpOrb, 72, 50, 12, Math.max(0, current / max), 0xcc2222);
      this.hpText.setText(`${Math.max(0, current)}`);
    });

    arena.events.on('mp', (current, max) => {
      this.drawMpBar(current, max);
      this.drawOrb(this.mpOrb, 102, 50, 12, Math.max(0, current / max), 0x2244cc);
      this.mpText.setText(`${Math.max(0, Math.floor(current))}`);
    });

    arena.events.on('kill', (count) => { this.killText.setText(`Kills: ${count}`); });

    arena.events.on('bossSpawn', (bossId, bossCfg) => {
      this.bossContainer.setVisible(true);
      this.bossNameText.setText(bossCfg.name);
      this.drawBossHpBar(bossCfg.hp, bossCfg.hp);
    });

    arena.events.on('bossHp', (current, max) => { this.drawBossHpBar(current, max); });
    arena.events.on('bossDead', () => { this.bossContainer.setVisible(false); });

    arena.events.on('togglePanel', () => {
      this.panelOpen = !this.panelOpen;
      this.panelContainer.setVisible(this.panelOpen);
    });

    arena.events.on('skillUsed', (index) => {
      if (this.skillCooldowns[index]) {
        const cd = this.skillCooldowns[index];
        cd.clear(); cd.fillStyle(0x000000, 0.5); cd.setAlpha(0.6);
        this.tweens.add({ targets: cd, alpha: 0, duration: 800 });
      }
    });

    // Party frame HP updates
    arena.events.on('allyHp', (charKey, current, max) => {
      const pf = this.partyFrames[charKey];
      if (!pf) return;
      pf.hpBar.clear();
      const pct = Math.max(0, current / max);
      const col = pct > 0.5 ? 0x44aa44 : pct > 0.25 ? 0xaaaa22 : 0xaa2222;
      pf.hpBar.fillStyle(col, 1);
      pf.hpBar.fillRoundedRect(42, pf.fy + 18, 130 * pct, 8, 2);
      pf.hpText.setText(`${Math.max(0, current)}/${pf.maxHp}`);
    });

    // Ally selection highlight
    arena.events.on('allySelected', (charKey) => {
      for (const [key, pf] of Object.entries(this.partyFrames)) {
        pf.selBorder.clear();
        if (key === charKey) {
          pf.selBorder.lineStyle(2, 0x44ff44, 0.9);
          pf.selBorder.strokeRoundedRect(6, pf.fy, 180, 38, 4);
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // DRAWING HELPERS
  // ══════════════════════════════════════════════════════════════════════
  drawOrb(graphics, x, y, r, pct, color) {
    graphics.clear();
    if (pct <= 0) return;
    graphics.fillStyle(color, 0.8);
    // Fill from bottom up based on pct
    const fillH = r * 2 * pct;
    const startY = y + r - fillH;
    graphics.fillRect(x - r, startY, r * 2, fillH);
    // Clip to circle via masking (approximate with rounded rect)
    graphics.fillStyle(color, 0.3);
    graphics.fillCircle(x, y, r * 0.6);
  }

  drawHpBar(current, max) {
    this.hpBar.clear();
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xccaa22 : 0xcc2222;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRoundedRect(120, 40, 120 * pct, 8, 2);
  }

  drawMpBar(current, max) {
    this.mpBar.clear();
    const pct = Math.max(0, current / max);
    this.mpBar.fillStyle(0x4444dd, 1);
    this.mpBar.fillRoundedRect(120, 52, 120 * pct, 6, 2);
  }

  drawBossHpBar(current, max) {
    this.bossHpBar.clear();
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? 0xcc4400 : pct > 0.25 ? 0xaa2200 : 0x880000;
    this.bossHpBar.fillStyle(color, 1);
    this.bossHpBar.fillRoundedRect(-156, -6, 312 * pct, 16, 3);
  }

  createCharacterPanel() {
    const cfg = this.heroCfg;
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a14, 0.95);
    bg.fillRoundedRect(-200, -180, 400, 360, 10);
    bg.lineStyle(2, 0x443366, 1);
    bg.strokeRoundedRect(-200, -180, 400, 360, 10);
    this.panelContainer.add(bg);

    this.panelContainer.add(this.add.text(0, -165, 'CHARACTER', { font: '16px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5));

    [`Name: ${cfg.name}`, `Role: ${cfg.role}`, `Resource: ${cfg.resource}`, `HP: ${cfg.hp}  MP: ${cfg.mp}`, `Speed: ${cfg.speed}`, `Attack: ${cfg.attackType}`].forEach((text, i) => {
      this.panelContainer.add(this.add.text(-180, -135 + i * 18, text, { font: '10px monospace', fill: '#cccccc' }));
    });

    this.panelContainer.add(this.add.text(0, -20, '── Equipment ──', { font: '11px monospace', fill: '#8877aa' }).setOrigin(0.5));
    EQUIPMENT_SLOTS.forEach((slot, i) => {
      const row = i % 3, col = Math.floor(i / 3);
      const sx = -170 + col * 200, sy = 5 + row * 36;
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x1a1430, 1); slotBg.fillRoundedRect(sx, sy, 180, 30, 4);
      slotBg.lineStyle(1, 0x332244, 0.6); slotBg.strokeRoundedRect(sx, sy, 180, 30, 4);
      this.panelContainer.add(slotBg);
      this.panelContainer.add(this.add.text(sx + 8, sy + 8, `[${slot}]`, { font: '10px monospace', fill: '#666688' }));
      this.panelContainer.add(this.add.text(sx + 90, sy + 8, 'Empty', { font: '10px monospace', fill: '#444444' }));
    });

    this.panelContainer.add(this.add.text(0, 120, '── Skills ──', { font: '11px monospace', fill: '#8877aa' }).setOrigin(0.5));
    const skills = SKILLS[this.heroId] || [];
    skills.forEach((skill, i) => {
      const label = skill.dual ? `[${i + 1}] ${skill.name} - ${skill.type} (${skill.cost}) ⚕ DUAL` : `[${i + 1}] ${skill.name} - ${skill.type} (${skill.cost} ${cfg.resource})`;
      this.panelContainer.add(this.add.text(-180, 140 + i * 16, label, { font: '9px monospace', fill: skill.dual ? '#88ffaa' : '#aaaacc' }));
    });

    this.panelContainer.add(this.add.text(0, 165, 'Press C to close', { font: '9px monospace', fill: '#555555' }).setOrigin(0.5));
  }
}
