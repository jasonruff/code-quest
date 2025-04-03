import Phaser from 'phaser';
import ProgressBar from './ProgressBar';

/**
 * Player Status Display
 * UI component to display player information like level, experience, and skills
 */
class PlayerStatusDisplay {
  /**
   * Create a new PlayerStatusDisplay
   * @param {Phaser.Scene} scene - The scene the display belongs to
   * @param {GameStateManager} stateManager - The game state manager
   * @param {Object} options - Display options
   */
  constructor(scene, stateManager, options = {}) {
    this.scene = scene;
    this.stateManager = stateManager;
    
    // Default options
    this.options = {
      x: options.x || scene.cameras.main.width - 10,
      y: options.y || 10,
      width: options.width || 200,
      backgroundColor: options.backgroundColor || 0x222222,
      textColor: options.textColor || 0xffffff,
      padding: options.padding || 10,
      fontSize: options.fontSize || 14,
      visible: options.visible !== undefined ? options.visible : true,
      minimizable: options.minimizable !== undefined ? options.minimizable : true,
      showSkills: options.showSkills !== undefined ? options.showSkills : true
    };
    
    // Create container for all display elements
    this.container = scene.add.container(this.options.x, this.options.y);
    
    // Minimized state
    this.minimized = false;
    
    // Create display UI
    this.createDisplay();
    
    // Subscribe to state events
    this.setupStateListeners();
    
    // Set initial visibility
    this.setVisible(this.options.visible);
    
    // Initial update
    this.updateDisplay();
  }
  
  /**
   * Create the display UI elements
   */
  createDisplay() {
    const { width, backgroundColor, padding, textColor, fontSize, minimizable } = this.options;
    
    // Calculate heights
    const headerHeight = fontSize + padding * 2;
    const playerInfoHeight = fontSize * 2 + padding * 2;
    const expBarHeight = 15 + padding * 2;
    const skillsHeight = this.options.showSkills ? (fontSize + 10) * 5 + padding * 2 : 0;
    
    // Full height for expanded mode
    this.fullHeight = headerHeight + playerInfoHeight + expBarHeight + skillsHeight;
    
    // Create background
    this.background = this.scene.add.rectangle(
      0,
      0,
      width,
      this.fullHeight,
      backgroundColor,
      0.8
    ).setOrigin(1, 0); // Right-aligned
    this.container.add(this.background);
    
    // Container for content to adjust for right alignment
    this.contentContainer = this.scene.add.container(-width, 0);
    this.container.add(this.contentContainer);
    
    // Header text
    this.header = this.scene.add.text(
      padding,
      padding,
      'PLAYER STATUS',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#4a9df8',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    this.contentContainer.add(this.header);
    
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
      this.contentContainer.add(this.minimizeButton);
    }
    
    // Divider after header
    this.divider1 = this.scene.add.line(
      0,
      headerHeight,
      0,
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.contentContainer.add(this.divider1);
    
    // Player basic info
    this.playerName = this.scene.add.text(
      padding,
      headerHeight + padding,
      'Agent Unknown',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    
    this.playerLevel = this.scene.add.text(
      padding,
      headerHeight + fontSize + padding * 1.5,
      'Level 1',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize - 2}px`,
        color: '#cccccc'
      }
    ).setOrigin(0, 0);
    
    this.contentContainer.add([this.playerName, this.playerLevel]);
    
    // Divider after basic info
    this.divider2 = this.scene.add.line(
      0,
      headerHeight + playerInfoHeight,
      0,
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.contentContainer.add(this.divider2);
    
    // Experience bar
    const expBarY = headerHeight + playerInfoHeight + padding;
    this.expLabel = this.scene.add.text(
      padding,
      expBarY,
      'EXP',
      {
        fontFamily: 'Arial',
        fontSize: `${fontSize - 2}px`,
        color: '#aaaaaa'
      }
    ).setOrigin(0, 0);
    
    // Create progress bar for experience
    this.expBar = new ProgressBar(this.scene, {
      x: padding,
      y: expBarY + fontSize,
      width: width - padding * 2,
      height: 10,
      value: 0,
      fillColor: 0x4edc91,
      backgroundColor: 0x333333,
      borderColor: 0x666666,
      showValue: true,
      valueFormat: '{value}%'
    });
    
    this.contentContainer.add([this.expLabel, this.expBar.container]);
    
    // Divider after exp bar
    const skillsY = headerHeight + playerInfoHeight + expBarHeight;
    this.divider3 = this.scene.add.line(
      0,
      skillsY,
      0,
      0,
      width,
      0,
      0xaaaaaa,
      0.5
    ).setOrigin(0, 0);
    this.contentContainer.add(this.divider3);
    
    // Skills section
    if (this.options.showSkills) {
      const skillsHeaderY = skillsY + padding;
      this.skillsHeader = this.scene.add.text(
        padding,
        skillsHeaderY,
        'SKILLS',
        {
          fontFamily: 'Arial',
          fontSize: `${fontSize - 2}px`,
          color: '#aaaaaa'
        }
      ).setOrigin(0, 0);
      this.contentContainer.add(this.skillsHeader);
      
      // Create skill bars
      this.skillBars = {};
      const skillTypes = ['variables', 'functions', 'conditionals', 'loops', 'objects'];
      const skillColors = {
        'variables': 0x4a9df8,   // Blue
        'functions': 0xf39c12,   // Orange
        'conditionals': 0xe74c3c, // Red
        'loops': 0x2ecc71,       // Green
        'objects': 0x9b59b6      // Purple
      };
      
      skillTypes.forEach((skill, index) => {
        const y = skillsHeaderY + fontSize + (fontSize + 10) * index;
        
        // Format skill name
        const formattedName = skill.charAt(0).toUpperCase() + skill.slice(1);
        
        this.skillBars[skill] = new ProgressBar(this.scene, {
          x: padding,
          y,
          width: width - padding * 2,
          height: 8,
          value: 0,
          label: formattedName,
          fillColor: skillColors[skill],
          backgroundColor: 0x333333,
          borderColor: 0x666666,
          labelPosition: 'left',
          labelColor: '#cccccc',
          textSize: fontSize - 2,
          showValue: true,
          valueFormat: 'Lv {value}'
        });
        
        this.contentContainer.add(this.skillBars[skill].container);
      });
    }
    
    // Store content elements for minimizing
    this.contentElements = [
      this.divider1,
      this.playerName,
      this.playerLevel,
      this.divider2,
      this.expLabel,
      this.expBar.container,
      this.divider3
    ];
    
    if (this.options.showSkills) {
      this.contentElements.push(this.skillsHeader);
      Object.values(this.skillBars).forEach(bar => {
        this.contentElements.push(bar.container);
      });
    }
  }
  
  /**
   * Set up listeners for state events
   */
  setupStateListeners() {
    // Update when state is initialized
    this.stateManager.events.on('state-initialized', () => {
      this.updateDisplay();
    });
    
    // Listen for changes to player state
    this.stateManager.events.on('state-changed-player', () => {
      this.updateDisplay();
    });
    
    // Listen for experience changes
    this.stateManager.events.on('state-changed-player.experience', () => {
      this.updateExperienceBar();
    });
    
    // Listen for level changes
    this.stateManager.events.on('state-changed-player.level', () => {
      this.updateLevel();
    });
    
    // Listen for player level up
    this.stateManager.events.on('player-leveled-up', (data) => {
      this.levelUpAnimation(data);
    });
    
    // Update when state is loaded
    this.stateManager.events.on('state-loaded', () => {
      this.updateDisplay();
    });
  }
  
  /**
   * Update the entire display with current player information
   */
  updateDisplay() {
    const state = this.stateManager.getState();
    if (!state) return;
    
    const player = state.player;
    
    // Update player name
    this.playerName.setText(player.name);
    
    // Update level
    this.updateLevel();
    
    // Update experience bar
    this.updateExperienceBar();
    
    // Update skill bars
    if (this.options.showSkills && this.skillBars) {
      Object.entries(player.skills).forEach(([skill, level]) => {
        if (this.skillBars[skill]) {
          this.skillBars[skill].setValue(level);
        }
      });
    }
  }
  
  /**
   * Update the experience bar
   */
  updateExperienceBar() {
    const state = this.stateManager.getState();
    if (!state) return;
    
    const player = state.player;
    const currentLevel = player.level;
    const currentExp = player.experience;
    
    // Calculate experience needed for next level
    const expForNextLevel = 100 * Math.pow(currentLevel, 2);
    const expForCurrentLevel = 100 * Math.pow(currentLevel - 1, 2);
    
    // Calculate percentage to next level
    const expIntoCurrentLevel = currentExp - expForCurrentLevel;
    const expNeededForNextLevel = expForNextLevel - expForCurrentLevel;
    const percentage = Math.min(100, (expIntoCurrentLevel / expNeededForNextLevel) * 100);
    
    // Update experience bar
    this.expBar.setValue(percentage, true);
  }
  
  /**
   * Update the level display
   */
  updateLevel() {
    const state = this.stateManager.getState();
    if (!state) return;
    
    const player = state.player;
    this.playerLevel.setText(`Level ${player.level}`);
  }
  
  /**
   * Animate a level up event
   * @param {Object} data - Level up data
   */
  levelUpAnimation(data) {
    // Create a flash effect
    const flash = this.scene.add.rectangle(
      -this.options.width / 2,
      this.fullHeight / 2,
      this.options.width,
      this.fullHeight,
      0xffffff
    );
    this.contentContainer.add(flash);
    
    // Create level up text
    const levelUpText = this.scene.add.text(
      -this.options.width / 2,
      this.fullHeight / 2,
      'LEVEL UP!',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.contentContainer.add(levelUpText);
    
    // Animate flash
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        flash.destroy();
      }
    });
    
    // Animate level up text
    this.scene.tweens.add({
      targets: levelUpText,
      alpha: 1,
      y: this.fullHeight / 2 - 20,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: levelUpText,
          alpha: 0,
          y: this.fullHeight / 2 - 40,
          delay: 1000,
          duration: 300,
          onComplete: () => {
            levelUpText.destroy();
          }
        });
      }
    });
    
    // Play sound if available
    if (this.scene.sound.get('levelUp')) {
      this.scene.sound.play('levelUp', { volume: 0.6 });
    }
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
   * Set the display's visibility
   * @param {Boolean} visible - Whether the display should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }
  
  /**
   * Toggle the display's visibility
   * @returns {Boolean} The new visibility state
   */
  toggle() {
    const newState = !this.container.visible;
    this.setVisible(newState);
    return newState;
  }
  
  /**
   * Update the display
   * @param {Number} time - Current time
   * @param {Number} delta - Time since last update
   */
  update(time, delta) {
    // Any per-frame updates if needed
  }
  
  /**
   * Clean up resources when destroying the display
   */
  destroy() {
    // Remove event listeners
    if (this.minimizeButton) {
      this.minimizeButton.removeAllListeners();
    }
    
    // Destroy progress bars
    if (this.expBar) {
      this.expBar.destroy();
    }
    
    if (this.skillBars) {
      Object.values(this.skillBars).forEach(bar => bar.destroy());
    }
    
    // Destroy the container and all children
    this.container.destroy(true);
    
    // Unsubscribe from events
    this.stateManager.events.removeAllListeners();
  }
}

export default PlayerStatusDisplay;