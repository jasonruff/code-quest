import Phaser from 'phaser';
import CodeEditorBridge from '../components/CodeEditorBridge.jsx';
import CodeChallengeManager from '../utils/CodeChallengeManager';
import GameStateManager from '../utils/GameStateManager';
import ByteAssistant from '../components/ByteAssistant';
import ByteInteractionUI from '../components/ByteInteractionUI';

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
    this.byteAssistant = null;
    this.byteInteractionUI = null;
    
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
    this.externalByteAssistant = data.byteAssistant || null;
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
    
    // Create or reference Byte assistant
    this.setupByteAssistant();
    
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
    
    // Store these for tracking hint effectiveness later
    this.lastHint = '';
    this.lastHintTimestamp = null;
    this.hintCount = 0;
    
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
    
    this.codeEditor = new CodeEditorBridge(this, {
      x: editorX,
      y: editorY,
      width: editorWidth,
      height: editorHeight
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
    
    // Byte assistant events
    if (this.byteAssistant) {
      this.events.on('byte-click', this.handleByteClick, this);
    }
  }
  
  /**
   * Handle challenge complete event from editor
   * @param {CustomEvent} event - The challenge complete event
   */
  handleChallengeComplete(event) {
    const { challengeId, code } = event.detail;
    
    if (this.stateManager && challengeId) {
      // Calculate time since last hint (if any) for hint effectiveness tracking
      let hintEffectiveness = null;
      if (this.lastHintTimestamp) {
        const timeSinceHint = Date.now() - this.lastHintTimestamp;
        hintEffectiveness = {
          timeSinceHint,
          effectiveHint: timeSinceHint < 120000, // Consider hint effective if completed within 2 minutes
          hintCount: this.hintCount
        };
      }
      
      // Update game state to mark challenge as completed
      this.stateManager.completeMission(challengeId, {
        experience: 100, // Award experience points
        skills: {
          [this.currentChallenge.skillType]: 1 // Increase skill level
        }
      });
      
      // Save the player's solution and hint effectiveness
      this.stateManager.setState(`challenges.${challengeId}.completed`, true);
      this.stateManager.setState(`challenges.${challengeId}.playerSolution`, code);
      this.stateManager.setState(`challenges.${challengeId}.hints`, this.hintCount);
      
      if (hintEffectiveness) {
        this.stateManager.setState(`challenges.${challengeId}.hintEffectiveness`, hintEffectiveness);
      }
      
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
    
    // If we have the ByteAssistant with AI integration, use it to provide feedback
    if (this.byteAssistant && this.currentChallenge) {
      // Get the current code from the editor
      const playerCode = this.codeEditor ? this.codeEditor.getCode() : '';
      
      // Build game state with success information
      const gameState = {
        playerName: this.stateManager.getState('player.name') || 'Player',
        currentMission: this.currentChallenge.title,
        challengeId: this.currentChallengeId,
        challengeDescription: this.currentChallenge.description,
        learningObjective: this.currentChallenge.skillType || 'coding',
        playerCode: playerCode,
        errorMessage: null,
        previousHint: this.lastHint || null,
        attemptCount: this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 1,
        success: true,
        requestType: 'success-feedback'
      };
      
      // Use the AI to give personalized feedback on their solution
      this.byteAssistant.getCodeFeedback(gameState);
    } else {
      // Fallback to static message if AI integration isn't available
      if (this.byteAssistant) {
        this.byteAssistant.say(
          "Great job! Your code passed all the tests!", 
          { mood: 'happy', duration: 3000 }
        );
      }
    }
  }
  
  /**
   * Handle challenge failed event from editor
   * @param {Object} data - Failure data
   */
  handleChallengeFailed(data) {
    console.log('Challenge failed:', data);
    
    // If we have the ByteAssistant with AI integration, use it to provide help
    if (this.byteAssistant && this.currentChallenge) {
      // Get the current code from the editor
      const playerCode = this.codeEditor ? this.codeEditor.getCode() : '';
      const errorMessage = data.error || "Test failure";
      
      // Build game state with failure information
      const gameState = {
        playerName: this.stateManager.getState('player.name') || 'Player',
        currentMission: this.currentChallenge.title,
        challengeId: this.currentChallengeId,
        challengeDescription: this.currentChallenge.description,
        learningObjective: this.currentChallenge.skillType || 'coding',
        playerCode: playerCode,
        errorMessage: errorMessage,
        testResults: data.results || null,
        previousHint: this.lastHint || null,
        attemptCount: this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 1,
        requestType: 'test-failure'
      };
      
      // Use the AI to give personalized help on why tests failed
      this.byteAssistant.getHint(gameState);
      
      // Track this failure for the challenge statistics
      if (this.stateManager) {
        const currentAttempts = this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 0;
        this.stateManager.setState(`challenges.${this.currentChallengeId}.attempts`, currentAttempts + 1);
        this.stateManager.saveState();
      }
    } else {
      // Fallback to static message if AI integration isn't available
      if (this.byteAssistant) {
        this.byteAssistant.say(
          "Don't worry! Programming is all about trying different approaches. Check the hints if you need help.", 
          { mood: 'confused', duration: 5000 }
        );
      }
    }
  }
  
  /**
   * Handle code error event from editor
   * @param {Object} data - Error data
   */
  handleCodeError(data) {
    console.log('Code error:', data);
    
    // If we have the ByteAssistant with AI integration, use it to explain the error
    if (this.byteAssistant && this.currentChallenge) {
      // Get the current code from the editor
      const playerCode = this.codeEditor ? this.codeEditor.getCode() : '';
      const errorMessage = data.error || "Unknown error";
      
      // Build game state with error information
      const gameState = {
        playerName: this.stateManager.getState('player.name') || 'Player',
        currentMission: this.currentChallenge.title,
        challengeId: this.currentChallengeId,
        challengeDescription: this.currentChallenge.description,
        learningObjective: this.currentChallenge.skillType || 'coding',
        playerCode: playerCode,
        errorMessage: errorMessage,
        previousHint: this.lastHint || null,
        attemptCount: this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 1
      };
      
      // Use the AI-powered error explanation
      this.byteAssistant.explainError(gameState);
      
      // Track this error for the challenge statistics
      if (this.stateManager) {
        const currentAttempts = this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 0;
        this.stateManager.setState(`challenges.${this.currentChallengeId}.attempts`, currentAttempts + 1);
        this.stateManager.saveState();
      }
    } else {
      // Fallback to static message if AI integration isn't available
      if (this.byteAssistant) {
        this.byteAssistant.say(
          "Looks like there's an error in your code. Check your syntax - did you close all brackets and add semicolons where needed?", 
          { mood: 'thinking', duration: 5000 }
        );
      }
    }
  }
  
  /**
   * Handle code reset event from editor
   * @param {Object} data - Reset data
   */
  handleCodeReset(data) {
    console.log('Code reset:', data);
    
    // Have Byte comment on the reset
    if (this.byteAssistant) {
      this.byteAssistant.say(
        "Starting fresh with a clean slate! Sometimes that's the best approach.", 
        { mood: 'excited', duration: 3000 }
      );
    }
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
    // Update Byte assistant position if the panel size changes
    if (this.byteAssistant && this.challengePanel) {
      const panelRight = this.challengePanel.x + this.challengePanel.width;
      const panelBottom = this.challengePanel.y + this.challengePanel.height;
      
      this.byteAssistant.setPosition(
        panelRight - 70, 
        panelBottom - 70
      );
    }
  }
  
  /**
   * Setup the Byte assistant and interaction UI
   */
  setupByteAssistant() {
    // If we received an assistant from the game scene, use it
    if (this.externalByteAssistant) {
      this.byteAssistant = this.externalByteAssistant;
      
      // Make sure it's visible in this scene
      this.byteAssistant.setVisible(true);
      
      // Position appropriately for this scene
      const { width, height } = this.cameras.main;
      this.byteAssistant.setPosition(width - 70, height - 70);
    } else {
      // Create a new assistant for this scene
      const { width, height } = this.cameras.main;
      
      this.byteAssistant = new ByteAssistant(this, {
        x: width - 70,
        y: height - 70,
        scale: 0.8
      });
      
      // Give initial greeting
      this.time.delayedCall(1000, () => {
        if (this.byteAssistant) {
          this.byteAssistant.say(
            "I'm here to help with your coding challenge! Click the 'Ask Byte' button or the Hints button if you get stuck.",
            { mood: 'excited', duration: 5000 }
          );
        }
      });
    }
    
    // Create the ByteInteractionUI component
    this.byteInteractionUI = new ByteInteractionUI(this, this.byteAssistant, {
      x: 10,
      y: this.cameras.main.height - 60,
      width: 160,
      height: 45,
      buttonText: 'Ask Byte'
    });
  }
  
  /**
   * Handle when the player clicks on Byte
   * @param {Object} data - Click event data
   */
  handleByteClick(data) {
    // If we have the current challenge data, create a game state object
    if (this.currentChallenge) {
      // Get the current code from the editor
      const playerCode = this.codeEditor ? this.codeEditor.getCode() : '';
      const errorMessage = this.codeEditor ? this.codeEditor.getLastError() : null;
      
      // Increment hint count for this challenge
      this.hintCount++;
      
      // Track attempt count
      const currentAttempts = this.stateManager.getState(`challenges.${this.currentChallengeId}.attempts`) || 1;
      
      // Build game state object for AI assistant
      const gameState = {
        playerName: this.stateManager.getState('player.name') || 'Player',
        currentMission: this.currentChallenge.title,
        challengeId: this.currentChallengeId,
        challengeDescription: this.currentChallenge.description,
        learningObjective: this.currentChallenge.skillType || 'coding',
        playerCode: playerCode,
        errorMessage: errorMessage,
        previousHint: this.lastHint || null,
        attemptCount: currentAttempts,
        hintCount: this.hintCount
      };
      
      // Use AI assistant to get a hint
      data.assistant.getHint(gameState);
      
      // Store this hint request for tracking
      this.lastHintTimestamp = Date.now();
      
      // Update hint count in game state for analytics
      this.stateManager.setState(`challenges.${this.currentChallengeId}.hints`, this.hintCount);
      this.stateManager.saveState();
      
      // Show hints panel as well
      if (!this.hintsPanel.visible) {
        this.toggleHintsPanel();
      }
      
      // Listen for an event when hint is delivered
      this.events.once('hint-delivered', (hint) => {
        this.lastHint = hint;
      });
    } else {
      // Fallback to static hints if no challenge is loaded
      // Generic tips if no specific hints are available
      const tips = [
        "Make sure your syntax is correct!",
        "Check for any missing semicolons or brackets.",
        "Read the challenge description carefully to understand what's required.",
        "Remember to initialize your variables before using them.",
        "Try breaking down the problem into smaller steps." 
      ];
      
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      data.assistant.say(randomTip, { mood: 'thinking', duration: 5000 });
    }
  }
  
  /**
   * Cleanup when the scene is shutdown
   */
  shutdown() {
    // Remove event listeners
    window.removeEventListener('challenge-complete', this.handleChallengeComplete);
    this.events.off('byte-click', this.handleByteClick, this);
    
    // Destroy components
    if (this.codeEditor) {
      this.codeEditor.destroy();
    }
    
    // Destroy ByteInteractionUI
    if (this.byteInteractionUI) {
      this.byteInteractionUI.destroy();
    }
    
    // Only destroy Byte if we created it (not if it was passed from GameScene)
    if (this.byteAssistant && !this.externalByteAssistant) {
      this.byteAssistant.destroy();
    }
    
    // Call parent cleanup
    super.shutdown();
  }
}

export default CodeChallengeScene;