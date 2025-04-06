/**
 * API Configuration
 * 
 * This file contains configuration for external API services.
 * In a production environment, these keys should be managed securely,
 * either through environment variables or a secure key management service.
 */

const API_CONFIG = {
  // Claude API configuration
  claude: {
    apiKey:  import.meta.env.VITE_CLAUDE_API_KEY || 'API_KEY_PLACEHOLDER',
    endpoint: 'https://api.anthropic.com/v1/messages',
    version: '2023-06-01',
    defaultModel: 'claude-3-haiku-20240307',
    defaultOptions: {
      maxTokens: 150,
      temperature: 0.7
    }
  },
  
  // Cache configuration for API responses
  cache: {
    enabled: true,
    maxSize: 100,
    expiry: 60 * 60 * 1000 // 1 hour in milliseconds
  }
};

export default API_CONFIG;