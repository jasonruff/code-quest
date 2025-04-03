import Phaser from 'phaser';

/**
 * Progress Bar Component
 * Displays a progress bar for various game mechanics (experience, mission progress, etc.)
 */
class ProgressBar {
  /**
   * Create a new ProgressBar
   * @param {Phaser.Scene} scene - The scene the progress bar belongs to
   * @param {Object} options - Progress bar options
   * @param {Number} options.x - X position
   * @param {Number} options.y - Y position
   * @param {Number} options.width - Width of the progress bar
   * @param {Number} options.height - Height of the progress bar
   * @param {Number} options.value - Initial value (0-100)
   * @param {String} options.label - Optional label text
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    
    // Default options
    this.options = {
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 100,
      height: options.height || 10,
      value: options.value !== undefined ? options.value : 0,
      label: options.label || '',
      fillColor: options.fillColor || 0x4a9df8,
      backgroundColor: options.backgroundColor || 0x222222,
      borderColor: options.borderColor || 0xffffff,
      labelColor: options.labelColor || '#ffffff',
      showValue: options.showValue !== undefined ? options.showValue : false,
      valueFormat: options.valueFormat || '{value}%',
      textSize: options.textSize || 12,
      labelPosition: options.labelPosition || 'above' // 'above', 'below', 'left', 'right', 'center'
    };
    
    // Create a container for all elements
    this.container = scene.add.container(this.options.x, this.options.y);
    
    // Create the progress bar elements
    this.createProgressBar();
  }
  
  /**
   * Create the progress bar visual elements
   */
  createProgressBar() {
    const { width, height, value, backgroundColor, fillColor, borderColor } = this.options;
    
    // Background
    this.background = this.scene.add.rectangle(0, 0, width, height, backgroundColor);
    this.background.setOrigin(0, 0);
    
    // Fill (progress indicator)
    this.fill = this.scene.add.rectangle(0, 0, width * (value / 100), height, fillColor);
    this.fill.setOrigin(0, 0);
    
    // Border
    this.border = this.scene.add.rectangle(0, 0, width, height, borderColor);
    this.border.setStrokeStyle(1, borderColor);
    this.border.setFillStyle();
    this.border.setOrigin(0, 0);
    
    // Add elements to container
    this.container.add([this.background, this.fill, this.border]);
    
    // Add label if provided
    if (this.options.label) {
      this.createLabel();
    }
    
    // Add value text if enabled
    if (this.options.showValue) {
      this.createValueText();
    }
  }
  
  /**
   * Create the label text
   */
  createLabel() {
    const { width, height, label, labelColor, textSize, labelPosition } = this.options;
    
    // Create text object
    this.labelText = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: `${textSize}px`,
      color: labelColor
    });
    
    // Position based on labelPosition
    switch (labelPosition) {
      case 'above':
        this.labelText.setPosition(width / 2, -5 - textSize / 2);
        this.labelText.setOrigin(0.5, 1);
        break;
      case 'below':
        this.labelText.setPosition(width / 2, height + 5);
        this.labelText.setOrigin(0.5, 0);
        break;
      case 'left':
        this.labelText.setPosition(-5, height / 2);
        this.labelText.setOrigin(1, 0.5);
        break;
      case 'right':
        this.labelText.setPosition(width + 5, height / 2);
        this.labelText.setOrigin(0, 0.5);
        break;
      case 'center':
        this.labelText.setPosition(width / 2, height / 2);
        this.labelText.setOrigin(0.5, 0.5);
        break;
    }
    
    // Add to container
    this.container.add(this.labelText);
  }
  
  /**
   * Create the value text
   */
  createValueText() {
    const { width, height, value, valueFormat, labelColor, textSize } = this.options;
    
    // Create text object
    this.valueText = this.scene.add.text(
      width / 2,
      height / 2,
      this.formatValue(value),
      {
        fontFamily: 'Arial',
        fontSize: `${textSize}px`,
        color: labelColor
      }
    ).setOrigin(0.5, 0.5);
    
    // Add to container
    this.container.add(this.valueText);
  }
  
  /**
   * Format the value text using the valueFormat template
   * @param {Number} value - Current value 
   * @returns {String} Formatted value text
   */
  formatValue(value) {
    return this.options.valueFormat.replace('{value}', Math.round(value));
  }
  
  /**
   * Set the progress value
   * @param {Number} value - New value (0-100)
   * @param {Boolean} animate - Whether to animate the transition
   * @param {Number} duration - Animation duration in ms (if animate=true)
   */
  setValue(value, animate = false, duration = 500) {
    // Ensure value is within bounds
    const clampedValue = Math.max(0, Math.min(100, value));
    this.options.value = clampedValue;
    
    // Update fill width
    const targetWidth = this.options.width * (clampedValue / 100);
    
    if (animate) {
      // Animate the fill
      this.scene.tweens.add({
        targets: this.fill,
        width: targetWidth,
        duration: duration,
        ease: 'Power2'
      });
    } else {
      // Update instantly
      this.fill.width = targetWidth;
    }
    
    // Update value text if present
    if (this.valueText) {
      this.valueText.setText(this.formatValue(clampedValue));
    }
  }
  
  /**
   * Set the progress bar label
   * @param {String} text - New label text
   */
  setLabel(text) {
    this.options.label = text;
    
    if (this.labelText) {
      this.labelText.setText(text);
    } else if (text) {
      // Create label if it doesn't exist
      this.createLabel();
    }
  }
  
  /**
   * Set the fill color
   * @param {Number} color - New fill color (hex)
   */
  setFillColor(color) {
    this.options.fillColor = color;
    this.fill.setFillStyle(color);
  }
  
  /**
   * Set the visibility of the progress bar
   * @param {Boolean} visible - Whether the progress bar should be visible
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }
  
  /**
   * Set the position of the progress bar
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPosition(x, y) {
    this.container.setPosition(x, y);
  }
  
  /**
   * Clean up resources when destroying the progress bar
   */
  destroy() {
    this.container.destroy(true);
  }
}

export default ProgressBar;