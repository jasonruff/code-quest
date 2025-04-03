import Phaser from 'phaser';

/**
 * Game State Panel
 * UI component to display game state information and provide save/load controls
 */
class GameStatePanel {
  /**
   * Create a new GameStatePanel
   * @param {Phaser.Scene} scene - The scene the panel belongs to
   * @param {GameStateManager} stateManager - The game state manager
   * @param {Object} options - Panel options
   * @param {Boolean} options.visible - Whether the panel is initially visible
   * @param {Object} options.position - Panel position {x, y}
   * @param {Number} options.width - Panel width
   * @param {String} options.align - Panel alignment ('left', 'center', 'right')
   */
  constructor(scene, stateManager, options = {}) {
    this.scene = scene;
    this.stateManager = stateManager;
    
    // Default options
    this.options = {
      visible: options.visible ?? false,
      position: options.position || {
        x: 10,
        y: 10
      },
      width: options.width || 300,
      align: options.align || 'left',
      backgroundColor: options.backgroundColor || 0x222222,
      textColor: options.textColor || 0xffffff,
      padding: options.padding || 10,
      fontSize: options.fontSize || 14
    };
    
    // Create container for all panel elements
    this.container = scene.add.container(this.options.position.x, this.options.position.y);
    
    // Create panel elements
    this.createPanel();
    
    // Subscribe to state events
    this.setupStateListeners();
    
    // Set initial visibility
    this.setVisible(this.options.visible);
  }
  
  /**
   * Create the panel UI elements
   */
  createPanel() {
    const { width, backgroundColor, padding, textColor, fontSize } = this.options;
    
    // Calculate height based on content
    const headerHeight = fontSize + padding * 2;
    const statHeight = (fontSize + padding) * 3; // Player info
    const missionHeight = (fontSize + padding) * 3; // Mission info
    const buttonHeight = fontSize + padding * 2;
    const panelHeight = headerHeight + statHeight + missionHeight + buttonHeight + padding * 4;
    
    // Background
    this.background = this.scene.add.rectangle(
      0,
      0,
      width,
      panelHeight,
      backgroundColor,
      0.9
    ).setOrigin(0, 0);
    this.container.add(this.background);
    
    // Header
    this.header = this.scene.add.text(
      padding,
      padding,
      'GAME STATE',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#4a9df8',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    this.container.add(this.header);
    
    // Close button
    this.closeButton = this.scene.add.text(
      width - padding,
      padding,
      'X',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#ff6666',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.setVisible(false);
      })
      .on('pointerover', () => {
        this.closeButton.setColor('#ff9999');
      })
      .on('pointerout', () => {
        this.closeButton.setColor('#ff6666');
      });
    this.container.add(this.closeButton);
    
    // Divider
    this.divider1 = this.scene.add.line(
      0, 
      headerHeight + padding,
      0, 
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.container.add(this.divider1);
    
    // Player info section
    this.playerInfo = this.scene.add.text(
      padding,
      headerHeight + padding * 2,
      'Player Info\nLoading...',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: `#${textColor.toString(16)}`,
        lineSpacing: 6
      }
    ).setOrigin(0, 0);
    this.container.add(this.playerInfo);
    
    // Divider
    this.divider2 = this.scene.add.line(
      0, 
      headerHeight + statHeight + padding * 2,
      0, 
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.container.add(this.divider2);
    
    // Mission info section
    this.missionInfo = this.scene.add.text(
      padding,
      headerHeight + statHeight + padding * 3,
      'Mission Info\nLoading...',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: `#${textColor.toString(16)}`,
        lineSpacing: 6
      }
    ).setOrigin(0, 0);
    this.container.add(this.missionInfo);
    
    // Divider
    this.divider3 = this.scene.add.line(
      0, 
      headerHeight + statHeight + missionHeight + padding * 3,
      0, 
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.container.add(this.divider3);
    
    // Buttons
    const buttonY = headerHeight + statHeight + missionHeight + padding * 4;
    const buttonWidth = (width - padding * 3) / 2;
    
    // Save button
    this.saveButton = this.scene.add.rectangle(
      padding,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x4a9df8,
      1
    ).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.saveGame();
      })
      .on('pointerover', () => {
        this.saveButton.setFillStyle(0x6aadff);
      })
      .on('pointerout', () => {
        this.saveButton.setFillStyle(0x4a9df8);
      });
    
    this.saveButtonText = this.scene.add.text(
      padding + buttonWidth / 2,
      buttonY + buttonHeight / 2,
      'SAVE GAME',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);
    
    // Load button
    this.loadButton = this.scene.add.rectangle(
      padding * 2 + buttonWidth,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x2ecc71,
      1
    ).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.loadGame();
      })
      .on('pointerover', () => {
        this.loadButton.setFillStyle(0x4edc91);
      })
      .on('pointerout', () => {
        this.loadButton.setFillStyle(0x2ecc71);
      });
    
    this.loadButtonText = this.scene.add.text(
      padding * 2 + buttonWidth * 1.5,
      buttonY + buttonHeight / 2,
      'LOAD GAME',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);
    
    this.container.add([
      this.saveButton, 
      this.saveButtonText, 
      this.loadButton, 
      this.loadButtonText
    ]);
    
    // Save notification
    this.notification = this.scene.add.text(
      width / 2,
      panelHeight + padding,
      '',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#4edc91',
        backgroundColor: '#00000077',
        padding: {
          x: 6,
          y: 4
        }
      }
    ).setOrigin(0.5, 0)
      .setVisible(false);
    
    this.container.add(this.notification);
    
    // Set container size
    this.containerWidth = width;
    this.containerHeight = panelHeight;
  }
  
  /**
   * Set up listeners for state changes
   */
  setupStateListeners() {
    // Update UI when state is initialized
    this.stateManager.events.on('state-initialized', () => {
      this.updateUI();
    });
    
    // Update UI when state changes
    this.stateManager.events.on('state-changed', () => {
      this.updateUI();
    });
    
    // Show notification when state is saved
    this.stateManager.events.on('state-saved', () => {
      this.showNotification('Game saved successfully', 0x4edc91);
    });
    
    // Show notification when state is loaded
    this.stateManager.events.on('state-loaded', () => {
      this.updateUI();
      this.showNotification('Game loaded successfully', 0x4edc91);
    });
    
    // Update when mission changes
    this.stateManager.events.on('mission-started', () => {
      this.updateUI();
    });
    
    this.stateManager.events.on('mission-completed', () => {
      this.updateUI();
    });
  }
  
  /**
   * Update the UI with current state information
   */
  updateUI() {
    const state = this.stateManager.getState();
    if (!state) return;
    
    // Update player info
    const player = state.player;
    this.playerInfo.setText(
      `Player: ${player.name} (Level ${player.level})\n` +
      `Exp: ${player.experience} | Missions: ${player.completedMissions.length}\n` +
      `Hints Used: ${player.hintsUsed}`
    );
    
    // Update mission info
    const mission = state.game.currentMission;
    if (mission && state.missions[mission]) {
      const missionData = state.missions[mission];
      
      let statusText = 'Unknown';
      switch (missionData.status) {
        case 'not_started':
          statusText = 'Not Started';
          break;
        case 'in_progress':
          statusText = 'In Progress';
          break;
        case 'completed':
          statusText = 'Completed';
          break;
        case 'failed':
          statusText = 'Failed';
          break;
      }
      
      this.missionInfo.setText(
        `Current Mission: ${mission}\n` +
        `Status: ${statusText}\n` +
        `Attempts: ${missionData.attempts} | Hints: ${missionData.hintsUsed}`
      );
    } else {
      this.missionInfo.setText(
        'Current Mission: None\n' +
        'Status: -\n' +
        'Attempts: 0 | Hints: 0'
      );
    }
  }
  
  /**
   * Save the game state
   */
  saveGame() {
    const success = this.stateManager.saveState();
    
    if (success) {
      this.showNotification('Game saved successfully', 0x4edc91);
    } else {
      this.showNotification('Failed to save game', 0xff6666);
    }
  }
  
  /**
   * Load the game state
   */
  loadGame() {
    const success = this.stateManager.loadState();
    
    if (success) {
      this.showNotification('Game loaded successfully', 0x4edc91);
    } else {
      this.showNotification('No saved game found', 0xffaa33);
    }
  }
  
  /**
   * Show a notification message
   * @param {String} message - The message to show
   * @param {Number} color - Color of the message (hex)
   * @param {Number} duration - How long to show the message (ms)
   */
  showNotification(message, color = 0x4edc91, duration = 2000) {
    // Update text and color
    this.notification.setText(message);
    this.notification.setColor(`#${color.toString(16)}`);
    
    // Show the notification
    this.notification.setVisible(true);
    
    // Clear any existing timer
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    
    // Set up a timer to hide the notification
    this.notificationTimer = setTimeout(() => {
      this.notification.setVisible(false);
    }, duration);
  }
  
  /**
   * Set the panel's visibility
   * @param {Boolean} visible - Whether the panel should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }
  
  /**
   * Toggle the panel's visibility
   * @returns {Boolean} The new visibility state
   */
  toggle() {
    const newState = !this.container.visible;
    this.setVisible(newState);
    return newState;
  }
  
  /**
   * Check if the panel is visible
   * @returns {Boolean} Whether the panel is visible
   */
  isVisible() {
    return this.container.visible;
  }
  
  /**
   * Update the panel
   * @param {Number} time - Current time
   * @param {Number} delta - Time since last update
   */
  update(time, delta) {
    // Any per-frame updates if needed
  }
  
  /**
   * Clean up resources when destroying the panel
   */
  destroy() {
    // Clear notification timer
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    
    // Remove event listeners
    this.saveButton.removeAllListeners();
    this.loadButton.removeAllListeners();
    this.closeButton.removeAllListeners();
    
    // Destroy the container and all children
    this.container.destroy(true);
  }
}

export default GameStatePanel;