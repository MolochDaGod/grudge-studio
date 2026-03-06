/**
 * Game Configuration
 * Central configuration for Grudge Builder
 */

export const GAME_CONFIG = {
  // Display
  width: 1280,
  height: 720,
  tileSize: 32,
  
  // Grid
  gridWidth: 40,
  gridHeight: 22,
  
  // Camera
  cameraZoom: 1,
  cameraSpeed: 10,
  
  // Player
  playerSpeed: 200,
  
  // Building
  maxBuildings: 50,
  buildingSnapToGrid: true,
  
  // Resources
  autoSaveInterval: 30000, // 30 seconds
  
  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  puterWorkerUrl: import.meta.env.VITE_PUTER_WORKER_URL || '',
  
  // Debug
  showGrid: import.meta.env.DEV,
  showColliders: import.meta.env.DEV,
} as const;

export const COLORS = {
  primary: 0xff6b6b,
  secondary: 0xffd93d,
  success: 0x6bcf7f,
  danger: 0xff4757,
  info: 0x5352ed,
  dark: 0x1a1a2e,
  light: 0xf1f2f6,
} as const;

export const LAYERS = {
  GROUND: 0,
  RESOURCES: 1,
  BUILDINGS: 2,
  PLAYER: 3,
  UI: 4,
} as const;

