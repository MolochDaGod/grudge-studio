import Phaser from 'phaser';
import {
  HEROES, BOSSES, WORLD, DIR, heroKey, bossKey, COMBAT, SKILLS, DIRECTIONS,
  getAttackAnimKey,
} from '../config.js';
import {
  applyEffect, tickEffects, isImmobilized, getSpeedMult, getDamageReduction,
  hasEffect, clearEffects, EFFECT_TYPES,
} from '../StatusEffects.js';

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
    this.selectedAlly = null;       // LMB target selection
    this.selectionRing = null;      // visual ring on selected ally

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
    this.player.setDepth(10);
    this.player.body.setCircle(12, 12, 20);
    if (this.anims.exists(startKey)) this.player.play(startKey);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Groups
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.allies = this.physics.add.group();
    this.bossGroup = this.physics.add.group();

    // ── Phase 2: Unit colliders ──
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.allies, this.allies);
    this.physics.add.collider(this.enemies, this.allies);
    // Player passes through units — no player-vs-unit collider

    // Projectile overlaps
    this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHit, null, this);
    this.physics.add.overlap(this.projectiles, this.bossGroup, this.projectileHitBoss, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.enemyProjHitPlayer, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.allies, this.enemyProjHitAlly, null, this);
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

    // LMB = target select / attack, RMB = parry
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.doParry();
      } else {
        this.handleLMB(pointer);
      }
    });
    this.input.mouse.disableContextMenu();
    this.spaceKey.on('down', () => this.doDash());
    this.cKey.on('down', () => this.events.emit('togglePanel'));
    this.skillKeys.forEach((key, i) => { key.on('down', () => this.useSkill(i)); });

    // Spawn
    this.spawnWave(6);
    this.spawnAllies();
    this.time.addEvent({ delay: 10000, callback: () => this.spawnWave(4), loop: true });
    this.time.addEvent({ delay: 100, callback: () => this.updateEnemyAI(), loop: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE LOOP
  // ══════════════════════════════════════════════════════════════════════════
  update(time, delta) {
    if (this.hp <= 0) return;
    if (this.isDashing) return;

    // Mouse-aimed facing
    const pointer = this.input.activePointer;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = wp.x - this.player.x;
    const dy = wp.y - this.player.y;
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? DIR.right : DIR.left;
    else this.facing = dy > 0 ? DIR.down : DIR.up;

    // WASD movement
    const speed = this.heroCfg.speed * getSpeedMult(this.player);
    let vx = 0, vy = 0;
    if (this.wasd.A.isDown) vx = -speed;
    else if (this.wasd.D.isDown) vx = speed;
    if (this.wasd.W.isDown) vy = -speed;
    else if (this.wasd.S.isDown) vy = speed;

    if (this.isAttacking || isImmobilized(this.player)) {
      this.player.setVelocity(0, 0);
    } else {
      this.player.setVelocity(vx, vy);
      if (vx !== 0 && vy !== 0) this.player.setVelocity(vx * 0.707, vy * 0.707);
    }

    // Player animation
    if (!this.isAttacking) {
      const moving = vx !== 0 || vy !== 0;
      const moveAnim = this.heroCfg.anims.run ? 'run' : 'walk';
      const anim = moving ? moveAnim : 'idle';
      const animKey = heroKey(this.heroId, anim, this.facing);
      if (this.player.anims.currentAnim?.key !== animKey && this.anims.exists(animKey)) {
        this.player.play(animKey);
      }
    }

    if (this.dashCooldown > 0) this.dashCooldown -= delta;

    // ── Tick status effects on all units ──
    this.tickUnitEffects(this.player, delta, true);
    this.enemies.children.each(e => { if (e.active && !e.getData('dead')) this.tickUnitEffects(e, delta, false); });
    this.allies.children.each(a => { if (a.active) this.tickUnitEffects(a, delta, false); });

    // Enemy melee contact damage
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 40 && !enemy.getData('meleeCd')) {
        enemy.setData('meleeCd', true);
        this.time.delayedCall(1500, () => { if (enemy.active) enemy.setData('meleeCd', false); });
        this.playerTakeDamage(12);
      }
    });

    // Boss melee contact
    this.bossGroup.children.each(boss => {
      if (!boss.active || boss.getData('dead')) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
      if (dist < 80 && !boss.getData('meleeCd')) {
        boss.setData('meleeCd', true);
        this.time.delayedCall(2000, () => { if (boss.active) boss.setData('meleeCd', false); });
        this.playerTakeDamage(BOSSES[boss.getData('bossId')]?.damage || 30);
      }
    });

    // Selection ring follows ally
    if (this.selectedAlly && this.selectedAlly.active && this.selectionRing) {
      this.selectionRing.clear();
      this.selectionRing.lineStyle(2, 0x44ff44, 0.7);
      this.selectionRing.strokeCircle(this.selectedAlly.x, this.selectedAlly.y, 22);
    } else if (this.selectionRing && (!this.selectedAlly || !this.selectedAlly.active)) {
      this.selectionRing.clear();
      this.selectedAlly = null;
    }

    this.updateAllyAI(delta);
  }

  /** Tick status effects on a unit, apply damage/heal */
  tickUnitEffects(sprite, delta, isPlayer) {
    const events = tickEffects(sprite, delta, this);
    for (const ev of events) {
      if (ev.damage > 0) {
        // DoT damage
        if (isPlayer) {
          this.hp -= ev.damage;
          this.events.emit('hp', this.hp, this.maxHp);
          this.showDamage(sprite.x, sprite.y - 30, ev.damage, EFFECT_TYPES[ev.type]?.color ? `#${EFFECT_TYPES[ev.type].color.toString(16).padStart(6, '0')}` : '#ff4444');
        } else {
          let hp = sprite.getData('hp') - ev.damage;
          sprite.setData('hp', hp);
          const color = EFFECT_TYPES[ev.type]?.color;
          this.showDamage(sprite.x, sprite.y - 20, ev.damage, color ? `#${color.toString(16).padStart(6, '0')}` : '#ffcc00');
          if (hp <= 0 && !sprite.getData('dead')) {
            this.killUnit(sprite);
          }
        }
      } else if (ev.damage < 0) {
        // HoT heal
        const heal = Math.abs(ev.damage);
        if (isPlayer) {
          this.hp = Math.min(this.maxHp, this.hp + heal);
          this.events.emit('hp', this.hp, this.maxHp);
        } else {
          let hp = Math.min(sprite.getData('maxHp') || 999, (sprite.getData('hp') || 0) + heal);
          sprite.setData('hp', hp);
        }
        this.showDamage(sprite.x, sprite.y - 20, `+${heal}`, '#44ff44');
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLING
  // ══════════════════════════════════════════════════════════════════════════
  handleLMB(pointer) {
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Check if clicked on an ally — target selection
    let clickedAlly = null;
    this.allies.children.each(ally => {
      if (!ally.active) return;
      const dist = Phaser.Math.Distance.Between(wp.x, wp.y, ally.x, ally.y);
      if (dist < 30) clickedAlly = ally;
    });

    if (clickedAlly) {
      this.selectedAlly = clickedAlly;
      if (!this.selectionRing) {
        this.selectionRing = this.add.graphics().setDepth(20);
      }
      this.events.emit('allySelected', clickedAlly.getData('charKey'));
      return;
    }

    // Deselect if clicking far from any ally
    if (this.selectedAlly) {
      const distToSel = Phaser.Math.Distance.Between(wp.x, wp.y, this.selectedAlly.x, this.selectedAlly.y);
      if (distToSel > 60) {
        this.selectedAlly = null;
        if (this.selectionRing) this.selectionRing.clear();
        this.events.emit('allySelected', null);
      }
    }

    this.doAttack();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DUNGEON
  // ══════════════════════════════════════════════════════════════════════════
  drawDungeon() {
    const g = this.add.graphics();
    g.fillStyle(0x1a1018, 1);
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    this.rooms = [];
    for (let i = 0; i < 12; i++) {
      const rw = Phaser.Math.Between(200, 500);
      const rh = Phaser.Math.Between(200, 500);
      const rx = Phaser.Math.Between(50, WORLD.w - rw - 50);
      const ry = Phaser.Math.Between(50, WORLD.h - rh - 50);
      this.rooms.push({ x: rx, y: ry, w: rw, h: rh });
      g.fillStyle(0x2a1a28, 1); g.fillRect(rx, ry, rw, rh);
      g.lineStyle(3, 0x443344, 0.8); g.strokeRect(rx, ry, rw, rh);
      for (let c = 0; c < Phaser.Math.Between(2, 5); c++) {
        g.fillStyle(0x661100, 0.3);
        g.fillCircle(rx + Phaser.Math.Between(20, rw - 20), ry + Phaser.Math.Between(20, rh - 20), Phaser.Math.Between(5, 15));
      }
    }
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const a = this.rooms[i], b = this.rooms[i + 1];
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
      g.fillStyle(0x221622, 1);
      g.fillRect(Math.min(ax, bx), ay - 20, Math.abs(bx - ax), 40);
      g.fillRect(bx - 20, Math.min(ay, by), 40, Math.abs(by - ay));
    }
    g.lineStyle(1, 0x221122, 0.15);
    for (let x = 0; x < WORLD.w; x += 48) { g.moveTo(x, 0); g.lineTo(x, WORLD.h); }
    for (let y = 0; y < WORLD.h; y += 48) { g.moveTo(0, y); g.lineTo(WORLD.w, y); }
    g.strokePath();
    for (const room of this.rooms) {
      for (const tp of [{ x: room.x + 10, y: room.y + 10 }, { x: room.x + room.w - 10, y: room.y + 10 }, { x: room.x + 10, y: room.y + room.h - 10 }, { x: room.x + room.w - 10, y: room.y + room.h - 10 }]) {
        const glow = this.add.graphics();
        glow.fillStyle(0xff6600, 0.08); glow.fillCircle(tp.x, tp.y, 40);
        glow.fillStyle(0xff4400, 0.15); glow.fillCircle(tp.x, tp.y, 12);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SPAWNING
  // ══════════════════════════════════════════════════════════════════════════
  spawnUnit(charKey, x, y, group, tint) {
    const cfg = HEROES[charKey];
    const idleKey = heroKey(charKey, 'idle', DIR.down);
    const unit = this.physics.add.sprite(x, y, this.textures.exists(idleKey) ? idleKey : '__DEFAULT');
    unit.setScale(cfg.isGolem ? 2.0 : 2.5);
    unit.body.setCircle(12, 12, 20);  // Phase 2: circular collider
    unit.setData('charKey', charKey);
    unit.setData('hp', Math.floor(cfg.hp * (group === this.enemies ? 0.6 : 1)));
    unit.setData('maxHp', Math.floor(cfg.hp * (group === this.enemies ? 0.6 : 1)));
    unit.setData('facing', DIR.down);
    unit.setData('dead', false);
    unit.setData('attackCd', 0);
    unit.setData('effects', []);
    unit.setData('origTint', tint);
    if (tint) unit.setTint(tint);
    unit.setDepth(group === this.allies ? 9 : 8);
    if (this.anims.exists(idleKey)) unit.play(idleKey);
    group.add(unit);
    return unit;
  }

  spawnWave(count) {
    for (let i = 0; i < count; i++) {
      const room = Phaser.Utils.Array.GetRandom(this.rooms || [{ x: 200, y: 200, w: 400, h: 400 }]);
      const x = room.x + Phaser.Math.Between(30, room.w - 30);
      const y = room.y + Phaser.Math.Between(30, room.h - 30);
      const otherHeroes = Object.keys(HEROES).filter(k => k !== this.heroId);
      this.spawnUnit(Phaser.Utils.Array.GetRandom(otherHeroes), x, y, this.enemies, 0xff8888);
    }
    if (this.kills >= COMBAT.bossSpawnKills && !this.bossActive) this.spawnBoss();
  }

  spawnAllies() {
    const others = Object.keys(HEROES).filter(k => k !== this.heroId);
    for (let i = 0; i < Math.min(3, others.length); i++) {
      this.spawnUnit(others[i], WORLD.w / 2 + (i - 1) * 80, WORLD.h / 2 + 60, this.allies, 0x88ff88);
    }
  }

  spawnBoss() {
    const bossId = Phaser.Utils.Array.GetRandom(Object.keys(BOSSES));
    const bossCfg = BOSSES[bossId];
    this.bossActive = bossId;
    const room = this.rooms?.[this.rooms.length - 1] || { x: WORLD.w / 2, y: WORLD.h / 2, w: 400, h: 400 };
    const idleKey = bossKey(bossId, 'idle', 'front');
    const boss = this.physics.add.sprite(room.x + room.w / 2, room.y + room.h / 2, this.textures.exists(idleKey) ? idleKey : '__DEFAULT');
    boss.setScale(0.4); boss.body.setCircle(50, 190, 190); boss.setDepth(5);
    boss.setData('bossId', bossId); boss.setData('hp', bossCfg.hp); boss.setData('maxHp', bossCfg.hp);
    boss.setData('facing', 'front'); boss.setData('dead', false); boss.setData('attackCd', 0);
    boss.setData('effects', []);
    if (this.anims.exists(idleKey)) boss.play(idleKey);
    this.bossGroup.add(boss);
    this.events.emit('bossSpawn', bossId, bossCfg);
    this.time.addEvent({ delay: 150, callback: () => this.updateBossAI(boss, bossId), loop: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMBAT — PLAYER ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  doAttack() {
    if (this.isAttacking || this.hp <= 0 || this.isDashing) return;
    this.isAttacking = true;

    const atkAnim = getAttackAnimKey(this.heroId);
    const animKey = heroKey(this.heroId, atkAnim, this.facing);
    if (this.anims.exists(animKey)) this.player.play(animKey);
    this.player.setVelocity(0, 0);

    // Casting VFX — glow ring at feet
    this.showCastingVFX(this.player.x, this.player.y, this.heroCfg.color);

    const wp = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
    this.spawnAttackEffect(wp.x, wp.y);

    this.mp = Math.min(this.maxMp, this.mp + COMBAT.resourcePerHit);
    this.events.emit('mp', this.mp, this.maxMp);

    this.player.once('animationcomplete', () => { this.isAttacking = false; });
    this.time.delayedCall(600, () => { this.isAttacking = false; });
  }

  doParry() {
    if (this.isParrying || this.hp <= 0) return;
    this.isParrying = true;

    // Play hurt anim briefly as block pose
    const hurtKey = heroKey(this.heroId, 'hurt', this.facing);
    if (this.anims.exists(hurtKey)) this.player.play(hurtKey);

    const shield = this.add.graphics().setDepth(20);
    const draw = () => {
      shield.clear();
      shield.lineStyle(3, 0x4488ff, 0.6); shield.strokeCircle(this.player.x, this.player.y, 34);
      shield.lineStyle(1, 0x88bbff, 0.3); shield.strokeCircle(this.player.x, this.player.y, 38);
    };
    draw();
    const timer = this.time.addEvent({ delay: 16, callback: draw, loop: true });
    this.time.delayedCall(COMBAT.parryWindow, () => {
      this.isParrying = false; timer.destroy(); shield.destroy();
    });
  }

  doDash() {
    if (this.isDashing || this.dashCooldown > 0 || this.hp <= 0) return;
    this.isDashing = true;
    this.dashCooldown = COMBAT.dashCooldown;
    const d = { [DIR.down]: { x: 0, y: 1 }, [DIR.up]: { x: 0, y: -1 }, [DIR.left]: { x: -1, y: 0 }, [DIR.right]: { x: 1, y: 0 } }[this.facing];

    // Play jump anim if available
    const jumpKey = heroKey(this.heroId, 'jump', this.facing);
    if (this.anims.exists(jumpKey)) this.player.play(jumpKey);

    this.player.setAlpha(0.5);
    this.tweens.add({
      targets: this.player, x: this.player.x + d.x * COMBAT.dashDistance, y: this.player.y + d.y * COMBAT.dashDistance,
      duration: COMBAT.dashDuration, ease: 'Cubic.easeOut',
      onComplete: () => { this.isDashing = false; this.player.setAlpha(1); },
    });
  }

  useSkill(index) {
    const skills = SKILLS[this.heroId];
    if (!skills?.[index]) return;
    const skill = skills[index];
    if (this.mp < skill.cost) return;
    this.mp -= skill.cost;
    this.events.emit('mp', this.mp, this.maxMp);

    // Phase 5: dual-purpose — if ally selected and skill is dual, apply ally effect
    if (skill.dual && this.selectedAlly?.active) {
      if (skill.allyEffect) applyEffect(this.selectedAlly, skill.allyEffect, 'player');
      if (skill.allyHeal) {
        let hp = Math.min(this.selectedAlly.getData('maxHp'), this.selectedAlly.getData('hp') + skill.allyHeal);
        this.selectedAlly.setData('hp', hp);
        this.showDamage(this.selectedAlly.x, this.selectedAlly.y - 20, `+${skill.allyHeal}`, '#44ff44');
      }
      this.showCastingVFX(this.selectedAlly.x, this.selectedAlly.y, 0x44ff44);
      this.events.emit('skillUsed', index);
      this.events.emit('allyHp', this.selectedAlly.getData('charKey'), this.selectedAlly.getData('hp'), this.selectedAlly.getData('maxHp'));
      return;
    }

    const wp = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);

    if (skill.type === 'projectile') {
      this.spawnProjectile(wp.x, wp.y, skill.damage, this.heroCfg.color, 400, skill.enemyEffect);
    } else if (skill.type === 'aoe') {
      this.spawnAoE(wp.x, wp.y, skill.damage, 100, skill.enemyEffect);
    } else if (skill.type === 'dash') {
      this.doDash();
    } else if (skill.type === 'melee') {
      this.spawnMeleeHit(skill.damage, skill.enemyEffect);
    }

    this.events.emit('skillUsed', index);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECTILES & VFX
  // ══════════════════════════════════════════════════════════════════════════
  getProjAnim(charKey) {
    if (charKey === 'sorceress') return 'anim_fireball';
    if (charKey === 'skeletonhunter') return 'anim_fire_arrow';
    if (charKey === 'golem') return 'anim_wind_ball';
    return 'anim_fireball';
  }

  getProjTex(charKey) {
    if (charKey === 'sorceress' && this.textures.exists('fireball_1')) return 'fireball_1';
    if (charKey === 'skeletonhunter' && this.textures.exists('fire_arrow_1')) return 'fire_arrow_1';
    if (charKey === 'golem' && this.textures.exists('wind_ball_1')) return 'wind_ball_1';
    return this.textures.exists('fireball_1') ? 'fireball_1' : null;
  }

  ensureCircleTex() {
    if (!this.textures.exists('proj_circle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6);
      g.generateTexture('proj_circle', 12, 12); g.destroy();
    }
  }

  spawnAttackEffect(tx, ty) {
    const cfg = this.heroCfg;
    if (cfg.attackType === 'projectile') this.spawnProjectile(tx, ty, COMBAT.baseLMBDamage, cfg.color, cfg.projSpeed || 350);
    else if (cfg.attackType === 'melee') this.spawnMeleeHit(COMBAT.baseLMBDamage);
    else if (cfg.attackType === 'aoe') this.spawnAoE(this.player.x, this.player.y, COMBAT.baseLMBDamage, cfg.aoeRadius || 80);
  }

  spawnProjectile(tx, ty, damage, color, speed, statusEffect) {
    const dx = tx - this.player.x, dy = ty - this.player.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    const angle = Math.atan2(dy, dx);
    const tex = this.getProjTex(this.heroId);
    const anim = this.getProjAnim(this.heroId);
    let proj;
    if (tex) {
      proj = this.physics.add.sprite(this.player.x + nx * 24, this.player.y + ny * 24, tex);
      proj.setScale(0.5); proj.setRotation(angle);
      if (this.anims.exists(anim)) proj.play(anim);
    } else {
      this.ensureCircleTex();
      proj = this.physics.add.sprite(this.player.x + nx * 24, this.player.y + ny * 24, 'proj_circle');
      proj.setScale(1.5); proj.setTint(color);
    }
    proj.setVelocity(nx * speed, ny * speed);
    proj.setData('damage', damage); proj.setData('owner', 'player');
    proj.setData('statusEffect', statusEffect || null);
    proj.setDepth(15);
    this.projectiles.add(proj);
    this.time.delayedCall(2000, () => { if (proj.active) proj.destroy(); });
  }

  spawnProjectileFrom(fx, fy, tx, ty, damage, anim, tex, group, tint, statusEffect) {
    const dx = tx - fx, dy = ty - fy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len, angle = Math.atan2(dy, dx), speed = 220;
    let proj;
    if (tex && this.textures.exists(tex)) {
      proj = this.physics.add.sprite(fx + nx * 16, fy + ny * 16, tex);
      proj.setScale(0.4); proj.setRotation(angle);
      if (anim && this.anims.exists(anim)) proj.play(anim);
      if (tint) proj.setTint(tint);
    } else {
      this.ensureCircleTex();
      proj = this.physics.add.sprite(fx + nx * 16, fy + ny * 16, 'proj_circle');
      proj.setTint(tint || 0xff4444);
    }
    proj.setVelocity(nx * speed, ny * speed);
    proj.setData('damage', damage); proj.setData('statusEffect', statusEffect || null);
    proj.setDepth(14); group.add(proj);
    this.time.delayedCall(2500, () => { if (proj.active) proj.destroy(); });
  }

  spawnMeleeHit(damage, statusEffect) {
    const d = { [DIR.down]: { x: 0, y: 1 }, [DIR.up]: { x: 0, y: -1 }, [DIR.left]: { x: -1, y: 0 }, [DIR.right]: { x: 1, y: 0 } }[this.facing];
    const range = this.heroCfg.meleeRange || 60;
    const hx = this.player.x + d.x * range, hy = this.player.y + d.y * range;
    this.showSlashEffect(hx, hy);
    this.enemies.children.each(e => {
      if (!e.active || e.getData('dead')) return;
      if (Phaser.Math.Distance.Between(hx, hy, e.x, e.y) < range + 20) this.damageEnemy(e, damage, statusEffect);
    });
    this.bossGroup.children.each(b => {
      if (!b.active || b.getData('dead')) return;
      if (Phaser.Math.Distance.Between(hx, hy, b.x, b.y) < range + 60) this.damageBoss(b, damage);
    });
  }

  spawnAoE(cx, cy, damage, radius, statusEffect) {
    if (this.anims.exists('anim_meteor') && this.textures.exists('meteor_1')) {
      const fx = this.add.sprite(cx, cy, 'meteor_1'); fx.setScale(0.5); fx.setDepth(12);
      fx.play('anim_meteor'); fx.once('animationcomplete', () => fx.destroy());
    } else if (this.textures.exists('fx_destroy')) {
      const fx = this.add.sprite(cx, cy, 'fx_destroy'); fx.setScale(3); fx.setDepth(12);
      if (this.anims.exists('fx_destroy')) { fx.play('fx_destroy'); fx.once('animationcomplete', () => fx.destroy()); }
      else this.time.delayedCall(400, () => fx.destroy());
    }
    this.cameras.main.shake(150, 0.015);  // Phase 4: AoE shake
    this.enemies.children.each(e => {
      if (!e.active || e.getData('dead')) return;
      if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) < radius) this.damageEnemy(e, damage, statusEffect);
    });
    this.bossGroup.children.each(b => {
      if (!b.active || b.getData('dead')) return;
      if (Phaser.Math.Distance.Between(cx, cy, b.x, b.y) < radius + 40) this.damageBoss(b, damage);
    });
  }

  showSlashEffect(x, y) {
    if (this.anims.exists('anim_slash') && this.textures.exists('slash_1')) {
      const s = this.add.sprite(x, y, 'slash_1'); s.setScale(1.5); s.setDepth(12);
      s.play('anim_slash'); s.once('animationcomplete', () => s.destroy());
    } else {
      const g = this.add.graphics(); g.fillStyle(this.heroCfg.color, 0.6); g.fillCircle(x, y, 15); g.setDepth(12);
      this.tweens.add({ targets: g, alpha: 0, scale: 3, duration: 250, onComplete: () => g.destroy() });
    }
  }

  showImpact(x, y, type = 'fire') {
    const ak = type === 'ground' ? 'anim_ground_hit' : 'anim_fire_explosion';
    const tk = type === 'ground' ? 'ground_hit_1' : 'fire_explosion_1';
    if (this.anims.exists(ak) && this.textures.exists(tk)) {
      const fx = this.add.sprite(x, y, tk); fx.setScale(type === 'ground' ? 0.6 : 0.4); fx.setDepth(13);
      fx.play(ak); fx.once('animationcomplete', () => fx.destroy());
    }
  }

  showCastingVFX(x, y, color) {
    const g = this.add.graphics().setDepth(11);
    g.lineStyle(2, color, 0.5); g.strokeCircle(x, y + 10, 20);
    this.tweens.add({ targets: g, alpha: 0, scale: 1.5, duration: 400, onComplete: () => g.destroy() });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DAMAGE — Phase 4: crits, camera shake, color-coded numbers
  // ══════════════════════════════════════════════════════════════════════════
  rollCrit(baseDmg) {
    if (Math.random() < COMBAT.critChance) return { dmg: Math.floor(baseDmg * COMBAT.critMult), crit: true };
    return { dmg: baseDmg, crit: false };
  }

  damageEnemy(enemy, baseDmg, statusEffect) {
    if (enemy.getData('dead')) return;
    const { dmg, crit } = this.rollCrit(baseDmg);
    const reduction = getDamageReduction(enemy);
    const finalDmg = Math.floor(dmg * (1 - reduction));
    let hp = enemy.getData('hp') - finalDmg;
    enemy.setData('hp', hp);
    this.showDamage(enemy.x, enemy.y - 20, crit ? `${finalDmg}!` : finalDmg, crit ? '#ffaa00' : '#ffcc00', crit);
    if (crit) this.cameras.main.flash(80, 255, 200, 0, true);

    if (statusEffect) applyEffect(enemy, statusEffect, 'player');

    const eId = enemy.getData('charKey'), eFacing = enemy.getData('facing') || DIR.down;
    if (hp <= 0) {
      this.killUnit(enemy);
    } else {
      // Play hurt animation
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

  killUnit(unit) {
    if (unit.getData('dead')) return;
    unit.setData('dead', true);
    unit.setVelocity(0, 0);
    clearEffects(unit);
    const charKey = unit.getData('charKey');
    const facing = unit.getData('facing') || DIR.down;
    const deathKey = heroKey(charKey, 'death', facing);
    if (this.anims.exists(deathKey)) {
      unit.play(deathKey);
      unit.once('animationcomplete', () => {
        if (this.enemies.contains(unit)) { this.dropPickup(unit.x, unit.y); this.kills++; this.events.emit('kill', this.kills); }
        unit.destroy();
        if (this.kills >= COMBAT.bossSpawnKills && !this.bossActive) this.spawnBoss();
      });
    } else {
      if (this.enemies.contains(unit)) { this.dropPickup(unit.x, unit.y); this.kills++; this.events.emit('kill', this.kills); }
      unit.destroy();
    }
  }

  damageBoss(boss, baseDmg) {
    if (boss.getData('dead')) return;
    const { dmg, crit } = this.rollCrit(baseDmg);
    let hp = boss.getData('hp') - dmg;
    boss.setData('hp', hp);
    this.showDamage(boss.x, boss.y - 60, crit ? `${dmg}!` : dmg, crit ? '#ffaa00' : '#ff8800', crit);
    this.events.emit('bossHp', hp, boss.getData('maxHp'));
    if (crit) this.cameras.main.flash(80, 255, 200, 0, true);

    const bossId = boss.getData('bossId'), facing = boss.getData('facing') || 'front';
    if (hp <= 0) {
      boss.setData('dead', true); boss.setVelocity(0, 0);
      this.cameras.main.shake(300, 0.03);  // big death shake
      const dyingKey = bossKey(bossId, 'dying', facing);
      if (this.anims.exists(dyingKey)) {
        boss.play(dyingKey);
        boss.once('animationcomplete', () => {
          for (let i = 0; i < 5; i++) this.dropPickup(boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-50, 50));
          boss.destroy();
        });
      } else boss.destroy();
      this.bossActive = null; this.events.emit('bossDead'); this.kills += 5; this.events.emit('kill', this.kills);
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
    const eff = proj.getData('statusEffect');
    this.showImpact(proj.x, proj.y, 'fire');
    proj.destroy();
    this.damageEnemy(enemy, dmg, eff);
  }

  projectileHitBoss(proj, boss) {
    if (boss.getData('dead')) return;
    this.showImpact(proj.x, proj.y, 'fire');
    proj.destroy();
    this.damageBoss(boss, proj.getData('damage') || COMBAT.baseLMBDamage);
  }

  enemyProjHitPlayer(player, proj) {
    this.showImpact(proj.x, proj.y, 'fire');
    const eff = proj.getData('statusEffect');
    if (eff) applyEffect(this.player, eff, 'enemy');
    proj.destroy();
    this.playerTakeDamage(proj.getData('damage') || 8);
  }

  enemyProjHitAlly(ally, proj) {
    if (!ally.active) return;
    this.showImpact(proj.x, proj.y, 'fire');
    proj.destroy();
    let hp = ally.getData('hp') - (proj.getData('damage') || 8);
    ally.setData('hp', hp);
    this.showDamage(ally.x, ally.y - 20, proj.getData('damage') || 8, '#ff8888');
    this.events.emit('allyHp', ally.getData('charKey'), hp, ally.getData('maxHp'));
    if (hp <= 0) this.killUnit(ally);
  }

  playerTakeDamage(baseDmg) {
    let dmg = baseDmg;
    if (this.isParrying) {
      dmg = Math.floor(dmg * (1 - COMBAT.parryReduction));
      this.showDamage(this.player.x, this.player.y - 40, `${dmg} (blocked)`, '#4488ff');
    } else {
      const reduction = getDamageReduction(this.player);
      dmg = Math.floor(dmg * (1 - reduction));
    }
    this.hp -= dmg;
    if (!this.isParrying) this.showDamage(this.player.x, this.player.y - 40, dmg, '#ff4444');
    this.events.emit('hp', this.hp, this.maxHp);

    // Scaled camera shake
    this.cameras.main.shake(80 + dmg * 3, Math.min(0.04, 0.005 * dmg / this.maxHp * 10));

    if (this.hp <= 0) {
      const deathKey = heroKey(this.heroId, 'death', this.facing);
      if (this.anims.exists(deathKey)) this.player.play(deathKey);
      this.player.setVelocity(0, 0);
      this.cameras.main.shake(400, 0.04);
      this.player.once('animationcomplete', () => { this.time.delayedCall(1000, () => { this.scene.stop('Hud'); this.scene.start('Select'); }); });
      this.time.delayedCall(2500, () => { this.scene.stop('Hud'); this.scene.start('Select'); });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PICKUPS
  // ══════════════════════════════════════════════════════════════════════════
  dropPickup(x, y) {
    if (Math.random() > 0.5) return;
    const types = ['pickup_health', 'pickup_mana', 'pickup_gem_blue', 'pickup_gem_orange', 'pickup_gold'];
    const key = Phaser.Utils.Array.GetRandom(types);
    if (!this.textures.exists(key)) return;
    const p = this.physics.add.sprite(x, y, key); p.setScale(2); p.setDepth(3); p.setData('type', key);
    this.pickups.add(p);
    this.tweens.add({ targets: p, y: y - 15, duration: 300, ease: 'Bounce.easeOut', yoyo: true });
  }

  collectPickup(player, pickup) {
    const type = pickup.getData('type'); pickup.destroy();
    if (type === 'pickup_health') { this.hp = Math.min(this.maxHp, this.hp + 25); this.events.emit('hp', this.hp, this.maxHp); this.showDamage(this.player.x, this.player.y - 30, '+25', '#44ff44'); }
    else if (type === 'pickup_mana') { this.mp = Math.min(this.maxMp, this.mp + 25); this.events.emit('mp', this.mp, this.maxMp); this.showDamage(this.player.x, this.player.y - 30, '+25', '#4488ff'); }
    else if (type?.startsWith('pickup_gem')) this.showDamage(this.player.x, this.player.y - 30, '+XP', '#ffaa00');
    else if (type === 'pickup_gold') this.showDamage(this.player.x, this.player.y - 30, '+Gold', '#ffdd00');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AI — enemies with full animation state machine
  // ══════════════════════════════════════════════════════════════════════════
  updateEnemyAI() {
    this.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('dead')) return;
      if (isImmobilized(enemy)) { enemy.setVelocity(0, 0); return; }

      // Find nearest target
      let tx = this.player.x, ty = this.player.y;
      let td = Phaser.Math.Distance.Between(enemy.x, enemy.y, tx, ty);
      this.allies.children.each(a => {
        if (!a.active) return;
        const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, a.x, a.y);
        if (d < td) { tx = a.x; ty = a.y; td = d; }
      });

      const dx = tx - enemy.x, dy = ty - enemy.y;
      const eId = enemy.getData('charKey');
      const cfg = HEROES[eId];

      if (td > 500) {
        enemy.setVelocity(0, 0);
        this.playUnitAnim(enemy, eId, 'idle');
        return;
      }

      // Update facing
      let eFacing = DIR.down;
      if (Math.abs(dx) > Math.abs(dy)) eFacing = dx > 0 ? DIR.right : DIR.left;
      else eFacing = dy > 0 ? DIR.down : DIR.up;
      enemy.setData('facing', eFacing);

      // Ranged attack
      const cd = enemy.getData('attackCd') || 0;
      if (td < COMBAT.enemyAttackRange && td > COMBAT.enemyMeleeRange && cd <= 0) {
        enemy.setData('attackCd', COMBAT.enemyAttackCdMin + Math.random() * (COMBAT.enemyAttackCdMax - COMBAT.enemyAttackCdMin));
        // Play attack anim
        const atkKey = heroKey(eId, getAttackAnimKey(eId), eFacing);
        if (this.anims.exists(atkKey)) {
          enemy.play(atkKey);
          enemy.once('animationcomplete', () => this.playUnitAnim(enemy, eId, 'idle'));
        }
        this.spawnProjectileFrom(enemy.x, enemy.y, tx, ty, 8, 'anim_lightning_arrow', 'lightning_arrow_1', this.enemyProjectiles, 0xff6666);
      } else if (cd > 0) {
        enemy.setData('attackCd', cd - 100);
      }

      // Movement — slow when shooting
      const spd = (td > 200 ? 55 + Math.random() * 15 : 25) * getSpeedMult(enemy);
      enemy.setVelocity((dx / td) * spd, (dy / td) * spd);

      // Walk/run animation (don't interrupt attack)
      if (!enemy.anims.currentAnim?.key?.includes('attack') && !enemy.anims.currentAnim?.key?.includes('hurt')) {
        const moveAnim = cfg.anims.run ? 'run' : 'walk';
        this.playUnitAnim(enemy, eId, moveAnim);
      }
    });
  }

  updateBossAI(boss, bossId) {
    if (!boss.active || boss.getData('dead')) return;
    const dx = this.player.x - boss.x, dy = this.player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bossCfg = BOSSES[bossId];
    let facing = 'front';
    if (Math.abs(dx) > Math.abs(dy)) facing = dx > 0 ? 'right' : 'left';
    else facing = dy > 0 ? 'front' : 'back';
    boss.setData('facing', facing);

    // Boss ranged attack
    const cd = boss.getData('attackCd') || 0;
    if (dist < 350 && dist > 100 && cd <= 0) {
      boss.setData('attackCd', 2500);
      this.spawnProjectileFrom(boss.x, boss.y, this.player.x, this.player.y, bossCfg.damage, 'anim_wind_ball', 'wind_ball_1', this.enemyProjectiles, bossCfg.color);
    } else if (cd > 0) boss.setData('attackCd', cd - 150);

    if (dist > 80) {
      boss.setVelocity((dx / dist) * bossCfg.speed, (dy / dist) * bossCfg.speed);
      const wk = bossKey(bossId, 'walking', facing);
      if (this.anims.exists(wk) && boss.anims.currentAnim?.key !== wk) boss.play(wk);
    } else {
      boss.setVelocity(0, 0);
      const ak = bossKey(bossId, 'attacking', facing);
      if (this.anims.exists(ak) && boss.anims.currentAnim?.key !== ak) boss.play(ak);
    }
  }

  updateAllyAI(delta) {
    this.allies.children.each(ally => {
      if (!ally.active) return;
      if (isImmobilized(ally)) { ally.setVelocity(0, 0); return; }

      const charKey = ally.getData('charKey');
      const cfg = HEROES[charKey];
      const dx = this.player.x - ally.x, dy = this.player.y - ally.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > COMBAT.allyFollowDist) {
        const spd = 90 * getSpeedMult(ally);
        ally.setVelocity((dx / dist) * spd, (dy / dist) * spd);
        let facing = DIR.down;
        if (Math.abs(dx) > Math.abs(dy)) facing = dx > 0 ? DIR.right : DIR.left;
        else facing = dy > 0 ? DIR.down : DIR.up;
        ally.setData('facing', facing);
        const moveAnim = cfg.anims.run ? 'run' : 'walk';
        this.playUnitAnim(ally, charKey, moveAnim);
      } else {
        ally.setVelocity(0, 0);
        const facing = ally.getData('facing') || DIR.down;

        // Find & attack nearest enemy
        let nearest = null, nearDist = COMBAT.allyAttackRange;
        this.enemies.children.each(e => {
          if (!e.active || e.getData('dead')) return;
          const ed = Phaser.Math.Distance.Between(ally.x, ally.y, e.x, e.y);
          if (ed < nearDist) { nearDist = ed; nearest = e; }
        });

        const cd = ally.getData('attackCd') || 0;
        if (nearest && cd <= 0) {
          ally.setData('attackCd', COMBAT.allyAttackCd);
          // Attack animation
          const atkKey = heroKey(charKey, getAttackAnimKey(charKey), facing);
          if (this.anims.exists(atkKey)) {
            ally.play(atkKey);
            ally.once('animationcomplete', () => this.playUnitAnim(ally, charKey, 'idle'));
          }
          // Fire projectile or melee
          if (cfg.attackType === 'projectile') {
            this.spawnProjectileFrom(ally.x, ally.y, nearest.x, nearest.y, 15, this.getProjAnim(charKey), this.getProjTex(charKey), this.projectiles, null);
          } else if (cfg.attackType === 'melee') {
            this.damageEnemy(nearest, 20);
            this.showSlashEffect(nearest.x, nearest.y);
          } else {
            this.damageEnemy(nearest, 18);
            this.showImpact(nearest.x, nearest.y, 'ground');
          }
        } else {
          if (cd > 0) ally.setData('attackCd', cd - (delta || 16));
          if (!ally.anims.currentAnim?.key?.includes('attack')) {
            this.playUnitAnim(ally, charKey, 'idle');
          }
        }
      }
    });
  }

  /** Play an animation on a unit, checking key correctness for golem */
  playUnitAnim(unit, charKey, animType) {
    if (!unit.active) return;
    const facing = unit.getData('facing') || DIR.down;
    const key = heroKey(charKey, animType, facing);
    if (this.anims.exists(key) && unit.anims.currentAnim?.key !== key) unit.play(key);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  showDamage(x, y, amount, color = '#ffcc00', isCrit = false) {
    const txt = this.add.text(x, y, `${amount}`, {
      font: isCrit ? 'bold 20px monospace' : '14px monospace',
      fill: color, stroke: '#000', strokeThickness: isCrit ? 4 : 3,
    }).setOrigin(0.5).setDepth(30);
    if (isCrit) txt.setScale(1.3);
    this.tweens.add({
      targets: txt, y: y - (isCrit ? 45 : 30), alpha: 0, scale: isCrit ? 0.8 : 1,
      duration: isCrit ? 900 : 700, ease: 'Cubic.easeOut', onComplete: () => txt.destroy(),
    });
  }
}
