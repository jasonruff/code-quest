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
  try {
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
    
    // Create a more complete player spritesheet
    const sheetGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Define colors
    const colors = {
      body: 0x3498db,    // Blue
      face: 0xfff6e6,    // Light skin tone
      hair: 0x8b4513,    // Brown
      shirt: 0x27ae60,   // Green
      pants: 0x34495e,   // Dark blue
      outline: 0x2c3e50  // Dark outline
    };
    
    // Helper function to create character frame
    const createCharacterFrame = (x, y, direction, frame) => {
      // Body base - 32x32 rectangle
      sheetGraphics.fillStyle(colors.outline);
      sheetGraphics.fillRect(x, y, 32, 32);
      sheetGraphics.fillStyle(colors.body);
      sheetGraphics.fillRect(x + 1, y + 1, 30, 30);
      
      // Face
      sheetGraphics.fillStyle(colors.face);
      
      if (direction === 'down') {
        // Front-facing character
        sheetGraphics.fillRect(x + 10, y + 6, 12, 12);
        
        // Eyes
        sheetGraphics.fillStyle(colors.outline);
        sheetGraphics.fillRect(x + 13, y + 10, 2, 2);
        sheetGraphics.fillRect(x + 17, y + 10, 2, 2);
        
        // Mouth
        const mouthOpen = frame % 4 === 2;
        if (mouthOpen) {
          sheetGraphics.fillRect(x + 14, y + 14, 4, 2);
        } else {
          sheetGraphics.fillRect(x + 14, y + 15, 4, 1);
        }
      } else if (direction === 'up') {
        // Back-facing character
        sheetGraphics.fillRect(x + 10, y + 6, 12, 12);
        
        // Hair from back
        sheetGraphics.fillStyle(colors.hair);
        sheetGraphics.fillRect(x + 10, y + 6, 12, 6);
      } else if (direction === 'left') {
        // Left-facing character
        sheetGraphics.fillRect(x + 8, y + 6, 10, 12);
        
        // Left eye
        sheetGraphics.fillStyle(colors.outline);
        sheetGraphics.fillRect(x + 10, y + 10, 2, 2);
      } else if (direction === 'right') {
        // Right-facing character
        sheetGraphics.fillRect(x + 14, y + 6, 10, 12);
        
        // Right eye
        sheetGraphics.fillStyle(colors.outline);
        sheetGraphics.fillRect(x + 20, y + 10, 2, 2);
      }
      
      // Body
      sheetGraphics.fillStyle(colors.shirt);
      if (direction === 'down' || direction === 'up') {
        sheetGraphics.fillRect(x + 8, y + 18, 16, 8);
      } else if (direction === 'left') {
        sheetGraphics.fillRect(x + 6, y + 18, 12, 8);
      } else if (direction === 'right') {
        sheetGraphics.fillRect(x + 14, y + 18, 12, 8);
      }
      
      // Legs
      sheetGraphics.fillStyle(colors.pants);
      if (direction === 'down' || direction === 'up') {
        // Walking animation for legs
        const offset = frame % 2 === 0 ? 0 : 2;
        sheetGraphics.fillRect(x + 10, y + 26, 4, 6);
        sheetGraphics.fillRect(x + 18, y + 26, 4, 6);
        
        if (frame % 4 >= 2) {
          // Left leg forward, right leg back
          sheetGraphics.fillRect(x + 10, y + 26, 4, 6 - offset);
          sheetGraphics.fillRect(x + 18, y + 26, 4, 6 + offset);
        } else {
          // Right leg forward, left leg back
          sheetGraphics.fillRect(x + 10, y + 26, 4, 6 + offset);
          sheetGraphics.fillRect(x + 18, y + 26, 4, 6 - offset);
        }
      } else if (direction === 'left') {
        const offset = frame % 2 === 0 ? 0 : 2;
        sheetGraphics.fillRect(x + 8, y + 26, 4, 6 + (frame % 4 >= 2 ? offset : 0));
        sheetGraphics.fillRect(x + 14, y + 26, 4, 6 + (frame % 4 < 2 ? offset : 0));
      } else if (direction === 'right') {
        const offset = frame % 2 === 0 ? 0 : 2;
        sheetGraphics.fillRect(x + 14, y + 26, 4, 6 + (frame % 4 >= 2 ? offset : 0));
        sheetGraphics.fillRect(x + 20, y + 26, 4, 6 + (frame % 4 < 2 ? offset : 0));
      }
      
      // Arms
      sheetGraphics.fillStyle(colors.shirt);
      if (direction === 'down') {
        // Walking animation for arms
        const armOffset = Math.sin(frame * Math.PI / 2) * 2;
        sheetGraphics.fillRect(x + 4, y + 18, 4, 6 + armOffset);
        sheetGraphics.fillRect(x + 24, y + 18, 4, 6 - armOffset);
      } else if (direction === 'up') {
        // Walking animation for arms
        const armOffset = Math.sin(frame * Math.PI / 2) * 2;
        sheetGraphics.fillRect(x + 4, y + 18, 4, 6 + armOffset);
        sheetGraphics.fillRect(x + 24, y + 18, 4, 6 - armOffset);
      } else if (direction === 'left') {
        sheetGraphics.fillRect(x + 4, y + 18, 4, 6);
      } else if (direction === 'right') {
        sheetGraphics.fillRect(x + 24, y + 18, 4, 6);
      }
    };
    
    // Create all frames for the player sprite sheet
    
    // Idle animations (frames 0-15)
    // Down idle (0-3)
    for (let i = 0; i < 4; i++) {
      createCharacterFrame(i * 32, 0, 'down', i);
    }
    
    // Up idle (4-7)
    for (let i = 0; i < 4; i++) {
      createCharacterFrame(i * 32, 32, 'up', i);
    }
    
    // Left idle (8-11)
    for (let i = 0; i < 4; i++) {
      createCharacterFrame(i * 32, 64, 'left', i);
    }
    
    // Right idle (12-15)
    for (let i = 0; i < 4; i++) {
      createCharacterFrame(i * 32, 96, 'right', i);
    }
    
    // Walk animations (frames 16-47)
    // Down walk (16-23)
    for (let i = 0; i < 8; i++) {
      createCharacterFrame(i * 32, 128, 'down', i);
    }
    
    // Up walk (24-31)
    for (let i = 0; i < 8; i++) {
      createCharacterFrame(i * 32, 160, 'up', i);
    }
    
    // Left walk (32-39)
    for (let i = 0; i < 8; i++) {
      createCharacterFrame(i * 32, 192, 'left', i);
    }
    
    // Right walk (40-47)
    for (let i = 0; i < 8; i++) {
      createCharacterFrame(i * 32, 224, 'right', i);
    }
    
    // Generate the sprite sheet texture
    sheetGraphics.generateTexture('playerSheet', 256, 256);
    
    // Create placeholder sound
    createPlaceholderSounds(scene);
    
    console.log('Created placeholder assets');
  } catch (error) {
    console.error('Error creating placeholder assets:', error);
  }
}

/**
 * Create placeholder sound effects
 * @param {Phaser.Scene} scene - The scene to create assets in
 */
function createPlaceholderSounds(scene) {
  try {
    // Skip if Web Audio is not available
    if (!scene.sound || !scene.sound.context) {
      console.warn('Web Audio not available for placeholder sounds');
      return;
    }

    // Create placeholder audio for common sounds
    const audioKeys = ['bgMusic', 'sfxButton', 'sfxInteract'];
    
    audioKeys.forEach(key => {
      if (!scene.cache.audio.exists(key)) {
        const audioContext = scene.sound.context;
        const buffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate);
        const channel = buffer.getChannelData(0);
        
        // Generate a simple beep sound
        for (let i = 0; i < 4096; i++) {
          // Different patterns for different sounds
          if (key === 'bgMusic') {
            channel[i] = Math.sin(i * 0.01) * 0.3 * (1 - i / 8000);
          } else if (key === 'sfxButton') {
            channel[i] = Math.sin(i * 0.08) * 0.3 * (1 - i / 4096);
          } else {
            channel[i] = Math.sin(i * 0.05) * 0.3 * (1 - i / 4096);
          }
        }
        
        // Add the buffer to the cache
        scene.cache.audio.add(key, buffer);
        console.log(`Created placeholder audio for: ${key}`);
      }
    });
  } catch (error) {
    console.error('Error creating placeholder sounds:', error);
  }
}

export default {
  ASSET_TYPES,
  getAssetManifest,
  loadAssets,
  createPlaceholderAssets
};