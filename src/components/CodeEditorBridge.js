import Phaser from 'phaser';
import ReactDOM from 'react-dom/client';
import React from 'react';
import CodeEditorComponent from './CodeEditorComponent';

/**
 * Bridge class to connect Phaser scene with React-based code editor
 */
class CodeEditorBridge {
  /**
   * Create a new CodeEditorBridge
   * @param {Phaser.Scene} scene - The scene this editor belongs to
   * @param {Object} options - Options for the editor
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    
    // Default options
    this.options = {
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 400,
      height: options.height || 300,
      initialCode: options.initialCode || '// Write your code here\n',
      challenge: options.challenge || null,
      visible: options.visible !== undefined ? options.visible : true,
    };
    
    // Create container for the editor
    this.container = document.createElement('div');
    this.container.id = 'code-editor-container';
    this.container.style.position = 'absolute';
    this.container.style.left = `${this.options.x}px`;
    this.container.style.top = `${this.options.y}px`;
    this.container.style.width = `${this.options.width}px`;
    this.container.style.height = `${this.options.height}px`;
    this.container.style.display = this.options.visible ? 'block' : 'none';
    this.container.style.zIndex = '100';
    
    document.body.appendChild(this.container);
    
    // Setup React component
    this.setupReactComponent();
    
    // Create the Phaser UI elements (if needed)
    this.createPhaserUI();
  }
  
  /**
   * Setup the React component
   */
  setupReactComponent() {
    const { challenge } = this.options;
    
    // Create root for React
    this.reactRoot = ReactDOM.createRoot(this.container);
    
    // Render React component
    this.reactRoot.render(
      <CodeEditorComponent 
        challenge={challenge}
        onSuccess={this.handleSuccess.bind(this)}
        onFailure={this.handleFailure.bind(this)}
        onError={this.handleError.bind(this)}
      />
    );
  }
  
  /**
   * Create any additional Phaser UI elements if needed
   */
  createPhaserUI() {
    // For now, we'll let the React component handle all the UI
    // But we could add additional Phaser elements here
  }
  
  /**
   * Handle successful challenge completion
   * @param {Object} data - Success data
   */
  handleSuccess(data) {
    // Create a custom event to communicate with the Phaser scene
    const event = new CustomEvent('challenge-complete', {
      detail: data
    });
    window.dispatchEvent(event);
    
    // You can also emit a Phaser event if needed
    if (this.scene && this.scene.events) {
      this.scene.events.emit('challenge-success', data);
    }
  }
  
  /**
   * Handle challenge failure
   * @param {Object} data - Failure data
   */
  handleFailure(data) {
    if (this.scene && this.scene.events) {
      this.scene.events.emit('challenge-failed', data);
    }
  }
  
  /**
   * Handle code error
   * @param {Object} data - Error data
   */
  handleError(data) {
    if (this.scene && this.scene.events) {
      this.scene.events.emit('code-error', data);
    }
  }
  
  /**
   * Set the challenge for the editor
   * @param {Object} challenge - Challenge object
   */
  setChallenge(challenge) {
    // Update the React component
    this.options.challenge = challenge;
    
    // Re-render with new challenge
    this.setupReactComponent();
  }
  
  /**
   * Set the visibility of the editor
   * @param {Boolean} visible - Whether the editor should be visible
   */
  setVisible(visible) {
    this.container.style.display = visible ? 'block' : 'none';
  }
  
  /**
   * Set the position of the editor
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPosition(x, y) {
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
  }
  
  /**
   * Set the size of the editor
   * @param {Number} width - New width
   * @param {Number} height - New height
   */
  setSize(width, height) {
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }
  
  /**
   * Clean up resources when destroying the editor
   */
  destroy() {
    // Unmount React component
    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
    
    // Remove DOM element
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default CodeEditorBridge;