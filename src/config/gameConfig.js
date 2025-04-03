import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import PreloadScene from '../scenes/PreloadScene';
import GameScene from '../scenes/GameScene';

/**
 * Initialize the Phaser game instance with configuration
 * @returns {Phaser.Game} The Phaser game instance
 */
export function initGame() {
  const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: 800,
    height: 600,
    backgroundColor: '#182635',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [BootScene, PreloadScene, GameScene]
  };

  return new Phaser.Game(config);
}

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
    startPosition: { x: 400, y: 300 }
  },
  
  // World settings
  world: {
    tileSize: 32
  },
  
  // Debug settings
  debug: false
};