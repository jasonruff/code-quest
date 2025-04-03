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
    
    // Set initial animation
    this.anims.play('player-idle-down');
  }
  
  /**
   * Create all player animations
   */
  createAnimations() {
    const anims = this.scene.anims;
    
    // Get the spritesheet key
    const sheet = this.texture.key;
    
    // Idle animations for each direction
    if (!anims.exists('player-idle-down')) {
      anims.create({
        key: 'player-idle-down',
        frames: anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-idle-up')) {
      anims.create({
        key: 'player-idle-up',
        frames: anims.generateFrameNumbers(sheet, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-idle-left')) {
      anims.create({
        key: 'player-idle-left',
        frames: anims.generateFrameNumbers(sheet, { start: 8, end: 11 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-idle-right')) {
      anims.create({
        key: 'player-idle-right',
        frames: anims.generateFrameNumbers(sheet, { start: 12, end: 15 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    // Walk animations for each direction
    if (!anims.exists('player-walk-down')) {
      anims.create({
        key: 'player-walk-down',
        frames: anims.generateFrameNumbers(sheet, { start: 16, end: 23 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-walk-up')) {
      anims.create({
        key: 'player-walk-up',
        frames: anims.generateFrameNumbers(sheet, { start: 24, end: 31 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-walk-left')) {
      anims.create({
        key: 'player-walk-left',
        frames: anims.generateFrameNumbers(sheet, { start: 32, end: 39 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-walk-right')) {
      anims.create({
        key: 'player-walk-right',
        frames: anims.generateFrameNumbers(sheet, { start: 40, end: 47 }),
        frameRate: 12,
        repeat: -1
      });
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
    
    if (isMoving) {
      this.anims.play(`player-walk-${direction}`, true);
    } else {
      this.anims.play(`player-idle-${direction}`, true);
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