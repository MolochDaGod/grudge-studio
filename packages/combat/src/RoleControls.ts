import type { ICombatCharacter, IRoleControlsConfig, IComboDefinition } from './types.js';

/**
 * Player input controller with sequential key combo detection.
 * Ported from annihilatetrainer/src/RoleControls.js
 *
 * Three key tracking systems:
 * - holdKey: keys currently pressed (for movement)
 * - tickKey: keys pressed this frame (for actions — consumed each tick)
 * - seqKey: sequential key buffer for combo detection (cleared on timeout)
 *
 * Default combos (when blocking):
 * - ↓→ + J = hadouken
 * - →↓→ + J = shoryuken
 * - ↓← + K = ajejebloken
 */

const DEFAULT_CONFIG: IRoleControlsConfig = {
  moveKeys: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
  },
  actionKeys: {
    attack: ['KeyJ', 'Numpad4'],
    jump: ['KeyK', 'Numpad5'],
    dash: ['KeyI', 'Numpad8'],
    bash: ['KeyU', 'Numpad7'],
    block: ['KeyL', 'Numpad6'],
    launch: ['KeyO', 'Numpad9'],
  },
  combos: [
    { sequence: ['KeyS', 'KeyD'], triggerKey: 'KeyJ', action: 'hadouken' },
    { sequence: ['ArrowDown', 'ArrowRight'], triggerKey: 'KeyJ', action: 'hadouken' },
    { sequence: ['KeyD', 'KeyS', 'KeyD'], triggerKey: 'KeyJ', action: 'shoryuken' },
    { sequence: ['ArrowRight', 'ArrowDown', 'ArrowRight'], triggerKey: 'KeyJ', action: 'shoryuken' },
    { sequence: ['KeyS', 'KeyA'], triggerKey: 'KeyK', action: 'ajejebloken' },
    { sequence: ['ArrowDown', 'ArrowLeft'], triggerKey: 'KeyK', action: 'ajejebloken' },
  ],
  comboTimeoutMs: 150,
};

export class RoleControls {
  role: ICombatCharacter;
  config: IRoleControlsConfig;

  private holdKey: Record<string, boolean> = {};
  private tickKey: Record<string, boolean> = {};
  private seqKey: string[] = [];
  private seqKeyTimeout: ReturnType<typeof setTimeout> | null = null;

  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;

  constructor(role: ICombatCharacter, config: Partial<IRoleControlsConfig> = {}) {
    this.role = role;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this._onKeyDown = (event: KeyboardEvent) => {
      if (this.holdKey[event.code]) return; // Prevent held-key double-fire
      this.holdKey[event.code] = true;
      this.tickKey[event.code] = true;

      // Combo detection (only while blocking)
      if (this.role.service.state.matches('block')) {
        clearTimeout(this.seqKeyTimeout!);
        const matchedCombo = this._checkCombo(event.code);
        if (matchedCombo) {
          this.role.service.send(matchedCombo.action);
          this.seqKey.length = 0;
        } else if (!this._isActionKey(event.code)) {
          this.seqKey.push(event.code);
        }
        this.seqKeyTimeout = setTimeout(() => { this.seqKey.length = 0; }, this.config.comboTimeoutMs);
      }
    };

    this._onKeyUp = (event: KeyboardEvent) => {
      this.holdKey[event.code] = false;

      // Notify character of key releases for held-action states
      const { actionKeys } = this.config;
      if (actionKeys.attack.includes(event.code)) this.role.service.send('keyJUp');
      else if (actionKeys.bash.includes(event.code)) this.role.service.send('keyUUp');
      else if (actionKeys.block.includes(event.code)) {
        this.role.service.send('keyLUp');
        this.seqKey.length = 0;
      } else if (actionKeys.launch.includes(event.code)) {
        this.role.service.send('keyOUp');
        this.seqKey.length = 0;
      }
    };
  }

  /** Attach keyboard listeners. Call once when entering gameplay. */
  attach(target: EventTarget = globalThis): void {
    target.addEventListener('keydown', this._onKeyDown as EventListener);
    target.addEventListener('keyup', this._onKeyUp as EventListener);
  }

  /** Detach keyboard listeners. Call when leaving gameplay. */
  detach(target: EventTarget = globalThis): void {
    target.removeEventListener('keydown', this._onKeyDown as EventListener);
    target.removeEventListener('keyup', this._onKeyUp as EventListener);
  }

  /**
   * Per-frame update. Call from the game loop with delta time.
   * Processes held movement keys and single-frame action keys.
   */
  update(dt: number): void {
    // Process single-frame actions (first pressed wins)
    const firstAction = Object.keys(this.tickKey)[0];
    if (firstAction) {
      const { actionKeys } = this.config;
      if (actionKeys.attack.includes(firstAction)) this.role.service.send('attack');
      else if (actionKeys.jump.includes(firstAction)) this.role.service.send('jump');
      else if (actionKeys.dash.includes(firstAction)) this.role.service.send('dash');
      else if (actionKeys.bash.includes(firstAction)) this.role.service.send('bash');
      else if (actionKeys.block.includes(firstAction)) this.role.service.send('block');
      else if (actionKeys.launch.includes(firstAction)) this.role.service.send('launch');
    }

    // Movement from held keys
    const { moveKeys } = this.config;
    let dirX = 0, dirY = 0;
    if (this._anyHeld(moveKeys.up)) dirY -= 1;
    if (this._anyHeld(moveKeys.down)) dirY += 1;
    if (this._anyHeld(moveKeys.left)) dirX -= 1;
    if (this._anyHeld(moveKeys.right)) dirX += 1;

    // Normalize and apply speed
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 0;
    if (len > 0) {
      const scale = this.role.speed * dt * 60;
      this.role.direction.x = (dirX / len) * scale;
      this.role.direction.y = (dirY / len) * scale;
    } else {
      this.role.direction.x = 0;
      this.role.direction.y = 0;
    }

    // Apply movement and facing
    if (this.role.service.state.hasTag('canMove')) {
      if (len > 0) {
        this.role.facing.x = this.role.direction.x;
        this.role.facing.y = this.role.direction.y;
      }
      this.role.mesh.rotation.y =
        -Math.atan2(this.role.facing.y, this.role.facing.x) + Math.PI / 2;

      this.role.body.position.x += this.role.direction.x;
      this.role.body.position.z += this.role.direction.y;
    }

    // Send run/stop to state machine
    if (len > 0) {
      this.role.service.send('run');
    } else {
      this.role.service.send('stop');
    }

    // Clear tick keys for next frame
    this.tickKey = {};
  }

  setRole(role: ICombatCharacter): void {
    this.role = role;
  }

  // --- Internal helpers ---

  private _anyHeld(keys: string[]): boolean {
    return keys.some(k => this.holdKey[k]);
  }

  private _isActionKey(code: string): boolean {
    return Object.values(this.config.actionKeys).some(keys => keys.includes(code));
  }

  private _checkCombo(triggerCode: string): IComboDefinition | null {
    for (const combo of this.config.combos) {
      if (combo.triggerKey !== triggerCode && !this.config.actionKeys.attack.includes(triggerCode)) continue;
      if (triggerCode !== combo.triggerKey) continue;
      if (this.seqKey.length !== combo.sequence.length) continue;
      if (combo.sequence.every((key, i) => key === this.seqKey[i])) {
        return combo;
      }
    }
    return null;
  }
}
