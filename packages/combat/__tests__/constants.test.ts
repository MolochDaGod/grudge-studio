import { describe, it, expect } from 'vitest';
import {
  GROUP_SCENE, GROUP_ROLE, GROUP_ENEMY, GROUP_ROLE_ATTACKER,
  GROUP_ENEMY_ATTACKER, GROUP_TRIGGER, GROUP_ENEMY_SHIELD, GROUP_NO_COLLIDE,
  ROLE_ATTACKER_MASK, ENEMY_ATTACKER_MASK, MAX_DT,
  BULLET_SPEED, BULLET_LIFETIME_MS, HADOUKEN_RADIUS, POP_RADIUS,
  AI_COOLDOWNS,
} from '../src/constants';

describe('Constants — Collision Groups', () => {
  const groups = [
    GROUP_SCENE, GROUP_ROLE, GROUP_ENEMY, GROUP_ROLE_ATTACKER,
    GROUP_ENEMY_ATTACKER, GROUP_TRIGGER, GROUP_ENEMY_SHIELD, GROUP_NO_COLLIDE,
  ];

  it('all collision groups are powers of 2', () => {
    for (const g of groups) {
      expect(g).toBeGreaterThan(0);
      expect(g & (g - 1)).toBe(0); // power-of-2 check
    }
  });

  it('all collision groups are unique', () => {
    const unique = new Set(groups);
    expect(unique.size).toBe(groups.length);
  });

  it('groups start from 2 (avoiding default 1)', () => {
    for (const g of groups) {
      expect(g).toBeGreaterThanOrEqual(2);
    }
  });

  it('ROLE_ATTACKER_MASK includes enemy groups', () => {
    expect(ROLE_ATTACKER_MASK & GROUP_ENEMY).toBe(GROUP_ENEMY);
    expect(ROLE_ATTACKER_MASK & GROUP_ENEMY_ATTACKER).toBe(GROUP_ENEMY_ATTACKER);
    expect(ROLE_ATTACKER_MASK & GROUP_ENEMY_SHIELD).toBe(GROUP_ENEMY_SHIELD);
    // Should NOT include own groups
    expect(ROLE_ATTACKER_MASK & GROUP_ROLE).toBe(0);
  });

  it('ENEMY_ATTACKER_MASK includes role groups', () => {
    expect(ENEMY_ATTACKER_MASK & GROUP_ROLE).toBe(GROUP_ROLE);
    expect(ENEMY_ATTACKER_MASK & GROUP_ROLE_ATTACKER).toBe(GROUP_ROLE_ATTACKER);
    // Should NOT include own groups
    expect(ENEMY_ATTACKER_MASK & GROUP_ENEMY).toBe(0);
  });
});

describe('Constants — Game Values', () => {
  it('MAX_DT is 60 FPS target', () => {
    expect(MAX_DT).toBeCloseTo(1 / 60);
  });

  it('combat defaults are positive', () => {
    expect(BULLET_SPEED).toBeGreaterThan(0);
    expect(BULLET_LIFETIME_MS).toBeGreaterThan(0);
    expect(HADOUKEN_RADIUS).toBeGreaterThan(0);
    expect(POP_RADIUS).toBeGreaterThan(0);
  });

  it('AI cooldowns are all positive', () => {
    for (const [, ms] of Object.entries(AI_COOLDOWNS)) {
      expect(ms).toBeGreaterThan(0);
    }
  });
});
