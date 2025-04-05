import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * Player character class
 * Manages player rendering, movement, animations, and interactions
 */
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'playerSheet');
    
    this.scene = scene;
    
    // Add player to the scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set depth to ensure player appears above background elements
    this.setDepth(10);
    
    // Set player physics properties
    this.setCollideWorldBounds(true);
    this.body.setSize(24, 28); // Hitbox size slightly smaller than sprite
    
    // Movement state
    this.movementState = {
      isMoving: false,
      direction: 'down', // 'up', 'down', 'left', 'right'
      speed: GAME_CONFIG.player.speed
    };
    
    // Initialize animations
    this.createAnimations();
    
    // Use a fallback texture if playerSheet isn't available
    if (!scene.textures.exists('playerSheet') || !scene.anims.exists('player-idle-down')) {
      this.setTexture('player');
      console.warn('Using fallback player texture - animations not available');
    } else {
      // Set initial animation
      try {
        this.anims.play('player-idle-down');
      } catch (error) {
        console.error('Error playing player animation:', error);
        // Fallback to simple texture
        this.setTexture('player');
      }
    }
  }
  
  /**
   * Create all player animations
   */
  createAnimations() {
    try {
      const anims = this.scene.anims;
      
      // Get the spritesheet key
      const sheet = this.texture.key;
      
      // Check if the texture exists and has frames
      if (!this.scene.textures.exists(sheet)) {
        console.warn(`Texture ${sheet} doesn't exist, skipping animation creation`);
        return;
      }
      
      // Try to create animations safely
      const createAnimSafely = (key, start, end, frameRate, repeat) => {
        try {
          if (!anims.exists(key)) {
            // Make sure frame numbers exist in the texture
            const texture = this.scene.textures.get(sheet);
            const framesExist = texture.has(start) && texture.has(end);
            
            if (framesExist) {
              anims.create({
                key: key,
                frames: anims.generateFrameNumbers(sheet, { start: start, end: end }),
                frameRate: frameRate,
                repeat: repeat
              });
            } else {
              console.warn(`Skipping animation ${key} - frames ${start}-${end} not found in texture`);
            }
          }
        } catch (error) {
          console.error(`Error creating animation ${key}:`, error);
        }
      };
      
      // Idle animations for each direction
      createAnimSafely('player-idle-down', 0, 3, 8, -1);
      createAnimSafely('player-idle-up', 4, 7, 8, -1);
      createAnimSafely('player-idle-left', 8, 11, 8, -1);
      createAnimSafely('player-idle-right', 12, 15, 8, -1);
      
      // Walk animations for each direction
      createAnimSafely('player-walk-down', 16, 23, 12, -1);
      createAnimSafely('player-walk-up', 24, 31, 12, -1);
      createAnimSafely('player-walk-left', 32, 39, 12, -1);
      createAnimSafely('player-walk-right', 40, 47, 12, -1);
    } catch (error) {
      console.error('Error in createAnimations:', error);
    }
  }
  
  /**
   * Update the player's movement based on input
   * @param {Phaser.Input.Keyboard.CursorKeys} cursors - Keyboard input
   */
  update(cursors) {
    // Reset velocity
    this.body.setVelocity(0);
    
    // Movement flags
    let isMoving = false;
    let direction = this.movementState.direction;
    const speed = this.movementState.speed;
    
    // Horizontal movement
    if (cursors.left.isDown) {
      this.body.setVelocityX(-speed);
      direction = 'left';
      isMoving = true;
    } else if (cursors.right.isDown) {
      this.body.setVelocityX(speed);
      direction = 'right';
      isMoving = true;
    }
    
    // Vertical movement
    if (cursors.up.isDown) {
      this.body.setVelocityY(-speed);
      // Only change direction to up if not moving horizontally
      if (!cursors.left.isDown && !cursors.right.isDown) {
        direction = 'up';
      }
      isMoving = true;
    } else if (cursors.down.isDown) {
      this.body.setVelocityY(speed);
      // Only change direction to down if not moving horizontally
      if (!cursors.left.isDown && !cursors.right.isDown) {
        direction = 'down';
      }
      isMoving = true;
    }
    
    // Normalize diagonal movement speed
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(speed);
    }
    
    // Update movement state
    this.movementState.isMoving = isMoving;
    this.movementState.direction = direction;
    
    // Play appropriate animation
    this.playAnimation();
  }
  
  /**
   * Play the appropriate animation based on movement state
   */
  playAnimation() {
    const { isMoving, direction } = this.movementState;
    
    try {
      const animKey = isMoving ? `player-walk-${direction}` : `player-idle-${direction}`;
      
      // Check if animation exists before playing
      if (this.scene.anims.exists(animKey)) {
        this.anims.play(animKey, true);
      } else {
        // If animation doesn't exist but we haven't warned yet, log it
        if (!this._warnedMissingAnims) {
          this._warnedMissingAnims = {};
        }
        
        if (!this._warnedMissingAnims[animKey]) {
          console.warn(`Missing animation: ${animKey}`);
          this._warnedMissingAnims[animKey] = true;
        }
        
        // Use a simple fallback behavior - just set a color based on direction
        if (!this.scene.textures.exists('player')) {
          const colors = {
            up: 0x00FF00,
            down: 0xFF0000,
            left: 0x0000FF,
            right: 0xFF00FF
          };
          this.setTint(colors[direction] || 0xFFFFFF);
        }
      }
    } catch (error) {
      console.error('Error playing animation:', error);
    }
  }
  
  /**
   * Interact with an object in front of the player
   * @returns {Object|null} The object the player is interacting with, or null
   */
  interact() {
    const { direction } = this.movementState;
    const interactDistance = this.scene.registry.get('GAME_CONFIG')?.player?.interactionDistance || 32;
    
    // Calculate the position to check based on player direction
    let checkX = this.x;
    let checkY = this.y;
    
    switch (direction) {
      case 'up':
        checkY -= interactDistance;
        break;
      case 'down':
        checkY += interactDistance;
        break;
      case 'left':
        checkX -= interactDistance;
        break;
      case 'right':
        checkX += interactDistance;
        break;
    }
    
    // Check if the scene has a tilemap manager to check for interactive objects
    if (this.scene.tilemapManager) {
      const interactiveObject = this.scene.tilemapManager.getInteractiveObjectAt(checkX, checkY);
      
      if (interactiveObject) {
        // Return the interaction result
        return this.scene.tilemapManager.interactWith(interactiveObject);
      }
    }
    
    // If no interactive object found, return the position for visual feedback
    return { x: checkX, y: checkY };
  }
  
  /**
   * Set the player's position
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPlayerPosition(x, y) {
    this.setPosition(x, y);
  }
  
  /**
   * Get the player's current direction
   * @returns {String} Current facing direction ('up', 'down', 'left', 'right')
   */
  getDirection() {
    return this.movementState.direction;
  }
}

export default Player;