import Phaser from 'phaser';
import { HEROES, BOSSES, WORLD, DIR, heroKey, bossKey, COMBAT, SKILLS, DIRECTIONS } from '../config.js';

// Map boss dirs to hero dirs for unified facing
const BOSS_DIR_MAP = { down: 'front', up: 'back', left: 'left', right: 'right' };

export class ArenaScene extends Phaser.Scene {
  constructor() { super('Arena'); }

  create() {
    const heroId = this.registry.get('selectedHero') || 'sorceress';
    const heroCfg = HEROES[heroId];
    this.heroId = heroId;
    this.heroCfg = heroCfg;
    this.facing = DIR.down;
    this.isAttacking = false;
    this.isDashing = false;
    this.isParrying = false;
    this.dashCooldown = 0;
    this.hp = heroCfg.hp;
    this.maxHp = heroCfg.hp;
    this.mp = heroCfg.mp;
    this.maxMp = heroCfg.mp;
    this.kills = 0;
    this.bossActive = null;

    // World
    this.cameras.main.setBackgroundColor('#0d0a12');
    this.physics.world.setBounds(0, 0, WORLD.w, WORLD.h);
    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
    this.drawDungeon();

    // Player
    const startKey = heroKey(heroId, 'idle', DIR.down);
    const tex = this.textures.exists(startKey) ? startKey : '__DEFAULT';
    this.player = this.physics.add.sprite(WORLD.w / 2, WORLD.h / 2, tex);
    this.player.setScale(2.5);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(24, 24);
    this.player.setOffset(12, 20);
    this.player.setDepth(10);
    if (this.anims.exists(startKey)) this.player.play(startKey);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Groups
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.allies = this.physics.add.group();
    this.bossGroup = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHit, null, this);
    this.physics.add.overlap(this.projectiles, this.bossGroup, this.projectileHitBoss, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

    // Input
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.cKey = this.input.keyboard.addKey('C');
    this.skillKeys = [
      this.input.keyboard.addKey('ONE'),
      this.input.keyboard.addKey('TWO'),
      this.input.keyboard.addKey('THREE'),
      this.input.keyboard.addKey('FOUR'),
    ];

    // LMB = attack, RMB = parry
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.doParry();
      } else {
        this.doAttack();
      }
    });

    // Disable context menu for RMB
    this.input.mouse.disableContextMenu();

    // Space = dash
    this.spaceKey.on('down', () => this.doDash());

    // C = character panel toggle
    this.cKey.on('down', () => this.events.emit('togglePanel'));

    // Skill keys
    this.skillKeys.forEach((key, i) => {
      key.on('down', () => this.useSkill(i));
    });

    // Spawn initial enemies + allies
    this.spawnWave(6);
    this.spawnAllies();

    // Spawn timer
    this.time.addEvent({ delay: 10000, callback: () => this.spawnWave(4), loop: true });

    // Enemy chase update
    this.enemyUpdateTimer = this.time.addEvent({ delay: 100, callback: () => this.updateEnemyAI(), loop: true });
  }

  update(time, delta) {
    if (this.hp <= 0) return;
    if (this.isDashing) return;

    // ── Mouse-aimed facing ──
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = worldPoint.x - this.player.x;
    const dy = worldPoint.y - this.player.y;
    const angle = Math.atan2(dy, dx);

    // Pick 4-dir based on angle to mouse
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? DIR.right : DIR.left;
    } else {
      this.facing = dy > 0 ? DIR.down : DIR.up;
    }

    // ── WASD movement ──
    const speed = this.heroCfg.speed;
    let vx = 0, vy = 0;
    if (this.wasd.A.isDown) vx = -speed;
    else if (this.wasd.D.isDown) vx = speed;
    if (this.wasd.W.isDown) vy = -speed;
    else if (this.wasd.S.isDown) vy = speed;

    if (this.isAttacking) {
      this.player.setVelocity(0, 0);
    } else {
      this.player.setVelocity(vx, vy);
      if (vx !== 0 && vy !== 0) {
        this.player.setVelocity(vx * 0.707, vy * 0.707);
      }
    }

    // Animation
    if (!this.isAttacking) {
      const moving = vx !== 0 || vy !== 0;
      const moveAnim = this.heroCfg.anims.run ? 'run' : 'walk';
      const anim = moving ? moveAnim : 'idle';
      const animKey = heroKey(this.heroId, anim, this.facing);
      if (this.player.anims.currentAnim?.key !== animKey && this.anims.exists(animKey)) {
        this.player.play(animKey);
      }
    }

    // Update dash cooldown
    if (this.dashCooldown > 0) this.dashCooldown -= delta;

    // Check enemy collision damage
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 40 && !enemy.getData('cooldown')) {
        enemy.setData('cooldown', true);
        this.time.delayedCall(1500, () => { if (enemy.active) enemy.setData('cooldown', false); });
        this.playerTakeDamage(12);
      }
    });

    // Boss collision damage
    this.bossGroup.children.each(boss => {
      if (!boss.active || boss.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
      if (dist < 80 && !boss.getData('cooldown')) {
        boss.setData('cooldown', true);
        this.time.delayedCall(2000, () => { if (boss.active) boss.setData('cooldown', false); });
        const bossCfg = BOSSES[boss.getData('bossId')];
        this.playerTakeDamage(bossCfg?.damage || 30);
      }
    });

    // Update ally AI
    this.updateAllyAI();
  }

  // ────── DUNGEON RENDERING ──────
  drawDungeon() {
    const g = this.add.graphics();
    // Floor
    g.fillStyle(0x1a1018, 1);
    g.fillRect(0, 0, WORLD.w, WORLD.h);

    // Generate rooms
    this.rooms = [];
    const roomCount = 12;
    for (let i = 0; i < roomCount; i++) {
      const rw = Phaser.Math.Between(200, 500);
      const rh = Phaser.Math.Between(200, 500);
      const rx = Phaser.Math.Between(50, WORLD.w - rw - 50);
      const ry = Phaser.Math.Between(50, WORLD.h - rh - 50);
      this.rooms.push({ x: rx, y: ry, w: rw, h: rh });

      // Room floor
      g.fillStyle(0x2a1a28, 1);
      g.fillRect(rx, ry, rw, rh);

      // Room border (walls)
      g.lineStyle(3, 0x443344, 0.8);
      g.strokeRect(rx, ry, rw, rh);

      // Lava cracks
      const crackCount = Phaser.Math.Between(2, 5);
      for (let c = 0; c < crackCount; c++) {
        g.fillStyle(0x661100, 0.3);
        const cx = rx + Phaser.Math.Between(20, rw - 20);
        const cy = ry + Phaser.Math.Between(20, rh - 20);
        g.fillCircle(cx, cy, Phaser.Math.Between(5, 15));
      }
    }

    // Draw corridors between rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const a = this.rooms[i];
      const b = this.rooms[i + 1];
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;

      g.fillStyle(0x221622, 1);
      const cw = 40;
      // Horizontal then vertical
      g.fillRect(Math.min(ax, bx), ay - cw / 2, Math.abs(bx - ax), cw);
      g.fillRect(bx - cw / 2, Math.min(ay, by), cw, Math.abs(by - ay));
    }

    // Decorative grid overlay
    g.lineStyle(1, 0x221122, 0.15);
    for (let x = 0; x < WORLD.w; x += 48) { g.moveTo(x, 0); g.lineTo(x, WORLD.h); }
    for (let y = 0; y < WORLD.h; y += 48) { g.moveTo(0, y); g.lineTo(WORLD.w, y); }
    g.strokePath();

    // Place torches as glow spots
    for (const room of this.rooms) {
      const torchPositions = [
        { x: room.x + 10, y: room.y + 10 },
        { x: room.x + room.w - 10, y: room.y + 10 },
        { x: room.x + 10, y: room.y + room.h - 10 },
        { x: room.x + room.w - 10, y: room.y + room.h - 10 },
      ];
      for (const tp of torchPositions) {
        const glow = this.add.graphics();
        glow.fillStyle(0xff6600, 0.08);
        glow.fillCircle(tp.x, tp.y, 40);
        glow.fillStyle(0xff4400, 0.15);
        glow.fillCircle(tp.x, tp.y, 12);
      }
    }
  }

  // ────── SPAWNING ──────
  spawnWave(count) {
    // Spawn enemies in random rooms away from player
    for (let i = 0; i < count; i++) {
      const room = Phaser.Utils.Array.GetRandom(this.rooms || [{ x: 200, y: 200, w: 400, h: 400 }]);
      const x = room.x + Phaser.Math.Between(30, room.w - 30);
      const y = room.y + Phaser.Math.Between(30, room.h - 30);

      // Use other heroes as enemy sprites
      const otherHeroes = Object.keys(HEROES).filter(k => k !== this.heroId);
      const charKey = Phaser.Utils.Array.GetRandom(otherHeroes);
      const cfg = HEROES[charKey];

      const idleKey = heroKey(charKey, 'idle', DIR.down);
      const enemy = this.physics.add.sprite(x, y, this.textures.exists(idleKey) ? idleKey : '__DEFAULT');
      enemy.setScale(2.5);
      enemy.setSize(24, 24);
      enemy.setOffset(12, 20);
      enemy.setData('charKey', charKey);
      enemy.setData('hp', Math.floor(cfg.hp * 0.6));
      enemy.setData('facing', DIR.down);
      enemy.setData('dead', false);
      enemy.setTint(0xff8888);
      if (this.anims.exists(idleKey)) enemy.play(idleKey);
      this.enemies.add(enemy);
    }

    // Check boss spawn
    if (this.kills >= COMBAT.bossSpawnKills && !this.bossActive) {
      this.spawnBoss();
    }
  }

  spawnBoss() {
    const bossIds = Object.keys(BOSSES);
    const bossId = Phaser.Utils.Array.GetRandom(bossIds);
    const bossCfg = BOSSES[bossId];
    this.bossActive = bossId;

    // Spawn boss in a room far from player
    const room = this.rooms?.[this.rooms.length - 1] || { x: WORLD.w / 2, y: WORLD.h / 2, w: 400, h: 400 };
    const bx = room.x + room.w / 2;
    const by = room.y + room.h / 2;

    const idleKey = bossKey(bossId, 'idle', 'front');
    const boss = this.physics.add.sprite(bx, by, this.textures.exists(idleKey) ? idleKey : '__DEFAULT');
    boss.setScale(0.4); // 480px sprite scaled down to ~192px
    boss.setSize(100, 100);
    boss.setDepth(5);
    boss.setData('bossId', bossId);
    boss.setData('hp', bossCfg.hp);
    boss.setData('maxHp', bossCfg.hp);
    boss.setData('facing', 'front');
    boss.setData('dead', false);
    if (this.anims.exists(idleKey)) boss.play(idleKey);
    this.bossGroup.add(boss);

    this.events.emit('bossSpawn', bossId, bossCfg);

    // Boss AI
    this.time.addEvent({
      delay: 150,
      callback: () => this.updateBossAI(boss, bossId),
      loop: true,
    });
  }

  spawnAllies() {
    const otherHeroes = Object.keys(HEROES).filter(k => k !== this.heroId);
    // Spawn 3 AI teammates
    for (let i = 0; i < Math.min(3, otherHeroes.length); i++) {
      const charKey = otherHeroes[i];
      const cfg = HEROES[charKey];
      const offset = [(i - 1) * 80, 60];
      const ax = WORLD.w / 2 + offset[0];
      const ay = WORLD.h / 2 + offset[1];

      const idleKey = heroKey(charKey, 'idle', DIR.down);
      const ally = this.physics.add.sprite(ax, ay, this.textures.exists(idleKey) ? idleKey : '__DEFAULT');
      ally.setScale(2.5);
      ally.setSize(24, 24);
      ally.setOffset(12, 20);
      ally.setDepth(9);
      ally.setData('charKey', charKey);
      ally.setData('hp', cfg.hp);
      ally.setData('facing', DIR.down);
      ally.setData('attackCd', 0);
      ally.setTint(0x88ff88);
      if (this.anims.exists(idleKey)) ally.play(idleKey);
      this.allies.add(ally);
    }
  }

  // ────── COMBAT ──────
  doAttack() {
    if (this.isAttacking || this.hp <= 0 || this.isDashing) return;
    this.isAttacking = true;

    // Play attack animation
    const attackAnim = this.heroCfg.isGolem ? 'attack' : 'attack01';
    const animKey = heroKey(this.heroId, attackAnim, this.facing);
    if (this.anims.exists(animKey)) {
      this.player.play(animKey);
    }
    this.player.setVelocity(0, 0);

    // Fire attack effect toward mouse
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.spawnAttackEffect(worldPoint.x, worldPoint.y);

    // Regain resource on attack
    this.mp = Math.min(this.maxMp, this.mp + COMBAT.resourcePerHit);
    this.events.emit('mp', this.mp, this.maxMp);

    this.player.once('animationcomplete', () => {
      this.isAttacking = false;
    });

    // Failsafe: unlock after 600ms even if anim doesn't complete
    this.time.delayedCall(600, () => { this.isAttacking = false; });
  }

  doParry() {
    if (this.isParrying || this.hp <= 0) return;
    this.isParrying = true;

    // Visual indicator
    const shield = this.add.graphics();
    shield.lineStyle(3, 0x4488ff, 0.6);
    shield.strokeCircle(this.player.x, this.player.y, 30);
    shield.setDepth(20);

    this.time.delayedCall(COMBAT.parryWindow, () => {
      this.isParrying = false;
      shield.destroy();
    });
  }

  doDash() {
    if (this.isDashing || this.dashCooldown > 0 || this.hp <= 0) return;
    this.isDashing = true;
    this.dashCooldown = COMBAT.dashCooldown;

    const dirs = {
      [DIR.down]:  { x: 0, y: 1 },
      [DIR.up]:    { x: 0, y: -1 },
      [DIR.left]:  { x: -1, y: 0 },
      [DIR.right]: { x: 1, y: 0 },
    };
    const d = dirs[this.facing];
    const dist = COMBAT.dashDistance;

    this.player.setAlpha(0.5);
    this.tweens.add({
      targets: this.player,
      x: this.player.x + d.x * dist,
      y: this.player.y + d.y * dist,
      duration: COMBAT.dashDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isDashing = false;
        this.player.setAlpha(1);
      },
    });
  }

  useSkill(index) {
    const skills = SKILLS[this.heroId];
    if (!skills || !skills[index]) return;
    const skill = skills[index];
    if (this.mp < skill.cost) return;

    this.mp -= skill.cost;
    this.events.emit('mp', this.mp, this.maxMp);

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    if (skill.type === 'projectile') {
      this.spawnProjectile(worldPoint.x, worldPoint.y, skill.damage, this.heroCfg.color, 400);
    } else if (skill.type === 'aoe') {
      this.spawnAoE(worldPoint.x, worldPoint.y, skill.damage, 100);
    } else if (skill.type === 'dash') {
      this.doDash();
    } else if (skill.type === 'melee') {
      this.spawnMeleeHit(skill.damage);
    }

    this.events.emit('skillUsed', index);
  }

  spawnAttackEffect(targetX, targetY) {
    const cfg = this.heroCfg;
    if (cfg.attackType === 'projectile') {
      this.spawnProjectile(targetX, targetY, COMBAT.baseLMBDamage, cfg.color, cfg.projSpeed || 350);
    } else if (cfg.attackType === 'melee') {
      this.spawnMeleeHit(COMBAT.baseLMBDamage);
    } else if (cfg.attackType === 'aoe') {
      this.spawnAoE(this.player.x, this.player.y, COMBAT.baseLMBDamage, cfg.aoeRadius || 80);
    }
  }

  spawnProjectile(targetX, targetY, damage, color, speed) {
    if (!this.textures.exists('proj')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(color, 1);
      g.fillCircle(6, 6, 6);
      g.generateTexture('proj', 12, 12);
      g.destroy();
    }

    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    const proj = this.physics.add.sprite(
      this.player.x + nx * 20,
      this.player.y + ny * 20,
      'proj'
    );
    proj.setScale(2);
    proj.setTint(color);
    proj.setVelocity(nx * speed, ny * speed);
    proj.setData('damage', damage);
    proj.setDepth(15);
    this.projectiles.add(proj);

    this.time.delayedCall(1500, () => { if (proj.active) proj.destroy(); });
  }

  spawnMeleeHit(damage) {
    const dirs = {
      [DIR.down]:  { x: 0, y: 1 },
      [DIR.up]:    { x: 0, y: -1 },
      [DIR.left]:  { x: -1, y: 0 },
      [DIR.right]: { x: 1, y: 0 },
    };
    const d = dirs[this.facing];
    const range = this.heroCfg.meleeRange || 60;
    const hitX = this.player.x + d.x * range;
    const hitY = this.player.y + d.y * range;

    // Wave VFX
    const waveKey = `fx_wave_${this.facing}`;
    if (this.textures.exists(waveKey)) {
      const wave = this.add.sprite(hitX, hitY, waveKey);
      wave.setScale(2);
      wave.setDepth(12);
      if (this.anims.exists(waveKey)) {
        wave.play(waveKey);
        wave.once('animationcomplete', () => wave.destroy());
      } else {
        this.time.delayedCall(300, () => wave.destroy());
      }
    } else {
      this.showSlashEffect(hitX, hitY);
    }

    // Hit enemies in range
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      if (dist < range + 20) {
        this.damageEnemy(enemy, damage);
      }
    });

    // Hit boss
    this.bossGroup.children.each(boss => {
      if (!boss.active || boss.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, boss.x, boss.y);
      if (dist < range + 60) {
        this.damageBoss(boss, damage);
      }
    });
  }

  spawnAoE(cx, cy, damage, radius) {
    // Destroy effect
    if (this.textures.exists('fx_destroy')) {
      const fx = this.add.sprite(cx, cy, 'fx_destroy');
      fx.setScale(3);
      fx.setDepth(12);
      if (this.anims.exists('fx_destroy')) {
        fx.play('fx_destroy');
        fx.once('animationcomplete', () => fx.destroy());
      } else {
        this.time.delayedCall(400, () => fx.destroy());
      }
    } else {
      const circle = this.add.graphics();
      circle.fillStyle(this.heroCfg.color, 0.3);
      circle.fillCircle(cx, cy, radius);
      circle.setDepth(12);
      this.tweens.add({ targets: circle, alpha: 0, duration: 400, onComplete: () => circle.destroy() });
    }

    // Damage all enemies in radius
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
      if (dist < radius) this.damageEnemy(enemy, damage);
    });

    this.bossGroup.children.each(boss => {
      if (!boss.active || boss.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(cx, cy, boss.x, boss.y);
      if (dist < radius + 40) this.damageBoss(boss, damage);
    });
  }

  showSlashEffect(x, y) {
    const g = this.add.graphics();
    g.fillStyle(this.heroCfg.color, 0.6);
    g.fillCircle(x, y, 15);
    g.setDepth(12);
    this.tweens.add({ targets: g, alpha: 0, scale: 3, duration: 250, onComplete: () => g.destroy() });
  }

  // ────── DAMAGE ──────
  damageEnemy(enemy, dmg) {
    if (enemy.getData('dead')) return;
    let hp = enemy.getData('hp') - dmg;
    enemy.setData('hp', hp);
    this.showDamage(enemy.x, enemy.y - 20, dmg);

    const eId = enemy.getData('charKey');
    const eFacing = enemy.getData('facing') || DIR.down;

    if (hp <= 0) {
      enemy.setData('dead', true);
      enemy.setVelocity(0, 0);
      const deathKey = heroKey(eId, 'death', eFacing);
      if (this.anims.exists(deathKey)) {
        enemy.play(deathKey);
        enemy.once('animationcomplete', () => {
          this.dropPickup(enemy.x, enemy.y);
          enemy.destroy();
        });
      } else {
        this.dropPickup(enemy.x, enemy.y);
        enemy.destroy();
      }
      this.kills++;
      this.events.emit('kill', this.kills);

      // Check boss spawn
      if (this.kills >= COMBAT.bossSpawnKills && !this.bossActive) {
        this.spawnBoss();
      }
    } else {
      const hurtKey = heroKey(eId, 'hurt', eFacing);
      if (this.anims.exists(hurtKey)) {
        enemy.play(hurtKey);
        enemy.once('animationcomplete', () => {
          const idleKey = heroKey(eId, 'idle', eFacing);
          if (enemy.active && this.anims.exists(idleKey)) enemy.play(idleKey);
        });
      }
    }
  }

  damageBoss(boss, dmg) {
    if (boss.getData('dead')) return;
    let hp = boss.getData('hp') - dmg;
    boss.setData('hp', hp);
    this.showDamage(boss.x, boss.y - 60, dmg, '#ff8800');
    this.events.emit('bossHp', hp, boss.getData('maxHp'));

    const bossId = boss.getData('bossId');
    const facing = boss.getData('facing') || 'front';

    if (hp <= 0) {
      boss.setData('dead', true);
      boss.setVelocity(0, 0);
      const dyingKey = bossKey(bossId, 'dying', facing);
      if (this.anims.exists(dyingKey)) {
        boss.play(dyingKey);
        boss.once('animationcomplete', () => {
          // Drop multiple pickups
          for (let i = 0; i < 5; i++) {
            this.dropPickup(boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-50, 50));
          }
          boss.destroy();
        });
      } else {
        boss.destroy();
      }
      this.bossActive = null;
      this.events.emit('bossDead');
      this.kills += 5;
      this.events.emit('kill', this.kills);
    } else {
      const hurtKey = bossKey(bossId, 'hurt', facing);
      if (this.anims.exists(hurtKey)) {
        boss.play(hurtKey);
        boss.once('animationcomplete', () => {
          const idleKey = bossKey(bossId, 'idle', facing);
          if (boss.active && this.anims.exists(idleKey)) boss.play(idleKey);
        });
      }
    }
  }

  projectileHit(proj, enemy) {
    if (enemy.getData('dead')) return;
    const dmg = proj.getData('damage') || COMBAT.baseLMBDamage;
    proj.destroy();
    this.damageEnemy(enemy, dmg);
  }

  projectileHitBoss(proj, boss) {
    if (boss.getData('dead')) return;
    const dmg = proj.getData('damage') || COMBAT.baseLMBDamage;
    proj.destroy();
    this.damageBoss(boss, dmg);
  }

  playerTakeDamage(dmg) {
    if (this.isParrying) {
      dmg = Math.floor(dmg * (1 - COMBAT.parryReduction));
      this.showDamage(this.player.x, this.player.y - 40, dmg, '#4488ff');
    }

    this.hp -= dmg;
    this.showDamage(this.player.x, this.player.y - 40, dmg, '#ff4444');
    this.events.emit('hp', this.hp, this.maxHp);
    this.events.emit('mp', this.mp, this.maxMp);

    if (this.hp <= 0) {
      const deathKey = heroKey(this.heroId, 'death', this.facing);
      if (this.anims.exists(deathKey)) this.player.play(deathKey);
      this.player.setVelocity(0, 0);
      this.player.once('animationcomplete', () => {
        this.time.delayedCall(1000, () => {
          this.scene.stop('Hud');
          this.scene.start('Select');
        });
      });
      // Failsafe
      this.time.delayedCall(2000, () => {
        this.scene.stop('Hud');
        this.scene.start('Select');
      });
    } else {
      this.cameras.main.shake(100, 0.01);
    }
  }

  // ────── PICKUPS ──────
  dropPickup(x, y) {
    if (Math.random() > 0.5) return; // 50% drop chance

    const types = ['pickup_health', 'pickup_mana', 'pickup_gem_blue', 'pickup_gem_orange', 'pickup_gold'];
    const key = Phaser.Utils.Array.GetRandom(types);

    if (!this.textures.exists(key)) return;

    const pickup = this.physics.add.sprite(x, y, key);
    pickup.setScale(2);
    pickup.setDepth(3);
    pickup.setData('type', key);
    this.pickups.add(pickup);

    // Bounce in
    this.tweens.add({
      targets: pickup,
      y: y - 15,
      duration: 300,
      ease: 'Bounce.easeOut',
      yoyo: true,
    });
  }

  collectPickup(player, pickup) {
    const type = pickup.getData('type');
    pickup.destroy();

    if (type === 'pickup_health') {
      this.hp = Math.min(this.maxHp, this.hp + 25);
      this.events.emit('hp', this.hp, this.maxHp);
      this.showDamage(this.player.x, this.player.y - 30, '+25', '#44ff44');
    } else if (type === 'pickup_mana') {
      this.mp = Math.min(this.maxMp, this.mp + 25);
      this.events.emit('mp', this.mp, this.maxMp);
      this.showDamage(this.player.x, this.player.y - 30, '+25', '#4488ff');
    } else if (type?.startsWith('pickup_gem')) {
      this.showDamage(this.player.x, this.player.y - 30, '+XP', '#ffaa00');
    } else if (type === 'pickup_gold') {
      this.showDamage(this.player.x, this.player.y - 30, '+Gold', '#ffdd00');
    }
  }

  // ────── AI ──────
  updateEnemyAI() {
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const eId = enemy.getData('charKey');

      if (dist > 400) {
        enemy.setVelocity(0, 0);
        const idleKey = heroKey(eId, 'idle', enemy.getData('facing') || DIR.down);
        if (this.anims.exists(idleKey) && enemy.anims.currentAnim?.key !== idleKey) enemy.play(idleKey);
        return;
      }

      let eFacing = DIR.down;
      if (Math.abs(dx) > Math.abs(dy)) {
        eFacing = dx > 0 ? DIR.right : DIR.left;
      } else {
        eFacing = dy > 0 ? DIR.down : DIR.up;
      }
      enemy.setData('facing', eFacing);

      const eSpeed = 55 + Math.random() * 15;
      enemy.setVelocity((dx / dist) * eSpeed, (dy / dist) * eSpeed);

      const walkKey = heroKey(eId, 'walk', eFacing);
      if (this.anims.exists(walkKey) && enemy.anims.currentAnim?.key !== walkKey) enemy.play(walkKey);
    });
  }

  updateBossAI(boss, bossId) {
    if (!boss.active || boss.getData('dead')) return;
    const dx = this.player.x - boss.x;
    const dy = this.player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bossCfg = BOSSES[bossId];

    let facing = 'front';
    if (Math.abs(dx) > Math.abs(dy)) {
      facing = dx > 0 ? 'right' : 'left';
    } else {
      facing = dy > 0 ? 'front' : 'back';
    }
    boss.setData('facing', facing);

    if (dist > 60) {
      const speed = bossCfg.speed;
      boss.setVelocity((dx / dist) * speed, (dy / dist) * speed);
      const walkKey = bossKey(bossId, 'walking', facing);
      if (this.anims.exists(walkKey) && boss.anims.currentAnim?.key !== walkKey) boss.play(walkKey);
    } else {
      boss.setVelocity(0, 0);
      const atkKey = bossKey(bossId, 'attacking', facing);
      if (this.anims.exists(atkKey) && boss.anims.currentAnim?.key !== atkKey) boss.play(atkKey);
    }
  }

  updateAllyAI() {
    this.allies.children.each(ally => {
      if (!ally.active) return;
      const charKey = ally.getData('charKey');

      // Follow player loosely
      const dx = this.player.x - ally.x;
      const dy = this.player.y - ally.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 100) {
        const speed = 90;
        ally.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        let facing = DIR.down;
        if (Math.abs(dx) > Math.abs(dy)) facing = dx > 0 ? DIR.right : DIR.left;
        else facing = dy > 0 ? DIR.down : DIR.up;
        ally.setData('facing', facing);

        const walkKey = heroKey(charKey, 'walk', facing);
        if (this.anims.exists(walkKey) && ally.anims.currentAnim?.key !== walkKey) ally.play(walkKey);
      } else {
        ally.setVelocity(0, 0);
        const facing = ally.getData('facing') || DIR.down;
        const idleKey = heroKey(charKey, 'idle', facing);
        if (this.anims.exists(idleKey) && ally.anims.currentAnim?.key !== idleKey) ally.play(idleKey);

        // Attack nearest enemy
        let nearestEnemy = null;
        let nearestDist = 200;
        this.enemies.children.each(enemy => {
          if (!enemy.active || enemy.getData('dead')) return;
          const ed = Phaser.Math.Distance.Between(ally.x, ally.y, enemy.x, enemy.y);
          if (ed < nearestDist) { nearestDist = ed; nearestEnemy = enemy; }
        });

        const cd = ally.getData('attackCd') || 0;
        if (nearestEnemy && cd <= 0) {
          ally.setData('attackCd', 1500);
          const cfg = HEROES[charKey];
          this.damageEnemy(nearestEnemy, 15);
          this.showSlashEffect(nearestEnemy.x, nearestEnemy.y);
        }
        if (cd > 0) ally.setData('attackCd', cd - 100);
      }
    });
  }

  // ────── UI HELPERS ──────
  showDamage(x, y, amount, color = '#ffcc00') {
    const txt = this.add.text(x, y, `${amount}`, {
      font: '14px monospace', fill: color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }
}
