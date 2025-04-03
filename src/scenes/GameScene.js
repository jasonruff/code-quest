import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import Player from '../entities/Player';

/**
 * Main game scene
 * Handles the core gameplay, including movement, physics, and interactions
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.cursors = null;
    this.map = null;
    this.backgroundLayer = null;
    this.foregroundLayer = null;
    this.collisionLayer = null;
    this.obstacles = null;
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.createObstacles();
    this.setupCamera();
    this.setupInput();
    this.setupCollisions();
    
    console.log('GameScene: Main game started');
  }

  update() {
    // Update player if it exists
    if (this.player) {
      this.player.update(this.cursors);
    }
  }

  createWorld() {
    // Create a simple placeholder background
    this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(
        GAME_CONFIG.width, 
        GAME_CONFIG.height
      );
    
    // Set up world boundaries
    this.physics.world.setBounds(
      0, 0, 
      GAME_CONFIG.width, 
      GAME_CONFIG.height
    );
    
    // In a real implementation, you would load a tilemap here:
    // this.map = this.make.tilemap({ key: 'level1' });
    // const tileset = this.map.addTilesetImage('tileset');
    // this.backgroundLayer = this.map.createLayer('background', tileset);
    // this.foregroundLayer = this.map.createLayer('foreground', tileset);
    // this.collisionLayer = this.map.createLayer('collision', tileset);
    // this.collisionLayer.setCollisionByProperty({ collides: true });
  }

  createPlayer() {
    // Get player starting position from config
    const { x, y } = GAME_CONFIG.player.startPosition;
    
    // Create player instance using our Player class
    this.player = new Player(this, x, y);
  }
  
  createObstacles() {
    // Create a group for obstacles
    this.obstacles = this.physics.add.group({
      immovable: true
    });
    
    // Add some sample obstacles
    const obstaclePositions = [
      { x: 200, y: 200, width: 50, height: 50 },
      { x: 500, y: 300, width: 100, height: 40 },
      { x: 300, y: 400, width: 80, height: 60 }
    ];
    
    obstaclePositions.forEach(pos => {
      // Create rectangle obstacle
      const obstacle = this.add.rectangle(
        pos.x, pos.y, 
        pos.width, pos.height, 
        0x00aa00, 0.7
      );
      
      // Add obstacle to physics
      this.physics.add.existing(obstacle, true); // true = static body
      
      // Add to obstacles group
      this.obstacles.add(obstacle);
    });
  }

  setupCamera() {
    // Configure camera to follow the player
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1); // Adjust zoom as needed
    
    // Set camera bounds to world bounds
    this.cameras.main.setBounds(
      0, 0, 
      GAME_CONFIG.width, 
      GAME_CONFIG.height
    );
    
    // Add camera controls for debugging/testing (can be removed for production)
    if (GAME_CONFIG.debug) {
      this.setupCameraControls();
    }
  }
  
  setupCameraControls() {
    // Add keys for camera control
    this.cameraControls = this.input.keyboard.addKeys({
      zoomIn: Phaser.Input.Keyboard.KeyCodes.Q,
      zoomOut: Phaser.Input.Keyboard.KeyCodes.E,
      reset: Phaser.Input.Keyboard.KeyCodes.R
    });
    
    // Listen for key events
    this.input.keyboard.on('keydown', (event) => {
      switch (event.code) {
        case 'KeyQ':
          this.cameras.main.zoom += 0.1;
          break;
        case 'KeyE':
          this.cameras.main.zoom -= 0.1;
          break;
        case 'KeyR':
          this.cameras.main.zoom = 1;
          break;
      }
    });
  }

  setupInput() {
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add interaction key (Space)
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.on('keydown-SPACE', this.handleInteraction, this);
    
    // Add WASD keys as alternative movement controls
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    
    // Merge WASD keys with cursor keys
    Object.keys(this.wasd).forEach(key => {
      const wasdKey = this.wasd[key];
      const cursorKey = this.cursors[key];
      
      // Override isDown getter to check both keys
      const originalIsDown = Object.getOwnPropertyDescriptor(cursorKey, 'isDown');
      Object.defineProperty(cursorKey, 'isDown', {
        get: function() {
          return originalIsDown.get.call(this) || wasdKey.isDown;
        }
      });
    });
  }

  setupCollisions() {
    // Add collision between player and obstacles
    if (this.player && this.obstacles) {
      this.physics.add.collider(this.player, this.obstacles);
    }
    
    // If using a tilemap with collision layer:
    // if (this.player && this.collisionLayer) {
    //   this.physics.add.collider(this.player, this.collisionLayer);
    // }
  }

  handleInteraction() {
    if (!this.player) return;
    
    // Get the interaction target from the player
    const interactTarget = this.player.interact();
    
    console.log('Interacting at position:', interactTarget);
    
    // Here you would check for interactive objects at the interaction position
    // For now, we'll just create a visual feedback
    this.createInteractionFeedback(interactTarget.x, interactTarget.y);
  }
  
  createInteractionFeedback(x, y) {
    // Create a simple visual feedback effect
    const circle = this.add.circle(x, y, 20, 0xffff00, 0.7);
    
    // Animate and destroy
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        circle.destroy();
      }
    });
  }
}

export default GameScene;