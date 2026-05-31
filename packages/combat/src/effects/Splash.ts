import type { ICollisionEvent, ISplashConfig, IVec3 } from '../types.js';

/**
 * Splash — hit impact visual effect descriptor.
 * Ported from annihilatetrainer/src/Splash.js
 *
 * This is framework-agnostic: it computes the splash position and
 * animation parameters. The renderer adapter creates the actual
 * mesh/particle and runs the tween.
 *
 * Original: small red box at contact point, rises 1.5 units over 0.5s,
 * fades opacity from 1 → 0.
 */
export class Splash {
  position: IVec3;
  config: ISplashConfig;

  constructor(event: ICollisionEvent, config: Partial<ISplashConfig> = {}) {
    this.config = {
      duration: config.duration ?? 0.5,
      riseDistance: config.riseDistance ?? 1.5,
    };

    // Compute world-space contact point
    this.position = {
      x: event.body.position.x + event.contact.ri.x,
      y: event.body.position.y + event.contact.ri.y,
      z: event.body.position.z + event.contact.ri.z,
    };
  }

  /**
   * Returns animation keyframes for the renderer to apply.
   * t: 0→1 over duration, opacity: 1→0 (sqrt falloff).
   */
  getAnimation() {
    return {
      startY: this.position.y,
      endY: this.position.y + this.config.riseDistance,
      duration: this.config.duration,
      opacityCurve: 'sqrtFalloff' as const,
    };
  }
}
