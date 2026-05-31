import { describe, it, expect, vi } from 'vitest';
import { Attacker } from '../src/Attacker';
import { GROUP_ROLE_ATTACKER, ROLE_ATTACKER_MASK } from '../src/constants';
import { mockBody, mockCollisionEvent } from './helpers';

describe('Attacker', () => {
  it('creates with default collision groups', () => {
    const a = new Attacker();
    expect(a.body.collisionFilterGroup).toBe(GROUP_ROLE_ATTACKER);
    expect(a.body.collisionFilterMask).toBe(ROLE_ATTACKER_MASK);
    expect(a.body.collisionResponse).toBe(false);
    expect(a.isAttacker).toBe(true);
  });

  it('creates custom number of bodies', () => {
    const a = new Attacker({ num: 3 });
    expect(a.bodies).toHaveLength(3);
    expect(a.body).toBe(a.bodies[0]);
  });

  it('accepts custom collision groups', () => {
    const a = new Attacker({ collisionFilterGroup: 32, collisionFilterMask: 4 });
    expect(a.body.collisionFilterGroup).toBe(32);
    expect(a.body.collisionFilterMask).toBe(4);
  });

  it('tracks beginCollide correctly', () => {
    const a = new Attacker();
    const spy = vi.spyOn(a, 'collide');
    const event = mockCollisionEvent();

    // First contact → isBeginCollide = true
    a.handleCollide(a.body, event);
    expect(spy).toHaveBeenCalledWith(event, true);

    // Same body again → isBeginCollide = false
    a.handleCollide(a.body, event);
    expect(spy).toHaveBeenCalledWith(event, false);
  });

  it('resets collision tracking on endContact', () => {
    const a = new Attacker();
    const spy = vi.spyOn(a, 'collide');
    const event = mockCollisionEvent();

    a.handleCollide(a.body, event);
    expect(spy).toHaveBeenLastCalledWith(event, true);

    a.handleEndContact(a.body, event);

    // After endContact, same body should be beginCollide again
    a.handleCollide(a.body, event);
    expect(spy).toHaveBeenLastCalledWith(event, true);
  });

  it('tracks multiple colliding bodies independently', () => {
    const a = new Attacker();
    const spy = vi.spyOn(a, 'collide');
    const body1 = mockBody({ position: { x: 1, y: 0, z: 0 } });
    const body2 = mockBody({ position: { x: 2, y: 0, z: 0 } });
    const event1 = mockCollisionEvent(body1);
    const event2 = mockCollisionEvent(body2);

    a.handleCollide(a.body, event1);
    expect(spy).toHaveBeenLastCalledWith(event1, true);

    a.handleCollide(a.body, event2);
    expect(spy).toHaveBeenLastCalledWith(event2, true);

    // event1 again → sustained
    a.handleCollide(a.body, event1);
    expect(spy).toHaveBeenLastCalledWith(event1, false);
  });

  it('endContact calls endContact hook', () => {
    const a = new Attacker();
    const spy = vi.spyOn(a, 'endContact');
    const event = mockCollisionEvent();

    a.handleEndContact(a.body, event);
    expect(spy).toHaveBeenCalledWith(event);
  });
});
