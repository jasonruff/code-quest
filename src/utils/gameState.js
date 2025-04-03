/**
 * Game state management module
 * Handles global game state, progress tracking, and save/load functionality
 */

// Default initial game state
const DEFAULT_STATE = {
  player: {
    name: 'Agent',
    completedMissions: [],
    skills: {
      variables: 0,
      functions: 0,
      conditionals: 0,
      loops: 0,
      objects: 0
    },
    inventory: [],
    hintsUsed: 0
  },
  game: {
    currentMission: 'tutorial-1',
    currentChallenge: 'security-initialization',
    unlockedAreas: ['command-center'],
    lastSaved: null
  },
  settings: {
    volume: 0.7,
    textSize: 'medium',
    musicEnabled: true,
    sfxEnabled: true
  }
};

// In-memory state (will be persisted to localStorage)
let gameState = { ...DEFAULT_STATE };

/**
 * Initialize the game state
 * @returns {Object} The current game state
 */
export function initGameState() {
  try {
    // Try to load from localStorage
    const savedState = localStorage.getItem('codeQuest_savedState');
    
    if (savedState) {
      gameState = JSON.parse(savedState);
      console.log('Game state loaded from localStorage');
    } else {
      console.log('No saved game found, using default state');
    }
  } catch (error) {
    console.error('Error initializing game state:', error);
  }
  
  return { ...gameState };
}

/**
 * Get the current game state
 * @returns {Object} The current game state
 */
export function getGameState() {
  return { ...gameState };
}

/**
 * Update a specific part of the game state
 * @param {String} path - Dot notation path to the state property to update
 * @param {*} value - New value to set
 * @returns {Object} Updated game state
 */
export function updateGameState(path, value) {
  const pathParts = path.split('.');
  let current = gameState;
  
  // Navigate to the leaf object containing the property
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (!current[pathParts[i]]) {
      current[pathParts[i]] = {};
    }
    current = current[pathParts[i]];
  }
  
  // Update the property
  current[pathParts[pathParts.length - 1]] = value;
  
  return { ...gameState };
}

/**
 * Save the current game state to localStorage
 * @returns {Boolean} Success status
 */
export function saveGameState() {
  try {
    // Update last saved timestamp
    gameState.game.lastSaved = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('codeQuest_savedState', JSON.stringify(gameState));
    console.log('Game state saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
}

/**
 * Reset the game state to default
 * @param {Boolean} clearStorage - Whether to clear the saved state from localStorage
 * @returns {Object} Default game state
 */
export function resetGameState(clearStorage = true) {
  gameState = { ...DEFAULT_STATE };
  
  if (clearStorage) {
    try {
      localStorage.removeItem('codeQuest_savedState');
    } catch (error) {
      console.error('Error clearing saved game state:', error);
    }
  }
  
  return { ...gameState };
}

/**
 * Track mission completion
 * @param {String} missionId - ID of the completed mission
 * @param {Object} stats - Mission completion statistics
 * @returns {Object} Updated game state
 */
export function completeMission(missionId, stats = {}) {
  // Check if mission is already completed
  if (gameState.player.completedMissions.includes(missionId)) {
    return { ...gameState };
  }
  
  // Add to completed missions
  gameState.player.completedMissions.push(missionId);
  
  // Update skills based on mission
  if (stats.skills) {
    Object.entries(stats.skills).forEach(([skill, value]) => {
      if (gameState.player.skills[skill] !== undefined) {
        gameState.player.skills[skill] += value;
      }
    });
  }
  
  // Save the updated state
  saveGameState();
  
  return { ...gameState };
}

export default {
  initGameState,
  getGameState,
  updateGameState,
  saveGameState,
  resetGameState,
  completeMission
};