/**
 * Claude API Service
 * Handles communication with Anthropic's Claude API for Byte's AI responses
 */
import API_CONFIG from '../config/apiConfig';

class ClaudeApiService {
  constructor(apiKey = null) {
    // Use provided API key or fall back to config
    this.apiKey = apiKey || API_CONFIG.claude.apiKey;
    this.apiEndpoint = API_CONFIG.claude.endpoint;
    this.apiVersion = API_CONFIG.claude.version;
    this.defaultModel = API_CONFIG.claude.defaultModel;
    
    // Initialize response cache
    this.responseCache = new Map();
    this.cacheEnabled = API_CONFIG.cache.enabled;
    this.cacheExpiry = API_CONFIG.cache.expiry;
    this.maxCacheSize = API_CONFIG.cache.maxSize;
  }

  /**
   * Send a request to Claude API
   * @param {Object} prompt - The formatted prompt to send
   * @param {Object} options - Additional API options
   * @returns {Promise<Object>} - API response
   */
  async sendRequest(prompt, options = {}) {
    try {
      // Check cache first if enabled
      if (this.cacheEnabled) {
        const cacheKey = this.generateCacheKey(prompt);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
          console.log('Using cached Claude API response');
          return cachedResponse;
        }
      }

      // Prepare request parameters
      const defaultOptions = API_CONFIG.claude.defaultOptions;
      const params = {
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || defaultOptions.maxTokens,
        temperature: options.temperature || defaultOptions.temperature,
        system: prompt.system,
        messages: prompt.messages || []
      };

      // Make API call
      const response = await this.makeApiCall(params);

      // Cache the response if enabled
      if (this.cacheEnabled) {
        const cacheKey = this.generateCacheKey(prompt);
        this.cacheResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error('Claude API request failed:', error);
      throw error;
    }
  }

  /**
   * Make the actual API call
   * @param {Object} params - API parameters
   * @returns {Promise<Object>} - API response
   */
  async makeApiCall(params) {
    try {
      console.log('Making Claude API request...');
      
      // In a development/testing environment, we might want to mock the API response
      if (this.apiKey === 'API_KEY_PLACEHOLDER') {
        console.warn('Using mock Claude API response - no real API key provided');
        return this.getMockResponse(params);
      }
      
      // Make the actual API call
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
  
  /**
   * Get a mock response for development/testing
   * @param {Object} params - The parameters that would have been sent to the API
   * @returns {Object} - A mock response
   */
  getMockResponse(params) {
    console.log('Generating mock Claude response for:', params.system.substring(0, 100) + '...');
    
    // Extract context from the system prompt to generate a contextual response
    const learningObjective = params.system.includes('Learning objective:') 
      ? params.system.split('Learning objective:')[1].split('\n')[0].trim() 
      : 'coding';
      
    const errorMessage = params.system.includes('Error message (if any):') 
      ? params.system.split('Error message (if any):')[1].split('\n')[0].trim() 
      : 'None';
    
    const attemptCount = params.system.includes('Number of attempts:')
      ? parseInt(params.system.split('Number of attempts:')[1].split('\n')[0].trim()) 
      : 1;
    
    // Generate different responses based on context
    let responseText = '';
    
    if (errorMessage !== 'None') {
      responseText = "I see there's a syntax error in your code. Check if you've closed all your brackets and added semicolons where needed. Also, remember that variable names are case-sensitive!";
    } else if (attemptCount > 2) {
      responseText = "Looking at your code, try breaking down the problem into smaller steps. First initialize your variables, then perform the calculation, and finally return the result.";
    } else if (learningObjective.includes('variable')) {
      responseText = "Think about variables as labeled containers. To declare a variable, you'll need to use keywords like 'let', 'const', or 'var', followed by a name and optional value assignment.";
    } else {
      responseText = "You're on the right track! Remember that JavaScript is case-sensitive and that indentation helps make your code more readable, even though it doesn't affect how the program runs.";
    }
    
    // Format as a Claude API response
    return {
      id: 'mock-response-' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: responseText
        }
      ],
      model: params.model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 250,
        output_tokens: responseText.split(' ').length
      }
    };
  }

  /**
   * Generate a cache key for the request
   * @param {Object} prompt - The prompt being sent
   * @returns {String} - Cache key
   */
  generateCacheKey(prompt) {
    // Create a deterministic key from the prompt content
    const contentString = JSON.stringify({
      system: prompt.system,
      messages: prompt.messages
    });
    
    // Simple hash function for strings
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `claude_${hash}`;
  }

  /**
   * Get a cached response if available and not expired
   * @param {String} cacheKey - The cache key
   * @returns {Object|null} - Cached response or null
   */
  getCachedResponse(cacheKey) {
    if (!this.responseCache.has(cacheKey)) {
      return null;
    }

    const { timestamp, data } = this.responseCache.get(cacheKey);
    const now = Date.now();

    // Check if cache entry has expired
    if (now - timestamp > this.cacheExpiry) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return data;
  }

  /**
   * Cache an API response
   * @param {String} cacheKey - The cache key
   * @param {Object} response - The response to cache
   */
  cacheResponse(cacheKey, response) {
    this.responseCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });

    // Cleanup old cache entries if cache is getting too large
    if (this.responseCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.responseCache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.responseCache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired cache entries`);
    }
    
    // If cache is still too large after removing expired entries,
    // remove the oldest entries until we're under the size limit
    if (this.responseCache.size > this.maxCacheSize) {
      const entriesToRemove = this.responseCache.size - this.maxCacheSize;
      const entries = Array.from(this.responseCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < entriesToRemove; i++) {
        this.responseCache.delete(entries[i][0]);
      }
      
      console.log(`Removed ${entriesToRemove} oldest cache entries to maintain size limit`);
    }
  }
}

export default ClaudeApiService;