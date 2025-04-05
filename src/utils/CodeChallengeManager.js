/**
 * Code Challenge Manager
 * Manages code challenges, their definitions, validation, and performance tracking
 */
class CodeChallengeManager {
  constructor() {
    // Challenge definitions by ID
    this.challenges = {};
    
    // Register built-in challenges
    this.registerBuiltInChallenges();
  }
  
  /**
   * Register a new challenge
   * @param {String} id - Challenge ID
   * @param {Object} challenge - Challenge definition
   */
  registerChallenge(id, challenge) {
    // Ensure challenge has required properties
    const validChallenge = {
      id,
      title: challenge.title || 'Untitled Challenge',
      description: challenge.description || 'No description provided.',
      difficulty: challenge.difficulty || 'beginner',
      initialCode: challenge.initialCode || '// Write your code here\n',
      solutionCode: challenge.solutionCode || null,
      hints: challenge.hints || [],
      validate: challenge.validate || null,
      context: challenge.context || {},
      skillType: challenge.skillType || 'variables',
      category: challenge.category || 'general',
      timeLimit: challenge.timeLimit || null,
      testCases: challenge.testCases || [],
      // Adding memory limit property for US-006
      memoryLimit: challenge.memoryLimit || 5 * 1024 * 1024, // 5MB default
      // Adding execution time limit
      executionTimeLimit: challenge.executionTimeLimit || 2000 // 2 seconds default
    };
    
    // Register the challenge
    this.challenges[id] = validChallenge;
    
    return validChallenge;
  }
  
  /**
   * Get a challenge by ID
   * @param {String} id - Challenge ID
   * @returns {Object|null} The challenge or null if not found
   */
  getChallenge(id) {
    return this.challenges[id] || null;
  }
  
  /**
   * Get all registered challenges
   * @returns {Object} Object with challenge IDs as keys
   */
  getAllChallenges() {
    return { ...this.challenges };
  }
  
  /**
   * Get challenges by category
   * @param {String} category - Category to filter by
   * @returns {Array} Array of challenges in the category
   */
  getChallengesByCategory(category) {
    return Object.values(this.challenges)
      .filter(challenge => challenge.category === category);
  }
  
  /**
   * Get challenges by difficulty
   * @param {String} difficulty - Difficulty level to filter by
   * @returns {Array} Array of challenges at the difficulty level
   */
  getChallengesByDifficulty(difficulty) {
    return Object.values(this.challenges)
      .filter(challenge => challenge.difficulty === difficulty);
  }

  /**
   * Safely execute user code with performance monitoring and security measures
   * @param {String} code - The user code to execute
   * @param {Object} sandboxEnv - The sandbox environment
   * @param {Object} challenge - The challenge definition
   * @returns {Object} Execution result and performance metrics
   */
  executeUserCode(code, sandboxEnv, challenge) {
    // Create a clean copy of the sandbox environment
    const sandbox = { ...sandboxEnv };
    
    // Performance metrics
    const metrics = {
      executionTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      testResults: []
    };
    
    try {
      // Sanitize the code (remove dangerous constructs)
      const sanitizedCode = this.sanitizeCode(code);
      
      // Check for illegal operations before execution
      this.checkCodeSafety(sanitizedCode);
      
      // Add performance monitoring
      const wrappedCode = `
        'use strict';
        try {
          const startTime = performance.now();
          ${sanitizedCode}
          const endTime = performance.now();
          __metrics.executionTime = endTime - startTime;
          return __challengeResult;
        } catch (error) {
          __metrics.errorCount++;
          __metrics.lastError = error.message;
          throw error;
        }
      `;
      
      // Add metrics to sandbox
      sandbox.__metrics = metrics;
      
      // Create a function that takes sandbox properties as parameters
      const sandboxKeys = Object.keys(sandbox);
      const sandboxValues = sandboxKeys.map(key => sandbox[key]);
      
      // Execute with timeout protection
      const timeoutMs = challenge?.executionTimeLimit || 2000;
      
      let result;
      const executor = new Function(...sandboxKeys, wrappedCode);
      
      // Execute the code with timeout protection
      result = this.executeWithTimeout(executor, sandboxValues, timeoutMs);
      
      // Get memory usage approximation 
      // This is an estimation since we can't directly measure memory in browser
      metrics.memoryUsage = this.estimateMemoryUsage(sandbox);
      
      // Run test cases if available
      if (challenge && challenge.testCases && challenge.testCases.length > 0) {
        metrics.testResults = this.runTestCases(code, challenge.testCases, sandbox);
      }
      
      return {
        success: true,
        result,
        metrics
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metrics
      };
    }
  }
  
  /**
   * Execute a function with timeout protection
   * @param {Function} func - The function to execute
   * @param {Array} args - The arguments to pass to the function
   * @param {Number} timeoutMs - The timeout in milliseconds
   * @returns {*} The result of the function
   */
  executeWithTimeout(func, args, timeoutMs) {
    let timeoutId;
    let completed = false;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!completed) {
          reject(new Error(`Execution timed out (${timeoutMs}ms)`));
        }
      }, timeoutMs);
    });
    
    const executionPromise = new Promise((resolve) => {
      const result = func(...args);
      completed = true;
      resolve(result);
    });
    
    return Promise.race([executionPromise, timeoutPromise])
      .finally(() => clearTimeout(timeoutId));
  }
  
  /**
   * Sanitize code to remove dangerous constructs
   * @param {String} code - The code to sanitize
   * @returns {String} Sanitized code
   */
  sanitizeCode(code) {
    // Remove or block dangerous JavaScript constructs
    const blockedPatterns = [
      // Block eval, Function constructor
      /eval\s*\(/g,
      /new\s+Function/g,
      
      // Block access to DOM
      /document\./g,
      /window\./g,
      /localStorage/g,
      /sessionStorage/g,
      
      // Block network access
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      
      // Block process manipulation
      /process\./g,
      /require\s*\(/g,
      /import\s+/g,
      
      // Block dangerous APIs
      /setInterval\s*\(/g,
      /setTimeout\s*\(/g,
      /Worker\s*\(/g,
      /Proxy\s*\(/g,
      
      // Block infinite loops detection pattern
      /while\s*\(\s*true\s*\)\s*\{(?!\s*break)/g
    ];
    
    let sanitized = code;
    blockedPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        return `/* BLOCKED: ${match} */`;
      });
    });
    
    return sanitized;
  }
  
  /**
   * Check code for safety violations
   * @param {String} code - The code to check
   * @throws {Error} If the code contains dangerous operations
   */
  checkCodeSafety(code) {
    // Additional safety checks
    const dangerousPatterns = [
      { pattern: /\bprocess\b/, message: "Access to Node.js process is not allowed" },
      { pattern: /\brequire\b/, message: "Node.js require is not allowed" },
      { pattern: /\bfs\b|\bpath\b/, message: "Access to filesystem is not allowed" },
      { pattern: /\bdocument\b|\bwindow\b/, message: "Direct DOM access is not allowed" }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Security violation: ${message}`);
      }
    }
  }
  
  /**
   * Roughly estimate memory usage (for metrics)
   * @param {Object} sandbox - The sandbox environment after execution
   * @returns {Number} Estimated memory usage in bytes
   */
  estimateMemoryUsage(sandbox) {
    try {
      // Rough memory approximation based on object sizes
      let total = 0;
      const seen = new WeakSet();
      
      const estimateSize = (obj) => {
        if (obj === null || obj === undefined) return 0;
        if (typeof obj !== 'object') {
          // Primitive size estimates
          if (typeof obj === 'string') return obj.length * 2;
          if (typeof obj === 'number') return 8;
          if (typeof obj === 'boolean') return 4;
          return 8; // Default size for other primitives
        }
        
        // Avoid circular references
        if (seen.has(obj)) return 0;
        seen.add(obj);
        
        // Estimate object size
        let size = 0;
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            size += (key.length * 2) + estimateSize(obj[key]);
          }
        }
        
        return size;
      };
      
      // Estimate size of all sandbox variables
      for (const key in sandbox) {
        if (Object.prototype.hasOwnProperty.call(sandbox, key) && 
            !key.startsWith('__')) { // Skip internal properties
          total += estimateSize(sandbox[key]);
        }
      }
      
      return total;
    } catch (e) {
      console.error('Error estimating memory usage:', e);
      return 0;
    }
  }
  
  /**
   * Run test cases against the user's code
   * @param {String} code - The user code
   * @param {Array} testCases - The test cases to run
   * @param {Object} originalSandbox - The original sandbox environment
   * @returns {Array} Test results
   */
  runTestCases(code, testCases, originalSandbox) {
    const results = [];
    
    // Execute each test case in isolation
    for (const testCase of testCases) {
      try {
        // Create a fresh sandbox for this test
        const testSandbox = { ...originalSandbox };
        delete testSandbox.__metrics; // Clean up metrics
        
        // Wrap the code to capture return value
        const wrappedCode = `
          'use strict';
          try {
            ${code}
            // For function tests
            if (${testCase.input !== null}) {
              const inputs = ${JSON.stringify(testCase.input)};
              if (typeof inputs === 'object' && Array.isArray(inputs)) {
                return ${this.extractMainFunctionName(code)}(...inputs);
              }
              return ${this.extractMainFunctionName(code)}(inputs);
            }
            // For variable tests, return the expected variable
            return ${testCase.expected !== null ? this.extractVariableName(testCase.expected) : '__challengeResult'};
          } catch (error) {
            throw error;
          }
        `;
        
        // Execute test
        const sandbox = { ...testSandbox };
        const sandboxKeys = Object.keys(sandbox);
        const sandboxValues = sandboxKeys.map(key => sandbox[key]);
        
        const testFunc = new Function(...sandboxKeys, wrappedCode);
        const result = testFunc(...sandboxValues);
        
        // Compare result with expected
        const passed = this.compareResults(result, testCase.expected);
        
        results.push({
          description: testCase.description || 'Test case',
          passed,
          expected: testCase.expected,
          actual: result
        });
      } catch (error) {
        results.push({
          description: testCase.description || 'Test case',
          passed: false,
          expected: testCase.expected,
          actual: null,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Compare test results, handling different types
   * @param {*} actual - The actual result
   * @param {*} expected - The expected result
   * @returns {Boolean} Whether the results match
   */
  compareResults(actual, expected) {
    // Handle different types of comparisons
    if (typeof actual !== typeof expected) return false;
    
    if (typeof actual === 'object') {
      // Deep comparison for objects
      if (actual === null) return expected === null;
      if (expected === null) return false;
      
      // Handle arrays
      if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        for (let i = 0; i < actual.length; i++) {
          if (!this.compareResults(actual[i], expected[i])) return false;
        }
        return true;
      }
      
      // Handle regular objects
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      for (const key of actualKeys) {
        if (!expectedKeys.includes(key)) return false;
        if (!this.compareResults(actual[key], expected[key])) return false;
      }
      
      return true;
    }
    
    // Simple equality for primitives
    return actual === expected;
  }
  
  /**
   * Extract the main function name from code
   * @param {String} code - The user code
   * @returns {String} The main function name
   */
  extractMainFunctionName(code) {
    const functionMatch = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (functionMatch && functionMatch[1]) {
      return functionMatch[1];
    }
    
    // Fallback if we can't determine the function name
    return 'mainFunction';
  }
  
  /**
   * Extract variable name from test case 
   * @param {*} expected - The expected value
   * @returns {String} The likely variable name
   */
  extractVariableName(expected) {
    if (typeof expected === 'string' && expected === 'Agent X') return 'agentName';
    if (typeof expected === 'number' && expected === 30) return 'agentAge';
    if (typeof expected === 'boolean') return 'isAuthorized';
    if (typeof expected === 'string' && expected === '9876') return 'securityCode';
    
    // Default case
    return '__challengeResult';
  }
  
  /**
   * Register built-in challenges
   */
  registerBuiltInChallenges() {
    // Challenge 1: Security Initialization
    this.registerChallenge('security-initialization', {
      title: 'Security Initialization',
      description: 'Initialize a variable called securityCode and set its value to "9876" to activate the security system.',
      difficulty: 'beginner',
      initialCode: '// Write your code below to initialize the security system\n\n// When finished, run your code to continue',
      solutionCode: 'let securityCode = "9876";',
      hints: [
        'Use the let keyword to declare a variable.',
        'String values should be enclosed in quotes.',
        'Make sure the variable name matches exactly what\'s required: securityCode',
      ],
      validate: (result, sandbox) => {
        // Check if securityCode exists and has the correct value
        if (sandbox.securityCode === undefined) {
          return { 
            success: false, 
            message: 'The securityCode variable hasn\'t been defined yet.' 
          };
        }
        
        if (sandbox.securityCode !== '9876') {
          return { 
            success: false, 
            message: `The securityCode variable should be set to "9876", but it's currently set to "${sandbox.securityCode}".` 
          };
        }
        
        return { 
          success: true, 
          message: 'Success! The security system has been activated.' 
        };
      },
      context: {
        // Any sandbox context needed for this challenge
      },
      skillType: 'variables',
      category: 'basics',
      testCases: [
        { input: null, expected: '9876', description: 'The securityCode variable should be set to "9876"' }
      ]
    });
    
    // Challenge 2: Logic Gates
    this.registerChallenge('logic-gates', {
      title: 'Logic Gates',
      description: 'Create logical conditions to route the power through the correct gates. ' +
        'You need to write a function called routePower that takes three parameters: ' +
        '`gate1`, `gate2`, and `gate3`. The function should return true if either gate1 is true ' +
        'AND gate2 is true, OR if gate3 is true.',
      difficulty: 'beginner',
      initialCode: '// Write a function to route power through the logic gates\nfunction routePower(gate1, gate2, gate3) {\n  // Your code here\n}\n',
      solutionCode: 'function routePower(gate1, gate2, gate3) {\n  return (gate1 && gate2) || gate3;\n}',
      hints: [
        'Use the && operator for logical AND.',
        'Use the || operator for logical OR.',
        'Remember the order of operations: AND is evaluated before OR.',
        'You can use parentheses to group expressions.'
      ],
      validate: (result, sandbox) => {
        // Check if routePower exists and works correctly
        if (typeof sandbox.routePower !== 'function') {
          return { 
            success: false, 
            message: 'The routePower function hasn\'t been defined yet.' 
          };
        }
        
        // Test cases
        const testCases = [
          { gate1: true, gate2: true, gate3: false, expected: true },
          { gate1: true, gate2: false, gate3: false, expected: false },
          { gate1: false, gate2: true, gate3: false, expected: false },
          { gate1: false, gate2: false, gate3: true, expected: true },
          { gate1: true, gate2: true, gate3: true, expected: true }
        ];
        
        // Check each test case
        for (const testCase of testCases) {
          const { gate1, gate2, gate3, expected } = testCase;
          const result = sandbox.routePower(gate1, gate2, gate3);
          
          if (result !== expected) {
            return { 
              success: false, 
              message: `Logic error: when gate1=${gate1}, gate2=${gate2}, gate3=${gate3}, expected ${expected} but got ${result}.` 
            };
          }
        }
        
        return { 
          success: true, 
          message: 'Success! The power is now flowing correctly through the gates.' 
        };
      },
      context: {
        // Any sandbox context needed for this challenge
      },
      skillType: 'conditionals',
      category: 'logic',
      testCases: [
        { input: [true, true, false], expected: true, description: 'Gate 1 and 2 true, Gate 3 false' },
        { input: [true, false, false], expected: false, description: 'Gate 1 true, Gate 2 and 3 false' },
        { input: [false, false, true], expected: true, description: 'Gate 1 and 2 false, Gate 3 true' }
      ]
    });
    
    // Challenge 3: Variable Declaration
    this.registerChallenge('variable-declaration', {
      title: 'Variable Declaration',
      description: 'Declare and initialize variables of different types to store agent information. ' +
        'Create three variables: `agentName` (string), `agentAge` (number), and `isAuthorized` (boolean). ' +
        'Set them to "Agent X", 30, and true, respectively.',
      difficulty: 'beginner',
      initialCode: '// Declare and initialize three variables of different types\n\n',
      solutionCode: 'const agentName = "Agent X";\nconst agentAge = 30;\nconst isAuthorized = true;',
      hints: [
        'Use const or let to declare variables.',
        'Strings need to be in quotes, numbers do not.',
        'Boolean values are true or false (without quotes).',
        'Remember to use semicolons at the end of each statement.'
      ],
      validate: (result, sandbox) => {
        // Check all three variables
        if (typeof sandbox.agentName !== 'string') {
          return { 
            success: false, 
            message: 'The agentName variable should be a string.' 
          };
        }
        
        if (sandbox.agentName !== 'Agent X') {
          return { 
            success: false, 
            message: `The agentName should be "Agent X", but got "${sandbox.agentName}".` 
          };
        }
        
        if (typeof sandbox.agentAge !== 'number') {
          return { 
            success: false, 
            message: 'The agentAge variable should be a number.' 
          };
        }
        
        if (sandbox.agentAge !== 30) {
          return { 
            success: false, 
            message: `The agentAge should be 30, but got ${sandbox.agentAge}.` 
          };
        }
        
        if (typeof sandbox.isAuthorized !== 'boolean') {
          return { 
            success: false, 
            message: 'The isAuthorized variable should be a boolean.' 
          };
        }
        
        if (sandbox.isAuthorized !== true) {
          return { 
            success: false, 
            message: 'The isAuthorized should be true.' 
          };
        }
        
        return { 
          success: true, 
          message: 'Success! Agent information has been properly stored.' 
        };
      },
      context: {
        // Any sandbox context needed for this challenge
      },
      skillType: 'variables',
      category: 'basics',
      testCases: [
        { input: null, expected: 'Agent X', description: 'The agentName should be "Agent X"' },
        { input: null, expected: 30, description: 'The agentAge should be 30' },
        { input: null, expected: true, description: 'The isAuthorized should be true' }
      ]
    });
    
    // Challenge 4: Array Operations (New challenge for US-006)
    this.registerChallenge('array-operations', {
      title: 'Array Operations',
      description: 'Create a function called `processData` that takes an array of numbers as input and returns a new array where each number is doubled if it\'s even, or tripled if it\'s odd.',
      difficulty: 'beginner',
      initialCode: '// Write your function to process the data array\nfunction processData(numbers) {\n  // Your code here\n}\n',
      solutionCode: 'function processData(numbers) {\n  return numbers.map(num => {\n    if (num % 2 === 0) {\n      return num * 2;\n    } else {\n      return num * 3;\n    }\n  });\n}',
      hints: [
        'Use the map() method to transform each element in the array',
        'Check if a number is even with num % 2 === 0',
        'Remember that you need to return the new array from your function'
      ],
      validate: (result, sandbox) => {
        if (typeof sandbox.processData !== 'function') {
          return {
            success: false,
            message: 'The processData function hasn\'t been defined yet.'
          };
        }
        
        // Test cases
        const testCases = [
          { input: [1, 2, 3, 4], expected: [3, 4, 9, 8] },
          { input: [10, 15, 20], expected: [20, 45, 40] },
          { input: [], expected: [] }
        ];
        
        for (const testCase of testCases) {
          const result = sandbox.processData(testCase.input);
          
          if (!Array.isArray(result)) {
            return {
              success: false,
              message: 'Your function should return an array.'
            };
          }
          
          if (result.length !== testCase.expected.length) {
            return {
              success: false,
              message: `Expected array of length ${testCase.expected.length} but got ${result.length}.`
            };
          }
          
          for (let i = 0; i < result.length; i++) {
            if (result[i] !== testCase.expected[i]) {
              return {
                success: false,
                message: `For input [${testCase.input}], expected [${testCase.expected}] but got [${result}].`
              };
            }
          }
        }
        
        return {
          success: true,
          message: 'Success! Your function correctly processes the data arrays.'
        };
      },
      context: {},
      skillType: 'arrays',
      category: 'data-manipulation',
      testCases: [
        { input: [1, 2, 3, 4], expected: [3, 4, 9, 8], description: 'Basic array with mixed numbers' },
        { input: [10, 15, 20], expected: [20, 45, 40], description: 'Array with larger numbers' },
        { input: [], expected: [], description: 'Empty array' }
      ],
      executionTimeLimit: 1000, // 1 second
      memoryLimit: 2 * 1024 * 1024 // 2MB
    });
  }
}

export default CodeChallengeManager;