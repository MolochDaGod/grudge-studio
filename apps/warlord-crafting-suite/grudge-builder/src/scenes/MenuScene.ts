/**
 * Menu Scene
 * Main menu for Grudge Builder
 */

import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/game-config';
import { gameAPI } from '../utils/api-client';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.dark).setOrigin(0);

    // Title
    this.add.text(centerX, 100, '🏗️ Grudge Builder', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, 180, 'Build Your Empire', {
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    // Buttons
    this.createButton(centerX, centerY - 50, 'New Game', () => {
      this.startNewGame();
    });

    this.createButton(centerX, centerY + 30, 'Continue', () => {
      this.continueGame();
    });

    this.createButton(centerX, centerY + 110, 'Settings', () => {
      this.showSettings();
    });

    this.createButton(centerX, centerY + 190, 'Back to Main App', () => {
      window.location.href = '/';
    });

    // Version
    this.add.text(width - 10, height - 10, 'v1.0.0', {
      fontSize: '14px',
      color: '#555555',
    }).setOrigin(1);

    // Check API connection
    this.checkAPIConnection();
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): void {
    const button = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 60, COLORS.primary, 1)
      .setInteractive({ useHandCursor: true });

    // Text
    const label = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.add([bg, label]);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.secondary);
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.primary);
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', onClick);
  }

  private async checkAPIConnection() {
    try {
      await gameAPI.checkHealth();
      console.log('✅ Connected to backend');
    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      this.showConnectionError();
    }
  }

  private showConnectionError() {
    const { width, height } = GAME_CONFIG;
    this.add.text(width / 2, height - 50, '⚠️ Backend connection failed', {
      fontSize: '16px',
      color: '#ff4757',
    }).setOrigin(0.5);
  }

  private startNewGame() {
    console.log('Starting new game...');
    this.scene.start('BuilderScene', { isNewGame: true });
  }

  private continueGame() {
    console.log('Continuing game...');
    this.scene.start('BuilderScene', { isNewGame: false });
  }

  private showSettings() {
    console.log('Opening settings...');
    // TODO: Implement settings scene
  }
}

