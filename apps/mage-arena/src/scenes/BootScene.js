import Phaser from 'phaser';
import {
  HEROES, ANIMS, ANIMS_GOLEM, FRAME, FRAME_GOLEM, FRAME_BOSS, CDN,
  heroSpriteUrl, golemSpriteUrl, bossSpriteUrl,
  heroKey, bossKey,
  DIRECTIONS, BOSSES, ANIMS_BOSS, BOSS_DIRS, DIR_IDX,
  UI_KEYS, uiUrl,
} from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.setCORS('anonymous');

    // Loading bar
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const bar = this.add.graphics();
    const box = this.add.graphics();
    box.fillStyle(0x1a1020, 0.9);
    box.fillRect(w / 4, h / 2 - 15, w / 2, 30);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0xaa44ff, 1);
      bar.fillRect(w / 4 + 4, h / 2 - 11, (w / 2 - 8) * v, 22);
    });

    const txt = this.add.text(w / 2, h / 2 - 40, 'Loading Mage Arena...', {
      font: '18px monospace', fill: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('complete', () => { bar.destroy(); box.destroy(); txt.destroy(); });

    // ── Load Foozle hero spritesheets (per direction per animation) ──
    for (const [charKey, cfg] of Object.entries(HEROES)) {
      if (cfg.isGolem) continue; // golem loaded separately
      const animKeys = Object.keys(cfg.anims);
      for (const anim of animKeys) {
        for (const dir of DIRECTIONS) {
          this.load.spritesheet(
            heroKey(charKey, anim, dir),
            heroSpriteUrl(charKey, dir, anim),
            { frameWidth: FRAME.w, frameHeight: FRAME.h }
          );
        }
      }
    }

    // ── Load Golem (4-row combined sheets, 64×64) ──
    const golemCfg = HEROES.golem;
    for (const anim of Object.keys(golemCfg.anims)) {
      this.load.spritesheet(
        `golem_${anim}`,
        golemSpriteUrl(anim),
        { frameWidth: FRAME_GOLEM.w, frameHeight: FRAME_GOLEM.h }
      );
    }

    // ── Load Boss spritesheets (480×480 per-dir) ──
    for (const [bossId, bossCfg] of Object.entries(BOSSES)) {
      for (const anim of Object.keys(bossCfg.anims)) {
        for (const dir of BOSS_DIRS) {
          this.load.spritesheet(
            bossKey(bossId, anim, dir),
            bossSpriteUrl(bossId, dir, anim),
            { frameWidth: FRAME_BOSS.w, frameHeight: FRAME_BOSS.h }
          );
        }
      }
    }

    // ── Load UI assets ──
    for (const [key] of Object.entries(UI_KEYS)) {
      this.load.image(`ui_${key}`, uiUrl(key));
    }

    // Character icons
    this.load.image('icon_sorceress', `${CDN}/sprites/foozle/ui/Character_Icons/Sroceress_Icon.png`);
    this.load.image('icon_warrior', `${CDN}/sprites/foozle/ui/Character_Icons/Warrior_Icon.png`);
    this.load.image('icon_necromancer', `${CDN}/sprites/foozle/ui/Character_Icons/Necromancer_Icon.png`);

    // Character action icons (for skill bar)
    this.load.image('action_sorceress_1', `${CDN}/sprites/foozle/ui/Character_Actions/Sorceress_Attack_1.png`);
    this.load.image('action_sorceress_2', `${CDN}/sprites/foozle/ui/Character_Actions/Sorceress_Attack_2.png`);
    this.load.image('action_warrior_1', `${CDN}/sprites/foozle/ui/Character_Actions/Warrior_Attack_1.png`);
    this.load.image('action_warrior_2', `${CDN}/sprites/foozle/ui/Character_Actions/Warrior_Attack_2.png`);

    // ── Load tileset ──
    this.load.image('tileset_lava', `${CDN}/sprites/foozle/tileset/LavaDungeonTileset.png`);
    this.load.image('tileset_mockup', `${CDN}/sprites/foozle/tileset/LavaMockup.png`);

    // ── Load effects (path fix: Effects/ subfolder) ──
    this.load.spritesheet('fx_wave_down', `${CDN}/sprites/foozle/effects/Effects/Wave/Big/Down/WaveBigDown.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_up', `${CDN}/sprites/foozle/effects/Effects/Wave/Big/Up/WaveBigUp.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_left', `${CDN}/sprites/foozle/effects/Effects/Wave/Big/Left/WaveBigLeft.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_right', `${CDN}/sprites/foozle/effects/Effects/Wave/Big/Right/WaveBigRight.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_small_down', `${CDN}/sprites/foozle/effects/Effects/Wave/Small/Down/WaveSmallDown.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_small_up', `${CDN}/sprites/foozle/effects/Effects/Wave/Small/Up/WaveSmallUp.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_small_left', `${CDN}/sprites/foozle/effects/Effects/Wave/Small/Left/WaveSmallLeft.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_wave_small_right', `${CDN}/sprites/foozle/effects/Effects/Wave/Small/Right/WaveSmallRIght.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_destroy', `${CDN}/sprites/foozle/effects/Effects/VFX/Destroy_Effect.png`, { frameWidth: 48, frameHeight: 48 });

    // Pickup effect sprites
    this.load.spritesheet('fx_health_pickup', `${CDN}/sprites/foozle/effects/Effects/Pickup_effects/Png/Health_Potion_Pickup_effect.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('fx_mana_pickup', `${CDN}/sprites/foozle/effects/Effects/Pickup_effects/Png/Mana_Potion_Pickup_effect.png`, { frameWidth: 48, frameHeight: 48 });

    // ── Load projectile sprites (individual frames from magic-fx packs) ──
    const MAGIC_FX = 'sprites/foozle/magic-fx';
    const FIRE_BASE = `${MAGIC_FX}/water-and-fire-magic-sprite-ve`;
    const WIND_BASE = `${MAGIC_FX}/down-wind-and-lightning-magic-`;
    const EARTH_BASE = `${MAGIC_FX}/and-earth-magic-sprites-for-to`;

    // Fireball (8 frames) — Sorceress primary
    for (let i = 1; i <= 8; i++) {
      this.load.image(`fireball_${i}`, `${CDN}/${FIRE_BASE}/Fire_Ball/PNG/Fire_Ball_Frame_0${i}.png`);
    }
    // Fire Arrow (8 frames) — Hunter primary
    for (let i = 1; i <= 8; i++) {
      this.load.image(`fire_arrow_${i}`, `${CDN}/${FIRE_BASE}/Fire_Arrow/PNG/Fire_Arrow_Frame_0${i}.png`);
    }
    // Wind Ball (8 frames) — enemy/golem projectile
    for (let i = 1; i <= 8; i++) {
      this.load.image(`wind_ball_${i}`, `${CDN}/${WIND_BASE}/Wind_Ball/PNG/Wind_Ball_Frame_0${i}.png`);
    }
    // Lightning Arrow (12 frames) — enemy ranged
    for (let i = 1; i <= 9; i++) {
      this.load.image(`lightning_arrow_${i}`, `${CDN}/${WIND_BASE}/Lightning_Arrow/PNG/Lightning_Arrow_Frame_0${i}.png`);
    }
    for (let i = 10; i <= 12; i++) {
      this.load.image(`lightning_arrow_${i}`, `${CDN}/${WIND_BASE}/Lightning_Arrow/PNG/Lightning_Arrow_Frame_${i}.png`);
    }
    // Fire Explosion (12 frames) — impact effect
    for (let i = 1; i <= 9; i++) {
      this.load.image(`fire_explosion_${i}`, `${CDN}/${EARTH_BASE}/Fire_Explosion/PNG/Fire_Explosion_Frame_0${i}.png`);
    }
    for (let i = 10; i <= 12; i++) {
      this.load.image(`fire_explosion_${i}`, `${CDN}/${EARTH_BASE}/Fire_Explosion/PNG/Fire_Explosion_Frame_${i}.png`);
    }
    // Ground Hit (8 frames) — melee impact
    for (let i = 1; i <= 8; i++) {
      this.load.image(`ground_hit_${i}`, `${CDN}/${EARTH_BASE}/Ground_Hit/PNG/Ground_Hit_Frame_0${i}.png`);
    }
    // Meteor (12 frames) — AoE impact
    for (let i = 1; i <= 9; i++) {
      this.load.image(`meteor_${i}`, `${CDN}/${EARTH_BASE}/Meteor/PNG/Meteor_Frame_0${i}.png`);
    }
    for (let i = 10; i <= 12; i++) {
      this.load.image(`meteor_${i}`, `${CDN}/${EARTH_BASE}/Meteor/PNG/Meteor_Frame_${i}.png`);
    }
    // Slash frames (from old effect pack) — melee VFX
    for (let i = 1; i <= 10; i++) {
      this.load.image(`slash_${i}`, `${CDN}/sprites/effects/slash/PNG/1/${i}.png`);
    }

    // ── Load pickups ──
    this.load.image('pickup_health', `${CDN}/sprites/foozle/pickups/Pickups/Potions/Health/Png/SmallHealthPotion.png`);
    this.load.image('pickup_mana', `${CDN}/sprites/foozle/pickups/Pickups/Potions/Mana/Png/SmallManaPotion.png`);
    this.load.image('pickup_gem_blue', `${CDN}/sprites/foozle/pickups/Pickups/Gems/Png/BlueGem.png`);
    this.load.image('pickup_gem_orange', `${CDN}/sprites/foozle/pickups/Pickups/Gems/Png/OrangeGem.png`);
    this.load.image('pickup_gold', `${CDN}/sprites/foozle/pickups/Pickups/Gold/Png/PileOfCoins.png`);

    // ── Load traps ──
    this.load.spritesheet('trap_arrow', `${CDN}/sprites/foozle/traps/Arrow_Trap/PNGs/Arrow_Trap_-_Level_1.png`, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('trap_fire', `${CDN}/sprites/foozle/traps/Fire_Breather_Trap/PNGs/Fire_Breather_Trap_-_Level_1.png`, { frameWidth: 48, frameHeight: 48 });

    // Handle load errors gracefully
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load: ${file.key} from ${file.url}`);
    });
  }

  create() {
    // ── Create hero animations (per charKey_anim_dir) ──
    for (const [charKey, cfg] of Object.entries(HEROES)) {
      if (cfg.isGolem) continue;
      const animKeys = Object.keys(cfg.anims);
      for (const anim of animKeys) {
        const ac = cfg.anims[anim];
        const frameCount = ac.frames ?? 4;
        const rate = ac.rate ?? 8;
        const repeat = (anim === 'idle' || anim === 'walk' || anim === 'run') ? -1 : 0;

        for (const dir of DIRECTIONS) {
          const key = heroKey(charKey, anim, dir);
          // Each spritesheet is a horizontal strip — all frames in one row
          if (!this.textures.exists(key)) continue;
          const frames = [];
          for (let i = 0; i < frameCount; i++) frames.push(i);
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(key, { frames }),
            frameRate: rate,
            repeat,
          });
        }
      }
    }

    // ── Golem animations (4-row combined sheets) ──
    const golemCfg = HEROES.golem;
    for (const anim of Object.keys(golemCfg.anims)) {
      const ac = golemCfg.anims[anim];
      const frameCount = ac.frames ?? 4;
      const rate = ac.rate ?? 8;
      const repeat = (anim === 'idle' || anim === 'walk' || anim === 'run') ? -1 : 0;
      const sheetKey = `golem_${anim}`;
      if (!this.textures.exists(sheetKey)) continue;

      for (const [dirName, dirIdx] of Object.entries(DIR_IDX)) {
        const startFrame = dirIdx * frameCount;
        const frames = [];
        for (let i = 0; i < frameCount; i++) frames.push(startFrame + i);
        this.anims.create({
          key: heroKey('golem', anim, dirName),
          frames: this.anims.generateFrameNumbers(sheetKey, { frames }),
          frameRate: rate,
          repeat,
        });
      }
    }

    // ── Boss animations ──
    for (const [bossId, bossCfg] of Object.entries(BOSSES)) {
      for (const anim of Object.keys(bossCfg.anims)) {
        const ac = bossCfg.anims[anim];
        const frameCount = ac.frames ?? 10;
        const rate = ac.rate ?? 8;
        const repeat = (anim === 'idle' || anim === 'walking' || anim === 'running') ? -1 : 0;

        for (const dir of BOSS_DIRS) {
          const key = bossKey(bossId, anim, dir);
          if (!this.textures.exists(key)) continue;
          const frames = [];
          for (let i = 0; i < frameCount; i++) frames.push(i);
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(key, { frames }),
            frameRate: rate,
            repeat,
          });
        }
      }
    }

    // ── Effect animations ──
    const waveDirs = ['down', 'up', 'left', 'right'];
    for (const d of waveDirs) {
      const k = `fx_wave_${d}`;
      if (this.textures.exists(k)) {
        this.anims.create({
          key: k,
          frames: this.anims.generateFrameNumbers(k),
          frameRate: 14,
          repeat: 0,
        });
      }
    }

    if (this.textures.exists('fx_destroy')) {
      this.anims.create({
        key: 'fx_destroy',
        frames: this.anims.generateFrameNumbers('fx_destroy'),
        frameRate: 12,
        repeat: 0,
      });
    }

    // ── Projectile animations (from individual frame images) ──
    const makeFrameAnim = (key, prefix, count, rate, repeat = -1) => {
      const frames = [];
      for (let i = 1; i <= count; i++) {
        const fk = `${prefix}_${i}`;
        if (this.textures.exists(fk)) frames.push({ key: fk });
      }
      if (frames.length > 0) {
        this.anims.create({ key, frames, frameRate: rate, repeat });
      }
    };

    makeFrameAnim('anim_fireball', 'fireball', 8, 14, -1);
    makeFrameAnim('anim_fire_arrow', 'fire_arrow', 8, 14, -1);
    makeFrameAnim('anim_wind_ball', 'wind_ball', 8, 12, -1);
    makeFrameAnim('anim_lightning_arrow', 'lightning_arrow', 12, 14, -1);
    makeFrameAnim('anim_fire_explosion', 'fire_explosion', 12, 16, 0);
    makeFrameAnim('anim_ground_hit', 'ground_hit', 8, 14, 0);
    makeFrameAnim('anim_meteor', 'meteor', 12, 12, 0);
    makeFrameAnim('anim_slash', 'slash', 10, 18, 0);

    this.scene.start('Select');
  }
}
