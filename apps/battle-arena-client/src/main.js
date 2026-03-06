import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

// Game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

let game = null;
let playerName = 'Player';
let authToken = null;

// Check for auth token
function checkAuth() {
  authToken = localStorage.getItem('grudge_auth_token');
  const username = localStorage.getItem('grudge_username');
  
  if (!authToken) {
    // Redirect to login
    window.location.href = '/login.html';
    return false;
  }
  
  // Set player name from auth
  if (username) {
    playerName = username;
    playerNameInput.value = username;
  }
  
  return true;
}

// Menu system
const menuOverlay = document.getElementById('menu-overlay');
const startButton = document.getElementById('start-button');
const playerNameInput = document.getElementById('player-name-input');
const deathScreen = document.getElementById('death-screen');
const respawnButton = document.getElementById('respawn-button');
const deathMessage = document.getElementById('death-message');

// Start game
startButton.addEventListener('click', startGame);
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    startGame();
  }
});

respawnButton.addEventListener('click', respawnPlayer);

function startGame() {
  if (!checkAuth()) return;
  
  playerName = playerNameInput.value.trim() || playerName;
  menuOverlay.classList.add('hidden');
  
  if (!game) {
    game = new Phaser.Game(config);
    game.registry.set('playerName', playerName);
    game.registry.set('authToken', authToken);
  } else {
    game.registry.set('playerName', playerName);
    game.registry.set('authToken', authToken);
    game.scene.start('GameScene');
  }
}

function respawnPlayer() {
  deathScreen.classList.remove('visible');
  if (game && game.scene.getScene('GameScene')) {
    game.scene.getScene('GameScene').respawn();
  }
}

// Export functions for use by game scene
window.showDeathScreen = (killerName, kills) => {
  deathMessage.textContent = killerName 
    ? `You were eliminated by ${killerName}! Your kills: ${kills}`
    : `You were eliminated! Your kills: ${kills}`;
  deathScreen.classList.add('visible');
};

window.hideDeathScreen = () => {
  deathScreen.classList.remove('visible');
};
