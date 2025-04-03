import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import PreloadScene from '../scenes/PreloadScene';
import GameScene from '../scenes/GameScene';
import CodeChallengeScene from '../scenes/CodeChallengeScene';

/**
 * Game constants and settings
 */
export const GAME_CONFIG = {
  // Game dimensions
  width: 800,
  height: 600,
  
  // Player settings
  player: {
    speed: 160,
    startPosition: { x: 400, y: 300 },
    interactionDistance: 40,
    collisionBodySize: {
      width: 24,
      height: 28
    }
  },
  
  // World settings
  world: {
    tileSize: 32,
    gravity: { x: 0, y: 0 }
  },
  
  // Camera settings
  camera: {
    initialZoom: 1,
    minZoom: 0.5,
    maxZoom: 2,
    followLerp: 0.1 // Lower = smoother camera follow
  },
  
  // Debug settings
  debug: true, // Set to true during development, false for production
  physics: {
    showBodies: false,
    showVelocity: false,
    showColliders: false
  },
  
  // Input settings
  input: {
    enableWASD: true,
    enableGamepad: false
  }
};

/**
 * Initialize the Phaser game instance with configuration
 * @returns {Phaser.Game} The Phaser game instance
 */
export function initGame() {
  const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: '#182635',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: GAME_CONFIG.world.gravity,
        debug: GAME_CONFIG.debug && GAME_CONFIG.physics.showBodies
      }
    },
    scene: [BootScene, PreloadScene, GameScene, CodeChallengeScene]
  };

  return new Phaser.Game(config);
}