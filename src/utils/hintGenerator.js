/**
 * Hint Generator
 * Generates context-aware hints based on code analysis
 * Used by Byte assistant to provide intelligent feedback
 */
import CodeAnalyzer from './codeAnalyzer';

class HintGenerator {
  constructor() {
    this.codeAnalyzer = new CodeAnalyzer();
    this.hintHistory = new Map(); // Track hints given for each challenge
    
    // Hint templates for different scenarios
    this.hintTemplates = {
      syntax: [
        "Check your syntax carefully. Look for {issue}.",
        "I spotted a syntax error: {issue}. Can you fix it?",
        "There's a problem with your code structure: {issue}."
      ],
      reference: [
        "Make sure all your variables are defined before using them. Specifically, check {issue}.",
        "I can't find where you've defined {issue}. Remember to declare variables before using them.",
        "The variable {issue} is being used but hasn't been declared yet."
      ],
      logic: [
        "Your logic looks a bit off. Check if {issue}.",
        "Think about what your code is actually doing. {issue}",
        "The logic in your solution needs adjustment. Specifically, {issue}."
      ],
      style: [
        "Your code works, but could be cleaner. Consider {issue}.",
        "For better readability, you might want to {issue}.",
        "A small style suggestion: {issue}."
      ],
      challenge: [
        "This challenge requires {issue}.",
        "Look at the challenge description again. You need to {issue}.",
        "You're missing a key requirement: {issue}."
      ],
      general: [
        "Think about what the challenge is asking you to do. Are you addressing the core problem?",
        "Try breaking down the problem into smaller steps. What's the first thing you need to accomplish?",
        "Sometimes it helps to write out the steps in comments before coding the solution."
      ],
      conceptual: {
        'variables': [
          "Remember that variables are like labeled containers that store values.",
          "Try using 'let' for variables that might change and 'const' for ones that won't.",
          "Don't forget to initialize your variables with a starting value using the '=' operator."
        ],
        'functions': [
          "Functions are reusable blocks of code that perform specific tasks.",
          "Remember that functions can take inputs (parameters) and return outputs.",
          "Make sure your function includes a 'return' statement if it's supposed to provide a value back."
        ],
        'loops': [
          "Loops let you repeat code multiple times without copying and pasting.",
          "A 'for' loop is great when you know how many iterations you need.",
          "Be careful with your loop conditions to avoid infinite loops."
        ],
        'conditionals': [
          "Conditional statements let your code make decisions.",
          "Remember to use '===' for strict equality comparison rather than '=' which is for assignment.",
          "You can chain conditions with 'else if' for multiple decision paths."
        ]
      },
      encouragement: [
        "You're making progress! Keep going.",
        "You're on the right track. Just a few adjustments needed.",
        "That's a good start! Let's refine it further.",
        "You're thinking along the right lines. Just need to fix a few details."
      ]
    };
  }

  /**
   * Generate a hint based on player's code and attempt number
   * @param {Object} params - Parameters for hint generation
   * @returns {Object} Generated hint and analysis results
   */
  generateHint(params) {
    const {
      code,
      errorMessage = null,
      challengeId,
      challengeType = 'general',
      attemptCount = 1,
      previousHints = []
    } = params;
    
    // Analyze the code to identify issues
    const analysis = this.codeAnalyzer.analyzeCode(code, errorMessage, challengeType);
    
    // Track hint for this challenge
    this.trackHintRequest(challengeId, attemptCount, analysis);
    
    // Generate appropriate hint based on analysis and attempt count
    const hint = this.createContextAwareHint(analysis, challengeType, attemptCount, previousHints);
    
    return {
      hint,
      analysis,
      hintLevel: this.getHintLevel(attemptCount),
      timestamp: Date.now()
    };
  }

  /**
   * Create a context-aware hint based on analysis results
   * @param {Object} analysis - Code analysis results
   * @param {String} challengeType - Type of challenge
   * @param {Number} attemptCount - Number of attempts made
   * @param {Array} previousHints - Previous hints given
   * @returns {String} Contextual hint
   */
  createContextAwareHint(analysis, challengeType, attemptCount, previousHints) {
    const { issues, potentialIssues, summary, errorType, complexity } = analysis;
    
    // No issues detected, give encouragement or conceptual guidance
    if (issues.length === 0 && potentialIssues.length === 0) {
      // If no specific issues but code is correct, give encouragement
      return this.getRandomElement(this.hintTemplates.encouragement);
    }
    
    // Get hint level based on attempt count
    const hintLevel = this.getHintLevel(attemptCount);
    
    // For first attempts, give more general conceptual hints
    if (hintLevel === 'basic' && this.hintTemplates.conceptual[challengeType]) {
      return this.getRandomElement(this.hintTemplates.conceptual[challengeType]);
    }
    
    // For repeated attempts, provide more specific guidance
    if (issues.length > 0) {
      // Prioritize critical issues
      const criticalIssues = issues.filter(issue => 
        issue.type === 'syntax' || 
        issue.type === 'reference' ||
        issue.type === 'challenge'
      );
      
      if (criticalIssues.length > 0) {
        // Pick an issue that hasn't been mentioned in previous hints if possible
        const issueToAddress = this.selectNewIssue(criticalIssues, previousHints);
        return this.formatIssueHint(issueToAddress, hintLevel);
      }
      
      // If no critical issues, address other issues
      const issueToAddress = this.selectNewIssue(issues, previousHints);
      return this.formatIssueHint(issueToAddress, hintLevel);
    }
    
    // If only potential issues exist, mention those for advanced hints
    if (potentialIssues.length > 0 && hintLevel === 'specific') {
      const issueToAddress = this.selectNewIssue(potentialIssues, previousHints);
      return this.formatIssueHint(issueToAddress, hintLevel);
    }
    
    // Fallback to general hints
    return this.getRandomElement(this.hintTemplates.general);
  }

  /**
   * Format a hint for a specific issue
   * @param {Object} issue - The issue to address
   * @param {String} hintLevel - Level of detail for the hint
   * @returns {String} Formatted hint
   */
  formatIssueHint(issue, hintLevel) {
    // Get appropriate hint template for this issue type
    const templates = this.hintTemplates[issue.type] || this.hintTemplates.general;
    
    if (!templates) {
      return issue.message; // Fallback to the raw message
    }
    
    // Select a template
    const template = this.getRandomElement(templates);
    
    // For basic hints, be more vague
    if (hintLevel === 'basic' && issue.type !== 'challenge') {
      return template.replace('{issue}', 'something related to ' + issue.type);
    }
    
    // For specific hints, include the exact issue
    return template.replace('{issue}', issue.message);
  }

  /**
   * Select an issue that hasn't been mentioned in previous hints if possible
   * @param {Array} issues - List of issues to choose from
   * @param {Array} previousHints - Previous hints given
   * @returns {Object} Selected issue
   */
  selectNewIssue(issues, previousHints) {
    if (issues.length === 0) {
      return null;
    }
    
    // Try to find an issue not mentioned before
    for (const issue of issues) {
      let isNew = true;
      
      for (const prevHint of previousHints) {
        if (prevHint.includes(issue.message) || 
            (issue.variable && prevHint.includes(issue.variable))) {
          isNew = false;
          break;
        }
      }
      
      if (isNew) {
        return issue;
      }
    }
    
    // If all have been mentioned, just pick the first one
    return issues[0];
  }

  /**
   * Get hint level based on attempt count
   * @param {Number} attemptCount - Number of attempts
   * @returns {String} Hint level (basic, general, specific)
   */
  getHintLevel(attemptCount) {
    if (attemptCount <= 1) return 'basic'; // Conceptual, general guidance
    if (attemptCount <= 3) return 'general'; // More specific, but not exact
    return 'specific'; // Specific guidance about exact issues
  }

  /**
   * Track hint requests for analytics and hint progression
   * @param {String} challengeId - Challenge identifier
   * @param {Number} attemptCount - Number of attempts made
   * @param {Object} analysis - Analysis results
   */
  trackHintRequest(challengeId, attemptCount, analysis) {
    if (!challengeId) return;
    
    const challengeKey = `challenge_${challengeId}`;
    
    if (!this.hintHistory.has(challengeKey)) {
      this.hintHistory.set(challengeKey, {
        attempts: 0,
        hintsRequested: 0,
        issuesFound: 0,
        lastHintTimestamp: Date.now()
      });
    }
    
    const stats = this.hintHistory.get(challengeKey);
    stats.attempts = Math.max(stats.attempts, attemptCount);
    stats.hintsRequested++;
    stats.issuesFound += analysis.issues.length + analysis.potentialIssues.length;
    stats.lastHintTimestamp = Date.now();
    
    // Don't let the history grow too large
    if (this.hintHistory.size > 100) {
      // Remove oldest entries
      const entries = Array.from(this.hintHistory.entries())
        .sort((a, b) => a[1].lastHintTimestamp - b[1].lastHintTimestamp);
        
      // Remove oldest 20 entries
      for (let i = 0; i < 20 && i < entries.length; i++) {
        this.hintHistory.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get random element from an array
   * @param {Array} array - Array to choose from
   * @returns {*} Random element
   */
  getRandomElement(array) {
    if (!array || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get hint history statistics for a challenge
   * @param {String} challengeId - Challenge identifier
   * @returns {Object|null} Hint statistics or null if not found
   */
  getHintStats(challengeId) {
    const challengeKey = `challenge_${challengeId}`;
    return this.hintHistory.get(challengeKey) || null;
  }
}

export default HintGenerator;