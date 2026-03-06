/**
 * Builder Scene
 * Main gameplay scene for base building
 */

import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, LAYERS } from '../config/game-config';
import { gameAPI } from '../utils/api-client';

interface SceneData {
  isNewGame: boolean;
}

export class BuilderScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private buildings: Phaser.GameObjects.Sprite[] = [];
  private resources: Map<string, number> = new Map();
  private characterId?: string;

  constructor() {
    super({ key: 'BuilderScene' });
  }

  init(data: SceneData) {
    console.log('Initializing BuilderScene:', data);
  }

  create() {
    const { width, height } = GAME_CONFIG;

    // Background
    this.add.rectangle(0, 0, width, height, 0x2d5016).setOrigin(0);

    // Grid (if enabled)
    if (GAME_CONFIG.showGrid) {
      this.createGrid();
    }

    // Create player
    this.createPlayer();

    // Setup camera
    this.setupCamera();

    // Setup controls
    this.setupControls();

    // Create UI
    this.createUI();

    // Load game state
    this.loadGameState();

    // Auto-save
    this.time.addEvent({
      delay: GAME_CONFIG.autoSaveInterval,
      callback: () => this.saveGameState(),
      loop: true,
    });
  }

  update() {
    this.handlePlayerMovement();
  }

  private createGrid() {
    const { width, height, tileSize } = GAME_CONFIG;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x444444, 0.3);

    // Vertical lines
    for (let x = 0; x <= width; x += tileSize) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += tileSize) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private createPlayer() {
    const { width, height } = GAME_CONFIG;
    
    // Create player sprite (placeholder)
    this.player = this.add.sprite(width / 2, height / 2, 'player-warrior')
      .setDepth(LAYERS.PLAYER);

    // Add physics if sprite exists, otherwise use rectangle
    if (!this.textures.exists('player-warrior')) {
      this.player.destroy();
      this.player = this.add.sprite(width / 2, height / 2, '__DEFAULT')
        .setDepth(LAYERS.PLAYER)
        .setTint(COLORS.primary);
    }

    this.physics.add.existing(this.player);
  }

  private setupCamera() {
    const { width, height } = GAME_CONFIG;
    this.cameras.main.setBounds(0, 0, width * 2, height * 2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    // ESC to return to menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // B to build
    this.input.keyboard!.on('keydown-B', () => {
      this.openBuildMenu();
    });

    // I for inventory
    this.input.keyboard!.on('keydown-I', () => {
      this.openInventory();
    });
  }

  private handlePlayerMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = GAME_CONFIG.playerSpeed;

    body.setVelocity(0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
    }
  }

  private createUI() {
    const { width } = GAME_CONFIG;

    // Resource display
    const resourceText = this.add.text(10, 10, this.getResourceText(), {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 },
    }).setDepth(LAYERS.UI).setScrollFactor(0);

    // Update resource display
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        resourceText.setText(this.getResourceText());
      },
      loop: true,
    });

    // Controls hint
    this.add.text(width - 10, 10, 
      'Controls: Arrow Keys | B: Build | I: Inventory | ESC: Menu', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 },
    }).setOrigin(1, 0).setDepth(LAYERS.UI).setScrollFactor(0);
  }

  private getResourceText(): string {
    return `Wood: ${this.resources.get('wood') || 0} | Stone: ${this.resources.get('stone') || 0} | Iron: ${this.resources.get('iron') || 0}`;
  }

  private openBuildMenu() {
    console.log('Opening build menu...');
    // TODO: Implement build menu
  }

  private openInventory() {
    console.log('Opening inventory...');
    // TODO: Implement inventory UI
  }

  private async loadGameState() {
    // TODO: Load from API
    console.log('Loading game state...');
  }

  private async saveGameState() {
    // TODO: Save to API
    console.log('Auto-saving...');
  }
}

