import { useEffect, useRef, useState } from 'react';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { parse as acornParse } from 'acorn';

/**
 * React component for the code editor
 * @param {Object} props - Component props
 * @param {Object} props.challenge - Challenge details
 * @param {Function} props.onSuccess - Function called when challenge is completed
 * @param {Function} props.onFailure - Function called when challenge fails
 * @param {Function} props.onError - Function called when there's an error in the code
 */
function CodeEditorComponent({ challenge, onSuccess, onFailure, onError }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [consoleOutput, setConsoleOutput] = useState([]);
  
  // Initialize the editor when component mounts
  useEffect(() => {
    if (!editorRef.current) return;
    
    const extensions = [
      basicSetup,
      javascript(),
      keymap.of([indentWithTab]),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      EditorState.tabSize.of(2),
      oneDark
    ];
    
    const initialCode = challenge?.initialCode || '// Write your code here\n';
    
    const state = EditorState.create({
      doc: initialCode,
      extensions,
    });
    
    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });
    
    // Clean up editor on unmount
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, []);
  
  // Update editor content when challenge changes
  useEffect(() => {
    if (!viewRef.current || !challenge) return;
    
    const initialCode = challenge.initialCode || '// Write your code here\n';
    
    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: viewRef.current.state.doc.length,
        insert: initialCode
      }
    });
    
    setConsoleOutput([]);
  }, [challenge]);
  
  /**
   * Run the code in the editor
   */
  const runCode = () => {
    // Clear previous console output
    setConsoleOutput([]);
    
    // Get code from the editor
    const code = viewRef.current.state.doc.toString();
    
    try {
      // First check syntax using acorn parser
      acornParse(code, { ecmaVersion: 2020 });
      
      // Create a sandbox environment
      const sandbox = {
        console: {
          log: (...args) => appendToConsole(args.map(stringify).join(' '), 'log'),
          error: (...args) => appendToConsole(args.map(stringify).join(' '), 'error'),
          warn: (...args) => appendToConsole(args.map(stringify).join(' '), 'warning')
        },
        // Challenge-specific context
        ...(challenge?.context || {}),
        __challengeResult: undefined
      };
      
      // Execute the code in the sandbox
      executeCodeInSandbox(code, sandbox);
      
      // Validate result against the challenge if there is one
      if (challenge && challenge.validate) {
        const validation = challenge.validate(sandbox.__challengeResult, sandbox);
        
        if (validation.success) {
          appendToConsole(validation.message, 'success');
          onSuccess?.({
            challengeId: challenge.id,
            code: code,
            result: sandbox.__challengeResult
          });
        } else {
          appendToConsole(validation.message, 'error');
          onFailure?.({
            challengeId: challenge.id,
            message: validation.message
          });
        }
      } else {
        // If no challenge, just show the result
        appendToConsole('Code executed successfully!', 'success');
      }
    } catch (error) {
      // Handle syntax or runtime errors
      appendToConsole(`Error: ${error.message}`, 'error');
      onError?.({
        error,
        challengeId: challenge?.id
      });
    }
  };
  
  /**
   * Execute code in a sandbox environment
   * @param {String} code - The code to execute
   * @param {Object} sandbox - The sandbox environment
   */
  const executeCodeInSandbox = (code, sandbox) => {
    // Create a function that takes sandbox properties as parameters
    const sandboxKeys = Object.keys(sandbox);
    const sandboxValues = sandboxKeys.map(key => sandbox[key]);
    
    // Create a function that will execute in the context of the sandbox
    const wrappedCode = `
      'use strict';
      try {
        ${code}
        return __challengeResult;
      } catch (error) {
        throw error;
      }
    `;
    
    // Execute the sandbox function
    const sandboxFunction = new Function(...sandboxKeys, wrappedCode);
    return sandboxFunction(...sandboxValues);
  };
  
  /**
   * Reset the code editor to the initial state
   */
  const resetCode = () => {
    if (!viewRef.current || !challenge) return;
    
    // Set initial code
    const initialCode = challenge.initialCode || '// Write your code here\n';
    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: viewRef.current.state.doc.length,
        insert: initialCode
      }
    });
    
    // Clear console
    setConsoleOutput([]);
  };
  
  /**
   * Append text to the console output
   * @param {String} text - Text to append
   * @param {String} type - Type of message ('log', 'error', 'warning', 'success')
   */
  const appendToConsole = (text, type = 'log') => {
    setConsoleOutput(prev => [...prev, { text, type }]);
  };
  
  /**
   * Convert a value to a string for console output
   * @param {*} value - The value to stringify
   * @returns {String} String representation of the value
   */
  const stringify = (value) => {
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
  };
  
  // Map console output types to CSS classes
  const consoleTypeClasses = {
    log: 'console-log',
    error: 'console-error',
    warning: 'console-warning',
    success: 'console-success'
  };
  
  return (
    <div className="code-editor-component">
      <div className="editor-container" ref={editorRef}></div>
      
      <div className="editor-buttons">
        <button className="run-button" onClick={runCode}>
          Run Code
        </button>
        <button className="reset-button" onClick={resetCode}>
          Reset Code
        </button>
      </div>
      
      <div className="console-container">
        <div className="console-header">
          <span>Console Output</span>
        </div>
        <div className="console-output">
          {consoleOutput.map((output, index) => (
            <div 
              key={index} 
              className={`console-line ${consoleTypeClasses[output.type] || 'console-log'}`}
            >
              {output.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CodeEditorComponent;