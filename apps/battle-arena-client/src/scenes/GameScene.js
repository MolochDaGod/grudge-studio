import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';

// Server configuration - update this with your server URL
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.room = null;
    this.roomJoined = false;
    this.cursors = null;
    this.players = {};
    this.player = null;
    this.bullets = {};
    this.score = 0;
    this.playerCount = 0;
    this.isDead = false;
    this.client = new Colyseus.Client(SERVER_URL);
  }

  preload() {
    // Load placeholder assets - these can be replaced with actual game assets
    this.createPlaceholderAssets();
  }

  create() {
    // Create a simple background
    this.cameras.main.setBackgroundColor('#1a5c1a');
    
    // Create world bounds
    const worldWidth = 3200;
    const worldHeight = 3200;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Create a simple grid for reference
    this.createWorldGrid(worldWidth, worldHeight);

    // UI Elements
    this.createUI();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Connect to server
    this.connectToServer();
  }

  createPlaceholderAssets() {
    // Create player sprite placeholder
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0x00ff00);
    playerGraphics.fillCircle(20, 20, 20);
    playerGraphics.fillStyle(0x004400);
    playerGraphics.fillRect(15, 10, 10, 5); // gun
    playerGraphics.generateTexture('player', 40, 40);
    playerGraphics.destroy();

    // Create bullet sprite placeholder
    const bulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bulletGraphics.fillStyle(0xffff00);
    bulletGraphics.fillCircle(3, 3, 3);
    bulletGraphics.generateTexture('bullet', 6, 6);
    bulletGraphics.destroy();
  }

  createWorldGrid(width, height) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x00ff00, 0.1);
    
    // Draw grid
    for (let x = 0; x < width; x += 100) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 100) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    graphics.strokePath();
  }

  createUI() {
    // Score text
    this.scoreText = this.add.text(16, 16, 'Kills: 0', {
      font: '24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    // Player count text
    this.playerCountText = this.add.text(16, 50, 'Players: 0', {
      font: '20px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    // Player name text (shows above player)
    const playerName = this.registry.get('playerName') || 'Player';
    this.playerNameText = this.add.text(0, 0, playerName, {
      font: '14px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(99);
  }

  async connectToServer() {
    try {
      console.log('Connecting to server:', SERVER_URL);
      const playerName = this.registry.get('playerName') || 'Player';
      const authToken = this.registry.get('authToken');
      
      this.room = await this.client.joinOrCreate('battle_arena', { 
        name: playerName,
        authToken: authToken
      });
      
      console.log('Joined room:', this.room.id);
      this.roomJoined = true;
      this.setupRoomHandlers();
    } catch (error) {
      console.error('Failed to connect to server:', error);
      alert('Failed to connect to game server. Please make sure the server is running.');
    }
  }

  setupRoomHandlers() {
    const self = this;

    // On state change - initial state
    this.room.onStateChange.once((state) => {
      console.log('Initial state received');
      
      // Create existing players
      state.players.forEach((player, sessionId) => {
        if (sessionId !== this.room.sessionId) {
          this.addOtherPlayer(sessionId, player);
        }
      });
    });

    // On player added
    this.room.state.players.onAdd((player, sessionId) => {
      console.log('Player added:', sessionId);
      this.playerCount++;
      this.updatePlayerCount();

      if (sessionId === this.room.sessionId) {
        // This is the current player
        this.addCurrentPlayer(player);
      } else {
        // This is another player
        this.addOtherPlayer(sessionId, player);
      }

      // Listen to player changes
      player.onChange(() => {
        if (this.players[sessionId]) {
          this.players[sessionId].targetX = player.x;
          this.players[sessionId].targetY = player.y;
          this.players[sessionId].targetRotation = player.rotation;
        }
      });
    });

    // On player removed
    this.room.state.players.onRemove((player, sessionId) => {
      console.log('Player removed:', sessionId);
      this.playerCount--;
      this.updatePlayerCount();
      
      if (this.players[sessionId]) {
        this.players[sessionId].sprite.destroy();
        if (this.players[sessionId].nameText) {
          this.players[sessionId].nameText.destroy();
        }
        delete this.players[sessionId];
      }
    });

    // On bullet added
    this.room.state.bullets.onAdd((bullet, id) => {
      const sprite = this.physics.add.sprite(bullet.x, bullet.y, 'bullet');
      sprite.setRotation(bullet.angle);
      this.bullets[id] = sprite;

      bullet.onChange(() => {
        if (this.bullets[id]) {
          this.bullets[id].x = bullet.x;
          this.bullets[id].y = bullet.y;
        }
      });
    });

    // On bullet removed
    this.room.state.bullets.onRemove((bullet, id) => {
      if (this.bullets[id]) {
        this.bullets[id].destroy();
        delete this.bullets[id];
      }
    });

    // On message from server
    this.room.onMessage('hit', (message) => {
      if (message.punisherId === this.room.sessionId) {
        this.score++;
        this.updateScore();
      } else if (message.punishedId === this.room.sessionId) {
        this.handleDeath(message.punisherName);
      }
    });
  }

  addCurrentPlayer(playerData) {
    const sprite = this.physics.add.sprite(playerData.x, playerData.y, 'player');
    sprite.setCollideWorldBounds(true);
    sprite.setSize(30, 30);
    
    this.player = {
      sprite: sprite,
      targetX: playerData.x,
      targetY: playerData.y,
      targetRotation: playerData.rotation
    };

    this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
  }

  addOtherPlayer(sessionId, playerData) {
    const sprite = this.physics.add.sprite(playerData.x, playerData.y, 'player');
    sprite.setTint(0xff0000);
    sprite.setSize(30, 30);

    const nameText = this.add.text(playerData.x, playerData.y - 30, playerData.name || 'Enemy', {
      font: '12px Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.players[sessionId] = {
      sprite: sprite,
      nameText: nameText,
      targetX: playerData.x,
      targetY: playerData.y,
      targetRotation: playerData.rotation
    };
  }

  update() {
    if (!this.player || this.isDead) return;

    // Player movement
    this.player.sprite.setVelocity(0);

    const speed = 300;
    if (this.cursors.left.isDown) {
      this.player.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.sprite.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.sprite.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.sprite.setVelocityY(speed);
    }

    // Player rotation towards mouse
    const pointer = this.input.activePointer;
    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const angle = Phaser.Math.Angle.Between(
      this.player.sprite.x, 
      this.player.sprite.y, 
      worldX, 
      worldY
    );
    this.player.sprite.setRotation(angle + Math.PI / 2);

    // Shooting
    if (pointer.isDown && !this.shotThisFrame) {
      this.shoot();
      this.shotThisFrame = true;
    } else if (!pointer.isDown) {
      this.shotThisFrame = false;
    }

    // Update player name position
    if (this.playerNameText && this.player) {
      this.playerNameText.x = this.player.sprite.x;
      this.playerNameText.y = this.player.sprite.y - 30;
    }

    // Send position to server
    if (this.roomJoined && this.room) {
      this.room.send('move', {
        x: this.player.sprite.x,
        y: this.player.sprite.y,
        rotation: this.player.sprite.rotation
      });
    }

    // Interpolate other players
    for (let sessionId in this.players) {
      const p = this.players[sessionId];
      p.sprite.x += (p.targetX - p.sprite.x) * 0.2;
      p.sprite.y += (p.targetY - p.sprite.y) * 0.2;
      
      // Interpolate rotation
      let angle = p.targetRotation;
      let dir = (angle - p.sprite.rotation) / (Math.PI * 2);
      dir -= Math.round(dir);
      dir = dir * Math.PI * 2;
      p.sprite.rotation += dir * 0.2;

      // Update name text position
      if (p.nameText) {
        p.nameText.x = p.sprite.x;
        p.nameText.y = p.sprite.y - 30;
      }
    }
  }

  shoot() {
    if (!this.player || this.isDead) return;

    const speedX = Math.cos(this.player.sprite.rotation + Math.PI / 2) * 50;
    const speedY = Math.sin(this.player.sprite.rotation + Math.PI / 2) * 50;

    this.room.send('shoot', {
      x: this.player.sprite.x,
      y: this.player.sprite.y,
      angle: this.player.sprite.rotation,
      speedX: speedX,
      speedY: speedY
    });
  }

  handleDeath(killerName) {
    this.isDead = true;
    if (this.player && this.player.sprite) {
      this.player.sprite.setVisible(false);
    }
    if (this.playerNameText) {
      this.playerNameText.setVisible(false);
    }
    
    window.showDeathScreen(killerName, this.score);
  }

  respawn() {
    this.isDead = false;
    this.score = 0;
    this.updateScore();
    
    if (this.player && this.player.sprite) {
      this.player.sprite.setVisible(true);
      this.player.sprite.setPosition(
        Phaser.Math.Between(100, 3100),
        Phaser.Math.Between(100, 3100)
      );
    }
    if (this.playerNameText) {
      this.playerNameText.setVisible(true);
    }
    
    window.hideDeathScreen();
  }

  updateScore() {
    this.scoreText.setText(`Kills: ${this.score}`);
  }

  updatePlayerCount() {
    this.playerCountText.setText(`Players: ${this.playerCount}`);
  }
}
