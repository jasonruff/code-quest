import Phaser from 'phaser';

/**
 * Game State Manager
 * Handles game state with event-based updates, persistence, and transitions
 */
class GameStateManager {
  /**
   * Create a new GameStateManager
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   */
  constructor(scene) {
    this.scene = scene;
    
    // Create an event emitter for state changes
    this.events = new Phaser.Events.EventEmitter();
    
    // Default state values
    this.defaultState = {
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
        hintsUsed: 0,
        position: null, // Will store last position
        direction: 'down',
        experience: 0,
        level: 1
      },
      game: {
        currentMission: null,
        currentMissionState: 'not_started', // 'not_started', 'in_progress', 'completed', 'failed'
        currentChallenge: null,
        unlockedAreas: ['command-center'],
        lastSaved: null,
        activeNPCs: [],
        globalFlags: {}, // For story-related flags
        gameTime: 0
      },
      missions: {
        // Mission-specific states
        'security-initialization': {
          status: 'not_started', // 'not_started', 'in_progress', 'completed', 'failed'
          attempts: 0,
          hintsUsed: 0,
          startTime: null,
          endTime: null,
          codeSubmissions: [],
          unlocks: ['logic-gates']
        }
      },
      settings: {
        volume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        textSize: 'medium',
        musicEnabled: true,
        sfxEnabled: true
      },
      statistics: {
        totalPlayTime: 0,
        sessionsPlayed: 0,
        hintsUsed: 0,
        codesSubmitted: 0,
        bugsFixed: 0,
        areasExplored: 0
      }
    };
    
    // Current state
    this.state = JSON.parse(JSON.stringify(this.defaultState));
    
    // Auto-save timer
    this.autoSaveTimer = null;
    
    // Storage key
    this.storageKey = 'codeQuest_savedState';
    
    // Flag to track if state is initialized
    this.isInitialized = false;
  }
  
  /**
   * Initialize the game state
   * @param {Boolean} loadSaved - Whether to try loading a saved state
   * @returns {Object} The initialized state
   */
  init(loadSaved = true) {
    if (loadSaved) {
      this.loadState();
    }
    
    // Setup auto-save
    this.setupAutoSave();
    
    // Mark as initialized
    this.isInitialized = true;
    
    // Emit initialization event
    this.events.emit('state-initialized', this.state);
    
    return this.getState();
  }
  
  /**
   * Setup auto-save functionality
   * @param {Number} interval - Auto-save interval in milliseconds
   */
  setupAutoSave(interval = 60000) {
    // Clear any existing timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Setup new timer
    this.autoSaveTimer = setInterval(() => {
      if (this.isInitialized) {
        this.saveState(true); // Auto-save quietly
      }
    }, interval);
  }
  
  /**
   * Get the entire state or a specific part of it
   * @param {String} path - Optional dot notation path to a specific state property
   * @returns {*} The requested state
   */
  getState(path = null) {
    if (!path) {
      return JSON.parse(JSON.stringify(this.state));
    }
    
    return this.getStateByPath(path);
  }
  
  /**
   * Get a specific part of the state by path
   * @param {String} path - Dot notation path to a specific state property
   * @returns {*} The requested state value
   */
  getStateByPath(path) {
    const pathParts = path.split('.');
    let value = JSON.parse(JSON.stringify(this.state));
    
    for (const part of pathParts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Update a specific part of the state
   * @param {String} path - Dot notation path to the state property to update
   * @param {*} value - New value to set
   * @param {Boolean} save - Whether to save the state after update
   * @returns {Object} Updated state
   */
  update(path, value, save = false) {
    const pathParts = path.split('.');
    let current = this.state;
    
    // Navigate to the leaf object containing the property
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    // Get the property name
    const prop = pathParts[pathParts.length - 1];
    
    // Only trigger change if value is actually different
    const isChanged = JSON.stringify(current[prop]) !== JSON.stringify(value);
    
    // Update the property
    current[prop] = value;
    
    // Emit change event if value changed
    if (isChanged) {
      this.events.emit('state-changed', { path, value, oldValue: current[prop] });
      this.events.emit(`state-changed-${path}`, value);
    }
    
    // Save if requested
    if (save) {
      this.saveState();
    }
    
    return this.getState();
  }
  
  /**
   * Start a mission
   * @param {String} missionId - ID of the mission to start
   * @returns {Object} Updated state
   */
  startMission(missionId) {
    // Check if mission exists in the state
    if (!this.state.missions[missionId]) {
      // Initialize mission state if it doesn't exist
      this.state.missions[missionId] = {
        status: 'not_started',
        attempts: 0,
        hintsUsed: 0,
        startTime: null,
        endTime: null,
        codeSubmissions: []
      };
    }
    
    // Update mission state
    const now = new Date().toISOString();
    this.update(`missions.${missionId}.status`, 'in_progress');
    this.update(`missions.${missionId}.startTime`, now);
    
    // Set as current mission
    this.update('game.currentMission', missionId);
    this.update('game.currentMissionState', 'in_progress');
    
    // Emit mission started event
    this.events.emit('mission-started', missionId);
    
    // Save the state
    this.saveState();
    
    return this.getState();
  }
  
  /**
   * Complete a mission
   * @param {String} missionId - ID of the completed mission
   * @param {Object} results - Mission completion results
   * @returns {Object} Updated state
   */
  completeMission(missionId, results = {}) {
    // Check if mission exists and is not already completed
    if (!this.state.missions[missionId] || 
        this.state.missions[missionId].status === 'completed') {
      return this.getState();
    }
    
    // Update mission state
    const now = new Date().toISOString();
    this.update(`missions.${missionId}.status`, 'completed');
    this.update(`missions.${missionId}.endTime`, now);
    
    // Add to completed missions if not already there
    if (!this.state.player.completedMissions.includes(missionId)) {
      const completedMissions = [...this.state.player.completedMissions, missionId];
      this.update('player.completedMissions', completedMissions);
    }
    
    // Update skills based on mission results
    if (results.skills) {
      Object.entries(results.skills).forEach(([skill, value]) => {
        if (this.state.player.skills[skill] !== undefined) {
          const newValue = this.state.player.skills[skill] + value;
          this.update(`player.skills.${skill}`, newValue);
        }
      });
    }
    
    // Update experience and check for level up
    if (results.experience) {
      this.addExperience(results.experience);
    }
    
    // Unlock any areas or missions
    const missionData = this.state.missions[missionId];
    if (missionData.unlocks && Array.isArray(missionData.unlocks)) {
      // Unlock next missions
      missionData.unlocks.forEach(unlockId => {
        if (!this.state.missions[unlockId]) {
          this.state.missions[unlockId] = {
            status: 'not_started',
            attempts: 0,
            hintsUsed: 0,
            startTime: null,
            endTime: null,
            codeSubmissions: []
          };
        }
      });
      
      // Emit unlocks event
      this.events.emit('missions-unlocked', missionData.unlocks);
    }
    
    // Update game state
    if (this.state.game.currentMission === missionId) {
      this.update('game.currentMissionState', 'completed');
    }
    
    // Emit mission completed event
    this.events.emit('mission-completed', { missionId, results });
    
    // Save the state
    this.saveState();
    
    return this.getState();
  }
  
  /**
   * Add experience to the player
   * @param {Number} amount - Amount of experience to add
   * @returns {Object} Updated state with any level up info
   */
  addExperience(amount) {
    if (!amount || amount <= 0) return this.getState();
    
    // Get current experience and level
    const currentExp = this.state.player.experience;
    const currentLevel = this.state.player.level;
    
    // Add experience
    const newExp = currentExp + amount;
    this.update('player.experience', newExp);
    
    // Check for level up (simple formula: 100 * level^2)
    const expForNextLevel = 100 * Math.pow(currentLevel, 2);
    
    if (newExp >= expForNextLevel) {
      const newLevel = currentLevel + 1;
      this.update('player.level', newLevel);
      
      // Emit level up event
      this.events.emit('player-leveled-up', {
        oldLevel: currentLevel,
        newLevel,
        experience: newExp
      });
      
      return {
        levelUp: true,
        oldLevel: currentLevel,
        newLevel,
        experience: newExp
      };
    }
    
    return {
      levelUp: false,
      level: currentLevel,
      experience: newExp,
      nextLevelAt: expForNextLevel
    };
  }
  
  /**
   * Save player position
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @param {String} direction - Facing direction
   * @param {String} currentMap - Current map ID
   */
  savePlayerPosition(x, y, direction, currentMap) {
    this.update('player.position', { x, y, direction, currentMap });
  }
  
  /**
   * Track code submission for current mission
   * @param {String} code - The submitted code
   * @param {Boolean} success - Whether the submission was successful
   * @param {String} error - Error message if submission failed
   */
  trackCodeSubmission(code, success, error = null) {
    const missionId = this.state.game.currentMission;
    
    if (!missionId || !this.state.missions[missionId]) return;
    
    // Get current submissions
    const submissions = this.state.missions[missionId].codeSubmissions || [];
    
    // Add new submission
    const newSubmission = {
      timestamp: new Date().toISOString(),
      code,
      success,
      error
    };
    
    // Update submissions array
    this.update(`missions.${missionId}.codeSubmissions`, [...submissions, newSubmission]);
    
    // Increment attempts
    const attempts = (this.state.missions[missionId].attempts || 0) + 1;
    this.update(`missions.${missionId}.attempts`, attempts);
    
    // Update statistics
    this.update('statistics.codesSubmitted', (this.state.statistics.codesSubmitted || 0) + 1);
    
    // Emit event
    this.events.emit('code-submitted', {
      missionId,
      success,
      attempts,
      submission: newSubmission
    });
  }
  
  /**
   * Track a hint being used
   * @param {String} missionId - ID of the mission the hint was used for
   */
  trackHintUsed(missionId = null) {
    // Default to current mission if not specified
    const mission = missionId || this.state.game.currentMission;
    
    if (mission && this.state.missions[mission]) {
      const hintsUsed = (this.state.missions[mission].hintsUsed || 0) + 1;
      this.update(`missions.${mission}.hintsUsed`, hintsUsed);
    }
    
    // Update player hints used
    this.update('player.hintsUsed', (this.state.player.hintsUsed || 0) + 1);
    
    // Update statistics
    this.update('statistics.hintsUsed', (this.state.statistics.hintsUsed || 0) + 1);
  }
  
  /**
   * Update total play time
   * @param {Number} deltaTime - Time in milliseconds since last update
   */
  updatePlayTime(deltaTime) {
    if (!deltaTime || deltaTime <= 0) return;
    
    // Convert to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update game time (current session)
    this.update('game.gameTime', this.state.game.gameTime + deltaSeconds);
    
    // Update total play time (all sessions)
    this.update('statistics.totalPlayTime', this.state.statistics.totalPlayTime + deltaSeconds);
  }
  
  /**
   * Set a global game flag
   * @param {String} flagName - Name of the flag
   * @param {*} value - Value to set
   */
  setFlag(flagName, value) {
    this.update(`game.globalFlags.${flagName}`, value);
  }
  
  /**
   * Get a global game flag
   * @param {String} flagName - Name of the flag
   * @returns {*} The flag value
   */
  getFlag(flagName) {
    return this.getState(`game.globalFlags.${flagName}`);
  }
  
  /**
   * Save the current state to localStorage
   * @param {Boolean} quiet - Whether to suppress logging and events
   * @returns {Boolean} Success status
   */
  saveState(quiet = false) {
    try {
      // Update last saved timestamp
      this.state.game.lastSaved = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      
      if (!quiet) {
        console.log('Game state saved successfully');
        this.events.emit('state-saved', this.state);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  }
  
  /**
   * Load the state from localStorage
   * @returns {Boolean} Success status
   */
  loadState() {
    try {
      // Try to load from localStorage
      const savedState = localStorage.getItem(this.storageKey);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Merge with default state to ensure we have all required properties
        // especially for newly added state properties that might not be in saved data
        this.state = this.mergeWithDefaultState(parsedState);
        
        console.log('Game state loaded from localStorage');
        this.events.emit('state-loaded', this.state);
        
        // Increment sessions played
        this.update('statistics.sessionsPlayed', this.state.statistics.sessionsPlayed + 1);
        
        return true;
      } else {
        console.log('No saved game found, using default state');
        
        // Initialize sessions played
        this.update('statistics.sessionsPlayed', 1);
        
        return false;
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      return false;
    }
  }
  
  /**
   * Reset the state to default values
   * @param {Boolean} clearStorage - Whether to clear localStorage
   * @returns {Object} The reset state
   */
  resetState(clearStorage = true) {
    // Reset to default state
    this.state = JSON.parse(JSON.stringify(this.defaultState));
    
    // Clear localStorage if requested
    if (clearStorage) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.error('Error clearing saved game state:', error);
      }
    }
    
    // Initialize sessions played
    this.update('statistics.sessionsPlayed', 1);
    
    // Emit reset event
    this.events.emit('state-reset', this.state);
    
    return this.getState();
  }
  
  /**
   * Merge saved state with default state to ensure all properties exist
   * @param {Object} savedState - The loaded state from localStorage
   * @returns {Object} Merged state
   */
  mergeWithDefaultState(savedState) {
    const mergedState = JSON.parse(JSON.stringify(this.defaultState));
    
    // Helper function to deep merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };
    
    // Merge saved state into default state
    deepMerge(mergedState, savedState);
    
    return mergedState;
  }
  
  /**
   * Clean up resources when destroying the manager
   */
  destroy() {
    // Save state one last time
    this.saveState();
    
    // Clear auto-save timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    // Clear all event listeners
    this.events.removeAllListeners();
    
    this.isInitialized = false;
  }
}

export default GameStateManager;