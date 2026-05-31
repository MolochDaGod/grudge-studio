/**
 * Status Effects System for Mage Arena
 *
 * Each effect: { type, ticksLeft, tickInterval, tickTimer, value, owner }
 * Stored as array on sprite.getData('effects')
 */

export const EFFECT_TYPES = {
  burning:  { color: 0xff6600, tint: 0xffaa44, dmgPerTick: 3, ticks: 5, interval: 500, label: 'BURN' },
  poison:   { color: 0x44cc44, tint: 0x66ff66, dmgPerTick: 2, ticks: 8, interval: 500, label: 'PSN' },
  frozen:   { color: 0x4488ff, tint: 0x88ccff, dmgPerTick: 0, ticks: 1, interval: 2000, label: 'FRZ', freezes: true },
  stunned:  { color: 0xffff00, tint: 0xffffaa, dmgPerTick: 0, ticks: 1, interval: 1500, label: 'STUN', stuns: true },
  bleed:    { color: 0xcc2222, tint: 0xff4444, dmgPerTick: 4, ticks: 4, interval: 600, label: 'BLD' },
  regen:    { color: 0x44ff44, tint: 0x88ffaa, dmgPerTick: -5, ticks: 4, interval: 600, label: 'HOT' },
  shield:   { color: 0x8888ff, tint: 0xaaaaff, dmgPerTick: 0, ticks: 1, interval: 3000, label: 'SHD', damageReduction: 0.5 },
  haste:    { color: 0xffaa00, tint: 0xffcc44, dmgPerTick: 0, ticks: 1, interval: 3000, label: 'HST', speedMult: 1.3 },
};

/** Apply a status effect to a sprite */
export function applyEffect(sprite, type, owner = 'system') {
  if (!sprite.active) return;
  const def = EFFECT_TYPES[type];
  if (!def) return;

  let effects = sprite.getData('effects') || [];

  // Don't stack same type — refresh instead
  const existing = effects.find(e => e.type === type);
  if (existing) {
    existing.ticksLeft = def.ticks;
    existing.tickTimer = 0;
    return;
  }

  effects.push({
    type,
    ticksLeft: def.ticks,
    tickInterval: def.interval,
    tickTimer: 0,
    value: def.dmgPerTick,
    owner,
  });

  sprite.setData('effects', effects);
}

/** Remove a specific effect type from a sprite */
export function removeEffect(sprite, type) {
  if (!sprite.active) return;
  let effects = sprite.getData('effects') || [];
  sprite.setData('effects', effects.filter(e => e.type !== type));
}

/** Clear all effects from a sprite */
export function clearEffects(sprite) {
  if (!sprite.active) return;
  sprite.setData('effects', []);
  sprite.clearTint();
}

/** Check if sprite has a specific effect */
export function hasEffect(sprite, type) {
  if (!sprite.active) return false;
  const effects = sprite.getData('effects') || [];
  return effects.some(e => e.type === type);
}

/** Check if sprite is frozen or stunned (can't move/attack) */
export function isImmobilized(sprite) {
  return hasEffect(sprite, 'frozen') || hasEffect(sprite, 'stunned');
}

/** Get speed multiplier from effects */
export function getSpeedMult(sprite) {
  if (hasEffect(sprite, 'frozen') || hasEffect(sprite, 'stunned')) return 0;
  if (hasEffect(sprite, 'haste')) return EFFECT_TYPES.haste.speedMult;
  return 1;
}

/** Get damage reduction multiplier from effects */
export function getDamageReduction(sprite) {
  if (hasEffect(sprite, 'shield')) return EFFECT_TYPES.shield.damageReduction;
  return 0;
}

/**
 * Tick all effects on a sprite. Call from scene.update() with delta.
 * Returns array of { type, damage } events that occurred this tick.
 * @param {Phaser.GameObjects.Sprite} sprite
 * @param {number} delta - ms since last frame
 * @param {Phaser.Scene} scene - for VFX
 */
export function tickEffects(sprite, delta, scene) {
  if (!sprite.active) return [];
  let effects = sprite.getData('effects') || [];
  if (effects.length === 0) return [];

  const events = [];
  let needsTintClear = true;

  for (let i = effects.length - 1; i >= 0; i--) {
    const eff = effects[i];
    const def = EFFECT_TYPES[eff.type];
    eff.tickTimer += delta;

    if (eff.tickTimer >= eff.tickInterval) {
      eff.tickTimer -= eff.tickInterval;
      eff.ticksLeft--;

      // Apply damage/heal tick
      if (eff.value !== 0) {
        events.push({ type: eff.type, damage: eff.value });
      }

      // Tint flash
      if (def) {
        sprite.setTint(def.tint);
        if (scene) {
          scene.time.delayedCall(150, () => {
            if (sprite.active && effects.length > 0) {
              // Re-apply strongest effect tint
              const top = effects[0];
              const topDef = EFFECT_TYPES[top?.type];
              if (topDef) sprite.setTint(topDef.tint);
              else sprite.clearTint();
            }
          });
        }
      }

      // Remove expired effects
      if (eff.ticksLeft <= 0) {
        effects.splice(i, 1);
      }
    }

    if (effects.length > 0) needsTintClear = false;
  }

  // Clear tint when no effects remain
  if (needsTintClear && effects.length === 0) {
    // Restore original tint (enemies are red, allies green)
    const origTint = sprite.getData('origTint');
    if (origTint != null) sprite.setTint(origTint);
    else sprite.clearTint();
  }

  sprite.setData('effects', effects);
  return events;
}
