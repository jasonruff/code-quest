import Phaser from 'phaser';
import { createPlaceholderAssets } from '../utils/assetLoader';
import { initGameState } from '../utils/gameState';

/**
 * Boot scene - the first scene to be loaded
 * Handles initial setup and transitions to the preload scene
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create placeholder assets for development
    createPlaceholderAssets(this);
  }

  create() {
    // Set up game scaling
    this.scale.refresh();
    
    // Initialize game state
    initGameState();
    
    // Initialize any game services or plugins
    console.log('BootScene: Game initialized');
    
    // Transition to the preload scene
    this.scene.start('PreloadScene');
  }
}

export default BootScene;