import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import Player from '../entities/Player';
import TilemapManager from '../utils/tilemapManager';
import DialogBox from '../components/DialogBox';
import InteractiveObject from '../entities/InteractiveObject';
import GameStateManager from '../utils/GameStateManager';
import GameStatePanel from '../components/GameStatePanel';
import MissionTracker from '../components/MissionTracker';
import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import ByteAssistant from '../components/ByteAssistant';
import ByteInteractionUI from '../components/ByteInteractionUI';
import { initCodeChallengeSystem, createCodeChallengeTerminal } from '../utils/codeChallengeSystem';

/**
 * Main game scene
 * Handles the core gameplay, including movement, physics, and interactions
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.cursors = null;
    this.tilemapManager = null;
    this.dialogBox = null;
    this.interactiveObjects = [];
    this.nearbyInteractiveObject = null;
    this.interactionIndicator = null;
    this.interactionEnabled = true;
    
    // Game state manager
    this.stateManager = null;
    
    // Code challenge system
    this.codeSystem = null;
    
    // UI components
    this.gameStatePanel = null;
    this.missionTracker = null;
    this.playerStatusDisplay = null;
    this.byteAssistant = null;
    this.byteInteractionUI = null;
    
    // Time tracking
    this.lastUpdateTime = 0;
  }

  create() {
    // Store game config in registry for access from other entities
    this.registry.set('GAME_CONFIG', GAME_CONFIG);
    
    // Initialize game state manager
    this.initializeGameState();
    
    // Initialize code challenge system
    this.initializeCodeSystem();
    
    // Initialize the tilemap manager
    this.tilemapManager = new TilemapManager(this);
    
    // Create the world
    this.createWorld();
    
    // Create the player
    this.createPlayer();
    
    // Create UI elements
    this.createUI();
    
    // Setup camera
    this.setupCamera();
    
    // Setup input
    this.setupInput();
    
    // Setup collisions
    this.setupCollisions();
    
    // Setup interaction detection
    this.setupInteractionDetection();
    
    // Play background music
    this.playBackgroundMusic();
    
    // Set initial time for updates
    this.lastUpdateTime = this.time.now;
    
    console.log('GameScene: Main game started');
  }
  
  /**
   * Initialize the game state manager
   */
  initializeGameState() {
    // Create the state manager
    this.stateManager = new GameStateManager(this);
    
    // Initialize the state (this will attempt to load saved state)
    this.stateManager.init();
    
    // Listen for key events to access state panel
    this.input.keyboard.on('keydown-TAB', this.toggleGameStatePanel, this);
    
    // Set up event listeners for transitions
    this.setupStateTransitionListeners();
  }
  
  /**
   * Set up listeners for state transitions
   */
  setupStateTransitionListeners() {
    // When a mission is started
    this.stateManager.events.on('mission-started', (missionId) => {
      console.log(`Mission started: ${missionId}`);
      // You could trigger cutscenes, dialog, etc. here
    });
    
    // When a mission is completed
    this.stateManager.events.on('mission-completed', (data) => {
      console.log(`Mission completed: ${data.missionId}`);
      
      // Show completion dialog
      this.showMissionCompleteDialog(data.missionId);
    });
    
    // When player levels up
    this.stateManager.events.on('player-leveled-up', (data) => {
      console.log(`Level up: ${data.oldLevel} -> ${data.newLevel}`);
      
      // Play level up sound if available
      if (this.sound.get('levelUp')) {
        this.sound.play('levelUp', { volume: 0.5 });
      }
    });
  }

  update(time, delta) {
    // Update player if it exists
    if (this.player) {
      this.player.update(this.cursors);
      
      // Save player position to state
      if (this.stateManager && this.player) {
        this.stateManager.savePlayerPosition(
          this.player.x,
          this.player.y,
          this.player.getDirection(),
          'command-center' // Current map name
        );
      }
    }
    
    // Check for nearby interactive objects
    this.checkNearbyInteractiveObjects();
    
    // Update dialog box if visible
    if (this.dialogBox && this.dialogBox.isVisible()) {
      this.dialogBox.update();
    }
    
    // Update UI components
    if (this.missionTracker) {
      this.missionTracker.update(time, delta);
    }
    
    if (this.playerStatusDisplay) {
      this.playerStatusDisplay.update(time, delta);
    }
    
    if (this.gameStatePanel) {
      this.gameStatePanel.update(time, delta);
    }
    
    // Update play time in state manager
    if (this.stateManager) {
      // Calculate time since last update
      const timeDelta = time - this.lastUpdateTime;
      this.stateManager.updatePlayTime(timeDelta);
      this.lastUpdateTime = time;
    }
    
    // Update camera boundaries if needed (to ensure UI elements stay in view)
    this.updateCameraBounds();
  }

  createWorld() {
    // Create the Command Center level
    this.createCommandCenterLevel();
  }
  
  createCommandCenterLevel() {
    // Load the command center tilemap
    this.tilemapManager.loadTilemap('command-center', {
      tilesets: [
        { name: 'command-center-tileset', key: 'command-center-tileset' }
      ],
      layers: ['floor', 'walls', 'objects'],
      collisionLayers: ['walls', 'objects']
    });
    
    // Set world bounds based on the tilemap
    const mapWidth = this.tilemapManager.map.widthInPixels;
    const mapHeight = this.tilemapManager.map.heightInPixels;
    
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    
    // Create interactive objects from the tilemap
    this.createInteractiveObjects();
  }
  
  createInteractiveObjects() {
    // Get interactive objects from the tilemap
    const interactiveLayer = this.tilemapManager.map.getObjectLayer('interactive');
    
    if (!interactiveLayer) return;
    
    // Create an interactive object for each object in the layer
    interactiveLayer.objects.forEach(object => {
      const { x, y, width, height, name, type, properties } = object;
      
      // Convert properties array to object
      const props = {};
      if (properties && properties.length > 0) {
        properties.forEach(prop => {
          props[prop.name] = prop.value;
        });
      }
      
      // Special handling for code terminals
      if (type === 'code-terminal') {
        // Create a code challenge terminal
        const terminal = createCodeChallengeTerminal(this, {
          x: x + width / 2,
          y: y + height / 2,
          width: width,
          height: height,
          name: name || 'Code Terminal',
          message: props.message || 'Press SPACE to start coding challenge',
          challengeId: props.codeChallenge,
          missionId: props.missionId,
          skillType: props.skillType
        });
        
        // Add to interactive objects array
        this.interactiveObjects.push(terminal);
      } else {
        // Create standard interactive object
        const interactiveObj = new InteractiveObject(
          this,
          x + width / 2,
          y + height / 2,
          width,
          height,
          {
            name,
            type,
            properties: props
          }
        );
        
        // Add to interactive objects array
        this.interactiveObjects.push(interactiveObj);
      }
    });
    
    // Create the security initialization challenge terminal (US-007)
    const securityTerminal = createCodeChallengeTerminal(this, {
      x: 192,
      y: 160,
      width: 50,
      height: 50,
      name: 'Security Terminal',
      message: 'Security systems offline. Initialize the security code to proceed.',
      challengeId: 'security-initialization',
      missionId: 'security-initialization',
      skillType: 'variables'
    });
    
    this.interactiveObjects.push(securityTerminal);
    
    // Create additional test terminals if in debug mode
    if (GAME_CONFIG.debug) {
      const testTerminal = createCodeChallengeTerminal(this, {
        x: 600,
        y: 350,
        width: 50,
        height: 50,
        name: 'Test Terminal',
        message: 'Press SPACE to try other coding challenges',
        challengeId: 'variable-declaration',
        missionId: 'variable-declaration'
      });
      
      this.interactiveObjects.push(testTerminal);
    }
  }

  createPlayer() {
    // Get player spawn location from tilemap
    let spawnPosition = this.tilemapManager.getPlayerSpawnPoint();
    
    // Fall back to config values if no spawn point found
    if (!spawnPosition) {
      spawnPosition = GAME_CONFIG.player.startPosition;
    }
    
    // Create player instance
    this.player = new Player(this, spawnPosition.x, spawnPosition.y);
    
    // Create interaction indicator above player
    this.createInteractionIndicator();
  }
  
  createInteractionIndicator() {
    // Create an indicator that appears when near interactive objects
    this.interactionIndicator = this.add.text(0, 0, 'Press SPACE to interact', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: {
        x: 4,
        y: 2
      }
    })
      .setOrigin(0.5, 1)
      .setVisible(false);
  }
  
  createUI() {
    // Create the dialog box
    this.dialogBox = new DialogBox(this);
    
    // Create game state panel
    this.gameStatePanel = new GameStatePanel(this, this.stateManager, {
      visible: false // Hidden by default, toggle with TAB key
    });
    
    // Create mission tracker
    this.missionTracker = new MissionTracker(this, this.stateManager, {
      x: 10,
      y: 10,
      width: 300
    });
    
    // Create player status display
    this.playerStatusDisplay = new PlayerStatusDisplay(this, this.stateManager, {
      x: this.cameras.main.width - 10,
      y: 10,
      width: 200
    });
    
    // Create Byte assistant with Claude API integration
    this.byteAssistant = new ByteAssistant(this, {
      x: this.cameras.main.width - 70,
      y: this.cameras.main.height - 70,
      scale: 0.8,
      // API key would normally come from environment variables or secure storage
      apiKey: process.env.CLAUDE_API_KEY || 'API_KEY_PLACEHOLDER'
    });
    
    // Set up Byte assistant event handling
    this.setupByteAssistantEvents();
  }
  
  /**
   * Toggle the game state panel
   */
  toggleGameStatePanel() {
    if (this.gameStatePanel) {
      this.gameStatePanel.toggle();
    }
  }
  
  /**
   * Show mission complete dialog
   * @param {String} missionId - ID of the completed mission
   */
  showMissionCompleteDialog(missionId) {
    // Format mission name
    const formattedName = this.formatMissionName(missionId);
    
    // Show dialog
    this.dialogBox.show(
      `Mission Complete: ${formattedName}\n\nYou have successfully completed this mission! Your progress has been saved.`,
      'Mission System',
      () => {
        // Enable interaction after dialog is closed
        this.interactionEnabled = true;
      }
    );
    
    // Disable interaction while dialog is shown
    this.interactionEnabled = false;
  }
  
  /**
   * Format a mission ID into a readable name
   * @param {String} missionId - The mission ID
   * @returns {String} Formatted mission name
   */
  formatMissionName(missionId) {
    if (!missionId) return 'Unknown Mission';
    
    // Custom formatting for known missions
    const missionNames = {
      'security-initialization': 'Security Initialization',
      'logic-gates': 'Logic Gates',
      'variable-declaration': 'Variable Declaration',
      'function-basics': 'Function Basics',
      'conditional-statements': 'Conditional Statements',
      'loops-intro': 'Introduction to Loops'
    };
    
    // Return custom name if available, otherwise format the ID
    return missionNames[missionId] || missionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  setupCamera() {
    // Configure camera to follow the player
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1); // Adjust zoom as needed
    
    // Set camera bounds to world bounds
    const bounds = this.physics.world.bounds;
    this.cameras.main.setBounds(
      bounds.x, bounds.y, 
      bounds.width, bounds.height
    );
    
    // Add camera controls for debugging/testing
    if (GAME_CONFIG.debug) {
      this.setupCameraControls();
    }
  }
  
  /**
   * Update camera bounds to ensure UI elements stay visible
   */
  updateCameraBounds() {
    // Ensure Byte Assistant stays within camera view (as it's fixed to the camera)
    if (this.byteAssistant) {
      const cameraView = this.cameras.main.worldView;
      this.byteAssistant.setPosition(
        cameraView.right - 70,
        cameraView.bottom - 70
      );
    }
    
    // Update ByteInteractionUI position
    if (this.byteInteractionUI) {
      const cameraView = this.cameras.main.worldView;
      this.byteInteractionUI.setPosition(
        10,
        cameraView.bottom - 60
      );
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
    // Set up collisions between player and tilemap
    if (this.player && this.tilemapManager) {
      this.tilemapManager.setupCollisions(this.player);
    }
  }
  
  setupInteractionDetection() {
    // Add an overlap check between player and interactive objects
    this.interactiveObjects.forEach(obj => {
      this.physics.add.overlap(this.player, obj, () => {
        // Set this object as the nearby interactive object
        if (this.nearbyInteractiveObject !== obj) {
          // Clear highlight on previous object
          if (this.nearbyInteractiveObject) {
            this.nearbyInteractiveObject.setHighlight(false);
          }
          
          // Set new nearby object and highlight it
          this.nearbyInteractiveObject = obj;
          obj.setHighlight(true);
          
          // Show interaction indicator
          this.updateInteractionIndicator(true);
        }
      });
    });
  }
  
  checkNearbyInteractiveObjects() {
    if (!this.player || !this.interactiveObjects.length) return;
    
    // Check if player is still near the interactive object
    let isNearAny = false;
    
    if (this.nearbyInteractiveObject) {
      const obj = this.nearbyInteractiveObject;
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        obj.x, obj.y
      );
      
      // Check if player is still within interaction distance
      isNearAny = distance < GAME_CONFIG.player.interactionDistance;
      
      // Clear highlight if no longer near
      if (!isNearAny) {
        this.nearbyInteractiveObject.setHighlight(false);
        this.nearbyInteractiveObject = null;
      }
    }
    
    // Update interaction indicator
    this.updateInteractionIndicator(isNearAny);
  }
  
  updateInteractionIndicator(show) {
    if (!this.interactionIndicator || !this.player) return;
    
    // Show/hide the indicator
    this.interactionIndicator.setVisible(show && this.interactionEnabled);
    
    // Update position above player
    if (show && this.interactionEnabled) {
      this.interactionIndicator.setPosition(
        this.player.x,
        this.player.y - 32
      );
    }
  }
  
  playBackgroundMusic() {
    // Play background music if available
    if (this.sound.get('bgMusic')) {
      this.sound.play('bgMusic', {
        loop: true,
        volume: 0.5
      });
    }
  }

  handleInteraction() {
    // Check if interaction is enabled and player exists
    if (!this.interactionEnabled || !this.player) return;
    
    // Check if there's a nearby interactive object
    if (this.nearbyInteractiveObject) {
      // Get interaction result
      const result = this.nearbyInteractiveObject.interact();
      
      if (result) {
        // Play interaction sound
        this.sound.play('sfxInteract', { volume: 0.5 });
        
        // Process any mission-related interaction
        this.processInteraction(result);
        
        // Check if this interaction should launch a code challenge
        if (result.properties && result.properties.codeChallenge) {
          // Launch code challenge scene with the specified challenge ID
          this.launchCodeChallenge(result.properties.codeChallenge);
        } else {
          // Show dialog for the interaction
          this.showInteractionDialog(result);
        }
      }
    } else {
      // If no nearby object, check for an object in front of the player
      const interactTarget = this.player.interact();
      
      console.log('Interacting at position:', interactTarget);
      
      // Create a visual feedback effect
      this.createInteractionFeedback(interactTarget.x, interactTarget.y);
    }
  }
  
  /**
   * Process interaction for mission progress
   * @param {Object} interactionResult - The result of the interaction
   */
  processInteraction(interactionResult) {
    if (!this.stateManager || !interactionResult) return;
    
    // Special handling for door interactions after security initialization (US-007)
    if (interactionResult.type === 'door' && interactionResult.properties) {
      const isSecurityInitialized = this.stateManager.getState('gameFlags.securityInitialized') || false;
      
      // Override the message if security is initialized and door was locked
      if (isSecurityInitialized && interactionResult.properties.locked) {
        // Update door properties to be unlocked
        interactionResult.properties.locked = false;
        interactionResult.message = "The door is now unlocked. You can proceed to the next area.";
        
        // Play an unlocking sound
        if (this.sound.get('sfxInteract')) {
          this.sound.play('sfxInteract', { volume: 0.5 });
        }
      }
    }
    
    // Check if this interaction has a mission ID
    if (interactionResult.properties && interactionResult.properties.missionId) {
      const missionId = interactionResult.properties.missionId;
      
      // Get current mission from state
      const currentMission = this.stateManager.getState('game.currentMission');
      
      if (!currentMission) {
        // If no mission is active, start this one
        this.stateManager.startMission(missionId);
        
        // Special handling for security initialization mission (US-007)
        if (missionId === 'security-initialization') {
          this.showFloatingText("Initialize the security system", 3000);
        }
      } else if (currentMission === missionId) {
        // If this is the current mission, handle progression
        // For code challenges, completion is handled in the CodeChallengeScene
        
        // For non-code challenges or testing, we can still simulate completing the mission directly
        if (interactionResult.properties.completeMission && !interactionResult.properties.codeChallenge) {
          this.stateManager.completeMission(missionId, {
            experience: 100,
            skills: {
              [interactionResult.properties.skillType || 'variables']: 1
            }
          });
        }
      }
    }
  }
  
  showInteractionDialog(interactionResult) {
    // Disable interaction while dialog is shown
    this.interactionEnabled = false;
    this.updateInteractionIndicator(false);
    
    // Get speaker name based on object type
    let speaker = '';
    switch (interactionResult.type) {
      case 'computer':
        speaker = 'Computer Terminal';
        break;
      case 'terminal':
        speaker = 'System Interface';
        break;
      case 'screen':
        speaker = 'Display Screen';
        break;
      case 'door':
        speaker = 'Door Control';
        break;
      default:
        speaker = interactionResult.name;
    }
    
    // Show dialog with the interaction message
    this.dialogBox.show(
      interactionResult.message,
      speaker,
      () => {
        // Re-enable interaction after dialog is closed
        this.interactionEnabled = true;
        this.updateInteractionIndicator(this.nearbyInteractiveObject !== null);
      }
    );
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
  
  /**
   * Initialize the code challenge system
   */
  initializeCodeSystem() {
    // Create code challenge system and store reference
    this.codeSystem = initCodeChallengeSystem(this, this.stateManager);
    
    // Listen for challenge completion events
    this.events.on('challenge-completed', this.handleChallengeCompleted, this);
  }
  
  /**
   * Handle when a challenge is completed
   * @param {Object} data - Challenge completion data
   */
  handleChallengeCompleted(data) {
    console.log(`Challenge completed: ${data.challengeId}`);
    
    // Special handling for Security Initialization challenge (US-007)
    if (data.challengeId === 'security-initialization') {
      this.handleSecurityInitialized();
    } else if (this.byteAssistant) {
      // For other challenges, have Byte give a congratulatory message
      this.byteAssistant.say(
        `Well done! You've completed the ${this.formatMissionName(data.challengeId)} challenge successfully.`,
        { mood: 'happy', duration: 4000 }
      );
    }
    
    // You could trigger other mission progression, unlocks, or other game events here
  }
  
  /**
   * Handle the security initialization completion
   * Special effects and world changes for US-007
   */
  handleSecurityInitialized() {
    // Add visual effects to show security system activation
    this.showSecurityActivationEffects();
    
    // Update game state for door unlocking
    if (this.stateManager) {
      this.stateManager.setState('gameFlags.securityInitialized', true);
      this.stateManager.saveState();
    }
    
    // Play success sound
    if (this.sound.get('sfxInteract')) {
      this.sound.play('sfxInteract', { volume: 0.7 });
    }
    
    // Show dialog with instructions
    this.dialogBox.show(
      "Security systems initialized! Access code '9876' accepted. You have unlocked access to the main facility.",
      "Security System",
      () => {
        // After dialog closes, show hint for next steps
        this.time.delayedCall(1000, () => {
          this.showFloatingText("Door unlocked! Proceed to the exit.", 3000);
          
          // Have Byte assistant congratulate the player
          if (this.byteAssistant) {
            this.time.delayedCall(800, () => {
              this.byteAssistant.say(
                "Great job initializing the security system! You've shown excellent skill with variable declaration.", 
                { mood: 'happy', duration: 5000 }
              );
            });
          }
        });
      }
    );
  }
  
  /**
   * Show security activation visual effects throughout the room
   */
  showSecurityActivationEffects() {
    // Create a security activation wave effect
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Create wave effect
    const circle = this.add.circle(centerX, centerY, 10, 0x00ff00, 0.3);
    circle.setDepth(1000);
    
    // Animate it
    this.tweens.add({
      targets: circle,
      radius: 1000,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        circle.destroy();
      }
    });
    
    // Add flashing lights on terminals
    this.interactiveObjects.forEach(obj => {
      if (obj.type === 'terminal' || obj.type === 'computer') {
        // Create a flash effect
        const flash = this.add.rectangle(obj.x, obj.y, 32, 32, 0x00ff00, 0.8);
        flash.setDepth(100);
        
        // Animate the flash
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 500,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            flash.destroy();
          }
        });
      }
    });
  }
  
  /**
   * Show floating text as a gameplay hint
   * @param {String} text - The text to show
   * @param {Number} duration - How long to show it in ms
   */
  showFloatingText(text, duration = 2000) {
    const x = this.cameras.main.worldView.centerX;
    const y = this.cameras.main.worldView.centerY - 100;
    
    const floatingText = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);
    
    // Fade in and then out
    this.tweens.add({
      targets: floatingText,
      alpha: 1,
      y: y - 20,
      ease: 'Power1',
      duration: 500,
      onComplete: () => {
        this.tweens.add({
          targets: floatingText,
          alpha: 0,
          y: y - 40,
          ease: 'Power1',
          duration: 500,
          delay: duration - 1000,
          onComplete: () => {
            floatingText.destroy();
          }
        });
      }
    });
  }
  
  /**
   * Launch the code challenge scene with the specified challenge ID
   * @param {String} challengeId - ID of the challenge to launch
   */
  launchCodeChallenge(challengeId) {
    // Have Byte give an encouraging message before starting the challenge
    if (this.byteAssistant) {
      this.byteAssistant.say(
        "Ready to tackle a coding challenge? I'll be here to help if you need it!", 
        { mood: 'excited', duration: 3000, onComplete: () => {
          this.startCodeChallenge(challengeId);
        }}
      );
    } else {
      this.startCodeChallenge(challengeId);
    }
  }
  
  /**
   * Start the actual code challenge scene
   * @param {String} challengeId - Challenge ID to launch
   */
  startCodeChallenge(challengeId) {
    if (this.codeSystem) {
      // Use the code system to launch the challenge
      this.codeSystem.launchChallenge(challengeId);
    } else {
      // Fallback to direct scene management if code system isn't initialized
      this.scene.pause();
      
      this.scene.launch('CodeChallengeScene', {
        challengeId: challengeId,
        previousScene: 'GameScene',
        stateManager: this.stateManager,
        byteAssistant: this.byteAssistant
      });
    }
    
    // Disable interaction while in the code challenge
    this.interactionEnabled = false;
  }
    /**
   * Set up Byte assistant event handling and interaction UI
   */
  setupByteAssistantEvents() {
    // Listen for click events
    this.events.on('byte-click', this.handleByteClick, this);
    
    // Create ByteInteractionUI
    this.byteInteractionUI = new ByteInteractionUI(this, this.byteAssistant, {
      x: 10,
      y: this.cameras.main.height - 60,
      width: 160,
      height: 45,
      buttonText: 'Ask Byte'
    });
    
    // Introduce Byte at the start of the game (with a delay)
    this.time.delayedCall(2000, () => {
      if (this.byteAssistant) {
        this.byteAssistant.say(
          "Hello! I'm Byte, your AI assistant. I'll help you navigate the challenges in this coding adventure! Click the 'Ask Byte' button anytime you need assistance.",
          { mood: 'excited', duration: 8000 }
        );
      }
    });
  }
  
  /**
   * Handle when the player clicks on Byte
   * @param {Object} data - Click event data
   */
  handleByteClick(data) {
    // Show a tip or hint when Byte is clicked
    const tips = [
      "Remember to initialize your variables before using them!",
      "Need help with a challenge? Click the Hints button in the code editor.",
      "Different challenges require different coding skills. Practice each one!",
      "You can open the game state panel with the TAB key to see your progress.",
      "Always check that your code matches the requirements exactly!"
    ];
    
    // Pick a random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Display the tip
    data.assistant.say(randomTip, { mood: 'happy', duration: 5000 });
  }

  shutdown() {
    // First, save the current state
    if (this.stateManager) {
      this.stateManager.saveState();
    }
    
    // Cleanup UI components
    if (this.gameStatePanel) {
      this.gameStatePanel.destroy();
    }
    
    if (this.missionTracker) {
      this.missionTracker.destroy();
    }
    
    if (this.playerStatusDisplay) {
      this.playerStatusDisplay.destroy();
    }
    
    if (this.dialogBox) {
      this.dialogBox.destroy();
    }
    
    if (this.byteAssistant) {
      this.byteAssistant.destroy();
    }
    
    if (this.byteInteractionUI) {
      this.byteInteractionUI.destroy();
    }
    
    // Cleanup code challenge event listeners
    this.events.off('challenge-completed', this.handleChallengeCompleted, this);
    this.events.off('byte-click', this.handleByteClick, this);
    
    // Cleanup state manager
    if (this.stateManager) {
      this.stateManager.destroy();
    }
    
    // Remove event listeners
    this.input.keyboard.off('keydown-TAB', this.toggleGameStatePanel, this);
    
    // Call parent cleanup
    super.shutdown();
  }
}

export default GameScene;