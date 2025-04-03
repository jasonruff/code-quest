import Phaser from 'phaser';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { parse as acornParse } from 'acorn';

/**
 * Code Editor Component
 * A code editor using CodeMirror integrated with Phaser
 */
class CodeEditor {
  /**
   * Create a new CodeEditor
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
      fontSize: options.fontSize || 14,
      fontFamily: options.fontFamily || 'monospace',
      theme: options.theme || 'dark',
      language: options.language || 'javascript',
      challenge: options.challenge || null,
      visible: options.visible !== undefined ? options.visible : true,
    };
    
    // Container for the editor
    this.container = document.createElement('div');
    this.container.id = 'code-editor-container';
    this.container.style.position = 'absolute';
    this.container.style.left = `${this.options.x}px`;
    this.container.style.top = `${this.options.y}px`;
    this.container.style.width = `${this.options.width}px`;
    this.container.style.height = `${this.options.height}px`;
    this.container.style.backgroundColor = this.options.theme === 'dark' ? '#282c34' : '#ffffff';
    this.container.style.borderRadius = '5px';
    this.container.style.overflow = 'hidden';
    this.container.style.display = this.options.visible ? 'block' : 'none';
    
    // Create the editor
    document.body.appendChild(this.container);
    this.setupEditor();
    
    // Create the Phaser UI elements (buttons, etc.)
    this.createPhaserUI();
    
    // Error decoration array - for tracking error highlights
    this.errorDecorations = [];
    
    // Reference to the current challenge
    this.currentChallenge = this.options.challenge;
  }
  
  /**
   * Set up the CodeMirror editor
   */
  setupEditor() {
    // Editor extensions for functionality
    const extensions = [
      basicSetup,
      javascript(),
      keymap.of([indentWithTab]),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      EditorState.tabSize.of(2),
    ];
    
    // Add theme based on options
    if (this.options.theme === 'dark') {
      extensions.push(oneDark);
    }
    
    // Create editor state
    this.editorState = EditorState.create({
      doc: this.options.initialCode,
      extensions,
    });
    
    // Create editor view
    this.editorView = new EditorView({
      state: this.editorState,
      parent: this.container,
    });
    
    // Style the editor further
    this.styleEditor();
  }
  
  /**
   * Apply additional styling to the editor
   */
  styleEditor() {
    // Get the editor's DOM node
    const editorDom = this.editorView.dom;
    
    // Apply custom styling
    editorDom.style.height = '100%';
    editorDom.style.fontSize = `${this.options.fontSize}px`;
    editorDom.style.fontFamily = this.options.fontFamily;
    
    // Add a class for custom CSS targeting if needed
    editorDom.classList.add('codequest-editor');
    
    // Enforce dark/light theme colors
    if (this.options.theme === 'dark') {
      editorDom.style.backgroundColor = '#282c34';
      editorDom.style.color = '#abb2bf';
    } else {
      editorDom.style.backgroundColor = '#ffffff';
      editorDom.style.color = '#000000';
    }
  }
  
  /**
   * Create Phaser UI elements for the editor
   */
  createPhaserUI() {
    const { width, height } = this.options;
    
    // Create a container for Phaser UI elements
    this.uiContainer = this.scene.add.container(this.options.x, this.options.y);
    
    // Add a border around the editor
    this.border = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    this.border.setStrokeStyle(2, 0x4a9df8);
    this.border.setOrigin(0, 0);
    this.uiContainer.add(this.border);
    
    // Add run button
    this.runButton = this.scene.add.rectangle(
      width - 10, 
      height + 10, 
      100, 
      30, 
      0x238636, 
      1
    );
    this.runButton.setOrigin(1, 0);
    
    this.runButtonText = this.scene.add.text(
      this.runButton.x - this.runButton.width / 2,
      this.runButton.y + this.runButton.height / 2,
      'Run Code',
      { 
        fontFamily: 'Arial', 
        fontSize: '14px', 
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);
    
    // Make button interactive
    this.runButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.runCode, this)
      .on('pointerover', () => {
        this.runButton.setFillStyle(0x2ea043);
      })
      .on('pointerout', () => {
        this.runButton.setFillStyle(0x238636);
      });
    
    // Add reset button
    this.resetButton = this.scene.add.rectangle(
      width - 120, 
      height + 10, 
      100, 
      30, 
      0x444444, 
      1
    );
    this.resetButton.setOrigin(1, 0);
    
    this.resetButtonText = this.scene.add.text(
      this.resetButton.x - this.resetButton.width / 2,
      this.resetButton.y + this.resetButton.height / 2,
      'Reset Code',
      { 
        fontFamily: 'Arial', 
        fontSize: '14px', 
        color: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);
    
    // Make reset button interactive
    this.resetButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.resetCode, this)
      .on('pointerover', () => {
        this.resetButton.setFillStyle(0x666666);
      })
      .on('pointerout', () => {
        this.resetButton.setFillStyle(0x444444);
      });
    
    // Add all elements to UI container
    this.uiContainer.add([
      this.runButton, 
      this.runButtonText, 
      this.resetButton, 
      this.resetButtonText
    ]);
    
    // Create console output area
    this.createConsoleOutput();
    
    // Set visibility based on options
    this.uiContainer.setVisible(this.options.visible);
  }
  
  /**
   * Create console output area
   */
  createConsoleOutput() {
    const { width, height } = this.options;
    
    // Console background
    this.consoleBackground = this.scene.add.rectangle(
      0,
      height + 50,
      width,
      100,
      0x1e1e1e,
      1
    );
    this.consoleBackground.setOrigin(0, 0);
    
    // Console header
    this.consoleHeader = this.scene.add.rectangle(
      0,
      height + 50,
      width,
      20,
      0x333333,
      1
    );
    this.consoleHeader.setOrigin(0, 0);
    
    this.consoleHeaderText = this.scene.add.text(
      10,
      height + 50 + 10,
      'Console Output',
      { 
        fontFamily: 'Arial', 
        fontSize: '12px', 
        color: '#ffffff' 
      }
    ).setOrigin(0, 0.5);
    
    // Console output text
    this.consoleOutput = this.scene.add.text(
      10,
      height + 80,
      '',
      { 
        fontFamily: 'monospace', 
        fontSize: '12px', 
        color: '#dddddd',
        wordWrap: { width: width - 20 }
      }
    ).setOrigin(0, 0);
    
    // Add to UI container
    this.uiContainer.add([
      this.consoleBackground,
      this.consoleHeader,
      this.consoleHeaderText,
      this.consoleOutput
    ]);
  }
  
  /**
   * Run the code in the editor
   */
  runCode() {
    // Clear previous console output and errors
    this.clearConsole();
    this.clearErrorHighlights();
    
    // Get code from the editor
    const code = this.getCode();
    
    try {
      // First check syntax using acorn parser
      acornParse(code, { ecmaVersion: 2020 });
      
      // Create a sandbox environment for running the code
      const sandbox = this.createSandbox();
      
      // Execute the code in the sandbox
      const result = this.executeCodeInSandbox(code, sandbox);
      
      // Validate result against the challenge if there is one
      if (this.currentChallenge) {
        const validation = this.validateResult(result, sandbox);
        
        if (validation.success) {
          this.showSuccessMessage(validation.message);
          
          // Emit successful completion event
          const challengeCompleteEvent = new CustomEvent('challenge-complete', {
            detail: {
              challengeId: this.currentChallenge.id,
              code: code,
              result: result
            }
          });
          window.dispatchEvent(challengeCompleteEvent);
        } else {
          this.showFailureMessage(validation.message);
        }
      } else {
        // If no challenge, just show the result
        this.appendToConsole('Code executed successfully!', 'success');
      }
    } catch (error) {
      // Handle syntax or runtime errors
      this.handleCodeError(error);
    }
  }
  
  /**
   * Create a sandbox environment for running code
   * @returns {Object} Sandbox object with permitted globals
   */
  createSandbox() {
    // Create a limited set of globals for the sandbox
    const sandbox = {
      console: {
        log: (...args) => this.appendToConsole(args.map(arg => this.stringify(arg)).join(' ')),
        error: (...args) => this.appendToConsole(args.map(arg => this.stringify(arg)).join(' '), 'error'),
        warn: (...args) => this.appendToConsole(args.map(arg => this.stringify(arg)).join(' '), 'warning')
      },
      // Add other safe globals as needed
      setTimeout: () => { throw new Error('setTimeout is not available in the sandbox'); },
      fetch: () => { throw new Error('fetch is not available in the sandbox'); },
      // Challenge-specific variables and functions can be added here
      __challengeResult: undefined
    };
    
    // Add challenge-specific context
    if (this.currentChallenge && this.currentChallenge.context) {
      Object.assign(sandbox, this.currentChallenge.context);
    }
    
    return sandbox;
  }
  
  /**
   * Execute code in a sandbox environment
   * @param {String} code - The code to execute
   * @param {Object} sandbox - The sandbox environment
   * @returns {*} The result of execution
   */
  executeCodeInSandbox(code, sandbox) {
    // Create a function that takes sandbox properties as parameters
    const sandboxKeys = Object.keys(sandbox);
    const sandboxValues = sandboxKeys.map(key => sandbox[key]);
    
    // Create a function that will execute in the context of the sandbox
    // We wrap user code in a try-catch to handle runtime errors
    const wrappedCode = `
      'use strict';
      try {
        ${code}
        return __challengeResult;
      } catch (error) {
        throw error;
      }
    `;
    
    // Create and execute the sandbox function
    try {
      const sandboxFunction = new Function(...sandboxKeys, wrappedCode);
      return sandboxFunction(...sandboxValues);
    } catch (error) {
      // Re-throw to be handled by the caller
      throw error;
    }
  }
  
  /**
   * Validate the result against the challenge requirements
   * @param {*} result - The result of code execution
   * @param {Object} sandbox - The sandbox environment
   * @returns {Object} Validation result {success, message}
   */
  validateResult(result, sandbox) {
    if (!this.currentChallenge || !this.currentChallenge.validate) {
      return { success: false, message: 'No validation available for this challenge.' };
    }
    
    try {
      // Call the challenge's validate function
      return this.currentChallenge.validate(result, sandbox);
    } catch (error) {
      console.error('Error in challenge validation:', error);
      return { 
        success: false, 
        message: 'An error occurred during validation.' 
      };
    }
  }
  
  /**
   * Show a success message for a completed challenge
   * @param {String} message - Success message
   */
  showSuccessMessage(message) {
    this.appendToConsole(message, 'success');
    
    // Highlight success in the UI
    if (this.scene.events) {
      this.scene.events.emit('challenge-success', {
        message,
        challengeId: this.currentChallenge?.id
      });
    }
  }
  
  /**
   * Show a failure message for an incomplete challenge
   * @param {String} message - Failure message
   */
  showFailureMessage(message) {
    this.appendToConsole(message, 'error');
    
    // Notify the game
    if (this.scene.events) {
      this.scene.events.emit('challenge-failed', {
        message,
        challengeId: this.currentChallenge?.id
      });
    }
  }
  
  /**
   * Handle code errors
   * @param {Error} error - The error that occurred
   */
  handleCodeError(error) {
    this.appendToConsole(`Error: ${error.message}`, 'error');
    
    // Try to extract line number from error
    const lineMatch = error.stack?.match(/\\d+:\\d+/) 
      || error.stack?.match(/line \\d+/)
      || error.message?.match(/\\d+:\\d+/)
      || error.message?.match(/line \\d+/);
    
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[0].match(/\\d+/)[0], 10);
      this.highlightError(lineNumber - 1); // CodeMirror is 0-indexed
    }
    
    // Notify the game
    if (this.scene.events) {
      this.scene.events.emit('code-error', {
        error,
        challengeId: this.currentChallenge?.id
      });
    }
  }
  
  /**
   * Highlight an error in the code editor
   * @param {Number} line - Line number with the error (0-indexed)
   */
  highlightError(line) {
    // First clear any existing error highlights
    this.clearErrorHighlights();
    
    // Create a decoration for the error line
    const decoration = this.editorView.decorations.line(line, "error-line");
    
    // Apply the decoration
    this.errorDecorations.push(decoration);
    this.editorView.update([decoration]);
    
    // Add error styling to the editor
    const editorStyle = document.createElement('style');
    editorStyle.textContent = `
      .error-line {
        background-color: rgba(255, 0, 0, 0.2);
        border-left: 2px solid red;
      }
    `;
    document.head.appendChild(editorStyle);
  }
  
  /**
   * Clear error highlights from the editor
   */
  clearErrorHighlights() {
    if (this.errorDecorations.length > 0) {
      this.editorView.update([]);
      this.errorDecorations = [];
    }
  }
  
  /**
   * Reset the code editor to the initial state
   */
  resetCode() {
    // Confirm reset
    const confirmReset = window.confirm('Are you sure you want to reset your code?');
    if (!confirmReset) return;
    
    // Clear the editor and set initial code
    this.setCode(this.options.initialCode);
    
    // Clear console and error highlights
    this.clearConsole();
    this.clearErrorHighlights();
    
    // Notify the game
    if (this.scene.events) {
      this.scene.events.emit('code-reset', {
        challengeId: this.currentChallenge?.id
      });
    }
  }
  
  /**
   * Set the challenge for the editor
   * @param {Object} challenge - Challenge object
   */
  setChallenge(challenge) {
    this.currentChallenge = challenge;
    
    // Update initial code if provided
    if (challenge && challenge.initialCode) {
      this.setCode(challenge.initialCode);
    }
    
    // Clear console and error highlights
    this.clearConsole();
    this.clearErrorHighlights();
  }
  
  /**
   * Get the current code from the editor
   * @returns {String} The current code
   */
  getCode() {
    return this.editorView.state.doc.toString();
  }
  
  /**
   * Set the code in the editor
   * @param {String} code - The code to set
   */
  setCode(code) {
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: code
      }
    });
  }
  
  /**
   * Append text to the console output
   * @param {String} text - Text to append
   * @param {String} type - Type of message ('log', 'error', 'warning', 'success')
   */
  appendToConsole(text, type = 'log') {
    let color;
    switch (type) {
      case 'error':
        color = '#ff6666';
        break;
      case 'warning':
        color = '#ffaa33';
        break;
      case 'success':
        color = '#33cc33';
        break;
      default:
        color = '#dddddd';
    }
    
    // Get current text and add new line
    const currentText = this.consoleOutput.text;
    const newText = currentText 
      ? `${currentText}\n${text}`
      : text;
    
    // Set the text
    this.consoleOutput.setText(newText);
    
    // Apply color based on type
    const textLength = newText.length;
    const currentLineIndex = textLength - text.length;
    
    this.consoleOutput.setStyle({
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dddddd',
      wordWrap: { width: this.options.width - 20 }
    });
    
    this.consoleOutput.setColor(color, currentLineIndex, textLength);
  }
  
  /**
   * Clear the console output
   */
  clearConsole() {
    this.consoleOutput.setText('');
  }
  
  /**
   * Convert a value to a string for console output
   * @param {*} value - The value to stringify
   * @returns {String} String representation of the value
   */
  stringify(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '[Object]';
      }
    }
    
    return String(value);
  }
  
  /**
   * Set the visibility of the editor
   * @param {Boolean} visible - Whether the editor should be visible
   */
  setVisible(visible) {
    this.container.style.display = visible ? 'block' : 'none';
    this.uiContainer.setVisible(visible);
  }
  
  /**
   * Set the position of the editor
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   */
  setPosition(x, y) {
    this.options.x = x;
    this.options.y = y;
    
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.uiContainer.setPosition(x, y);
  }
  
  /**
   * Set the size of the editor
   * @param {Number} width - New width
   * @param {Number} height - New height
   */
  setSize(width, height) {
    this.options.width = width;
    this.options.height = height;
    
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    
    // Resize UI elements
    this.border.width = width;
    this.border.height = height;
    
    this.runButton.x = width - 10;
    this.runButton.y = height + 10;
    this.runButtonText.x = this.runButton.x - this.runButton.width / 2;
    this.runButtonText.y = this.runButton.y + this.runButton.height / 2;
    
    this.resetButton.x = width - 120;
    this.resetButton.y = height + 10;
    this.resetButtonText.x = this.resetButton.x - this.resetButton.width / 2;
    this.resetButtonText.y = this.resetButton.y + this.resetButton.height / 2;
    
    this.consoleBackground.width = width;
    this.consoleBackground.y = height + 50;
    
    this.consoleHeader.width = width;
    this.consoleHeader.y = height + 50;
    
    this.consoleHeaderText.y = height + 50 + 10;
    
    this.consoleOutput.y = height + 80;
    this.consoleOutput.setWordWrapWidth(width - 20);
  }
  
  /**
   * Clean up resources when destroying the editor
   */
  destroy() {
    // Remove DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Destroy editor view
    if (this.editorView) {
      this.editorView.destroy();
    }
    
    // Destroy Phaser UI elements
    if (this.uiContainer) {
      this.uiContainer.destroy(true);
    }
    
    // Remove event listeners
    this.runButton?.removeAllListeners();
    this.resetButton?.removeAllListeners();
  }
}

export default CodeEditor;