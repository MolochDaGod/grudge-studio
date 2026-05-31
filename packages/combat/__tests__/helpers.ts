import type { ICombatBody, ICombatCharacter, ICollisionEvent, IStateMachineService } from '../src/types';

/** Create a mock state machine service with configurable state/tags */
export function mockService(overrides: {
  value?: string;
  tags?: string[];
} = {}): IStateMachineService {
  const tags = new Set(overrides.tags ?? ['canMove', 'canFacing', 'canDamage']);
  const sentEvents: string[] = [];
  return {
    state: {
      value: overrides.value ?? 'idle',
      matches(v: string) { return this.value === v; },
      hasTag(t: string) { return tags.has(t); },
    },
    send(event: string | { type: string }) {
      const name = typeof event === 'string' ? event : event.type;
      sentEvents.push(name);
    },
    start() {},
    stop() {},
    /** Non-standard — access sent events in tests */
    _sentEvents: sentEvents,
  } as IStateMachineService & { _sentEvents: string[] };
}

/** Create a mock physics body */
export function mockBody(overrides: Partial<ICombatBody> = {}): ICombatBody {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    belongTo: null,
    collisionFilterGroup: 0,
    collisionFilterMask: 0,
    collisionResponse: false,
    ...overrides,
  };
}

/** Create a mock combat character */
export function mockCharacter(overrides: Partial<ICombatCharacter> = {}): ICombatCharacter & { service: IStateMachineService & { _sentEvents: string[] } } {
  const svc = mockService(overrides as any) as IStateMachineService & { _sentEvents: string[] };
  return {
    body: mockBody(),
    mesh: { rotation: { y: 0 } },
    service: svc,
    direction: { x: 0, y: 0 },
    facing: { x: 1, y: 0 },
    speed: 0.05,
    initialPosition: { x: 0, y: 0, z: 0 },
    detectorRadius: 8,
    hit(_event: ICollisionEvent) {},
    ...overrides,
    // Ensure service is always our mock (don't let overrides clobber it unless explicit)
    ...(overrides.service ? {} : { service: svc }),
  } as ICombatCharacter & { service: IStateMachineService & { _sentEvents: string[] } };
}

/** Create a mock collision event */
export function mockCollisionEvent(body?: ICombatBody): ICollisionEvent {
  return {
    body: body ?? mockBody(),
    contact: {
      ri: { x: 0.1, y: 0.2, z: 0.3 },
      rj: { x: 0, y: 0, z: 0 },
      ni: { x: 0, y: 1, z: 0 },
    },
  };
}

/** Get sent events from a mock service */
export function getSentEvents(character: ICombatCharacter): string[] {
  return (character.service as any)._sentEvents;
}
