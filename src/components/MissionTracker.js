import Phaser from 'phaser';

/**
 * Mission Tracker
 * UI component to display current mission information and progress
 */
class MissionTracker {
  /**
   * Create a new MissionTracker
   * @param {Phaser.Scene} scene - The scene the tracker belongs to
   * @param {GameStateManager} stateManager - The game state manager
   * @param {Object} options - Tracker options
   */
  constructor(scene, stateManager, options = {}) {
    this.scene = scene;
    this.stateManager = stateManager;
    
    // Default options
    this.options = {
      x: options.x || 10,
      y: options.y || 10,
      width: options.width || 300,
      backgroundColor: options.backgroundColor || 0x222222,
      textColor: options.textColor || 0xffffff,
      padding: options.padding || 10,
      fontSize: options.fontSize || 14,
      visible: options.visible !== undefined ? options.visible : true,
      minimizable: options.minimizable !== undefined ? options.minimizable : true
    };
    
    // Container for all tracker elements
    this.container = scene.add.container(this.options.x, this.options.y);
    
    // Minimized state
    this.minimized = false;
    
    // Create tracker UI
    this.createTracker();
    
    // Subscribe to state events
    this.setupStateListeners();
    
    // Set initial visibility
    this.setVisible(this.options.visible);
    
    // Initial update
    this.updateTracker();
  }
  
  /**
   * Create the tracker UI elements
   */
  createTracker() {
    const { width, backgroundColor, padding, textColor, fontSize, minimizable } = this.options;
    
    // Calculate heights
    const headerHeight = fontSize + padding * 2;
    const contentHeight = fontSize * 3 + padding * 3;
    
    // Full height for expanded mode
    this.fullHeight = headerHeight + contentHeight;
    
    // Create background
    this.background = this.scene.add.rectangle(
      0,
      0,
      width,
      this.fullHeight,
      backgroundColor,
      0.8
    ).setOrigin(0, 0);
    this.container.add(this.background);
    
    // Header text
    this.header = this.scene.add.text(
      padding,
      padding,
      'CURRENT MISSION',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#4a9df8',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    this.container.add(this.header);
    
    // Minimize/maximize button
    if (minimizable) {
      this.minimizeButton = this.scene.add.text(
        width - padding,
        padding,
        '-',
        {
          fontFamily: 'Arial',
          fontSize: `${fontSize}px`,
          color: '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.toggleMinimized();
        })
        .on('pointerover', () => {
          this.minimizeButton.setColor('#aaaaaa');
        })
        .on('pointerout', () => {
          this.minimizeButton.setColor('#ffffff');
        });
      this.container.add(this.minimizeButton);
    }
    
    // Divider
    this.divider = this.scene.add.line(
      0,
      headerHeight,
      0,
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.container.add(this.divider);
    
    // Content area
    // Mission title
    this.missionTitle = this.scene.add.text(
      padding,
      headerHeight + padding,
      'No Active Mission',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    this.container.add(this.missionTitle);
    
    // Mission description
    this.missionDescription = this.scene.add.text(
      padding,
      headerHeight + fontSize + padding * 1.5,
      'Complete missions to progress through the game.',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize - 2}px`,
        color: '#cccccc',
        wordWrap: { width: width - padding * 2 }
      }
    ).setOrigin(0, 0);
    this.container.add(this.missionDescription);
    
    // Mission status
    this.missionStatus = this.scene.add.text(
      padding,
      headerHeight + fontSize * 2 + padding * 2,
      'Status: Not Started',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize - 2}px`,
        color: '#aaaaaa'
      }
    ).setOrigin(0, 0);
    this.container.add(this.missionStatus);
    
    // Store content elements for minimizing
    this.contentElements = [
      this.divider,
      this.missionTitle,
      this.missionDescription,
      this.missionStatus
    ];
  }
  
  /**
   * Set up listeners for state events
   */
  setupStateListeners() {
    // Update when state is initialized
    this.stateManager.events.on('state-initialized', () => {
      this.updateTracker();
    });
    
    // Listen for changes to current mission
    this.stateManager.events.on('state-changed-game.currentMission', () => {
      this.updateTracker();
    });
    
    this.stateManager.events.on('state-changed-game.currentMissionState', () => {
      this.updateTracker();
    });
    
    // Update when a mission starts or completes
    this.stateManager.events.on('mission-started', () => {
      this.updateTracker();
    });
    
    this.stateManager.events.on('mission-completed', () => {
      this.updateTracker();
    });
    
    // Update when state is loaded
    this.stateManager.events.on('state-loaded', () => {
      this.updateTracker();
    });
  }
  
  /**
   * Update the tracker with current mission information
   */
  updateTracker() {
    const state = this.stateManager.getState();
    if (!state) return;
    
    const missionId = state.game.currentMission;
    
    if (missionId && state.missions[missionId]) {
      const mission = state.missions[missionId];
      
      // Format mission name (convert from ID to readable name)
      const formattedName = this.formatMissionName(missionId);
      
      // Update mission title
      this.missionTitle.setText(formattedName);
      
      // Get mission description
      const description = this.getMissionDescription(missionId);
      this.missionDescription.setText(description);
      
      // Apply special formatting for Security Initialization challenge (US-007)
      if (missionId === 'security-initialization') {
        // Check if security is already initialized
        const isSecurityInitialized = this.stateManager.getState('gameFlags.securityInitialized') || false;
        
        if (isSecurityInitialized) {
          // Highlight completed security challenge
          this.missionTitle.setColor('#4edc91');
          
          // Add a success icon if we don't have one yet
          if (!this.securitySuccessIcon) {
            this.securitySuccessIcon = this.scene.add.text(
              this.missionTitle.x + this.missionTitle.width + 10,
              this.missionTitle.y + 2,
              '✓',
              {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#4edc91',
                fontStyle: 'bold'
              }
            );
            this.container.add(this.securitySuccessIcon);
          }
        } else {
          // Highlight active security challenge
          this.missionTitle.setColor('#ffcc00');
          
          // Pulse effect for ongoing security mission
          if (!this.missionTitleTween) {
            this.missionTitleTween = this.scene.tweens.add({
              targets: this.missionTitle,
              alpha: 0.7,
              duration: 800,
              yoyo: true,
              repeat: -1
            });
          }
        }
      } else {
        // Reset formatting for other missions
        this.missionTitle.setColor('#ffffff');
        
        // Stop any active tweens
        if (this.missionTitleTween) {
          this.missionTitleTween.stop();
          this.missionTitleTween = null;
          this.missionTitle.setAlpha(1);
        }
        
        // Remove success icon if it exists
        if (this.securitySuccessIcon) {
          this.securitySuccessIcon.destroy();
          this.securitySuccessIcon = null;
        }
      }
      
      // Format status
      let statusText = 'Unknown';
      let statusColor = '#aaaaaa';
      
      switch (mission.status) {
        case 'not_started':
          statusText = 'Not Started';
          statusColor = '#aaaaaa';
          break;
        case 'in_progress':
          statusText = 'In Progress';
          statusColor = '#4a9df8';
          break;
        case 'completed':
          statusText = 'Completed';
          statusColor = '#4edc91';
          break;
        case 'failed':
          statusText = 'Failed';
          statusColor = '#ff6666';
          break;
      }
      
      // Update status text
      this.missionStatus.setText(`Status: ${statusText}`);
      this.missionStatus.setColor(statusColor);
    } else {
      // No active mission
      this.missionTitle.setText('No Active Mission');
      this.missionDescription.setText('Complete missions to progress through the game.');
      this.missionStatus.setText('Status: Not Started');
      this.missionStatus.setColor('#aaaaaa');
      
      // Stop any active tweens
      if (this.missionTitleTween) {
        this.missionTitleTween.stop();
        this.missionTitleTween = null;
        this.missionTitle.setAlpha(1);
      }
      
      // Remove success icon if it exists
      if (this.securitySuccessIcon) {
        this.securitySuccessIcon.destroy();
        this.securitySuccessIcon = null;
      }
    }
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
  
  /**
   * Get a description for a mission
   * @param {String} missionId - The mission ID
   * @returns {String} Mission description
   */
  getMissionDescription(missionId) {
    if (!missionId) return '';
    
    // Enhanced description for Security Initialization (US-007)
    if (missionId === 'security-initialization') {
      // Check if security is already initialized
      const isSecurityInitialized = this.stateManager.getState('gameFlags.securityInitialized') || false;
      
      if (isSecurityInitialized) {
        return 'Security system successfully activated with code "9876". The main exit is now unlocked.';
      } else {
        return 'OBJECTIVE: Find and interact with the Security Terminal. Initialize a variable called securityCode and set its value to "9876" to activate the security system.';
      }
    }
    
    // Custom descriptions for other missions
    const descriptions = {
      'logic-gates': 'Create logical conditions to route the power through the correct gates.',
      'variable-declaration': 'Declare and initialize variables with different data types.',
      'function-basics': 'Create functions to automate repetitive tasks.',
      'conditional-statements': 'Use if/else statements to control program flow.',
      'loops-intro': 'Use loops to repeat code operations efficiently.',
      'array-operations': 'Process data arrays using array methods and transformations.'
    };
    
    return descriptions[missionId] || 'Complete this mission to progress in the game.';
  }
  
  /**
   * Toggle between minimized and expanded states
   */
  toggleMinimized() {
    this.minimized = !this.minimized;
    
    // Update the minimize button text
    if (this.minimizeButton) {
      this.minimizeButton.setText(this.minimized ? '+' : '-');
    }
    
    // Show/hide content elements
    this.contentElements.forEach(element => {
      element.setVisible(!this.minimized);
    });
    
    // Resize background
    const height = this.minimized
      ? this.options.fontSize + this.options.padding * 2 // Header height only
      : this.fullHeight;
    
    this.background.height = height;
  }
  
  /**
   * Set the tracker's visibility
   * @param {Boolean} visible - Whether the tracker should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }
  
  /**
   * Toggle the tracker's visibility
   * @returns {Boolean} The new visibility state
   */
  toggle() {
    const newState = !this.container.visible;
    this.setVisible(newState);
    return newState;
  }
  
  /**
   * Set the tracker's position
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPosition(x, y) {
    this.container.setPosition(x, y);
  }
  
  /**
   * Update the tracker
   * @param {Number} time - Current time
   * @param {Number} delta - Time since last update
   */
  update(time, delta) {
    // Any per-frame updates if needed
  }
  
  /**
   * Clean up resources when destroying the tracker
   */
  destroy() {
    // Remove event listeners
    if (this.minimizeButton) {
      this.minimizeButton.removeAllListeners();
    }
    
    // Destroy the container and all children
    this.container.destroy(true);
    
    // Unsubscribe from events
    this.stateManager.events.off('state-initialized', this.updateTracker, this);
    this.stateManager.events.off('state-changed-game.currentMission', this.updateTracker, this);
    this.stateManager.events.off('state-changed-game.currentMissionState', this.updateTracker, this);
    this.stateManager.events.off('mission-started', this.updateTracker, this);
    this.stateManager.events.off('mission-completed', this.updateTracker, this);
    this.stateManager.events.off('state-loaded', this.updateTracker, this);
  }
}

export default MissionTracker;