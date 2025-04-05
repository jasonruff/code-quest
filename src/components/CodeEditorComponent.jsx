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
 * React component for the code editor - Enhanced for US-006
 * @param {Object} props - Component props
 * @param {Object} props.challenge - Challenge details
 * @param {Function} props.onSuccess - Function called when challenge is completed
 * @param {Function} props.onFailure - Function called when challenge fails
 * @param {Function} props.onError - Function called when there's an error in the code
 * @param {Object} props.challengeManager - Challenge manager instance (for US-006)
 */
function CodeEditorComponent({ challenge, onSuccess, onFailure, onError, challengeManager }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
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
    
    // Reset console output and metrics
    setConsoleOutput([]);
    setMetrics(null);
    setTestResults([]);
  }, [challenge]);
  
  /**
   * Format bytes to a human-readable string
   * @param {Number} bytes - The number of bytes
   * @returns {String} Formatted string
   */
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Format milliseconds to a human-readable string
   * @param {Number} ms - The number of milliseconds
   * @returns {String} Formatted string
   */
  const formatTime = (ms) => {
    if (ms < 1) return '<1 ms';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };
  
  /**
   * Run the code in the editor with enhanced security and performance monitoring
   */
  const runCode = async () => {
    // Set running state
    setIsRunning(true);
    
    // Clear previous outputs
    setConsoleOutput([]);
    setMetrics(null);
    setTestResults([]);
    
    // Get code from the editor
    const code = viewRef.current.state.doc.toString();
    
    try {
      // First check syntax using acorn parser
      acornParse(code, { ecmaVersion: 2020 });
      
      // Create a sandbox environment with console capture
      const consoleCapture = {
        log: (...args) => appendToConsole(args.map(stringify).join(' '), 'log'),
        error: (...args) => appendToConsole(args.map(stringify).join(' '), 'error'),
        warn: (...args) => appendToConsole(args.map(stringify).join(' '), 'warning')
      };
      
      const sandbox = {
        console: consoleCapture,
        // Challenge-specific context
        ...(challenge?.context || {}),
        __challengeResult: undefined
      };
      
      // Execute the code in the secure sandbox using the challenge manager
      // This is a major enhancement for US-006
      let executionResult;
      
      if (challengeManager && typeof challengeManager.executeUserCode === 'function') {
        // Use the enhanced secure execution with metrics
        try {
          appendToConsole('Executing code in secure sandbox...', 'log');
          
          // Execute the code with the manager's secure execution
          executionResult = await Promise.resolve(
            challengeManager.executeUserCode(code, sandbox, challenge)
          );
          
          // Store metrics for display
          if (executionResult.metrics) {
            setMetrics(executionResult.metrics);
            
            // Store test results if available
            if (executionResult.metrics.testResults) {
              setTestResults(executionResult.metrics.testResults);
            }
          }
          
          // Handle errors
          if (!executionResult.success) {
            appendToConsole(`Error: ${executionResult.error}`, 'error');
            onError?.({
              error: new Error(executionResult.error),
              challengeId: challenge?.id
            });
            setIsRunning(false);
            return;
          }
        } catch (error) {
          appendToConsole(`Error: ${error.message}`, 'error');
          onError?.({
            error,
            challengeId: challenge?.id
          });
          setIsRunning(false);
          return;
        }
      } else {
        // Fallback to the old execution method if manager not available
        executionResult = { success: true };
        executeCodeInSandbox(code, sandbox);
      }
      
      // Validate result against the challenge if there is one
      if (challenge && challenge.validate) {
        const validation = challenge.validate(sandbox.__challengeResult, sandbox);
        
        if (validation.success) {
          // Show validation success message
          appendToConsole(validation.message, 'success');
          
          // Show test results summary
          if (testResults.length > 0) {
            const passedTests = testResults.filter(test => test.passed).length;
            appendToConsole(`Tests: ${passedTests}/${testResults.length} passed`, 
                            passedTests === testResults.length ? 'success' : 'warning');
          }
          
          // Report success to parent component
          onSuccess?.({
            challengeId: challenge.id,
            code: code,
            result: sandbox.__challengeResult,
            metrics: executionResult.metrics || null
          });
        } else {
          appendToConsole(validation.message, 'error');
          
          // Show test results summary
          if (testResults.length > 0) {
            const passedTests = testResults.filter(test => test.passed).length;
            appendToConsole(`Tests: ${passedTests}/${testResults.length} passed`, 'warning');
          }
          
          onFailure?.({
            challengeId: challenge.id,
            message: validation.message,
            metrics: executionResult.metrics || null
          });
        }
      } else {
        // If no challenge validation, show execution results
        appendToConsole('Code executed successfully!', 'success');
        
        // Show output value if any
        if (sandbox.__challengeResult !== undefined) {
          appendToConsole(`Result: ${stringify(sandbox.__challengeResult)}`, 'log');
        }
      }
    } catch (error) {
      // Handle syntax or runtime errors
      appendToConsole(`Error: ${error.message}`, 'error');
      onError?.({
        error,
        challengeId: challenge?.id
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  /**
   * Legacy execute code in a sandbox environment
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
    
    // Clear console and metrics
    setConsoleOutput([]);
    setMetrics(null);
    setTestResults([]);
  };
  
  /**
   * Get the current code from editor
   * @returns {String} Current code
   */
  const getCode = () => {
    if (!viewRef.current) return '';
    return viewRef.current.state.doc.toString();
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
        <button 
          className="run-button" 
          onClick={runCode}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
        <button className="reset-button" onClick={resetCode}>
          Reset Code
        </button>
      </div>
      
      {/* Performance metrics display */}
      {metrics && (
        <div className="metrics-container">
          <div className="metrics-header">Performance Metrics</div>
          <div className="metrics-content">
            <div className="metric">
              <span className="metric-label">Execution Time:</span>
              <span className="metric-value">{formatTime(metrics.executionTime)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Memory Usage:</span>
              <span className="metric-value">{formatBytes(metrics.memoryUsage)}</span>
            </div>
            {metrics.errorCount > 0 && (
              <div className="metric error">
                <span className="metric-label">Errors:</span>
                <span className="metric-value">{metrics.errorCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Test results display */}
      {testResults.length > 0 && (
        <div className="test-results-container">
          <div className="test-results-header">Test Results</div>
          <div className="test-results-content">
            {testResults.map((test, index) => (
              <div 
                key={index} 
                className={`test-result ${test.passed ? 'test-passed' : 'test-failed'}`}
              >
                <div className="test-result-status">
                  {test.passed ? '✓' : '✗'}
                </div>
                <div className="test-result-description">
                  {test.description}
                  {!test.passed && test.error && (
                    <div className="test-error">Error: {test.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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

// Add a method to access code from outside
CodeEditorComponent.prototype.getCode = function() {
  return this.viewRef?.current?.state.doc.toString() || '';
};

export default CodeEditorComponent;