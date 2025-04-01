// AI Assistant Integration
// This demonstrates how to implement the Byte assistant using a modern LLM API

// Core Assistant Class
class ByteAssistant {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.conversationHistory = [];
    this.characterTraits = {
      name: 'Byte',
      personality: 'friendly, slightly quirky, patient, encouraging',
      speakingStyle: 'concise, uses occasional humor, explains complex concepts simply'
    };
    this.fallbackResponses = {
      error: "Hmm, my circuits are a bit tangled. Let's try a different approach!",
      timeout: "Oh! My processing took too long. Let's keep it simpler for now.",
      noContext: "I'm not quite sure what's happening here. Can you try running your code again?"
    };
    // Cache for storing common responses to reduce API calls
    this.responseCache = new Map();
  }

  /**
   * Generate context for the LLM based on current game state
   * @param {Object} gameState - Current state of the game and player progress
   * @returns {String} - Formatted context for the prompt
   */
  buildContext(gameState) {
    const {
      playerName,
      currentMission,
      challengeDescription,
      learningObjective,
      playerCode,
      errorMessage,
      previousHint,
      attemptCount
    } = gameState;

    return `
Current game context:
- Player: ${playerName}
- Current mission: ${currentMission}
- Current challenge: ${challengeDescription}
- Learning objective: ${learningObjective}
- Player's current code: \`\`\`javascript
${playerCode}
\`\`\`
- Error message (if any): ${errorMessage || 'None'}
- Previous hint provided (if any): ${previousHint || 'None'}
- Number of attempts: ${attemptCount}
    `;
  }

  /**
   * Generate a cache key for storing/retrieving similar responses
   * @param {Object} gameState - Current state of the game
   * @returns {String} - A cache key representing this scenario
   */
  generateCacheKey(gameState) {
    // Create a simplified version of the game state for caching
    // Focus on error message and code patterns rather than exact code
    const { errorMessage, learningObjective } = gameState;
    const codeSummary = this.summarizeCodeForCache(gameState.playerCode);
    
    return `${learningObjective}:${codeSummary}:${errorMessage || 'noError'}`;
  }

  /**
   * Create a simplified representation of code for caching purposes
   * @param {String} code - Player's code
   * @returns {String} - Simplified version for cache key
   */
  summarizeCodeForCache(code) {
    // This is a simple implementation - in a real system you'd want
    // more sophisticated code analysis
    const hasVariableDeclaration = /let|var|const/.test(code);
    const hasLoops = /for|while/.test(code);
    const hasConditionals = /if|else|switch/.test(code);
    const hasArrayMethods = /map|filter|reduce|forEach/.test(code);
    
    return `vars:${hasVariableDeclaration}|loops:${hasLoops}|cond:${hasConditionals}|arr:${hasArrayMethods}`;
  }

  /**
   * Call LLM API to generate assistant response
   * @param {Object} gameState - Current game state
   * @returns {Promise<String>} - Assistant's response
   */
  async getResponse(gameState) {
    // Check cache first
    const cacheKey = this.generateCacheKey(gameState);
    if (this.responseCache.has(cacheKey) && gameState.attemptCount < 3) {
      console.log('Using cached response');
      return this.responseCache.get(cacheKey);
    }
    
    try {
      const context = this.buildContext(gameState);
      const prompt = this.generatePrompt(context);
      
      // Make API call to LLM
      const response = await this.callLLMApi(prompt);
      
      // Process the response
      const processedResponse = this.processResponse(response);
      
      // Cache the response if it's a common scenario
      if (gameState.attemptCount < 2) {
        this.responseCache.set(cacheKey, processedResponse);
      }
      
      // Add to conversation history
      this.addToHistory(gameState, processedResponse);
      
      return processedResponse;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return this.getFallbackResponse(error);
    }
  }

  /**
   * Generate the full prompt for the LLM
   * @param {String} context - Game context
   * @returns {Object} - Formatted prompt for the API
   */
  generatePrompt(context) {
    return {
      messages: [
        {
          role: "system",
          content: `You are Byte, a helpful AI teaching assistant in the coding game CodeQuest. Your goal is to help the player learn coding concepts while maintaining their engagement and not solving puzzles for them. You should respond in character as Byte - ${this.characterTraits.personality}. Your speaking style is ${this.characterTraits.speakingStyle}.

${context}

Keep your response concise (max 2-3 sentences). If this is the player's first or second attempt, provide a general hint about the concept. If they've made multiple attempts, provide more specific guidance about their particular mistake without giving away the complete solution.`
        }
      ]
    };
  }

  /**
   * Make the actual API call to the Claude API
   * @param {Object} prompt - Formatted prompt
   * @returns {Promise<Object>} - Raw API response
   */
  async callLLMApi(prompt) {
    // Using Anthropic's Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',  // Using a fast, cost-effective model for quick responses
        max_tokens: 150,
        temperature: 0.7,
        system: prompt.messages[0].content,
        messages: [
          { 
            role: 'user', 
            content: `Context for this response:
${prompt.context || 'No additional context provided'}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Process and format the raw Claude API response
   * @param {Object} response - Raw API response
   * @returns {String} - Processed assistant message
   */
  processResponse(response) {
    try {
      // Extract the content from the Claude response
      const content = response.content[0].text.trim();
      
      // Format the response (add character touch, remove unnecessary prefixes, etc.)
      return this.formatByteResponse(content);
    } catch (error) {
      console.error('Error processing response:', error);
      return this.fallbackResponses.error;
    }
  }

  /**
   * Add character-specific touches to responses
   * @param {String} content - Raw response content
   * @returns {String} - Formatted response
   */
  formatByteResponse(content) {
    // Remove any "Byte:" or similar prefixes that the LLM might add
    let formatted = content.replace(/^(Byte:|As Byte:|I am Byte:)/i, '').trim();
    
    // Ensure the response isn't too long
    if (formatted.length > 150) {
      formatted = formatted.substring(0, 147) + '...';
    }
    
    return formatted;
  }

  /**
   * Get a fallback response when the API call fails
   * @param {Error} error - The error that occurred
   * @returns {String} - Appropriate fallback response
   */
  getFallbackResponse(error) {
    if (error.message.includes('timeout')) {
      return this.fallbackResponses.timeout;
    }
    
    return this.fallbackResponses.error;
  }

  /**
   * Add the interaction to conversation history
   * @param {Object} gameState - Game state that prompted the response
   * @param {String} response - Assistant's response
   */
  addToHistory(gameState, response) {
    // Keep history from growing too large by limiting size
    if (this.conversationHistory.length > 10) {
      this.conversationHistory.shift();
    }
    
    this.conversationHistory.push({
      timestamp: Date.now(),
      gameState: {
        currentMission: gameState.currentMission,
        learningObjective: gameState.learningObjective,
        playerCode: gameState.playerCode,
        errorMessage: gameState.errorMessage,
        attemptCount: gameState.attemptCount
      },
      response
    });
  }
}

// Example usage in game context
const initializeAssistant = () => {
  // In production, this key would be securely stored on the server
  // Using Anthropic's Claude API for our assistant
  const assistant = new ByteAssistant('YOUR_ANTHROPIC_API_KEY');
  
  return assistant;
};

// Example how to use the assistant in your game code
const getAssistantHelp = async (gameState) => {
  const assistant = initializeAssistant();
  
  // Show "thinking" animation
  displayThinkingAnimation();
  
  // Get response from assistant
  const response = await assistant.getResponse(gameState);
  
  // Hide thinking animation
  hideThinkingAnimation();
  
  // Display the response in the game UI
  displayAssistantResponse(response);
  
  // Track analytics
  trackAssistantInteraction({
    mission: gameState.currentMission,
    objective: gameState.learningObjective,
    attemptCount: gameState.attemptCount,
    responseLength: response.length
  });
};

// Example game state
const exampleGameState = {
  playerName: 'Agent Lightning',
  currentMission: 'Security Initialization',
  challengeDescription: 'Initialize a variable called securityCode and set its value to "9876"',
  learningObjective: 'Variable declaration and initialization',
  playerCode: 'let securityCode',
  errorMessage: null,
  previousHint: null,
  attemptCount: 1
};

// Helper functions (would be implemented elsewhere)
const displayThinkingAnimation = () => console.log('Byte is thinking...');
const hideThinkingAnimation = () => console.log('Byte finished thinking');
const displayAssistantResponse = (response) => console.log('Byte says:', response);
const trackAssistantInteraction = (data) => console.log('Analytics tracked:', data);

// Example function call for testing
// getAssistantHelp(exampleGameState);
