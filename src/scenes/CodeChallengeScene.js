import Phaser from 'phaser';
import CodeEditor from '../components/CodeEditor';
import CodeChallengeManager from '../utils/CodeChallengeManager';
import GameStateManager from '../utils/GameStateManager';

/**
 * Code Challenge Scene
 * Handles code challenges and editor integration with the game
 */
class CodeChallengeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CodeChallengeScene' });
    
    // References to components
    this.codeEditor = null;
    this.challengeManager = null;
    this.stateManager = null;
    
    // Current challenge data
    this.currentChallengeId = null;
    this.currentChallenge = null;
    
    // UI elements
    this.challengeTitle = null;
    this.challengeDescription = null;
    this.backButton = null;
    this.hintsButton = null;
    this.hintsPanel = null;
  }
  
  init(data) {
    // Data passed from the previous scene
    this.currentChallengeId = data.challengeId || null;
    this.previousScene = data.previousScene || 'GameScene';
    this.stateManagerData = data.stateManager || null;
  }
  
  create() {
    // Initialize the challenge manager
    this.challengeManager = new CodeChallengeManager();
    
    // Initialize or reference the game state manager
    if (this.stateManagerData) {
      this.stateManager = this.stateManagerData;
    } else {
      // Create a new state manager (fallback)
      this.stateManager = new GameStateManager(this);
      this.stateManager.init();
    }
    
    // Create UI layout
    this.createUILayout();
    
    // Load the challenge if one was provided
    if (this.currentChallengeId) {
      this.loadChallenge(this.currentChallengeId);
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Disable input for the scene below
    if (this.previousScene) {
      const prevScene = this.scene.get(this.previousScene);
      if (prevScene) {
        prevScene.input.enabled = false;
      }
    }
  }
  
  /**
   * Create the UI layout for the code challenge scene
   */
  createUILayout() {
    const { width, height } = this.cameras.main;
    
    // Semi-transparent background to dim the game scene below
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0);
    
    // Challenge panel with title and description
    const panelWidth = width * 0.8;
    const panelHeight = height * 0.8;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;
    
    // Create panel background
    this.challengePanel = this.add.rectangle(
      panelX, panelY, panelWidth, panelHeight,
      0x1e1e1e, 1
    ).setOrigin(0, 0);
    
    // Add border to panel
    this.panelBorder = this.add.rectangle(
      panelX, panelY, panelWidth, panelHeight,
      0x000000, 0
    ).setOrigin(0, 0)
      .setStrokeStyle(2, 0x4682b4);
    
    // Panel header
    this.panelHeader = this.add.rectangle(
      panelX, panelY, panelWidth, 40,
      0x333333, 1
    ).setOrigin(0, 0);
    
    // Challenge title text
    this.challengeTitle = this.add.text(
      panelX + 20, panelY + 20,
      'Code Challenge',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);
    
    // Back button
    this.backButton = this.add.rectangle(
      panelX + panelWidth - 100, panelY + 20,
      80, 30,
      0x444444, 1
    ).setOrigin(0.5, 0.5);
    
    this.backButtonText = this.add.text(
      this.backButton.x, this.backButton.y,
      'Back',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);
    
    // Make back button interactive
    this.backButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.handleBackButton, this)
      .on('pointerover', () => {
        this.backButton.setFillStyle(0x666666);
      })
      .on('pointerout', () => {
        this.backButton.setFillStyle(0x444444);
      });
    
    // Challenge description text
    this.challengeDescription = this.add.text(
      panelX + 20, panelY + 60,
      'Select a challenge to begin coding.',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#cccccc',
        wordWrap: { width: panelWidth - 40 }
      }
    ).setOrigin(0, 0);
    
    // Hints button
    this.hintsButton = this.add.rectangle(
      panelX + panelWidth - 180, panelY + 20,
      80, 30,
      0x7c3aed, 1
    ).setOrigin(0.5, 0.5);
    
    this.hintsButtonText = this.add.text(
      this.hintsButton.x, this.hintsButton.y,
      'Hints',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);
    
    // Make hints button interactive
    this.hintsButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.toggleHintsPanel, this)
      .on('pointerover', () => {
        this.hintsButton.setFillStyle(0x8f5cf6);
      })
      .on('pointerout', () => {
        this.hintsButton.setFillStyle(0x7c3aed);
      });
    
    // Create hints panel (hidden by default)
    this.createHintsPanel(panelX + panelWidth - 220, panelY + 60, 200, 150);
    
    // Create code editor
    const editorX = panelX + 20;
    const editorY = panelY + 100;
    const editorWidth = panelWidth - 40;
    const editorHeight = panelHeight - 160;
    
    this.codeEditor = new CodeEditor(this, {
      x: editorX,
      y: editorY,
      width: editorWidth,
      height: editorHeight,
      theme: 'dark',
      fontSize: 14
    });
  }
  
  /**
   * Create the hints panel UI
   * @param {Number} x - X position
   * @param {Number} y - Y position
   * @param {Number} width - Panel width
   * @param {Number} height - Panel height
   */
  createHintsPanel(x, y, width, height) {
    // Create panel container
    this.hintsPanel = this.add.container(x, y);
    
    // Panel background
    this.hintsPanelBg = this.add.rectangle(
      0, 0, width, height,
      0x2d2d2d, 1
    ).setOrigin(0, 0);
    
    // Panel border
    this.hintsPanelBorder = this.add.rectangle(
      0, 0, width, height,
      0x000000, 0
    ).setOrigin(0, 0)
      .setStrokeStyle(1, 0x7c3aed);
    
    // Panel header
    this.hintsPanelHeader = this.add.rectangle(
      0, 0, width, 30,
      0x333333, 1
    ).setOrigin(0, 0);
    
    // Panel title
    this.hintsPanelTitle = this.add.text(
      10, 15,
      'Hints',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);
    
    // Close button
    this.hintsPanelClose = this.add.rectangle(
      width - 20, 15,
      20, 20,
      0x444444, 1
    ).setOrigin(0.5, 0.5);
    
    this.hintsPanelCloseText = this.add.text(
      this.hintsPanelClose.x, this.hintsPanelClose.y,
      'X',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);
    
    // Make close button interactive
    this.hintsPanelClose.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.toggleHintsPanel, this)
      .on('pointerover', () => {
        this.hintsPanelClose.setFillStyle(0x666666);
      })
      .on('pointerout', () => {
        this.hintsPanelClose.setFillStyle(0x444444);
      });
    
    // Hints content text
    this.hintsContent = this.add.text(
      10, 40,
      'No hints available for this challenge.',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#cccccc',
        wordWrap: { width: width - 20 }
      }
    ).setOrigin(0, 0);
    
    // Add all elements to the panel container
    this.hintsPanel.add([
      this.hintsPanelBg,
      this.hintsPanelBorder,
      this.hintsPanelHeader,
      this.hintsPanelTitle,
      this.hintsPanelClose,
      this.hintsPanelCloseText,
      this.hintsContent
    ]);
    
    // Hide panel by default
    this.hintsPanel.setVisible(false);
  }
  
  /**
   * Toggle the visibility of the hints panel
   */
  toggleHintsPanel() {
    this.hintsPanel.setVisible(!this.hintsPanel.visible);
  }
  
  /**
   * Set up event listeners for the scene
   */
  setupEventListeners() {
    // Listen for challenge completion events
    window.addEventListener('challenge-complete', this.handleChallengeComplete.bind(this));
    
    // Listen for Phaser events
    this.events.on('challenge-success', this.handleChallengeSuccess, this);
    this.events.on('challenge-failed', this.handleChallengeFailed, this);
    this.events.on('code-error', this.handleCodeError, this);
    this.events.on('code-reset', this.handleCodeReset, this);
  }
  
  /**
   * Handle challenge complete event from editor
   * @param {CustomEvent} event - The challenge complete event
   */
  handleChallengeComplete(event) {
    const { challengeId, code } = event.detail;
    
    if (this.stateManager && challengeId) {
      // Update game state to mark challenge as completed
      this.stateManager.completeMission(challengeId, {
        experience: 100, // Award experience points
        skills: {
          [this.currentChallenge.skillType]: 1 // Increase skill level
        }
      });
      
      // Save the player's solution
      this.stateManager.setState(`challenges.${challengeId}.completed`, true);
      this.stateManager.setState(`challenges.${challengeId}.playerSolution`, code);
      this.stateManager.saveState();
      
      // Display success message
      this.showSuccessOverlay(challengeId);
    }
  }
  
  /**
   * Handle challenge success event from editor
   * @param {Object} data - Success data
   */
  handleChallengeSuccess(data) {
    console.log('Challenge success:', data);
    // Additional UI feedback could be added here
  }
  
  /**
   * Handle challenge failed event from editor
   * @param {Object} data - Failure data
   */
  handleChallengeFailed(data) {
    console.log('Challenge failed:', data);
    // Additional UI feedback could be added here
  }
  
  /**
   * Handle code error event from editor
   * @param {Object} data - Error data
   */
  handleCodeError(data) {
    console.log('Code error:', data);
    // Additional UI feedback could be added here
  }
  
  /**
   * Handle code reset event from editor
   * @param {Object} data - Reset data
   */
  handleCodeReset(data) {
    console.log('Code reset:', data);
    // Additional UI feedback could be added here
  }
  
  /**
   * Load a challenge by ID
   * @param {String} challengeId - ID of the challenge to load
   */
  loadChallenge(challengeId) {
    // Get challenge from manager
    const challenge = this.challengeManager.getChallenge(challengeId);
    
    if (!challenge) {
      console.error(`Challenge not found: ${challengeId}`);
      this.challengeDescription.setText('Challenge not found. Please try again.');
      return;
    }
    
    // Store current challenge
    this.currentChallenge = challenge;
    this.currentChallengeId = challengeId;
    
    // Update UI with challenge data
    this.challengeTitle.setText(challenge.title);
    this.challengeDescription.setText(challenge.description);
    
    // Check if the player has previously completed this challenge
    const completed = this.stateManager.getState(`challenges.${challengeId}.completed`) || false;
    const playerSolution = this.stateManager.getState(`challenges.${challengeId}.playerSolution`);
    
    // If player has a saved solution, use it, otherwise use the initial code
    const initialCode = playerSolution || challenge.initialCode;
    
    // Set the challenge in the code editor
    this.codeEditor.setChallenge(challenge);
    this.codeEditor.setCode(initialCode);
    
    // Update hints panel with challenge hints
    this.updateHintsPanel(challenge.hints);
  }
  
  /**
   * Update the hints panel with challenge hints
   * @param {Array} hints - Array of hint strings
   */
  updateHintsPanel(hints) {
    if (!hints || hints.length === 0) {
      this.hintsContent.setText('No hints available for this challenge.');
      return;
    }
    
    // Format hints as a numbered list
    const hintsText = hints.map((hint, index) => `${index + 1}. ${hint}`).join('\n\n');
    this.hintsContent.setText(hintsText);
  }
  
  /**
   * Handle back button click
   */
  handleBackButton() {
    // Confirm leaving if there are unsaved changes
    const confirmLeave = window.confirm('Are you sure you want to exit this challenge? Your progress will be saved.');
    
    if (confirmLeave) {
      // Save current code if there's a challenge loaded
      if (this.currentChallengeId && this.codeEditor) {
        const currentCode = this.codeEditor.getCode();
        this.stateManager.setState(`challenges.${this.currentChallengeId}.playerSolution`, currentCode);
        this.stateManager.saveState();
      }
      
      // Re-enable input for the previous scene
      if (this.previousScene) {
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene) {
          prevScene.input.enabled = true;
        }
      }
      
      // Return to previous scene
      this.scene.stop();
      this.scene.resume(this.previousScene);
    }
  }
  
  /**
   * Show a success overlay when challenge is completed
   * @param {String} challengeId - ID of the completed challenge
   */
  showSuccessOverlay(challengeId) {
    const { width, height } = this.cameras.main;
    
    // Create overlay container
    const overlay = this.add.container(0, 0);
    
    // Add semi-transparent background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0, 0);
    overlay.add(bg);
    
    // Add success message panel
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;
    
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1e1e1e, 1)
      .setOrigin(0, 0);
    overlay.add(panel);
    
    const panelBorder = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x33cc33);
    overlay.add(panelBorder);
    
    // Format mission name
    const formattedName = this.formatMissionName(challengeId);
    
    // Add success icon or animation
    const successIcon = this.add.circle(width / 2, panelY + 70, 40, 0x33cc33, 1);
    overlay.add(successIcon);
    
    const checkmark = this.add.text(successIcon.x, successIcon.y, '✓', {
      fontFamily: 'Arial',
      fontSize: '50px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    overlay.add(checkmark);
    
    // Add congratulatory text
    const titleText = this.add.text(width / 2, panelY + 130, 'Mission Complete!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    overlay.add(titleText);
    
    const missionText = this.add.text(width / 2, panelY + 170, formattedName, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#33cc33',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    overlay.add(missionText);
    
    const descText = this.add.text(width / 2, panelY + 210, 'You have successfully completed this mission!', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0.5, 0);
    overlay.add(descText);
    
    // Add continue button
    const continueButton = this.add.rectangle(width / 2, panelY + 260, 180, 40, 0x33cc33, 1)
      .setOrigin(0.5, 0);
    overlay.add(continueButton);
    
    const continueText = this.add.text(continueButton.x, continueButton.y + 20, 'Continue', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    overlay.add(continueText);
    
    // Make continue button interactive
    continueButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Return to previous scene
        if (this.previousScene) {
          const prevScene = this.scene.get(this.previousScene);
          if (prevScene) {
            prevScene.input.enabled = true;
          }
        }
        
        // Resume previous scene and stop this one
        this.scene.stop();
        this.scene.resume(this.previousScene);
      })
      .on('pointerover', () => {
        continueButton.setFillStyle(0x66dd66);
      })
      .on('pointerout', () => {
        continueButton.setFillStyle(0x33cc33);
      });
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
   * Update function called every frame
   * @param {Number} time - Current time
   * @param {Number} delta - Time delta since last update
   */
  update(time, delta) {
    // Any animation or continuous updates can go here
  }
  
  /**
   * Cleanup when the scene is shutdown
   */
  shutdown() {
    // Remove event listeners
    window.removeEventListener('challenge-complete', this.handleChallengeComplete);
    
    // Destroy components
    if (this.codeEditor) {
      this.codeEditor.destroy();
    }
    
    // Call parent cleanup
    super.shutdown();
  }
}

export default CodeChallengeScene;