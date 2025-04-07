/**
 * ByteInteractionUI
 * User interface for interacting with the Byte assistant
 */
import Phaser from 'phaser';

class ByteInteractionUI {
  /**
   * Create a new ByteInteractionUI instance
   * @param {Phaser.Scene} scene - The scene the UI belongs to
   * @param {ByteAssistant} byteAssistant - Reference to the Byte assistant
   * @param {Object} options - UI options
   */
  constructor(scene, byteAssistant, options = {}) {
    this.scene = scene;
    this.byteAssistant = byteAssistant;
    
    // Default options
    this.options = {
      x: options.x || 10,
      y: options.y || this.scene.cameras.main.height - 60,
      width: options.width || 160,
      height: options.height || 45,
      visible: options.visible !== undefined ? options.visible : true,
      buttonText: options.buttonText || 'Ask Byte',
      depth: options.depth || 1000,
      padding: options.padding || 10
    };
    
    // State
    this.isOpen = false;
    this.quickQuestions = [
      'What should I do?',
      'How do I solve this?',
      'Explain this error',
      'Give me a hint'
    ];
    
    // Create UI elements
    this.createUI();
    
    // Handle resize
    this.scene.scale.on('resize', this.handleResize, this);
  }
  
  /**
   * Create the UI elements
   */
  createUI() {
    // Create main container
    this.container = this.scene.add.container(this.options.x, this.options.y);
    this.container.setDepth(this.options.depth);
    
    // Create "Ask Byte" button
    this.createAskButton();
    
    // Create question panel (initially hidden)
    this.createQuestionPanel();
    
    // Set initial visibility
    this.container.setVisible(this.options.visible);
  }
  
  /**
   * Create the "Ask Byte" button
   */
  createAskButton() {
    // Using the "Ask Byte" button from ui-elements.svg located at (170,120)
    // Creating a multi-state button with normal and hover states
    
    // Normal state button
    this.buttonBg = this.scene.add.image(0, 0, 'ui-elements', 'ask-byte-button-normal')
      .setOrigin(0, 0);
    
    // Set the button size to match the UI options
    this.buttonBg.displayWidth = this.options.width;
    this.buttonBg.displayHeight = this.options.height;
    this.container.add(this.buttonBg);
    
    // Create a hover state image (hidden initially)
    this.buttonBgHover = this.scene.add.image(0, 0, 'ui-elements', 'ask-byte-button-hover')
      .setOrigin(0, 0)
      .setVisible(false);
    this.buttonBgHover.displayWidth = this.options.width;
    this.buttonBgHover.displayHeight = this.options.height;
    this.container.add(this.buttonBgHover);
    
    // Button text
    this.buttonText = this.scene.add.text(
      this.options.width / 2,
      this.options.height / 2,
      this.options.buttonText,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.container.add(this.buttonText);
    
    // Add byte icon from the sprite sheet
    this.byteIcon = this.scene.add.sprite(
      this.options.padding + 10, 
      this.options.height / 2,
      'byteSheet',
      0 // Using neutral frame
    ).setScale(0.5); // Scale down to fit on button
    this.container.add(this.byteIcon);
    
    // Make button interactive
    this.buttonBg.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.options.width, this.options.height),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Add hover effects
    this.buttonBg.on('pointerover', () => {
      this.buttonBg.setVisible(false);
      this.buttonBgHover.setVisible(true);
    });
    
    this.buttonBg.on('pointerout', () => {
      this.buttonBg.setVisible(true);
      this.buttonBgHover.setVisible(false);
    });
    
    // Add click handler
    this.buttonBg.on('pointerdown', this.toggleQuestionPanel, this);
  }
  
  /**
   * Create the question panel for common questions
   */
  createQuestionPanel() {
    // Create panel container
    this.questionPanel = this.scene.add.container(0, -this.options.padding);
    this.container.add(this.questionPanel);
    
    // Calculate panel dimensions
    const panelWidth = this.options.width + 80;
    const panelHeight = this.quickQuestions.length * 40 + this.options.padding * 2;
    
    // Panel background
    this.panelBg = this.scene.add.graphics();
    this.panelBg.fillStyle(0x253748, 0.95);
    this.panelBg.fillRoundedRect(
      0, 
      -panelHeight, 
      panelWidth, 
      panelHeight, 
      10
    );
    this.panelBg.lineStyle(2, 0x4a9df8, 1);
    this.panelBg.strokeRoundedRect(
      0, 
      -panelHeight, 
      panelWidth, 
      panelHeight, 
      10
    );
    this.questionPanel.add(this.panelBg);
    
    // Add question buttons
    this.questionButtons = [];
    
    this.quickQuestions.forEach((question, index) => {
      // Button background
      const questionBg = this.scene.add.graphics();
      questionBg.fillStyle(0x3a526a, 1);
      questionBg.fillRoundedRect(
        this.options.padding,
        -panelHeight + this.options.padding + index * 40,
        panelWidth - this.options.padding * 2,
        35,
        5
      );
      this.questionPanel.add(questionBg);
      
      // Question text
      const questionText = this.scene.add.text(
        this.options.padding + 10,
        -panelHeight + this.options.padding + index * 40 + 17,
        question,
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff'
        }
      ).setOrigin(0, 0.5);
      this.questionPanel.add(questionText);
      
      // Make button interactive
      questionBg.setInteractive(
        new Phaser.Geom.Rectangle(
          this.options.padding,
          -panelHeight + this.options.padding + index * 40,
          panelWidth - this.options.padding * 2,
          35
        ),
        Phaser.Geom.Rectangle.Contains
      );
      
      // Add hover effects
      questionBg.on('pointerover', () => {
        questionBg.clear();
        questionBg.fillStyle(0x4e6982, 1);
        questionBg.fillRoundedRect(
          this.options.padding,
          -panelHeight + this.options.padding + index * 40,
          panelWidth - this.options.padding * 2,
          35,
          5
        );
      });
      
      questionBg.on('pointerout', () => {
        questionBg.clear();
        questionBg.fillStyle(0x3a526a, 1);
        questionBg.fillRoundedRect(
          this.options.padding,
          -panelHeight + this.options.padding + index * 40,
          panelWidth - this.options.padding * 2,
          35,
          5
        );
      });
      
      // Add click handler
      questionBg.on('pointerdown', () => {
        this.handleQuestionSelected(question);
      });
      
      this.questionButtons.push({
        background: questionBg,
        text: questionText
      });
    });
    
    // Hide panel initially
    this.questionPanel.setVisible(false);
  }
  
  /**
   * Toggle the question panel visibility
   */
  toggleQuestionPanel() {
    this.isOpen = !this.isOpen;
    this.questionPanel.setVisible(this.isOpen);
    
    // Button state
    if (this.isOpen) {
      this.buttonText.setText('Close');
      
      // Update the Byte icon to show thinking state
      this.byteIcon.setFrame(2); // Thinking frame
    } else {
      this.buttonText.setText(this.options.buttonText);
      
      // Reset the Byte icon to neutral state
      this.byteIcon.setFrame(0); // Neutral frame
    }
    
    // Add animation
    if (this.isOpen) {
      // Animate panel opening
      this.questionPanel.alpha = 0;
      this.scene.tweens.add({
        targets: this.questionPanel,
        alpha: 1,
        duration: 200
      });
    }
  }
  
  /**
   * Handle when a question is selected
   * @param {String} question - The selected question
   */
  handleQuestionSelected(question) {
    // Close the panel
    this.toggleQuestionPanel();
    
    // Get the current game state and challenge info
    const gameState = this.getCurrentGameState();
    
    // Map questions to request types
    let requestType = 'general';
    
    if (question.includes('hint')) {
      requestType = 'hint';
    } else if (question.includes('error')) {
      requestType = 'error-explanation';
    } else if (question.includes('solve')) {
      requestType = 'solution-guidance';
    }
    
    // Update game state with request type
    gameState.requestType = requestType;
    
    // Send the question to Byte
    if (this.byteAssistant) {
      this.byteAssistant.getAIResponse(gameState);
    }
  }
  
  /**
   * Get current game state from the scene
   * @returns {Object} Current game state
   */
  getCurrentGameState() {
    // Default state (will be enhanced in specific scenes)
    const gameState = {
      playerName: this.scene.stateManager?.getState('player.name') || 'Player',
      requestType: 'general'
    };
    
    // In code challenge scene
    if (this.scene.currentChallenge) {
      // Get current code and challenge info
      const playerCode = this.scene.codeEditor?.getCode() || '';
      const errorMessage = this.scene.codeEditor?.getLastError() || null;
      
      return {
        ...gameState,
        currentMission: this.scene.currentChallenge.title,
        challengeId: this.scene.currentChallengeId,
        challengeDescription: this.scene.currentChallenge.description,
        learningObjective: this.scene.currentChallenge.skillType || 'coding',
        playerCode,
        errorMessage,
        attemptCount: this.scene.stateManager?.getState(`challenges.${this.scene.currentChallengeId}.attempts`) || 1
      };
    }
    
    return gameState;
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Update position for responsive UI
    this.setPosition(
      this.options.x,
      this.scene.cameras.main.height - 60
    );
  }
  
  /**
   * Set the position of the UI
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate 
   */
  setPosition(x, y) {
    this.options.x = x;
    this.options.y = y;
    this.container.setPosition(x, y);
  }
  
  /**
   * Set visibility of the UI
   * @param {Boolean} visible - Whether the UI should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
    this.options.visible = visible;
  }
  
  /**
   * Cleanup and destroy the UI
   */
  destroy() {
    // Remove event listeners
    this.scene.scale.off('resize', this.handleResize, this);
    
    // Destroy container (will also destroy all children)
    this.container.destroy();
  }
}

export default ByteInteractionUI;