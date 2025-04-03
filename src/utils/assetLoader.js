/**
 * Asset Loader utility
 * Provides functions for loading and managing game assets
 */

/**
 * Asset types supported by the loader
 */
export const ASSET_TYPES = {
  IMAGE: 'image',
  SPRITESHEET: 'spritesheet',
  AUDIO: 'audio',
  TILEMAP: 'tilemap'
};

/**
 * Generate asset manifests for different game sections
 * @param {String} section - Game section ('core', 'mission1', etc.)
 * @returns {Object} Asset manifest for the section
 */
export function getAssetManifest(section = 'core') {
  const manifests = {
    // Core assets loaded first and always available
    core: {
      images: [
        { key: 'logo', path: 'assets/images/logo-placeholder.png' },
        { key: 'progressBar', path: 'assets/images/progress-bar.png' },
        { key: 'progressBarFill', path: 'assets/images/progress-bar-fill.png' },
        { key: 'background', path: 'assets/images/background-placeholder.png' },
        { key: 'tileset', path: 'assets/images/tileset-placeholder.png' }
      ],
      spritesheets: [
        { 
          key: 'playerSheet', 
          path: 'assets/images/player-spritesheet-placeholder.png',
          config: { frameWidth: 32, frameHeight: 32 } 
        }
      ],
      audio: [
        { key: 'bgMusic', path: 'assets/audio/background-music-placeholder.mp3' },
        { key: 'sfxButton', path: 'assets/audio/button-click-placeholder.mp3' }
      ],
      tilemaps: [
        { key: 'level1', path: 'assets/tilemaps/level1-placeholder.json' }
      ]
    },
    
    // Mission 1 specific assets
    mission1: {
      images: [
        { key: 'mission1-bg', path: 'assets/images/mission1-bg-placeholder.png' }
      ],
      spritesheets: [
        {
          key: 'npcSheet1',
          path: 'assets/images/npc1-spritesheet-placeholder.png',
          config: { frameWidth: 32, frameHeight: 32 }
        }
      ],
      audio: [
        { key: 'mission1-music', path: 'assets/audio/mission1-music-placeholder.mp3' }
      ],
      tilemaps: [
        { key: 'mission1-map', path: 'assets/tilemaps/mission1-map-placeholder.json' }
      ]
    }
  };
  
  return manifests[section] || {};
}

/**
 * Load assets into a Phaser scene
 * @param {Phaser.Scene} scene - The scene to load assets into
 * @param {Object} manifest - Asset manifest object
 * @param {Function} onComplete - Callback when loading is complete
 */
export function loadAssets(scene, manifest, onComplete = null) {
  // Count total assets to load
  const totalAssets = (
    (manifest.images?.length || 0) +
    (manifest.spritesheets?.length || 0) +
    (manifest.audio?.length || 0) +
    (manifest.tilemaps?.length || 0)
  );
  
  // If no assets, call onComplete and return
  if (totalAssets === 0) {
    if (onComplete) onComplete();
    return;
  }
  
  // Load images
  if (manifest.images) {
    manifest.images.forEach(image => {
      scene.load.image(image.key, image.path);
    });
  }
  
  // Load spritesheets
  if (manifest.spritesheets) {
    manifest.spritesheets.forEach(spritesheet => {
      scene.load.spritesheet(
        spritesheet.key, 
        spritesheet.path, 
        spritesheet.config
      );
    });
  }
  
  // Load audio
  if (manifest.audio) {
    manifest.audio.forEach(audio => {
      scene.load.audio(audio.key, audio.path);
    });
  }
  
  // Load tilemaps
  if (manifest.tilemaps) {
    manifest.tilemaps.forEach(tilemap => {
      scene.load.tilemapTiledJSON(tilemap.key, tilemap.path);
    });
  }
  
  // Handle completion
  if (onComplete) {
    scene.load.once('complete', onComplete);
  }
}

/**
 * Create placeholder assets for development
 * @param {Phaser.Scene} scene - The scene to create assets in
 */
export function createPlaceholderAssets(scene) {
  // Create a logo placeholder texture
  const logoGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  logoGraphics.fillStyle(0x3498db);
  logoGraphics.fillRect(0, 0, 320, 240);
  logoGraphics.fillStyle(0xffffff);
  logoGraphics.fillRect(40, 40, 240, 160);
  logoGraphics.generateTexture('logo', 320, 240);
  
  // Create progress bar placeholder textures
  const barGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  barGraphics.fillStyle(0x444444);
  barGraphics.fillRect(0, 0, 300, 30);
  barGraphics.generateTexture('progressBar', 300, 30);
  
  const barFillGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  barFillGraphics.fillStyle(0x3498db);
  barFillGraphics.fillRect(0, 0, 300, 30);
  barFillGraphics.generateTexture('progressBarFill', 300, 30);
  
  // Create a background placeholder
  const bgGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  bgGraphics.fillGradientStyle(0x1a2a3a, 0x1a2a3a, 0x0d151f, 0x0d151f, 1);
  bgGraphics.fillRect(0, 0, 800, 600);
  bgGraphics.generateTexture('background', 800, 600);
  
  // Create player placeholder
  const playerGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  playerGraphics.fillStyle(0xFF0000);
  playerGraphics.fillCircle(16, 16, 16);
  playerGraphics.generateTexture('player', 32, 32);
  
  // Create a simple player spritesheet
  const sheetGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  // Frame 0-3: Idle
  for (let i = 0; i < 4; i++) {
    sheetGraphics.fillStyle(0x3498db);
    sheetGraphics.fillRect(i * 32, 0, 32, 32);
    sheetGraphics.fillStyle(0xffffff);
    sheetGraphics.fillCircle(i * 32 + 16, 16, 10 + Math.sin(i * 2) * 2);
  }
  // Frame 4-9: Walk
  for (let i = 0; i < 6; i++) {
    sheetGraphics.fillStyle(0x3498db);
    sheetGraphics.fillRect(i * 32 + 128, 0, 32, 32);
    sheetGraphics.fillStyle(0xffffff);
    sheetGraphics.fillCircle(i * 32 + 128 + 16, 16, 10);
    // Add walking animation
    const offset = Math.sin(i * Math.PI / 3) * 4;
    sheetGraphics.fillRect(i * 32 + 128 + 12, 20 + offset, 8, 12);
  }
  sheetGraphics.generateTexture('playerSheet', 320, 32);
  
  console.log('Created placeholder assets');
}

export default {
  ASSET_TYPES,
  getAssetManifest,
  loadAssets,
  createPlaceholderAssets
};