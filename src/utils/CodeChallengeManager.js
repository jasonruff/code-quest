/**
 * Code Challenge Manager
 * Manages code challenges, their definitions, and validation
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
      testCases: challenge.testCases || []
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
  }
}

export default CodeChallengeManager;