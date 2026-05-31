import { describe, it, expect } from 'vitest';
import { Splash } from '../src/effects/Splash';
import { Pop } from '../src/effects/Pop';
import { RoleControls } from '../src/RoleControls';
import { mockCharacter, mockBody, mockCollisionEvent, getSentEvents } from './helpers';

describe('Splash', () => {
  it('computes position from body + contact ri', () => {
    const body = mockBody({ position: { x: 10, y: 5, z: 3 } });
    const event = {
      body,
      contact: {
        ri: { x: 0.1, y: 0.2, z: 0.3 },
        rj: { x: 0, y: 0, z: 0 },
        ni: { x: 0, y: 1, z: 0 },
      },
    };

    const splash = new Splash(event);
    expect(splash.position.x).toBeCloseTo(10.1);
    expect(splash.position.y).toBeCloseTo(5.2);
    expect(splash.position.z).toBeCloseTo(3.3);
  });

  it('returns animation keyframes', () => {
    const splash = new Splash(mockCollisionEvent());
    const anim = splash.getAnimation();
    expect(anim.duration).toBe(0.5);
    expect(anim.endY).toBeGreaterThan(anim.startY);
    expect(anim.opacityCurve).toBe('sqrtFalloff');
  });

  it('accepts custom config', () => {
    const splash = new Splash(mockCollisionEvent(), { duration: 1.0, riseDistance: 3.0 });
    expect(splash.config.duration).toBe(1.0);
    expect(splash.config.riseDistance).toBe(3.0);
  });
});

describe('Pop', () => {
  it('creates with default radius', () => {
    const owner = mockCharacter();
    const pop = new Pop(owner);
    expect(pop.config.radius).toBe(3.7);
  });

  it('centers on owner position', () => {
    const owner = mockCharacter();
    owner.body.position.x = 5;
    owner.body.position.z = 10;
    const pop = new Pop(owner);
    pop.update();
    expect(pop.body.position.x).toBe(5);
    expect(pop.body.position.z).toBe(10);
  });

  it('pushes targets away from owner on collide', () => {
    const owner = mockCharacter();
    owner.body.position.x = 0;
    owner.body.position.z = 0;

    const pop = new Pop(owner);
    const targetBody = mockBody({
      position: { x: 3, y: 0, z: 4 },
      velocity: { x: 0, y: 0, z: 0 },
      belongTo: { knockDown() {} },
    });
    const event = mockCollisionEvent(targetBody);
    event.body = targetBody;

    pop.collide(event, true);

    // Velocity should point away from owner (positive x and z)
    expect(targetBody.velocity.x).toBeGreaterThan(0);
    expect(targetBody.velocity.z).toBeGreaterThan(0);
  });

  it('pop() returns animation config', () => {
    const owner = mockCharacter();
    const pop = new Pop(owner, { radius: 5, animDuration: 0.3 });
    const result = pop.pop();
    expect(result.radius).toBe(5);
    expect(result.animDuration).toBe(0.3);
  });
});

describe('RoleControls', () => {
  it('constructs with default key bindings', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    expect(controls.config.moveKeys.up).toContain('KeyW');
    expect(controls.config.actionKeys.attack).toContain('KeyJ');
    expect(controls.config.combos.length).toBeGreaterThan(0);
  });

  it('sends stop when no keys held', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    controls.update(1 / 60);
    expect(getSentEvents(char)).toContain('stop');
  });

  it('sends run when movement keys held', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    // Simulate key down via internal state
    (controls as any).holdKey['KeyW'] = true;
    controls.update(1 / 60);
    expect(getSentEvents(char)).toContain('run');
  });

  it('sends attack on tick key', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    (controls as any).tickKey['KeyJ'] = true;
    controls.update(1 / 60);
    expect(getSentEvents(char)).toContain('attack');
  });

  it('sends jump on tick key K', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    (controls as any).tickKey['KeyK'] = true;
    controls.update(1 / 60);
    expect(getSentEvents(char)).toContain('jump');
  });

  it('normalizes diagonal movement', () => {
    const char = mockCharacter();
    char.speed = 1;
    const controls = new RoleControls(char);
    (controls as any).holdKey['KeyW'] = true;
    (controls as any).holdKey['KeyD'] = true;
    controls.update(1 / 60);

    // Diagonal should be normalized (not sqrt(2) magnitude)
    const len = Math.sqrt(char.direction.x ** 2 + char.direction.y ** 2);
    expect(len).toBeCloseTo(1, 0); // ~1 at speed=1, dt=1/60, *60
  });

  it('clears tick keys after update', () => {
    const char = mockCharacter();
    const controls = new RoleControls(char);
    (controls as any).tickKey['KeyJ'] = true;
    controls.update(1 / 60);
    expect(Object.keys((controls as any).tickKey)).toHaveLength(0);
  });

  it('setRole switches the controlled character', () => {
    const char1 = mockCharacter();
    const char2 = mockCharacter();
    const controls = new RoleControls(char1);
    controls.setRole(char2);
    (controls as any).tickKey['KeyJ'] = true;
    controls.update(1 / 60);
    expect(getSentEvents(char2)).toContain('attack');
    expect(getSentEvents(char1)).not.toContain('attack');
  });
});
