import { Schema, MapSchema, type } from '@colyseus/schema';

export class Player extends Schema {
  constructor(x = 0, y = 0, name = 'Player') {
    super();
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.name = name;
  }
}

type('number')(Player.prototype, 'x');
type('number')(Player.prototype, 'y');
type('number')(Player.prototype, 'rotation');
type('string')(Player.prototype, 'name');

export class Bullet extends Schema {
  constructor(x, y, angle, speedX, speedY, ownerId) {
    super();
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speedX = speedX;
    this.speedY = speedY;
    this.ownerId = ownerId;
    this.distanceTraveled = 0;
  }
}

type('number')(Bullet.prototype, 'x');
type('number')(Bullet.prototype, 'y');
type('number')(Bullet.prototype, 'angle');
type('number')(Bullet.prototype, 'speedX');
type('number')(Bullet.prototype, 'speedY');
type('string')(Bullet.prototype, 'ownerId');

export class GameState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.bullets = new MapSchema();
    this.bulletIdCounter = 0;
  }

  createPlayer(sessionId, x, y, name) {
    this.players.set(sessionId, new Player(x, y, name));
  }

  removePlayer(sessionId) {
    this.players.delete(sessionId);
  }

  updatePlayer(sessionId, x, y, rotation) {
    const player = this.players.get(sessionId);
    if (player) {
      player.x = x;
      player.y = y;
      player.rotation = rotation;
    }
  }

  createBullet(x, y, angle, speedX, speedY, ownerId) {
    const bulletId = `bullet_${this.bulletIdCounter++}`;
    this.bullets.set(bulletId, new Bullet(x, y, angle, speedX, speedY, ownerId));
    return bulletId;
  }

  removeBullet(bulletId) {
    this.bullets.delete(bulletId);
  }

  updateBullet(bulletId) {
    const bullet = this.bullets.get(bulletId);
    if (!bullet) return false;

    const oldX = bullet.x;
    const oldY = bullet.y;

    bullet.x -= bullet.speedX;
    bullet.y -= bullet.speedY;

    const dx = bullet.x - oldX;
    const dy = bullet.y - oldY;
    bullet.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    return true;
  }
}

type({ map: Player })(GameState.prototype, 'players');
type({ map: Bullet })(GameState.prototype, 'bullets');
