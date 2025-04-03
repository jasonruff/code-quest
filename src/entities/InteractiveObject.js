import Phaser from 'phaser';

/**
 * Interactive Object class
 * Represents an object in the game world that the player can interact with
 */
class InteractiveObject extends Phaser.GameObjects.Zone {
  /**
   * Create a new interactive object
   * @param {Phaser.Scene} scene - The scene this object belongs to
   * @param {Number} x - X position
   * @param {Number} y - Y position
   * @param {Number} width - Width of the interactive area
   * @param {Number} height - Height of the interactive area
   * @param {Object} config - Configuration options
   * @param {String} config.name - Name of the object
   * @param {String} config.type - Type of object (e.g., 'computer', 'terminal')
   * @param {Object} config.properties - Additional properties for the object
   */
  constructor(scene, x, y, width, height, config = {}) {
    super(scene, x, y, width, height);
    
    this.scene = scene;
    this.name = config.name || 'interactive_object';
    this.type = config.type || 'generic';
    this.properties = config.properties || {};
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.world.enable(this, Phaser.Physics.Arcade.STATIC_BODY);
    
    // Create visual indicator
    this.createIndicator();
    
    // Track interaction state
    this.isActive = false;
    this.lastInteracted = 0;
    
    // Cooldown time (in ms) between interactions
    this.interactionCooldown = 500;
  }
  
  /**
   * Create a visual indicator for the interactive object
   */
  createIndicator() {
    // Choose color based on object type
    let color;
    switch (this.type) {
      case 'computer':
        color = 0x00ffff; // Cyan
        break;
      case 'terminal':
        color = 0xffff00; // Yellow
        break;
      case 'door':
        color = 0xff00ff; // Magenta
        break;
      case 'screen':
        color = 0x00ff00; // Green
        break;
      default:
        color = 0xffffff; // White
    }
    
    // Create ellipse indicator
    this.indicator = this.scene.add.ellipse(
      this.x,
      this.y,
      this.width * 0.5,
      this.height * 0.5,
      color,
      0.3
    );
    
    // Make the indicator pulse
    this.scene.tweens.add({
      targets: this.indicator,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
  
  /**
   * Highlight this object when the player is near
   * @param {Boolean} active - Whether the object should be highlighted
   */
  setHighlight(active) {
    if (this.isActive === active) return;
    
    this.isActive = active;
    
    if (active) {
      // Enhance the indicator when active
      this.scene.tweens.add({
        targets: this.indicator,
        alpha: 0.6,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        ease: 'Bounce.easeOut'
      });
    } else {
      // Return to normal pulsing state
      this.scene.tweens.add({
        targets: this.indicator,
        alpha: 0.3,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Sine.easeOut'
      });
    }
  }
  
  /**
   * Interact with this object
   * @returns {Object|null} Interaction result or null if on cooldown
   */
  interact() {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastInteracted < this.interactionCooldown) {
      return null;
    }
    
    this.lastInteracted = now;
    
    // Create a visual feedback effect
    this.createInteractionEffect();
    
    // Return interaction data
    return {
      name: this.name,
      type: this.type,
      properties: this.properties,
      message: this.properties.message || `Interacting with ${this.name}`
    };
  }
  
  /**
   * Create a visual effect when interacting with the object
   */
  createInteractionEffect() {
    // Create an expanding circle at the interaction point
    const effect = this.scene.add.circle(
      this.x,
      this.y,
      Math.min(this.width, this.height) * 0.4,
      0xffffff,
      0.7
    );
    
    // Animation for the effect
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        effect.destroy();
      }
    });
  }
  
  /**
   * Update this object
   * @param {Number} time - Current time
   * @param {Number} delta - Time since last update
   */
  update(time, delta) {
    // Override this method for custom update behavior
  }
  
  /**
   * Clean up resources when destroying the object
   */
  destroy() {
    if (this.indicator) {
      this.indicator.destroy();
    }
    
    super.destroy();
  }
}

export default InteractiveObject;