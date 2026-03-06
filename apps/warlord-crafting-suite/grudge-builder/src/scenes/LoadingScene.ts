/**
 * Loading Scene
 * Handles asset loading with progress display
 */

import Phaser from 'phaser';
import { AssetManager } from '../systems/AssetManager';
import { GAME_CONFIG } from '../config/game-config';

export class LoadingScene extends Phaser.Scene {
  private assetManager!: AssetManager;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    this.createLoadingUI();
    this.assetManager = new AssetManager(this);
    
    // Load assets with progress callback
    this.assetManager.loadAll((progress) => {
      this.updateProgress(progress);
    }).then(() => {
      // Hide HTML loading screen
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      
      // Transition to menu
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    }).catch((error) => {
      console.error('Failed to load assets:', error);
      this.showError('Failed to load game assets. Please refresh.');
    });
  }

  private createLoadingUI() {
    const { width, height } = GAME_CONFIG;
    const centerX = width / 2;
    const centerY = height / 2;

    // Title
    this.add.text(centerX, centerY - 100, '🏗️ Grudge Builder', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Progress bar background
    const barWidth = 400;
    const barHeight = 30;
    const barX = centerX - barWidth / 2;
    const barY = centerY;

    this.add.graphics()
      .fillStyle(0x222222, 1)
      .fillRoundedRect(barX, barY, barWidth, barHeight, 10);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Progress text
    this.progressText = this.add.text(centerX, centerY + 50, 'Loading... 0%', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Tip text
    this.add.text(centerX, height - 50, 'Tip: Build near resources for faster gathering!', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);
  }

  private updateProgress(progress: number) {
    const { width, height } = GAME_CONFIG;
    const centerX = width / 2;
    const centerY = height / 2;
    const barWidth = 400;
    const barHeight = 30;
    const barX = centerX - barWidth / 2;
    const barY = centerY;

    // Update progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(0xff6b6b, 1);
    this.progressBar.fillRoundedRect(
      barX + 2,
      barY + 2,
      (barWidth - 4) * progress,
      barHeight - 4,
      8
    );

    // Update text
    this.progressText.setText(`Loading... ${Math.round(progress * 100)}%`);

    // Update HTML progress bar
    const htmlProgress = document.getElementById('loading-progress');
    if (htmlProgress) {
      htmlProgress.style.width = `${progress * 100}%`;
    }
  }

  private showError(message: string) {
    const { width, height } = GAME_CONFIG;
    this.add.text(width / 2, height / 2 + 100, message, {
      fontSize: '20px',
      color: '#ff4757',
    }).setOrigin(0.5);
  }
}

