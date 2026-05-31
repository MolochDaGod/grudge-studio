import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sword } from '../src/weapons/Sword';
import { GreatSword } from '../src/weapons/GreatSword';
import { Bullet } from '../src/weapons/Bullet';
import { Hadouken } from '../src/weapons/Hadouken';
import { Grenade } from '../src/weapons/Grenade';
import { Shield } from '../src/weapons/Shield';
import { Flail } from '../src/weapons/Flail';
import { GROUP_ENEMY_ATTACKER, GROUP_ROLE, GROUP_ROLE_ATTACKER, GROUP_ENEMY_SHIELD } from '../src/constants';
import { mockCharacter, mockBody, mockCollisionEvent } from './helpers';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('Sword', () => {
  it('has enemy attacker collision group', () => {
    const s = new Sword();
    expect(s.body.collisionFilterGroup).toBe(GROUP_ENEMY_ATTACKER);
    expect(s.body.collisionFilterMask).toBe(GROUP_ROLE);
  });

  it('syncs position from delegate', () => {
    const s = new Sword();
    s.delegatePosition = { x: 5, y: 2, z: 3 };
    s.update();
    expect(s.body.position.x).toBe(5);
    expect(s.body.position.y).toBe(2);
    expect(s.body.position.z).toBe(3);
  });

  it('only hits when owner has canDamage tag', () => {
    const s = new Sword();
    const owner = mockCharacter({ tags: ['canDamage'] });
    s.owner = owner;

    const hitSpy = vi.fn();
    const targetBody = mockBody({ belongTo: { hit: hitSpy, isRole: true } });
    s.collide(mockCollisionEvent(targetBody), true);
    expect(hitSpy).toHaveBeenCalled();
  });

  it('does not hit without canDamage tag', () => {
    const s = new Sword();
    const owner = mockCharacter({ tags: [] }); // no canDamage
    s.owner = owner;

    const hitSpy = vi.fn();
    const targetBody = mockBody({ belongTo: { hit: hitSpy } });
    s.collide(mockCollisionEvent(targetBody), true);
    expect(hitSpy).not.toHaveBeenCalled();
  });
});

describe('GreatSword', () => {
  it('has role attacker collision group', () => {
    const gs = new GreatSword();
    expect(gs.body.collisionFilterGroup).toBe(GROUP_ROLE_ATTACKER);
  });

  it('prioritizes shield over body collision', () => {
    const gs = new GreatSword();
    const owner = mockCharacter({ tags: ['canDamage'] });
    gs.owner = owner;

    const shieldOwner = mockCharacter();
    const shieldBody = mockBody({ belongTo: { isShield: true, owner: shieldOwner } });
    const enemyHit = vi.fn();
    const enemyBody = mockBody({ belongTo: { isEnemy: true, hit: enemyHit } });

    // Both collide in same frame
    gs.collide(mockCollisionEvent(enemyBody), true);
    gs.collide(mockCollisionEvent(shieldBody), true);
    gs.update(); // resolve priority

    // Shield should win — 'blocked' sent to shield owner, enemy NOT hit
    expect((shieldOwner.service as any)._sentEvents).toContain('blocked');
    expect(enemyHit).not.toHaveBeenCalled();
  });
});

describe('Bullet', () => {
  it('moves in direction each update', () => {
    const owner = mockCharacter();
    const b = new Bullet(owner, { x: 1, y: 0, z: 0 });
    const startX = b.body.position.x;
    b.update(1 / 60);
    expect(b.body.position.x).toBeGreaterThan(startX);
  });

  it('auto-disposes after lifetime', () => {
    const owner = mockCharacter();
    const disposeSpy = vi.fn();
    const b = new Bullet(owner, { x: 1, y: 0, z: 0 });
    b.onDispose = disposeSpy;

    vi.advanceTimersByTime(2000);
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('hits role targets', () => {
    const owner = mockCharacter();
    const b = new Bullet(owner, { x: 1, y: 0, z: 0 });

    const hitSpy = vi.fn();
    const targetBody = mockBody({ belongTo: { isRole: true, hit: hitSpy } });
    b.collide(mockCollisionEvent(targetBody), true);
    expect(hitSpy).toHaveBeenCalled();
  });

  it('rebounds when hitting attacker with canDamage', () => {
    const owner = mockCharacter();
    const b = new Bullet(owner, { x: 1, y: 0, z: 0 });
    const origMovX = b.movement.x;

    const attackerOwner = mockCharacter({ tags: ['canDamage'] });
    const attackerBody = mockBody({
      belongTo: { isAttacker: true, owner: attackerOwner },
    });

    b.collide(mockCollisionEvent(attackerBody), true);

    // Movement should reverse
    expect(b.movement.x).toBe(-origMovX);
    // Collision groups should swap
    expect(b.body.collisionFilterGroup).toBe(GROUP_ROLE_ATTACKER);
  });

  it('ignores sustained collisions (not beginCollide)', () => {
    const owner = mockCharacter();
    const b = new Bullet(owner, { x: 1, y: 0, z: 0 });
    const hitSpy = vi.fn();
    const targetBody = mockBody({ belongTo: { isRole: true, hit: hitSpy } });

    b.collide(mockCollisionEvent(targetBody), false);
    expect(hitSpy).not.toHaveBeenCalled();
  });
});

describe('Hadouken', () => {
  it('uses owner facing as movement direction', () => {
    const owner = mockCharacter();
    owner.facing = { x: 1, y: 0 };
    const h = new Hadouken(owner);

    expect(h.movement.x).toBeGreaterThan(0);
    expect(h.movement.z).toBeCloseTo(0);
  });
});

describe('Grenade', () => {
  it('applies gravity to movement', () => {
    const owner = mockCharacter();
    const g = new Grenade(owner, { x: 1, y: 0, z: 0 });
    const initY = g.movement.y;

    g.update(1 / 60);
    expect(g.movement.y).toBeLessThan(initY);
  });
});

describe('Shield', () => {
  it('has ENEMY_SHIELD collision group', () => {
    const s = new Shield();
    expect(s.body.collisionFilterGroup).toBe(GROUP_ENEMY_SHIELD);
    expect(s.isShield).toBe(true);
  });

  it('syncs from delegate', () => {
    const s = new Shield();
    s.delegatePosition = { x: 3, y: 1, z: 2 };
    s.update();
    expect(s.body.position).toEqual({ x: 3, y: 1, z: 2 });
  });
});

describe('Flail', () => {
  it('has configurable chain length', () => {
    const f = new Flail(7);
    expect(f.chainLength).toBe(7);
  });

  it('hits when owner has canDamage', () => {
    const f = new Flail();
    f.owner = mockCharacter({ tags: ['canDamage'] });
    const hitSpy = vi.fn();
    const targetBody = mockBody({ belongTo: { hit: hitSpy } });
    f.collide(mockCollisionEvent(targetBody), true);
    expect(hitSpy).toHaveBeenCalled();
  });
});
