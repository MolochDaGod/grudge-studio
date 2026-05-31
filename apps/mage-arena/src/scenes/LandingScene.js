import Phaser from 'phaser';

const DIFFICULTIES = [
  { key: 'easy',      label: 'Easy',      color: 0x44cc44, hpMult: 0.5, spdMult: 0.8, waveMult: 0.6, desc: 'Fewer enemies, less HP' },
  { key: 'normal',    label: 'Normal',    color: 0xccaa22, hpMult: 1.0, spdMult: 1.0, waveMult: 1.0, desc: 'Standard challenge' },
  { key: 'hard',      label: 'Hard',      color: 0xcc4422, hpMult: 1.5, spdMult: 1.2, waveMult: 1.4, desc: 'Tougher enemies, more waves' },
  { key: 'nightmare', label: 'Nightmare', color: 0xcc22cc, hpMult: 2.5, spdMult: 1.5, waveMult: 2.0, desc: 'Brutal. Good luck.' },
];

export class LandingScene extends Phaser.Scene {
  constructor() { super('Landing'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#08060e');

    // Defaults
    this.selectedAllies = 3;
    this.selectedDifficulty = 1; // normal

    // ── Background panel ──
    if (this.textures.exists('ui_panel1')) {
      this.add.image(w / 2, h / 2, 'ui_panel1').setDisplaySize(w - 20, h - 20).setAlpha(0.15);
    }

    // ── Title ──
    this.add.text(w / 2, 36, 'MAGE ARENA', {
      font: 'bold 42px monospace', fill: '#ff6622', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(w / 2, 72, 'Foozle Lucifer Edition', {
      font: '12px monospace', fill: '#665544',
    }).setOrigin(0.5);

    // ── Ally Count ──
    this.add.text(w / 2, 110, 'AI TEAMMATES', {
      font: 'bold 14px monospace', fill: '#88aacc',
    }).setOrigin(0.5);

    this.allyButtons = [];
    for (let n = 0; n <= 3; n++) {
      const bx = w / 2 + (n - 1.5) * 70;
      const by = 140;
      const btn = this.add.graphics();
      const label = this.add.text(bx, by, `${n}`, {
        font: 'bold 22px monospace', fill: '#ffffff',
      }).setOrigin(0.5);

      const zone = this.add.zone(bx, by, 55, 40).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.selectedAllies = n;
        this.drawAllyButtons();
      });

      this.allyButtons.push({ btn, label, n, x: bx, y: by });
    }
    this.drawAllyButtons();

    this.add.text(w / 2, 168, 'Choose how many AI allies join your party', {
      font: '9px monospace', fill: '#555566',
    }).setOrigin(0.5);

    // ── Difficulty ──
    this.add.text(w / 2, 200, 'DIFFICULTY', {
      font: 'bold 14px monospace', fill: '#ccaa66',
    }).setOrigin(0.5);

    this.diffButtons = [];
    DIFFICULTIES.forEach((diff, i) => {
      const bx = w / 2 + (i - 1.5) * 120;
      const by = 240;

      const btn = this.add.graphics();
      const label = this.add.text(bx, by - 6, diff.label, {
        font: 'bold 11px monospace', fill: '#ffffff',
      }).setOrigin(0.5);
      const desc = this.add.text(bx, by + 10, diff.desc, {
        font: '7px monospace', fill: '#888888',
      }).setOrigin(0.5);

      const zone = this.add.zone(bx, by, 105, 44).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.selectedDifficulty = i;
        this.drawDiffButtons();
      });

      this.diffButtons.push({ btn, label, desc, i, x: bx, y: by, diff });
    });
    this.drawDiffButtons();

    // ── Summary ──
    this.summaryText = this.add.text(w / 2, 290, '', {
      font: '10px monospace', fill: '#aaaaaa',
    }).setOrigin(0.5);
    this.updateSummary();

    // ── PLAY Button ──
    const playY = 340;
    const playBtn = this.add.graphics();
    playBtn.fillStyle(0x882200, 1);
    playBtn.fillRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8);
    playBtn.lineStyle(2, 0xff6622, 1);
    playBtn.strokeRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8);

    this.add.text(w / 2, playY, 'CHOOSE HERO  →', {
      font: 'bold 16px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    const playZone = this.add.zone(w / 2, playY, 200, 44).setInteractive({ useHandCursor: true });
    playZone.on('pointerover', () => { playBtn.clear(); playBtn.fillStyle(0xaa3300, 1); playBtn.fillRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8); playBtn.lineStyle(2, 0xff8844, 1); playBtn.strokeRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8); });
    playZone.on('pointerout', () => { playBtn.clear(); playBtn.fillStyle(0x882200, 1); playBtn.fillRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8); playBtn.lineStyle(2, 0xff6622, 1); playBtn.strokeRoundedRect(w / 2 - 100, playY - 22, 200, 44, 8); });
    playZone.on('pointerdown', () => {
      const diff = DIFFICULTIES[this.selectedDifficulty];
      this.registry.set('allyCount', this.selectedAllies);
      this.registry.set('difficulty', diff.key);
      this.registry.set('hpMult', diff.hpMult);
      this.registry.set('spdMult', diff.spdMult);
      this.registry.set('waveMult', diff.waveMult);
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(250, () => this.scene.start('Select'));
    });

    // ── Credits ──
    this.add.text(w / 2, h - 20, 'Part of Grudge Studio • Foozle Lucifer Assets • Craftpix Magic FX', {
      font: '7px monospace', fill: '#333344',
    }).setOrigin(0.5);
  }

  drawAllyButtons() {
    this.allyButtons.forEach(({ btn, label, n, x, y }) => {
      btn.clear();
      const sel = this.selectedAllies === n;
      btn.fillStyle(sel ? 0x224488 : 0x151520, 1);
      btn.fillRoundedRect(x - 25, y - 18, 50, 36, 6);
      btn.lineStyle(2, sel ? 0x4488ff : 0x333344, 1);
      btn.strokeRoundedRect(x - 25, y - 18, 50, 36, 6);
      label.setColor(sel ? '#88ccff' : '#666666');
    });
    this.updateSummary();
  }

  drawDiffButtons() {
    this.diffButtons.forEach(({ btn, label, desc, i, x, y, diff }) => {
      btn.clear();
      const sel = this.selectedDifficulty === i;
      btn.fillStyle(sel ? (diff.color & 0xffffff) | 0x111111 : 0x151520, sel ? 0.5 : 1);
      btn.fillRoundedRect(x - 50, y - 20, 100, 40, 6);
      btn.lineStyle(2, sel ? diff.color : 0x333344, 1);
      btn.strokeRoundedRect(x - 50, y - 20, 100, 40, 6);
      label.setColor(sel ? '#ffffff' : '#888888');
      desc.setColor(sel ? '#aaaaaa' : '#555555');
    });
    this.updateSummary();
  }

  updateSummary() {
    if (!this.summaryText) return;
    const diff = DIFFICULTIES[this.selectedDifficulty];
    this.summaryText.setText(
      `${this.selectedAllies} allies • ${diff.label} (HP ×${diff.hpMult}  SPD ×${diff.spdMult}  Waves ×${diff.waveMult})`
    );
  }
}
