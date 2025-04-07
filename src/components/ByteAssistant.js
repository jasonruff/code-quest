import Phaser from 'phaser';
import ByteAIAssistant from '../utils/byteAIAssistant';

/**
 * ByteAssistant - AI companion character
 * Animated character that provides help and guidance to the player
 * Integrated with Claude API for intelligent responses
 */
class ByteAssistant {
  /**
   * Create a new ByteAssistant instance
   * @param {Phaser.Scene} scene - The scene the assistant belongs to
   * @param {Object} options - Assistant options
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    
    // Default options
    this.options = {
      x: options.x || 700,
      y: options.y || 150,
      scale: options.scale || 0.8,
      depth: options.depth || 1000,
      visible: options.visible !== undefined ? options.visible : true,
      apiKey: options.apiKey || null
    };
    
    // Character state tracking
    this.state = {
      currentMood: 'idle', // idle, thinking, happy, confused, excited
      isSpeaking: false,
      messageQueue: [],
      processingRequest: false
    };
    
    // Initialize AI assistant
    this.aiAssistant = new ByteAIAssistant(this.options.apiKey);
    
    // Create the assistant visuals
    this.createAssistant();
    
    // Set initial visibility
    this.setVisible(this.options.visible);
  }
  
  /**
   * Create the assistant sprite and animations
   */
  createAssistant() {
    // Create main container for the assistant
    this.container = this.scene.add.container(this.options.x, this.options.y);
    this.container.setDepth(this.options.depth);
    
    // Create the hologram effect
    this.createHologramEffect();
    
    // Create Byte sprite using the new SVG asset
    this.byteSprite = this.scene.add.sprite(0, 0, 'byteSheet', 0);
    this.byteSprite.setScale(1.2); // Scale to appropriate size
    this.container.add(this.byteSprite);
    
    // Create animations for Byte using the spritesheet frames
    this.createByteAnimations();
    
    // We'll keep these variables for backward compatibility, but they won't be used visually
    this.avatarCircle = { setFillStyle: () => {}, setStrokeStyle: () => {}, setVisible: () => {} };
    this.innerCircle = { setAngle: () => {}, setScale: () => {}, setVisible: () => {} };
    this.avatarText = { setColor: () => {}, setVisible: () => {} };
    
    // Create speech bubble (initially hidden)
    this.createSpeechBubble();
    
    // Create animations for different moods
    this.createMoodAnimations();
    
    // Create a glow effect
    this.createGlowEffect();
    
    // Scale the container
    this.container.setScale(this.options.scale);
    
    // Make avatar circle interactive
    this.avatarCircle.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.emit('click');
      })
      .on('pointerover', () => {
        // Hover effect
        this.scene.tweens.add({
          targets: this.container,
          scale: this.options.scale * 1.1,
          duration: 200
        });
      })
      .on('pointerout', () => {
        // Reset hover effect
        this.scene.tweens.add({
          targets: this.container,
          scale: this.options.scale,
          duration: 200
        });
      });
    
    // Start idle animation
    this.playMood('idle');
  }
  
  /**
   * Create a pulsing hologram effect
   */
  createHologramEffect() {
    // Hologram rings
    this.hologramRing = this.scene.add.circle(0, 0, 45, 0x4a9df8, 0.3);
    this.container.add(this.hologramRing);
    
    // Add pulsing animation
    this.scene.tweens.add({
      targets: this.hologramRing,
      alpha: { from: 0.3, to: 0.1 },
      radius: { from: 45, to: 50 },
      yoyo: true,
      duration: 1500,
      repeat: -1
    });
    
    // Add scanning line effect
    this.scanLine = this.scene.add.rectangle(0, -40, 80, 2, 0x8ac0ff, 0.7);
    this.container.add(this.scanLine);
    
    this.scene.tweens.add({
      targets: this.scanLine,
      y: 40,
      alpha: { start: 0.7, from: 0.7, to: 0 },
      duration: 1500,
      repeat: -1,
      repeatDelay: 1000
    });
  }
  
  /**
   * Create a glow effect for the assistant
   */
  createGlowEffect() {
    // Add a glow effect
    this.glow = this.scene.add.circle(0, 0, 50, 0x4a9df8, 0);
    this.container.add(this.glow);
    this.glow.setBlendMode(Phaser.BlendModes.SCREEN);
    
    // Move the glow to the back
    this.container.sendToBack(this.glow);
  }
  
  /**
   * Create the speech bubble for messages
   */
  createSpeechBubble() {
    // Speech bubble container (positioned to the left of the avatar)
    this.speechContainer = this.scene.add.container(-300, 0);
    this.container.add(this.speechContainer);
    
    // Default bubble width
    const bubbleWidth = 250;
    const bubbleHeight = 120;
    
    // Speech bubble background
    this.speechBubble = this.scene.add.graphics();
    this.speechBubble.fillStyle(0x253748, 0.95); // Slightly transparent
    this.speechBubble.lineStyle(4, 0x4a9df8, 1);
    
    // Draw rounded rectangle for speech bubble with enhanced corners
    this.speechBubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
    this.speechBubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
    
    // Draw speech bubble pointer with better shape
    this.speechBubble.fillStyle(0x253748, 0.95);
    this.speechBubble.lineStyle(4, 0x4a9df8, 1);
    
    // Triangle for the pointer
    this.speechBubble.beginPath();
    this.speechBubble.moveTo(bubbleWidth - 5, bubbleHeight / 2 - 12);
    this.speechBubble.lineTo(bubbleWidth + 15, bubbleHeight / 2);
    this.speechBubble.lineTo(bubbleWidth - 5, bubbleHeight / 2 + 12);
    this.speechBubble.closePath();
    this.speechBubble.fillPath();
    this.speechBubble.strokePath();
    
    this.speechContainer.add(this.speechBubble);
    
    // Add glow effect to the bubble
    this.bubbleGlow = this.scene.add.graphics();
    this.bubbleGlow.fillStyle(0x4a9df8, 0.1);
    this.bubbleGlow.fillRoundedRect(-5, -5, bubbleWidth + 10, bubbleHeight + 10, 20);
    this.speechContainer.add(this.bubbleGlow);
    this.speechContainer.sendToBack(this.bubbleGlow);
    
    // Add a header bar at the top
    this.headerBar = this.scene.add.graphics();
    this.headerBar.fillStyle(0x4a9df8, 0.5);
    this.headerBar.fillRoundedRect(0, 0, bubbleWidth, 30, {tl: 15, tr: 15, bl: 0, br: 0});
    this.speechContainer.add(this.headerBar);
    
    // Add name text at the top of the bubble
    this.nameText = this.scene.add.text(15, 15, 'Byte', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.speechContainer.add(this.nameText);
    
    // Add a decorative icon next to the name
    this.nameIcon = this.scene.add.circle(bubbleWidth - 20, 15, 8, 0x182635);
    this.nameIcon.setStrokeStyle(2, 0x8ac0ff);
    this.speechContainer.add(this.nameIcon);
    
    // Add "B" to the icon
    this.nameIconText = this.scene.add.text(bubbleWidth - 20, 15, 'B', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#4a9df8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.speechContainer.add(this.nameIconText);
    
    // Add message text with improved styling
    this.messageText = this.scene.add.text(15, 45, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: bubbleWidth - 30 },
      lineSpacing: 5
    });
    this.speechContainer.add(this.messageText);
    
    // Add a close button
    this.closeButton = this.scene.add.circle(bubbleWidth - 15, 15, 10, 0x253748);
    this.closeButton.setStrokeStyle(1, 0x4a9df8);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', () => this.hideSpeechBubble());
    this.speechContainer.add(this.closeButton);
    
    // Add X to the close button
    this.closeButtonText = this.scene.add.text(bubbleWidth - 15, 15, 'x', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.speechContainer.add(this.closeButtonText);
    
    // Create fancy typing indicator
    this.createTypingIndicator();
    
    // Add appear animation for the speech bubble
    this.speechBubbleAnimation = {
      show: (duration = 300) => {
        this.speechContainer.setScale(0.5);
        this.speechContainer.setAlpha(0);
        this.scene.tweens.add({
          targets: this.speechContainer,
          scale: 1,
          alpha: 1,
          duration: duration,
          ease: 'Back.easeOut'
        });
      },
      hide: (duration = 200) => {
        this.scene.tweens.add({
          targets: this.speechContainer,
          scale: 0.5,
          alpha: 0,
          duration: duration,
          ease: 'Back.easeIn',
          onComplete: () => {
            this.speechContainer.setVisible(false);
          }
        });
      }
    };
    
    // Hide speech bubble initially
    this.speechContainer.setVisible(false);
  }
  
  /**
   * Create typing indicator animation
   */
  createTypingIndicator() {
    // Container for typing dots
    this.typingContainer = this.scene.add.container(15, 80);
    this.speechContainer.add(this.typingContainer);
    
    // Create background for typing indicator
    this.typingBackground = this.scene.add.graphics();
    this.typingBackground.fillStyle(0x3a526a, 0.7);
    this.typingBackground.fillRoundedRect(-5, -10, 60, 20, 8);
    this.typingContainer.add(this.typingBackground);
    
    // Create 3 dots with enhanced animation
    this.typingDots = [];
    for (let i = 0; i < 3; i++) {
      // Create dot with glow effect
      const dotContainer = this.scene.add.container(i * 15, 0);
      
      // Glow
      const glow = this.scene.add.circle(0, 0, 7, 0x4a9df8, 0.3);
      dotContainer.add(glow);
      
      // Main dot
      const dot = this.scene.add.circle(0, 0, 3, 0x4a9df8);
      dotContainer.add(dot);
      
      this.typingContainer.add(dotContainer);
      this.typingDots.push(dotContainer);
      
      // Add more dynamic animation with different delays
      this.scene.tweens.add({
        targets: dotContainer,
        y: { from: 0, to: -8 },
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: i * 150,
        ease: 'Sine.easeInOut'
      });
      
      // Add pulse animation to glow
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.7 },
        scale: { from: 1, to: 1.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        delay: i * 150,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Text indicator
    this.typingText = this.scene.add.text(50, 0, 'thinking...', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#8ac0ff',
      fontStyle: 'italic'
    }).setOrigin(0, 0.5);
    this.typingContainer.add(this.typingText);
    
    // Resize background to fit text
    this.typingBackground.clear();
    this.typingBackground.fillStyle(0x3a526a, 0.7);
    this.typingBackground.fillRoundedRect(
      -5, -10, 
      this.typingText.x + this.typingText.width + 10, 
      20, 
      8
    );
    
    // Add fade in/out animation for the whole typing indicator
    this.typingAnimation = {
      show: () => {
        this.typingContainer.setAlpha(0);
        this.typingContainer.setVisible(true);
        this.scene.tweens.add({
          targets: this.typingContainer,
          alpha: 1,
          duration: 300,
          ease: 'Sine.easeInOut'
        });
      },
      hide: () => {
        this.scene.tweens.add({
          targets: this.typingContainer,
          alpha: 0,
          duration: 300,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.typingContainer.setVisible(false);
          }
        });
      }
    };
    
    // Hide typing indicator initially
    this.typingContainer.setVisible(false);
  }
  
  /**
   * Create animations for Byte from the sprite sheet
   */
  createByteAnimations() {
    const anims = this.scene.anims;
    
    // Define animations using the frames from byte-ai-companion.svg
    // Each state/mood is at a specific position in the sprite sheet
    // Positions per asset documentation: neutral(24,24), happy(72,24), thinking(120,24), confused(168,24)
    
    if (!anims.exists('byte-neutral')) {
      anims.create({
        key: 'byte-neutral',
        frames: [{ key: 'byteSheet', frame: 0 }], // Neutral/Default at first frame
        frameRate: 5,
        repeat: -1
      });
    }
    
    if (!anims.exists('byte-happy')) {
      anims.create({
        key: 'byte-happy',
        frames: [{ key: 'byteSheet', frame: 1 }], // Happy at second frame
        frameRate: 5,
        repeat: -1
      });
    }
    
    if (!anims.exists('byte-thinking')) {
      anims.create({
        key: 'byte-thinking',
        frames: [{ key: 'byteSheet', frame: 2 }], // Thinking at third frame
        frameRate: 5,
        repeat: -1
      });
    }
    
    if (!anims.exists('byte-confused')) {
      anims.create({
        key: 'byte-confused',
        frames: [{ key: 'byteSheet', frame: 3 }], // Confused at fourth frame
        frameRate: 5,
        repeat: -1
      });
    }
  }
  
  /**
   * Create animations for different character moods
   */
  createMoodAnimations() {
    // Store animation tweens to control them later
    this.moodAnimations = {
      idle: null,
      thinking: null,
      happy: null,
      confused: null,
      excited: null
    };
    
    // Define animations for each mood
    this.defineMoodAnimations();
  }
  
  /**
   * Define the animations for each mood
   */
  defineMoodAnimations() {
    // Idle animation - neutral
    this.moodAnimations.idle = () => {
      // Play the neutral sprite animation
      this.byteSprite.play('byte-neutral');
      
      // Add subtle pulse animation to the sprite
      return this.scene.tweens.add({
        targets: this.byteSprite,
        scaleX: { from: 1.2, to: 1.25 },
        scaleY: { from: 1.2, to: 1.25 },
        yoyo: true,
        duration: 2000,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };
    
    // Thinking animation
    this.moodAnimations.thinking = () => {
      // Play the thinking sprite animation
      this.byteSprite.play('byte-thinking');
      
      // Speed up scan line
      this.scene.tweens.add({
        targets: this.scanLine,
        duration: 800,
        repeatDelay: 300
      });
      
      // Add rotation animation to create thinking effect
      return this.scene.tweens.add({
        targets: this.byteSprite,
        angle: 5,
        y: { from: 0, to: -5 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };
    
    // Happy animation
    this.moodAnimations.happy = () => {
      // Play the happy sprite animation
      this.byteSprite.play('byte-happy');
      
      // Add bouncing animation
      return this.scene.tweens.add({
        targets: this.container,
        y: this.options.y - 10,
        duration: 400,
        yoyo: true,
        repeat: 3,
        ease: 'Bounce'
      });
    };
    
    // Confused animation
    this.moodAnimations.confused = () => {
      // Play the confused sprite animation
      this.byteSprite.play('byte-confused');
      
      // Add wobble animation
      return this.scene.tweens.add({
        targets: this.container,
        angle: { from: -5, to: 5 },
        duration: 300,
        yoyo: true,
        repeat: 5,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Reset angle when finished
          this.container.angle = 0;
        }
      });
    };
    
    // Excited animation - use happy sprite with more energetic animations
    this.moodAnimations.excited = () => {
      // Play the happy sprite animation
      this.byteSprite.play('byte-happy');
      
      // Add more dynamic animations for excitement
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.7,
        scale: 1.5,
        duration: 300,
        yoyo: true,
        repeat: 5
      });
      
      // Add scaling animation
      return this.scene.tweens.add({
        targets: this.byteSprite,
        scaleX: { from: 1.2, to: 1.4 },
        scaleY: { from: 1.2, to: 1.4 },
        duration: 200,
        yoyo: true,
        repeat: 3
      });
    };
  }
  
  /**
   * Reset any color tweens that might be active
   */
  resetColorTweens() {
    // Stop all running tweens
    this.scene.tweens.killTweensOf(this.innerCircle);
    this.scene.tweens.killTweensOf(this.avatarCircle);
    
    // Reset transforms
    this.avatarCircle.setScale(1);
    this.innerCircle.setScale(1);
    this.innerCircle.setAngle(0);
  }
  
  /**
   * Play a mood animation
   * @param {String} mood - The mood to display ('idle', 'thinking', 'happy', 'confused', 'excited')
   */
  playMood(mood) {
    // Validate mood
    if (!this.moodAnimations[mood]) {
      console.warn(`Unknown mood: ${mood}`);
      mood = 'idle';
    }
    
    // Update current mood
    this.state.currentMood = mood;
    
    // Play the mood animation
    const animation = this.moodAnimations[mood]();
    
    // Highlight glow when in active moods
    if (mood !== 'idle') {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.5,
        duration: 300
      });
    } else {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0,
        duration: 300
      });
    }
    
    return animation;
  }
  
  /**
   * Display a message in the speech bubble
   * @param {String} message - The message to display
   * @param {Object} options - Display options
   * @param {String} options.mood - Mood to display ('idle', 'thinking', 'happy', 'confused', 'excited')
   * @param {Number} options.duration - How long to display the message in ms (0 = indefinite)
   * @param {Boolean} options.typing - Whether to show typing animation before message
   * @param {Function} options.onComplete - Callback when message display completes
   */
  async say(message, options = {}) {
    // Default options
    const defaultOptions = {
      mood: 'idle',
      duration: 5000, // 5 seconds by default
      typing: true,
      onComplete: null
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Show thinking animation while typing
    if (opts.typing) {
      await this.showThinking();
    }
    
    // Play the specified mood
    this.playMood(opts.mood);
    
    // Show the speech bubble with animation
    this.speechContainer.setVisible(true);
    if (this.speechBubbleAnimation) {
      this.speechBubbleAnimation.show();
    }
    
    // Set the message (with typewriter effect if not coming from thinking)
    if (opts.typing) {
      // Just set the text directly since we already showed typing animation
      this.messageText.setText(message);
      this.typingContainer.setVisible(false);
    } else {
      // Use typewriter effect
      await this.typewriterEffect(message);
    }
    
    // Set speaking flag
    this.state.isSpeaking = true;
    
    // Auto-hide after duration if specified
    if (opts.duration > 0) {
      this.scene.time.delayedCall(opts.duration, () => {
        this.hideSpeechBubble();
        
        // Reset to idle when done
        this.playMood('idle');
        
        // Call completion callback if provided
        if (opts.onComplete) {
          opts.onComplete();
        }
      });
    }
  }
  
  /**
   * Create a typewriter text effect
   * @param {String} message - The message to type
   * @returns {Promise} - Resolves when typing is complete
   */
  typewriterEffect(message) {
    return new Promise((resolve) => {
      // Start with empty text
      this.messageText.setText('');
      
      // Hide typing indicator
      this.typingContainer.setVisible(false);
      
      // Split the message into characters
      const chars = message.split('');
      let currentIndex = 0;
      const typingSpeed = 30; // ms per character
      
      // Create a timer to add characters one by one
      const typingTimer = this.scene.time.addEvent({
        delay: typingSpeed,
        callback: () => {
          // Add the next character
          this.messageText.setText(this.messageText.text + chars[currentIndex]);
          currentIndex++;
          
          // Stop when all characters are typed
          if (currentIndex >= chars.length) {
            typingTimer.destroy();
            resolve();
          }
        },
        callbackScope: this,
        repeat: chars.length - 1
      });
    });
  }
  
  /**
   * Show the thinking animation with typing indicator
   * @returns {Promise} Resolves when thinking animation completes
   */
  showThinking() {
    return new Promise((resolve) => {
      // Show speech bubble with typing indicator
      this.speechContainer.setVisible(true);
      
      // Show bubble with animation if it was hidden
      if (this.speechBubbleAnimation) {
        this.speechBubbleAnimation.show(200);
      }
      
      // Clear any previous text
      this.messageText.setText('');
      
      // Show typing animation
      if (this.typingAnimation) {
        this.typingAnimation.show();
      } else {
        this.typingContainer.setVisible(true);
      }
      
      // Play thinking animation with enhanced visual effects
      this.playMood('thinking');
      
      // Add a pulsing glow effect while thinking
      this.scene.tweens.add({
        targets: this.glow,
        alpha: { from: 0, to: 0.6 },
        scale: { from: 1, to: 1.2 },
        yoyo: true,
        repeat: 3,
        duration: 300,
        ease: 'Sine.easeInOut'
      });
      
      // Resolve after a short delay to simulate thinking
      // Using a random time makes it feel more natural
      this.scene.time.delayedCall(Phaser.Math.Between(800, 1200), () => {
        resolve();
      });
    });
  }
  
  /**
   * Hide the speech bubble
   */
  hideSpeechBubble() {
    // Use animation if available
    if (this.speechBubbleAnimation) {
      this.speechBubbleAnimation.hide();
    } else {
      this.speechContainer.setVisible(false);
    }
    
    // Hide typing indicator with animation
    if (this.typingAnimation) {
      this.typingAnimation.hide();
    } else {
      this.typingContainer.setVisible(false);
    }
    
    // Update state
    this.state.isSpeaking = false;
    
    // Return to idle state
    this.playMood('idle');
    
    // Emit event for tracking
    this.emit('message-closed');
  }
  
  /**
   * Set the position of the assistant
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPosition(x, y) {
    this.options.x = x;
    this.options.y = y;
    this.container.setPosition(x, y);
  }
  
  /**
   * Set the visibility of the assistant
   * @param {Boolean} visible - Whether the assistant should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }
  
  /**
   * Set the scale of the assistant
   * @param {Number} scale - Scale factor
   */
  setScale(scale) {
    this.options.scale = scale;
    this.container.setScale(scale);
  }
  
  /**
   * Emit an event to the scene
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data = {}) {
    this.scene.events.emit(`byte-${event}`, { ...data, assistant: this });
  }
  
  /**
   * Get an AI-powered response based on the current game context
   * @param {Object} gameState - Current game state
   * @returns {Promise<void>} - Shows the AI response
   */
  async getAIResponse(gameState) {
    try {
      // Show thinking animation while waiting for the API
      this.state.processingRequest = true;
      await this.showThinking();
      
      // Get response from the AI assistant
      const response = await this.aiAssistant.getResponse(gameState);
      
      // Determine appropriate mood based on context
      const mood = this.determineMood(gameState);
      
      // Display the response
      this.say(response, { 
        mood, 
        duration: 6000, // Show for longer since it's an AI response
        typing: false // Skip typing animation since we already showed thinking
      });
      
      // Emit an event to notify that a hint was delivered (for tracking)
      if (gameState.requestType === 'hint') {
        this.emit('hint-delivered', response);
      }
      
      // Track for analytics if needed
      this.trackInteraction(gameState, response);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Show fallback response with confused mood
      this.say(
        "Hmm, my circuits are a bit tangled. Let's try a different approach!",
        { mood: 'confused', duration: 4000, typing: false }
      );
    } finally {
      this.state.processingRequest = false;
    }
  }
  
  /**
   * Determine appropriate mood based on game context
   * @param {Object} gameState - Current game state
   * @returns {String} - Appropriate mood
   */
  determineMood(gameState) {
    const { errorMessage, attemptCount } = gameState;
    
    if (errorMessage) {
      return 'confused'; // Show confused when there's an error
    } else if (attemptCount > 3) {
      return 'thinking'; // Show thinking for multiple attempts
    } else if (attemptCount === 1) {
      return 'excited'; // Show excited for first attempt
    }
    
    return 'happy'; // Default to happy
  }
  
  /**
   * Track interaction for analytics
   * @param {Object} gameState - Game state
   * @param {String} response - Assistant's response
   */
  trackInteraction(gameState, response) {
    // In a real implementation, this would send data to an analytics service
    console.log('ByteAssistant interaction:', {
      timestamp: new Date().toISOString(),
      challenge: gameState.challengeId,
      mission: gameState.currentMission,
      attemptCount: gameState.attemptCount,
      responseLength: response.length
    });
  }
  
  /**
   * Get a hint for the current challenge
   * @param {Object} gameState - Current game state
   */
  async getHint(gameState) {
    // Record the timestamp for this hint request
    const requestTimestamp = Date.now();
    
    // Store the last hint request attributes
    this.lastHintRequest = {
      challengeId: gameState.challengeId,
      timestamp: requestTimestamp,
      attemptCount: gameState.attemptCount || 1
    };
    
    // Add hint-specific context
    const hintContext = {
      ...gameState,
      requestType: 'hint',
      previousHints: this.aiAssistant.getPreviousHints(gameState.challengeId)
    };
    
    // Get and show AI response
    await this.getAIResponse(hintContext);
    
    // Track hint effectiveness
    this.trackHintEffectiveness(requestTimestamp, gameState.challengeId);
  }
  
  /**
   * Track hint effectiveness by monitoring if the player completes the challenge
   * after receiving the hint
   * @param {Number} hintTimestamp - When the hint was given
   * @param {String} challengeId - Challenge ID
   */
  trackHintEffectiveness(hintTimestamp, challengeId) {
    // We'll check if the challenge is completed within a reasonable timeframe
    // This would be called when the challenge is completed
    this.hintEffectivenessTimer = this.scene.time.delayedCall(60000, () => {
      // After 60 seconds, check if the challenge was completed
      const wasCompleted = this.scene.stateManager?.getState(`challenges.${challengeId}.completed`);
      
      if (wasCompleted) {
        console.log(`Hint was effective - challenge completed within 60 seconds`);
        // Could send this to analytics or store for improvement
      }
    });
  }
  
  /**
   * Get feedback on player's code
   * @param {Object} gameState - Current game state with code
   */
  async getCodeFeedback(gameState) {
    // Add feedback-specific context
    const feedbackContext = {
      ...gameState,
      requestType: 'feedback'
    };
    
    // Get and show AI response
    await this.getAIResponse(feedbackContext);
  }
  
  /**
   * Get an explanation for an error
   * @param {Object} gameState - Current game state with error
   */
  async explainError(gameState) {
    // Add error-specific context
    const errorContext = {
      ...gameState,
      requestType: 'error-explanation'
    };
    
    // Get and show AI response
    await this.getAIResponse(errorContext);
  }

  /**
   * Clean up the assistant
   */
  destroy() {
    // Stop all tweens
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.avatarCircle);
    this.scene.tweens.killTweensOf(this.innerCircle);
    this.scene.tweens.killTweensOf(this.hologramRing);
    this.scene.tweens.killTweensOf(this.scanLine);
    this.scene.tweens.killTweensOf(this.typingDots);
    
    // Destroy container (will destroy all children)
    this.container.destroy();
  }
}

export default ByteAssistant;