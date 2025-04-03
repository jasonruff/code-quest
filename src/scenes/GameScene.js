import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

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
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.setupCollisions();
    this.setupAnimations();
    
    console.log('GameScene: Main game started');
  }

  update() {
    this.handlePlayerMovement();
  }

  createWorld() {
    // Create a simple placeholder background until we have actual tilemap assets
    this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(
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
    // Create player at the start position
    const { x, y } = GAME_CONFIG.player.startPosition;
    
    this.player = this.physics.add.sprite(x, y, 'playerSheet')
      .setOrigin(0.5)
      .setDepth(10);
    
    // Set player physics properties
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 28); // Adjust collision body size
  }

  setupCamera() {
    // Configure camera to follow the player
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1); // Adjust zoom as needed
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  }

  setupInput() {
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Additional input handlers can be added here
    // this.input.keyboard.on('keydown-SPACE', this.handleInteraction, this);
  }

  setupCollisions() {
    // Set up world boundaries
    this.physics.world.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    
    // If using a tilemap with collision layer:
    // this.physics.add.collider(this.player, this.collisionLayer);
  }

  setupAnimations() {
    // Create player animations from spritesheet
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    if (!this.anims.exists('player-walk')) {
      this.anims.create({
        key: 'player-walk',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 4, end: 9 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    // Set initial animation
    this.player.anims.play('player-idle');
  }

  handlePlayerMovement() {
    // Reset velocity
    this.player.body.setVelocity(0);
    
    const speed = GAME_CONFIG.player.speed;
    let isMoving = false;
    
    // Handle horizontal movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
      this.player.flipX = true;
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
      this.player.flipX = false;
      isMoving = true;
    }
    
    // Handle vertical movement
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed);
      isMoving = true;
    }
    
    // Normalize diagonal movement speed
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.body.velocity.normalize().scale(speed);
    }
    
    // Play appropriate animation
    if (isMoving) {
      this.player.anims.play('player-walk', true);
    } else {
      this.player.anims.play('player-idle', true);
    }
  }
}

export default GameScene;