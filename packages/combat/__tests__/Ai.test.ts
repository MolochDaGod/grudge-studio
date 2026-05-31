import { describe, it, expect } from 'vitest';
import { Ai } from '../src/Ai';
import { mockCharacter, getSentEvents } from './helpers';

describe('Ai', () => {
  it('does nothing when disabled', () => {
    const char = mockCharacter();
    const ai = new Ai(char);
    ai.enabled = false;
    ai.update(1 / 60);
    expect(getSentEvents(char)).toHaveLength(0);
  });

  it('sends stop when idle at spawn with no target', () => {
    const char = mockCharacter();
    const ai = new Ai(char);
    ai.update(1 / 60);
    expect(getSentEvents(char)).toContain('stop');
  });

  it('chases target when out of range', () => {
    const char = mockCharacter();
    char.body.position.x = 0;
    char.body.position.z = 0;

    const target = mockCharacter();
    target.body.position.x = 10;
    target.body.position.z = 0;

    const ai = new Ai(char, 1);
    ai.setTarget(target);
    ai.update(1 / 60);

    expect(getSentEvents(char)).toContain('run');
    // Character should have moved toward target (positive X)
    expect(char.body.position.x).toBeGreaterThan(0);
  });

  it('attacks when target is in range', () => {
    const char = mockCharacter();
    char.body.position.x = 0;

    const target = mockCharacter();
    target.body.position.x = 0.5; // within distance=1

    const ai = new Ai(char, 1);
    ai.setTarget(target);
    ai.update(1 / 60);

    expect(getSentEvents(char)).toContain('attack');
  });

  it('sends stop in range when isAttack is false', () => {
    const char = mockCharacter();
    const target = mockCharacter();
    target.body.position.x = 0.5;

    const ai = new Ai(char, 1);
    ai.isAttack = false;
    ai.setTarget(target);
    ai.update(1 / 60);

    expect(getSentEvents(char)).toContain('stop');
    expect(getSentEvents(char)).not.toContain('attack');
  });

  it('returns to initial position when target is lost', () => {
    const char = mockCharacter();
    char.body.position.x = 5;
    char.body.position.z = 5;
    char.initialPosition = { x: 0, y: 0, z: 0 };

    const ai = new Ai(char);
    ai.update(1 / 60);

    expect(getSentEvents(char)).toContain('run');
    // Should move toward origin
    expect(char.body.position.x).toBeLessThan(5);
    expect(char.body.position.z).toBeLessThan(5);
  });

  it('updates facing toward target', () => {
    const char = mockCharacter();
    const target = mockCharacter();
    target.body.position.x = 10;
    target.body.position.z = 0;

    const ai = new Ai(char, 1);
    ai.setTarget(target);
    ai.update(1 / 60);

    expect(char.facing.x).toBeGreaterThan(0);
  });

  it('syncs detector position with character', () => {
    const char = mockCharacter();
    char.body.position.x = 7;
    char.body.position.z = 3;

    const ai = new Ai(char);
    ai.detector = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      belongTo: ai,
      collisionFilterGroup: 0,
      collisionFilterMask: 0,
      collisionResponse: false,
    };
    ai.update(1 / 60);

    expect(ai.detector.position.x).toBeCloseTo(7, 0);
    expect(ai.detector.position.z).toBeCloseTo(3, 0);
  });

  it('does not move when isMove is false', () => {
    const char = mockCharacter();
    char.body.position.x = 5;
    char.initialPosition = { x: 0, y: 0, z: 0 };

    const ai = new Ai(char);
    ai.isMove = false;
    ai.update(1 / 60);

    // Should not move back, just send stop
    expect(char.body.position.x).toBe(5);
    expect(getSentEvents(char)).toContain('stop');
  });
});
