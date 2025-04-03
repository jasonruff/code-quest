import Phaser from 'phaser';

/**
 * Dialog Box
 * Displays in-game dialogs and messages
 */
class DialogBox {
  /**
   * Create a new dialog box
   * @param {Phaser.Scene} scene - The scene the dialog belongs to
   * @param {Object} options - Dialog options
   * @param {Number} options.x - X position (default: 10% of game width)
   * @param {Number} options.y - Y position (default: 70% of game height)
   * @param {Number} options.width - Width (default: 80% of game width)
   * @param {Number} options.padding - Internal padding (default: 10)
   * @param {String} options.fontFamily - Font family (default: Arial)
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    
    // Get game dimensions
    const gameWidth = scene.cameras.main.width;
    const gameHeight = scene.cameras.main.height;
    
    // Set default options
    this.options = {
      x: options.x || Math.floor(gameWidth * 0.1),
      y: options.y || Math.floor(gameHeight * 0.7),
      width: options.width || Math.floor(gameWidth * 0.8),
      padding: options.padding || 10,
      fontFamily: options.fontFamily || 'Arial',
      fontSize: options.fontSize || 16,
      speed: options.speed || 30,  // Characters per second
      autoCloseDelay: options.autoCloseDelay || 4000 // ms
    };
    
    // Calculate height based on padding and font size
    this.options.height = options.height || Math.floor(gameHeight * 0.2);
    
    // Create the dialog container
    this.createDialogContainer();
    
    // Dialog state
    this.visible = false;
    this.typing = false;
    this.text = '';
    this.displayedText = '';
    this.textIndex = 0;
    this.lastCharTime = 0;
    this.closeTimer = null;
    
    // Event callback (for when dialog is closed)
    this.onClose = null;
    
    // Hide initially
    this.hide();
  }
  
  /**
   * Create the dialog container and text elements
   */
  createDialogContainer() {
    const { x, y, width, height, padding, fontFamily, fontSize } = this.options;
    
    // Create the dialog group
    this.container = this.scene.add.group();
    
    // Create background
    this.background = this.scene.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    this.background.setStrokeStyle(2, 0x4a9df8);
    
    // Create text
    this.textObject = this.scene.add.text(
      x + padding,
      y + padding,
      '',
      {
        fontFamily,
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        wordWrap: { width: width - (padding * 2) }
      }
    );
    
    // Create name tag (for character dialogs)
    this.nameTag = this.scene.add.text(
      x + padding,
      y - fontSize - 4,
      '',
      {
        fontFamily,
        fontSize: `${fontSize}px`,
        color: '#4a9df8'
      }
    );
    
    // Create continue indicator
    this.continueIndicator = this.scene.add.text(
      x + width - padding - 20,
      y + height - padding - fontSize,
      '▼',
      {
        fontFamily,
        fontSize: `${fontSize}px`,
        color: '#ffffff'
      }
    );
    
    // Add all elements to the container
    this.container.add(this.background);
    this.container.add(this.textObject);
    this.container.add(this.nameTag);
    this.container.add(this.continueIndicator);
    
    // Set continue indicator to blink
    this.scene.tweens.add({
      targets: this.continueIndicator,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  /**
   * Show a dialog with the given text
   * @param {String} text - The text to display
   * @param {String} speaker - Optional speaker name
   * @param {Function} callback - Optional callback when dialog is closed
   */
  show(text, speaker = '', callback = null) {
    this.text = text;
    this.displayedText = '';
    this.textIndex = 0;
    this.typing = true;
    this.visible = true;
    this.onClose = callback;
    
    // Set the speaker name if provided
    if (speaker) {
      this.nameTag.setText(speaker);
      this.nameTag.setVisible(true);
    } else {
      this.nameTag.setVisible(false);
    }
    
    // Reset text
    this.textObject.setText('');
    
    // Clear any existing close timer
    if (this.closeTimer) {
      this.closeTimer.remove();
      this.closeTimer = null;
    }
    
    // Show the dialog
    this.container.setVisible(true);
    
    // Start typing effect
    this.lastCharTime = 0;
    this.scene.time.addEvent({
      callback: this.updateText,
      callbackScope: this,
      loop: true,
      delay: 1000 / this.options.speed
    });
    
    // Add listener for clicking/tapping to skip or close
    this.background.setInteractive();
    this.background.once('pointerdown', this.handleClick, this);
    
    // Add keyboard listener
    this.keyListener = this.scene.input.keyboard.addKey('SPACE');
    this.keyListener.on('down', this.handleClick, this);
    
    return this;
  }
  
  /**
   * Update the displayed text for typing effect
   */
  updateText() {
    if (!this.typing) return;
    
    if (this.textIndex < this.text.length) {
      // Add the next character
      this.displayedText += this.text[this.textIndex];
      this.textObject.setText(this.displayedText);
      this.textIndex++;
    } else {
      // Finished typing
      this.typing = false;
      this.continueIndicator.setVisible(true);
      
      // Auto-close after delay if no callback
      if (!this.onClose) {
        this.closeTimer = this.scene.time.delayedCall(
          this.options.autoCloseDelay,
          this.hide,
          [],
          this
        );
      }
    }
  }
  
  /**
   * Handle click/tap on the dialog
   */
  handleClick() {
    if (this.typing) {
      // Skip typing and show full text
      this.typing = false;
      this.displayedText = this.text;
      this.textObject.setText(this.displayedText);
      this.continueIndicator.setVisible(true);
    } else {
      // Close the dialog
      this.hide();
    }
  }
  
  /**
   * Hide the dialog
   */
  hide() {
    this.visible = false;
    this.container.setVisible(false);
    
    // Remove keyboard listener
    if (this.keyListener) {
      this.keyListener.removeAllListeners();
    }
    
    // Call the callback if provided
    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
    
    return this;
  }
  
  /**
   * Check if the dialog is currently visible
   * @returns {Boolean} True if visible
   */
  isVisible() {
    return this.visible;
  }
  
  /**
   * Update the dialog (call this from the scene's update method)
   */
  update() {
    // Additional update logic if needed
  }
  
  /**
   * Destroy the dialog and clean up resources
   */
  destroy() {
    this.hide();
    
    if (this.closeTimer) {
      this.closeTimer.remove();
    }
    
    this.container.destroy(true);
  }
}

export default DialogBox;