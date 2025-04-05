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
    try {
      // Create placeholder assets for development
      createPlaceholderAssets(this);
      
      // Create emergency fallback assets in case loading fails
      this.generateEmergencyPlaceholders();
    } catch (error) {
      console.error('Error in BootScene preload:', error);
      this.generateEmergencyPlaceholders();
    }
  }

  /**
   * Generate ultra-simple emergency placeholder assets
   * These are used if the normal placeholder generation fails
   */
  generateEmergencyPlaceholders() {
    try {
      // Create ultra-simple placeholders for critical assets
      const criticalAssets = [
        { key: 'player', color: 0xFF0000, size: 32 },
        { key: 'playerSheet', color: 0x00FF00, size: 256 },
        { key: 'logo', color: 0x0000FF, size: 320 },
        { key: 'progressBar', color: 0x444444, size: 300 },
        { key: 'progressBarFill', color: 0x3498DB, size: 300 },
        { key: 'background', color: 0x000000, size: 800 },
        { key: 'tileset', color: 0x777777, size: 320 }
      ];
      
      criticalAssets.forEach(asset => {
        if (!this.textures.exists(asset.key)) {
          const graphics = this.make.graphics({ x: 0, y: 0, add: false });
          graphics.fillStyle(asset.color);
          graphics.fillRect(0, 0, asset.size, asset.size);
          graphics.generateTexture(asset.key, asset.size, asset.size);
          console.log(`Created emergency fallback texture: ${asset.key}`);
        }
      });
      
      // Create empty audio placeholders
      if (this.sound && this.sound.context) {
        const audioContext = this.sound.context;
        const emptyBuffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
        
        ['bgMusic', 'sfxButton', 'sfxInteract'].forEach(key => {
          if (!this.cache.audio.exists(key)) {
            this.cache.audio.add(key, emptyBuffer);
            console.log(`Created emergency audio placeholder: ${key}`);
          }
        });
      }
    } catch (error) {
      console.error('Failed to create emergency placeholders:', error);
    }
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