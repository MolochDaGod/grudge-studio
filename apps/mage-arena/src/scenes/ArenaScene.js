import Phaser from 'phaser';
import { HEROES, WORLD, DIR, heroKey } from '../config.js';

const ENEMY_CHARS = ['lich', 'lizardman', 'skeleton', 'orc'];

export class ArenaScene extends Phaser.Scene {
  constructor() { super('Arena'); }

  create() {
    const heroId = this.registry.get('selectedHero') || 'lich';
    const heroCfg = HEROES[heroId];
    this.heroId = heroId;
    this.heroCfg = heroCfg;
    this.facing = DIR.down;
    this.isAttacking = false;
    this.hp = heroCfg.hp;
    this.mp = heroCfg.mp;
    this.kills = 0;

    // World
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.physics.world.setBounds(0, 0, WORLD.w, WORLD.h);
    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
    this.drawGrid();

    // Player
    this.player = this.physics.add.sprite(WORLD.w / 2, WORLD.h / 2, heroKey(heroId, 'idle'));
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(40, 40);
    this.player.setOffset(12, 20);
    this.player.play(`${heroId}_idle_${this.facing}`);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Enemies group
    this.enemies = this.physics.add.group();
    this.spawnWave(5);

    // Projectiles
    this.projectiles = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHit, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemy, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.attackKey = this.input.keyboard.addKey('J');
    this.input.on('pointerdown', () => this.doAttack());
    this.attackKey.on('down', () => this.doAttack());

    // Spawn timer
    this.time.addEvent({ delay: 8000, callback: () => this.spawnWave(3), loop: true });
  }

  update() {
    if (this.hp <= 0) return;
    if (this.isAttacking) return;

    const speed = this.heroCfg.speed;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -speed; this.facing = DIR.left; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = speed; this.facing = DIR.right; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -speed; this.facing = DIR.up; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = speed; this.facing = DIR.down; }

    this.player.setVelocity(vx, vy);

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      this.player.setVelocity(vx * 0.707, vy * 0.707);
    }

    // Animation
    const moving = vx !== 0 || vy !== 0;
    const animKey = moving ? `${this.heroId}_run_${this.facing}` : `${this.heroId}_idle_${this.facing}`;
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey);
    }

    // Enemy AI — simple chase
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 300) { // Too far, idle
        enemy.setVelocity(0, 0);
        const eId = enemy.getData('charKey');
        const eDir = enemy.getData('facing') || DIR.down;
        const idleAnim = `${eId}_idle_${eDir}`;
        if (enemy.anims.currentAnim?.key !== idleAnim) enemy.play(idleAnim);
        return;
      }

      // Determine facing
      let eFacing = DIR.down;
      if (Math.abs(dx) > Math.abs(dy)) {
        eFacing = dx > 0 ? DIR.right : DIR.left;
      } else {
        eFacing = dy > 0 ? DIR.down : DIR.up;
      }
      enemy.setData('facing', eFacing);

      const eSpeed = 50 + Math.random() * 20;
      const nx = (dx / dist) * eSpeed;
      const ny = (dy / dist) * eSpeed;
      enemy.setVelocity(nx, ny);

      const eId = enemy.getData('charKey');
      const runAnim = `${eId}_run_${eFacing}`;
      if (enemy.anims.currentAnim?.key !== runAnim) enemy.play(runAnim);

      // Attack if close enough
      if (dist < 50 && !enemy.getData('cooldown')) {
        enemy.setData('cooldown', true);
        this.time.delayedCall(2000, () => enemy.setData('cooldown', false));
        this.playerTakeDamage(10);
      }
    });
  }

  drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x333344, 0.3);
    for (let x = 0; x < WORLD.w; x += 80) { g.moveTo(x, 0); g.lineTo(x, WORLD.h); }
    for (let y = 0; y < WORLD.h; y += 80) { g.moveTo(0, y); g.lineTo(WORLD.w, y); }
    g.strokePath();
  }

  spawnWave(count) {
    for (let i = 0; i < count; i++) {
      // Pick a random enemy character that ISN'T the player's hero
      const available = ENEMY_CHARS.filter(c => c !== this.heroId);
      const charKey = Phaser.Utils.Array.GetRandom(available);
      const cfg = HEROES[charKey];

      const x = Phaser.Math.Between(100, WORLD.w - 100);
      const y = Phaser.Math.Between(100, WORLD.h - 100);

      const enemy = this.physics.add.sprite(x, y, heroKey(charKey, 'idle'));
      enemy.setScale(2);
      enemy.setSize(40, 40);
      enemy.setOffset(12, 20);
      enemy.setData('charKey', charKey);
      enemy.setData('hp', cfg.hp);
      enemy.setData('facing', DIR.down);
      enemy.setData('dead', false);
      enemy.setTint(0xff8888); // Tint enemies slightly red
      enemy.play(`${charKey}_idle_${DIR.down}`);
      this.enemies.add(enemy);
    }
  }

  doAttack() {
    if (this.isAttacking || this.hp <= 0) return;
    this.isAttacking = true;

    this.player.play(`${this.heroId}_attack_${this.facing}`);
    this.player.setVelocity(0, 0);

    // Spawn projectile/slash
    this.spawnAttackEffect();

    this.player.once('animationcomplete', () => {
      this.isAttacking = false;
    });
  }

  spawnAttackEffect() {
    const dirs = {
      [DIR.down]:  { x: 0, y: 1 },
      [DIR.up]:    { x: 0, y: -1 },
      [DIR.left]:  { x: -1, y: 0 },
      [DIR.right]: { x: 1, y: 0 },
    };
    const d = dirs[this.facing];
    const speed = 300;

    // Projectile — a tinted bullet sprite (using a tiny generated texture)
    if (!this.textures.exists('proj')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(this.heroCfg.color, 1);
      g.fillCircle(6, 6, 6);
      g.generateTexture('proj', 12, 12);
      g.destroy();
    }

    const proj = this.physics.add.sprite(this.player.x + d.x * 30, this.player.y + d.y * 30, 'proj');
    proj.setScale(2);
    proj.setVelocity(d.x * speed, d.y * speed);
    proj.setData('damage', 25);
    this.projectiles.add(proj);

    // Auto-destroy after 1.5s
    this.time.delayedCall(1500, () => {
      if (proj.active) proj.destroy();
    });

    // Melee slash effect near player
    this.showSlashEffect(this.player.x + d.x * 40, this.player.y + d.y * 40);
  }

  showSlashEffect(x, y) {
    const slash = this.add.sprite(x, y, 'fx_slash');
    slash.setScale(2);
    slash.setAlpha(0.8);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 3,
      duration: 300,
      onComplete: () => slash.destroy(),
    });
  }

  projectileHit(proj, enemy) {
    if (enemy.getData('dead')) return;

    const dmg = proj.getData('damage') || 25;
    let hp = enemy.getData('hp') - dmg;
    enemy.setData('hp', hp);
    proj.destroy();

    // Damage number
    this.showDamage(enemy.x, enemy.y - 30, dmg);

    // Flash hurt
    const eId = enemy.getData('charKey');
    const eFacing = enemy.getData('facing') || DIR.down;

    if (hp <= 0) {
      enemy.setData('dead', true);
      enemy.setVelocity(0, 0);
      enemy.play(`${eId}_death_${eFacing}`);
      enemy.once('animationcomplete', () => {
        this.showExplosion(enemy.x, enemy.y);
        enemy.destroy();
      });
      this.kills++;
      this.events.emit('kill', this.kills);
    } else {
      enemy.play(`${eId}_hurt_${eFacing}`);
      enemy.once('animationcomplete', () => {
        if (enemy.active) enemy.play(`${eId}_idle_${eFacing}`);
      });
    }
  }

  playerHitByEnemy(player, enemy) {
    // Handled in update() via distance check + cooldown
  }

  playerTakeDamage(dmg) {
    this.hp -= dmg;
    this.showDamage(this.player.x, this.player.y - 40, dmg, '#ff4444');
    this.events.emit('hp', this.hp, this.heroCfg.hp);

    if (this.hp <= 0) {
      this.player.play(`${this.heroId}_death_${this.facing}`);
      this.player.setVelocity(0, 0);
      this.player.once('animationcomplete', () => {
        this.showExplosion(this.player.x, this.player.y);
        this.time.delayedCall(1000, () => {
          this.scene.stop('Hud');
          this.scene.start('Select');
        });
      });
    } else {
      this.cameras.main.shake(100, 0.01);
    }
  }

  showDamage(x, y, amount, color = '#ffcc00') {
    const txt = this.add.text(x, y, `-${amount}`, {
      font: '16px monospace', fill: color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  showExplosion(x, y) {
    const circle = this.add.graphics();
    circle.fillStyle(0xff4400, 0.6);
    circle.fillCircle(x, y, 10);
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 4,
      duration: 400,
      onComplete: () => circle.destroy(),
    });
  }
}
