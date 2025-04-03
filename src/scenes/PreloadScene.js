import Phaser from 'phaser';
import TilesetGenerator from '../utils/tilesetGenerator';

/**
 * Preload scene - handles loading all game assets
 * Shows loading progress and transitions to the main game scene
 */
class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
    this.loadingText = null;
    this.progressBar = null;
    this.progressBarFill = null;
    this.tilesetGenerator = null;
  }

  preload() {
    this.createLoadingUI();
    this.setupLoadingEvents();
    
    // Create tileset generator
    this.tilesetGenerator = new TilesetGenerator(this);
    
    // Load all game assets here
    this.loadImages();
    this.loadSpritesheets();
    this.loadAudio();
    this.loadTilemaps();
    this.loadFonts();
  }

  create() {
    console.log('PreloadScene: All assets loaded');
    
    // Generate placeholder tilesets if needed
    this.generatePlaceholderAssets();
    
    // Start the game scene
    this.scene.start('GameScene');
  }

  createLoadingUI() {
    // Create loading UI elements
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Logo
    this.add.image(width / 2, height / 3, 'logo')
      .setDisplaySize(320, 240);
    
    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Progress bar background
    this.progressBar = this.add.image(width / 2, height / 2 + 50, 'progressBar')
      .setOrigin(0.5);
    
    // Progress bar fill (will be cropped during loading)
    this.progressBarFill = this.add.image(
      this.progressBar.x - this.progressBar.width / 2,
      this.progressBar.y,
      'progressBarFill'
    )
      .setOrigin(0, 0.5)
      .setVisible(false);
  }

  setupLoadingEvents() {
    // Set up loading progress events
    this.load.on('progress', (value) => {
      // Update progress bar fill
      this.progressBarFill.setVisible(true);
      this.progressBarFill.displayWidth = this.progressBar.width * value;
      
      // Update loading text with percentage
      const percent = Math.round(value * 100);
      this.loadingText.setText(`Loading... ${percent}%`);
    });
    
    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBarFill.destroy();
      this.loadingText.destroy();
    });
  }

  loadImages() {
    // Load individual images
    this.load.image('tileset', 'assets/images/tileset-placeholder.png');
    this.load.image('player', 'assets/images/player-placeholder.png');
    this.load.image('background', 'assets/images/background-placeholder.png');
  }

  loadSpritesheets() {
    // Load sprite sheets
    this.load.spritesheet('playerSheet', 
      'assets/images/player-spritesheet-placeholder.png',
      { frameWidth: 32, frameHeight: 32 }
    );
  }

  loadAudio() {
    // Load audio files
    this.load.audio('bgMusic', 'assets/audio/background-music-placeholder.mp3');
    this.load.audio('sfxButton', 'assets/audio/button-click-placeholder.mp3');
    this.load.audio('sfxInteract', 'assets/audio/interact-placeholder.mp3');
  }

  loadTilemaps() {
    // Load tilemaps
    this.load.tilemapTiledJSON('level1', 'assets/tilemaps/level1-placeholder.json');
    this.load.tilemapTiledJSON('command-center', 'assets/tilemaps/command-center.json');
  }
  
  loadFonts() {
    // Note: Custom fonts should be loaded via CSS
    // This method is for preloading font textures if needed
  }
  
  /**
   * Generate placeholder assets for development
   */
  generatePlaceholderAssets() {
    // Generate sci-fi tileset
    this.tilesetGenerator.generateSciFiTileset('sci-fi-tileset', 32, 10, 10);
    
    // Create sound effects for interactions
    if (!this.cache.audio.exists('sfxInteract')) {
      this.createPlaceholderSounds();
    }
  }
  
  /**
   * Create placeholder sound effects
   */
  createPlaceholderSounds() {
    // Create a sound effect for interactions
    const audioContext = this.sound.context;
    const buffer = audioContext.createBuffer(1, 2048, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    
    // Generate a simple beep sound
    for (let i = 0; i < 2048; i++) {
      channel[i] = Math.sin(i * 0.05) * (1 - i / 2048);
    }
    
    // Add the buffer to the cache
    this.cache.audio.add('sfxInteract', buffer);
  }
}

export default PreloadScene;