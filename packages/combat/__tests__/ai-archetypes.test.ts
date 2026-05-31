import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MutantAi } from '../src/ai/MutantAi';
import { PaladinAi } from '../src/ai/PaladinAi';
import { RobotAi } from '../src/ai/RobotAi';
import { RobotBossAi } from '../src/ai/RobotBossAi';
import { ParrotAi } from '../src/ai/ParrotAi';
import { mockCharacter, getSentEvents } from './helpers';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('MutantAi', () => {
  it('attacks and enters cooldown', () => {
    const char = mockCharacter();
    const ai = new MutantAi(char);
    ai.attack();
    expect(getSentEvents(char)).toContain('attack');

    // Second attack during cooldown → stop
    ai.attack();
    expect(getSentEvents(char).filter(e => e === 'stop')).toHaveLength(1);
  });

  it('can attack again after cooldown', () => {
    const char = mockCharacter();
    const ai = new MutantAi(char);
    ai.attack();

    vi.advanceTimersByTime(4000);
    getSentEvents(char).length = 0;
    ai.attack();
    expect(getSentEvents(char)).toContain('attack');
  });

  it('sends keyJUp after 1.6s hold', () => {
    const char = mockCharacter();
    const ai = new MutantAi(char);
    ai.attack();

    vi.advanceTimersByTime(1600);
    expect(getSentEvents(char)).toContain('keyJUp');
  });
});

describe('PaladinAi', () => {
  it('sends bash instead of attack', () => {
    const char = mockCharacter();
    const ai = new PaladinAi(char);
    ai.attack();
    expect(getSentEvents(char)).toContain('bash');
    expect(getSentEvents(char)).not.toContain('attack');
  });

  it('does not attack while airborne', () => {
    const char = mockCharacter();
    char.isAir = true;
    const ai = new PaladinAi(char);
    ai.attack();
    expect(getSentEvents(char)).toHaveLength(0);
  });

  it('respects 6s cooldown', () => {
    const char = mockCharacter();
    const ai = new PaladinAi(char);
    ai.attack();
    ai.attack();
    expect(getSentEvents(char).filter(e => e === 'stop')).toHaveLength(1);

    vi.advanceTimersByTime(6000);
    getSentEvents(char).length = 0;
    ai.attack();
    expect(getSentEvents(char)).toContain('bash');
  });
});

describe('RobotAi', () => {
  it('attacks with 4s cooldown', () => {
    const char = mockCharacter();
    const ai = new RobotAi(char);
    ai.attack();
    expect(getSentEvents(char)).toContain('attack');

    ai.attack(); // should be on cooldown
    expect(getSentEvents(char).filter(e => e === 'stop')).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    getSentEvents(char).length = 0;
    ai.attack();
    expect(getSentEvents(char)).toContain('attack');
  });
});

describe('RobotBossAi', () => {
  it('starts in idle phase', () => {
    const char = mockCharacter();
    const ai = new RobotBossAi(char);
    // No attack should fire without calling attack()
    expect(getSentEvents(char)).toHaveLength(0);
  });

  it('is stationary (isMove = false)', () => {
    const char = mockCharacter();
    const ai = new RobotBossAi(char);
    expect(ai.isMove).toBe(false);
  });

  it('progresses through attack → bash phases', () => {
    const char = mockCharacter();
    const ai = new RobotBossAi(char);
    ai.attack(); // idle → attack
    expect(getSentEvents(char)).toContain('attack');

    vi.advanceTimersByTime(7000); // attack → attacked
    vi.advanceTimersByTime(2000); // attacked → bash
    expect(getSentEvents(char)).toContain('bash');
  });

  it('ignores attack() when not idle', () => {
    const char = mockCharacter();
    const ai = new RobotBossAi(char);
    ai.attack(); // idle → attack
    const countBefore = getSentEvents(char).filter(e => e === 'attack').length;
    ai.attack(); // should be ignored
    const countAfter = getSentEvents(char).filter(e => e === 'attack').length;
    expect(countAfter).toBe(countBefore);
  });
});

describe('ParrotAi', () => {
  it('fires either attack or grenade', () => {
    const char = mockCharacter();
    const ai = new ParrotAi(char);

    // Run attack multiple times with different Math.random outcomes
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    ai.attack();
    expect(getSentEvents(char)).toContain('attack');

    vi.advanceTimersByTime(3000);
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    getSentEvents(char).length = 0;
    ai.attack();
    expect(getSentEvents(char)).toContain('grenade');
  });

  it('respects 3s cooldown', () => {
    const char = mockCharacter();
    const ai = new ParrotAi(char);
    ai.attack();
    ai.attack();
    expect(getSentEvents(char).filter(e => e === 'stop')).toHaveLength(1);
  });
});
