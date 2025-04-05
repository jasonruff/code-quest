/**
 * ByteAIAssistant
 * Connects the Claude API to the ByteAssistant component
 * Integrates code analysis and context-aware hints
 */
import ClaudeApiService from './claudeApiService';
import HintGenerator from './hintGenerator';

class ByteAIAssistant {
  constructor(apiKey = null) {
    this.apiService = new ClaudeApiService(apiKey);
    this.hintGenerator = new HintGenerator();
    this.conversationHistory = [];
    this.challengeHints = new Map(); // Track hints given for each challenge
    
    this.fallbackResponses = {
      error: "Hmm, my circuits are a bit tangled. Let's try a different approach!",
      timeout: "Oh! My processing took too long. Let's keep it simpler for now.",
      noContext: "I'm not quite sure what's happening here. Can you try running your code again?",
      notImplemented: "I'm still learning that. Let's focus on the current challenge for now!"
    };
    
    this.characterTraits = {
      name: 'Byte',
      personality: 'friendly, slightly quirky, patient, encouraging',
      speakingStyle: 'concise, uses occasional humor, explains complex concepts simply'
    };
  }

  /**
   * Get AI assistant response for the current game context
   * @param {Object} gameState - Current game state
   * @returns {Promise<String>} - Assistant's response
   */
  async getResponse(gameState) {
    try {
      // For code-specific responses, consider using context-aware hints
      if (this.shouldUseContextAwareHint(gameState)) {
        return await this.getContextAwareHint(gameState);
      }
      
      // Build context from game state
      const context = this.buildContext(gameState);
      
      // Generate prompt with context
      const prompt = this.generatePrompt(context);
      
      // Send request to Claude API
      const response = await this.apiService.sendRequest(prompt, {
        maxTokens: 150,
        temperature: 0.7
      });
      
      // Process and format the response
      const processedResponse = this.processResponse(response);
      
      // Add to conversation history
      this.addToHistory(gameState, processedResponse);
      
      return processedResponse;
    } catch (error) {
      console.error('Error getting assistant response:', error);
      return this.getFallbackResponse(error);
    }
  }
  
  /**
   * Determine if we should use context-aware hints based on game state
   * @param {Object} gameState - Current game state
   * @returns {Boolean} True if we should use context-aware hints
   */
  shouldUseContextAwareHint(gameState) {
    // Use context-aware hints when:
    // 1. Player code is available
    // 2. It's a coding challenge
    // 3. Request type is hint, error-explanation, or test-failure
    const hasCode = Boolean(gameState.playerCode);
    const isChallenge = Boolean(gameState.challengeId);
    const isCodeRequest = gameState.requestType === 'hint' || 
                         gameState.requestType === 'error-explanation' ||
                         gameState.requestType === 'test-failure';
    
    return hasCode && isChallenge && isCodeRequest;
  }
  
  /**
   * Get a context-aware hint based on code analysis
   * @param {Object} gameState - Current game state
   * @returns {Promise<String>} - Context-aware hint
   */
  async getContextAwareHint(gameState) {
    const {
      playerCode, 
      errorMessage, 
      challengeId, 
      learningObjective,
      attemptCount = 1
    } = gameState;
    
    // Determine challenge type from learning objective
    const challengeType = this.getChallengeType(learningObjective);
    
    // Get previous hints for this challenge
    const previousHints = this.getPreviousHints(challengeId);
    
    // Generate a context-aware hint
    const hintResult = this.hintGenerator.generateHint({
      code: playerCode,
      errorMessage,
      challengeId,
      challengeType,
      attemptCount,
      previousHints
    });
    
    // Store the hint for this challenge
    this.storeHint(challengeId, hintResult.hint);
    
    // Format the hint to sound more like Byte
    const formattedHint = this.formatByteHint(hintResult.hint, gameState);
    
    // Add to conversation history
    this.addToHistory(gameState, formattedHint);
    
    // Return the hint
    return formattedHint;
  }
  
  /**
   * Format a hint to match Byte's character
   * @param {String} hint - Raw hint
   * @param {Object} gameState - Game state
   * @returns {String} - Formatted hint
   */
  formatByteHint(hint, gameState) {
    // Add character-specific touches based on attempt count, error type, etc.
    if (gameState.attemptCount <= 1) {
      // First attempt, be encouraging
      return `${hint} Don't worry, you've got this!`;
    } else if (gameState.errorMessage) {
      // Error case, be helpful
      return `${hint} Let's solve this one step at a time.`;
    } else if (gameState.attemptCount > 3) {
      // Multiple attempts, provide more support
      return `${hint} I believe in you! Try this approach.`;
    }
    
    // Default case
    return hint;
  }
  
  /**
   * Get challenge type from learning objective
   * @param {String} learningObjective - Learning objective
   * @returns {String} - Challenge type
   */
  getChallengeType(learningObjective) {
    if (!learningObjective) return 'general';
    
    const objective = learningObjective.toLowerCase();
    
    if (objective.includes('variable')) return 'variables';
    if (objective.includes('function')) return 'functions';
    if (objective.includes('loop')) return 'loops';
    if (objective.includes('condition') || objective.includes('if') || objective.includes('else')) return 'conditionals';
    if (objective.includes('security')) return 'security-initialization';
    
    return 'general';
  }
  
  /**
   * Get previous hints given for a challenge
   * @param {String} challengeId - Challenge ID
   * @returns {Array} - Previous hints
   */
  getPreviousHints(challengeId) {
    if (!challengeId) return [];
    
    const hints = this.challengeHints.get(challengeId) || [];
    return hints;
  }
  
  /**
   * Store a hint for a challenge
   * @param {String} challengeId - Challenge ID
   * @param {String} hint - The hint
   */
  storeHint(challengeId, hint) {
    if (!challengeId) return;
    
    const hints = this.challengeHints.get(challengeId) || [];
    
    // Add the new hint
    hints.push(hint);
    
    // Keep only the last 5 hints
    if (hints.length > 5) {
      hints.shift();
    }
    
    // Update the map
    this.challengeHints.set(challengeId, hints);
  }

  /**
   * Build context for the AI from the current game state
   * @param {Object} gameState - Current game state
   * @returns {String} - Formatted context
   */
  buildContext(gameState) {
    const {
      playerName = 'Player',
      currentMission = '',
      challengeId = '',
      challengeDescription = '',
      learningObjective = '',
      playerCode = '',
      errorMessage = null,
      previousHint = null,
      attemptCount = 1,
      requestType = 'general'
    } = gameState;

    // Analyze code if available
    let codeAnalysis = '';
    if (playerCode) {
      const challengeType = this.getChallengeType(learningObjective);
      const analysis = this.hintGenerator.codeAnalyzer.analyzeCode(playerCode, errorMessage, challengeType);
      
      codeAnalysis = `
Code analysis:
- Summary: ${analysis.summary || 'No issues detected'}
- Complexity: ${analysis.complexity || 'simple'}
- Lines of code: ${analysis.lineCount || 'unknown'}
- Has comments: ${analysis.hasComments ? 'yes' : 'no'}
${analysis.issues.length > 0 ? `- Issues found: ${analysis.issues.length}` : ''}
${analysis.potentialIssues.length > 0 ? `- Potential improvements: ${analysis.potentialIssues.length}` : ''}
`;
    }

    return `
Current game context:
- Player: ${playerName}
- Current mission: ${currentMission}
- Challenge ID: ${challengeId}
- Current challenge: ${challengeDescription}
- Learning objective: ${learningObjective}
- Request type: ${requestType}
- Player's current code: \`\`\`javascript
${playerCode}
\`\`\`
- Error message (if any): ${errorMessage || 'None'}
- Previous hint provided (if any): ${previousHint || 'None'}
- Number of attempts: ${attemptCount}
${codeAnalysis}
Previous interactions:
${this.formatPreviousInteractions()}
`;
  }

  /**
   * Format previous interactions for context
   * @returns {String} - Formatted history
   */
  formatPreviousInteractions() {
    if (this.conversationHistory.length === 0) {
      return 'No previous interactions.';
    }

    // Get the last 3 interactions for context
    const recentHistory = this.conversationHistory
      .slice(-3)
      .map(item => {
        return `- Challenge: ${item.gameState.challengeId || 'Unknown'}\n  Player code: \`${this.truncateCode(item.gameState.playerCode)}\`\n  Response: "${item.response}"`;
      })
      .join('\n');

    return recentHistory;
  }

  /**
   * Truncate code for context
   * @param {String} code - Code to truncate
   * @returns {String} - Truncated code
   */
  truncateCode(code) {
    if (!code) return 'No code provided';
    if (code.length <= 60) return code;
    return code.substring(0, 57) + '...';
  }

  /**
   * Generate the full prompt for the AI
   * @param {String} context - Game context
   * @returns {Object} - Formatted prompt
   */
  generatePrompt(context) {
    const systemPrompt = `You are Byte, a helpful AI teaching assistant in the coding game CodeQuest. Your goal is to help the player learn coding concepts while maintaining their engagement and not solving puzzles for them. You should respond in character as Byte - ${this.characterTraits.personality}. Your speaking style is ${this.characterTraits.speakingStyle}.

${context}

Keep your response concise (max 2-3 sentences). If this is the player's first or second attempt, provide a general hint about the concept. If they've made multiple attempts, provide more specific guidance about their particular mistake without giving away the complete solution.`;

    return {
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Please help me with this coding challenge.'
        }
      ]
    };
  }

  /**
   * Process and format the API response
   * @param {Object} response - Raw API response
   * @returns {String} - Processed response
   */
  processResponse(response) {
    try {
      if (!response || !response.content || !response.content.length) {
        throw new Error('Invalid response format');
      }
      
      // Extract content from the response
      const content = response.content[0].text.trim();
      
      // Format the content for Byte's character
      return this.formatByteResponse(content);
    } catch (error) {
      console.error('Error processing response:', error);
      return this.fallbackResponses.error;
    }
  }

  /**
   * Format the response to match Byte's character
   * @param {String} content - Raw response content
   * @returns {String} - Formatted response
   */
  formatByteResponse(content) {
    // Remove any "Byte:" or similar prefixes
    let formatted = content.replace(/^(Byte:|As Byte:|I am Byte:)/i, '').trim();
    
    // Ensure response isn't too long
    if (formatted.length > 150) {
      formatted = formatted.substring(0, 147) + '...';
    }
    
    return formatted;
  }

  /**
   * Get appropriate fallback response
   * @param {Error} error - Error that occurred
   * @returns {String} - Fallback response
   */
  getFallbackResponse(error) {
    if (error.message.includes('timeout')) {
      return this.fallbackResponses.timeout;
    } else if (error.message.includes('not implemented')) {
      return this.fallbackResponses.notImplemented;
    }
    
    return this.fallbackResponses.error;
  }

  /**
   * Add interaction to conversation history
   * @param {Object} gameState - Game state
   * @param {String} response - Assistant's response
   */
  addToHistory(gameState, response) {
    // Limit history size
    if (this.conversationHistory.length > 10) {
      this.conversationHistory.shift();
    }
    
    // Add new interaction
    this.conversationHistory.push({
      timestamp: Date.now(),
      gameState: {
        playerName: gameState.playerName,
        currentMission: gameState.currentMission,
        challengeId: gameState.challengeId,
        learningObjective: gameState.learningObjective,
        playerCode: gameState.playerCode,
        errorMessage: gameState.errorMessage,
        attemptCount: gameState.attemptCount
      },
      response
    });
  }
}

export default ByteAIAssistant;