/**
 * Code Analyzer
 * Analyzes player code to detect common errors and patterns
 * Used to generate context-aware hints
 */

class CodeAnalyzer {
  constructor() {
    // Define common error patterns
    this.errorPatterns = {
      syntaxErrors: {
        missingBracket: /\{[^}]*$/,
        missingParenthesis: /\([^)]*$/,
        missingSemicolon: /[^;{]\s*$/,
        undefinedVariable: /ReferenceError:\s*(\w+) is not defined/,
        invalidSyntax: /SyntaxError:/
      },
      logicErrors: {
        infiniteLoop: /(for|while)\s*\([^)]*true[^)]*\)/,
        unreachableCode: /return[^;]*;\s*\w+/,
        unusedVariable: /\b(let|const|var)\s+(\w+)[^=;]*;(?:(?!\2).)*$/,
        incorrectComparison: /[^=!<>]=(?!=)/
      },
      styleIssues: {
        inconsistentIndentation: /^\s*\w+.*\n\s{2,}\w+.*\n^\w+/m,
        mixedQuotes: /["'].*?["'].*?["']/,
        missingSpaces: /if\(/
      }
    };
  }

  /**
   * Analyze code and identify issues
   * @param {String} code - Player's code to analyze
   * @param {String} errorMessage - Error message if any
   * @param {String} challengeType - Type of challenge
   * @returns {Object} Analysis results
   */
  analyzeCode(code, errorMessage = null, challengeType = 'general') {
    if (!code || typeof code !== 'string') {
      return { issues: [], summary: 'No code to analyze' };
    }

    // Initialize results
    const result = {
      issues: [],
      potentialIssues: [],
      summary: '',
      missingSolution: false,
      errorType: null,
      codeTooShort: false,
      complexity: this.calculateComplexity(code),
      hasComments: code.includes('//') || code.includes('/*'),
      lineCount: code.split('\n').length
    };

    // Check if code is too short based on challenge type
    const minLengthByType = {
      'variables': 10,
      'functions': 20,
      'loops': 30,
      'general': 15
    };

    const minExpectedLength = minLengthByType[challengeType] || 15;
    if (code.length < minExpectedLength) {
      result.codeTooShort = true;
      result.issues.push({
        type: 'incomplete',
        message: 'Your solution seems incomplete. Try adding more code to solve the challenge.'
      });
    }

    // Check for syntax errors first
    if (errorMessage) {
      this.analyzeSyntaxErrors(code, errorMessage, result);
    }

    // Then check for logical errors
    this.analyzeLogicalErrors(code, result, challengeType);

    // Finally check for style issues
    this.analyzeStyleIssues(code, result);

    // Add challenge-specific checks
    this.addChallengeSpecificAnalysis(code, result, challengeType);

    // Create a summary of findings
    this.createSummary(result);

    return result;
  }

  /**
   * Analyze syntax errors based on error message
   * @param {String} code - Player's code
   * @param {String} errorMessage - Error message
   * @param {Object} result - Analysis result object
   */
  analyzeSyntaxErrors(code, errorMessage, result) {
    const { syntaxErrors } = this.errorPatterns;

    // Initialize error type as syntax
    result.errorType = 'syntax';

    // Check for specific error types
    if (errorMessage.includes('SyntaxError')) {
      if (errorMessage.includes('Unexpected end of input')) {
        // Missing closing bracket or parenthesis
        const bracketCount = (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
        const parenCount = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
        
        if (bracketCount > 0) {
          result.issues.push({
            type: 'syntax',
            message: 'Missing closing curly brace(s)',
            count: bracketCount
          });
        }
        
        if (parenCount > 0) {
          result.issues.push({
            type: 'syntax',
            message: 'Missing closing parenthesis',
            count: parenCount
          });
        }
      } else if (errorMessage.includes("Unexpected token")) {
        const tokenMatch = errorMessage.match(/Unexpected token\s+'([^']+)'/);
        if (tokenMatch) {
          result.issues.push({
            type: 'syntax',
            message: `Unexpected token: ${tokenMatch[1]}. This usually means you have a typo or incorrect syntax.`
          });
        } else {
          result.issues.push({
            type: 'syntax',
            message: 'Unexpected token error. Check for typos or incorrect syntax.'
          });
        }
      } else {
        // Generic syntax error
        result.issues.push({
          type: 'syntax',
          message: 'Syntax error: ' + errorMessage.split(':').pop().trim()
        });
      }
    } else if (errorMessage.includes('ReferenceError')) {
      // Check for undefined variables
      const match = errorMessage.match(syntaxErrors.undefinedVariable);
      if (match) {
        result.issues.push({
          type: 'reference',
          message: `The variable "${match[1]}" is used but has not been defined.`,
          variable: match[1]
        });
      } else {
        result.issues.push({
          type: 'reference',
          message: 'Reference error: ' + errorMessage.split(':').pop().trim()
        });
      }
    } else if (errorMessage.includes('TypeError')) {
      result.issues.push({
        type: 'type',
        message: 'Type error: ' + errorMessage.split(':').pop().trim()
      });
    } else {
      // Generic error message
      result.issues.push({
        type: 'unknown',
        message: errorMessage
      });
    }
  }

  /**
   * Analyze logical errors in code
   * @param {String} code - Player's code
   * @param {Object} result - Analysis result object
   * @param {String} challengeType - Type of challenge
   */
  analyzeLogicalErrors(code, result, challengeType) {
    const { logicErrors } = this.errorPatterns;

    // Check for infinite loops
    if (logicErrors.infiniteLoop.test(code)) {
      result.potentialIssues.push({
        type: 'logic',
        message: 'Potential infinite loop detected. Make sure your loop has a proper exit condition.'
      });
    }

    // Check for unreachable code
    if (logicErrors.unreachableCode.test(code)) {
      result.potentialIssues.push({
        type: 'logic',
        message: 'Some code may be unreachable after a return statement.'
      });
    }

    // Check for unused variables
    const declarations = code.match(/\b(let|const|var)\s+(\w+)/g) || [];
    for (const decl of declarations) {
      const varName = decl.split(/\s+/)[1];
      // Count occurrences of the variable name (excluding declaration)
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      const count = (code.match(regex) || []).length;
      
      if (count <= 1) {
        result.potentialIssues.push({
          type: 'logic',
          message: `The variable "${varName}" is declared but may not be used.`,
          variable: varName
        });
      }
    }

    // Check for incorrect equality checks
    if (challengeType === 'conditionals' || challengeType === 'general') {
      // Look for single equals in conditions
      if (/if\s*\([^=]*=[^=][^)]*\)/.test(code)) {
        result.issues.push({
          type: 'logic',
          message: 'You may be using the assignment operator (=) instead of the equality operator (== or ===) in a condition.'
        });
      }
    }
  }

  /**
   * Analyze style issues in code
   * @param {String} code - Player's code
   * @param {Object} result - Analysis result object
   */
  analyzeStyleIssues(code, result) {
    const { styleIssues } = this.errorPatterns;

    // Check for inconsistent indentation
    const lines = code.split('\n');
    let prevIndent = -1;
    let inconsistentIndent = false;
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const indent = line.search(/\S/);
      if (prevIndent !== -1 && indent !== 0 && indent !== prevIndent && indent !== prevIndent + 2) {
        inconsistentIndent = true;
        break;
      }
      prevIndent = indent;
    }
    
    if (inconsistentIndent) {
      result.potentialIssues.push({
        type: 'style',
        message: 'Your code has inconsistent indentation, which can make it harder to read and maintain.'
      });
    }

    // Check for mixed quotes (both " and ' used)
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    
    if (singleQuotes > 0 && doubleQuotes > 0) {
      result.potentialIssues.push({
        type: 'style',
        message: "You're mixing single and double quotes. While this works, it's better to be consistent."
      });
    }

    // Check for missing spaces in control structures
    if (styleIssues.missingSpaces.test(code)) {
      result.potentialIssues.push({
        type: 'style',
        message: 'Consider adding spaces after keywords like "if", "for", "while", etc. for better readability.'
      });
    }
  }

  /**
   * Add challenge-specific analysis
   * @param {String} code - Player's code
   * @param {Object} result - Analysis result object
   * @param {String} challengeType - Type of challenge
   */
  addChallengeSpecificAnalysis(code, result, challengeType) {
    switch (challengeType) {
      case 'variables':
        // Check for proper variable declarations
        if (!/(let|const|var)\s+\w+/.test(code)) {
          result.issues.push({
            type: 'challenge',
            message: 'Your code needs to include variable declarations using let, const, or var.'
          });
        }
        break;
        
      case 'functions':
        // Check for function declarations
        if (!/(function\s+\w+|const\s+\w+\s*=\s*function|const\s+\w+\s*=\s*\(.*\)\s*=>)/.test(code)) {
          result.issues.push({
            type: 'challenge',
            message: 'This challenge requires you to define a function.'
          });
        }
        break;
        
      case 'loops':
        // Check for loop structures
        if (!/(for|while)/.test(code)) {
          result.issues.push({
            type: 'challenge',
            message: 'This challenge requires you to use a loop (for or while).'
          });
        }
        break;
        
      case 'conditionals':
        // Check for conditional statements
        if (!/(if|else|switch)/.test(code)) {
          result.issues.push({
            type: 'challenge',
            message: 'This challenge requires you to use conditional statements (if, else, or switch).'
          });
        }
        break;
      
      case 'security-initialization':
        // Specific check for the security initialization challenge
        if (!code.includes('securityCode') && !code.includes('security')) {
          result.issues.push({
            type: 'challenge',
            message: 'This challenge requires you to define a security-related variable.'
          });
        }
        if (!code.includes('9876') && !code.includes('"9876"') && !code.includes("'9876'")) {
          result.issues.push({
            type: 'challenge',
            message: 'Make sure you\'re initializing the variable with the correct security code value.'
          });
        }
        break;
    }
  }

  /**
   * Calculate code complexity
   * @param {String} code - Player's code
   * @returns {String} Complexity level
   */
  calculateComplexity(code) {
    // Simple complexity heuristic based on elements in the code
    let complexity = 0;
    
    // Count control structures
    const controlStructures = (code.match(/(if|else|for|while|switch|case)/g) || []).length;
    complexity += controlStructures * 2;
    
    // Count function declarations
    const functions = (code.match(/(function|=>)/g) || []).length;
    complexity += functions * 3;
    
    // Count operators
    const operators = (code.match(/(\+|\-|\*|\/|%|&&|\|\||===|!==|==|!=|>=|<=|>|<)/g) || []).length;
    complexity += operators;
    
    // Count lines
    const lines = code.split('\n').length;
    complexity += Math.floor(lines / 2);
    
    // Determine complexity level
    if (complexity < 5) return 'simple';
    if (complexity < 15) return 'moderate';
    return 'complex';
  }

  /**
   * Create a summary of the analysis results
   * @param {Object} result - Analysis result object
   */
  createSummary(result) {
    const { issues, potentialIssues, codeTooShort, complexity } = result;
    
    if (issues.length === 0 && potentialIssues.length === 0) {
      result.summary = 'No issues detected in your code.';
      return;
    }
    
    let summary = [];
    
    // Prioritize syntax errors
    const syntaxIssues = issues.filter(issue => issue.type === 'syntax' || issue.type === 'reference' || issue.type === 'type');
    if (syntaxIssues.length > 0) {
      summary.push(`Found ${syntaxIssues.length} syntax error(s) that need to be fixed.`);
    }
    
    // Then logical errors
    const logicIssues = issues.filter(issue => issue.type === 'logic');
    if (logicIssues.length > 0) {
      summary.push(`Found ${logicIssues.length} logical issue(s) in your code.`);
    }
    
    // Finally challenge-specific issues
    const challengeIssues = issues.filter(issue => issue.type === 'challenge');
    if (challengeIssues.length > 0) {
      summary.push(`Your code doesn't meet the challenge requirements.`);
    }
    
    // Add potential issues summary
    if (potentialIssues.length > 0) {
      summary.push(`Found ${potentialIssues.length} potential improvement(s) to consider.`);
    }
    
    // Add missing or incomplete code note
    if (codeTooShort) {
      summary.push('Your solution appears incomplete.');
    }
    
    result.summary = summary.join(' ');
  }
}

export default CodeAnalyzer;