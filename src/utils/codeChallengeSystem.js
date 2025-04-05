/**
 * Code Challenge System
 * Integration module for code challenge components
 */
import CodeChallengeManager from './CodeChallengeManager';
import CodeEditor from '../components/CodeEditor';
import InteractiveObject from '../entities/InteractiveObject';

/**
 * Initialize the code challenge system
 * @param {Phaser.Scene} scene - The scene to which the system belongs
 * @param {GameStateManager} stateManager - Game state manager
 * @returns {Object} Code challenge system API
 */
export function initCodeChallengeSystem(scene, stateManager) {
  // Create challenge manager
  const challengeManager = new CodeChallengeManager();
  
  // Keep track of completed challenges
  let completedChallenges = stateManager.getState('challenges.completed') || [];
  
  /**
   * Event handler for challenge completion
   * @param {Object} data - Challenge completion data
   */
  function handleChallengeComplete(data) {
    const { challengeId, code, result, metrics } = data;
    
    if (!challengeId) return;
    
    // Update state to mark challenge as completed
    if (!completedChallenges.includes(challengeId)) {
      completedChallenges.push(challengeId);
      stateManager.setState('challenges.completed', completedChallenges);
    }
    
    // Save player's solution
    stateManager.setState(`challenges.${challengeId}.playerSolution`, code);
    stateManager.setState(`challenges.${challengeId}.lastCompleted`, Date.now());
    
    // Save performance metrics if available (from US-006)
    if (metrics) {
      stateManager.setState(`challenges.${challengeId}.metrics`, {
        executionTime: metrics.executionTime || 0,
        memoryUsage: metrics.memoryUsage || 0,
        errorCount: metrics.errorCount || 0,
        completionDate: Date.now()
      });
    }
    
    // Award experience based on challenge difficulty
    const challenge = challengeManager.getChallenge(challengeId);
    if (challenge) {
      let experiencePoints = 100; // Default
      
      // Adjust based on difficulty
      switch (challenge.difficulty) {
        case 'beginner':
          experiencePoints = 100;
          break;
        case 'intermediate':
          experiencePoints = 200;
          break;
        case 'advanced':
          experiencePoints = 300;
          break;
        case 'expert':
          experiencePoints = 500;
          break;
      }
      
      // Extra bonus for good performance (US-006 integration)
      if (metrics && metrics.executionTime < 50) {
        experiencePoints += 20; // Fast execution bonus
      }
      
      // Complete the mission associated with this challenge
      stateManager.completeMission(challengeId, {
        experience: experiencePoints,
        skills: {
          [challenge.skillType]: 1 // Increase skill level
        }
      });
      
      // Special handling for specific challenges (US-007)
      if (challengeId === 'security-initialization') {
        // Set a game flag to indicate security system is initialized
        stateManager.setState('gameFlags.securityInitialized', true);
        
        // This could trigger other events in the game world
        stateManager.setState('messages.system', [
          ...(stateManager.getState('messages.system') || []),
          {
            text: 'Security system initialized successfully. Access granted to restricted areas.',
            timestamp: Date.now(),
            read: false
          }
        ]);
      }
    }
    
    // Save state
    stateManager.saveState();
    
    // Trigger scene-specific events
    scene.events.emit('challenge-completed', { challengeId, code, result, metrics });
  }
  
  /**
   * Launch a code challenge
   * @param {String} challengeId - ID of the challenge to launch
   */
  function launchChallenge(challengeId) {
    // Check if challenge exists
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) {
      console.error(`Challenge not found: ${challengeId}`);
      return;
    }
    
    // Pause the current scene and launch the challenge scene
    scene.scene.pause();
    scene.scene.launch('CodeChallengeScene', {
      challengeId,
      previousScene: scene.scene.key,
      stateManager
    });
  }
  
  /**
   * Get challenge status
   * @param {String} challengeId - Challenge ID
   * @returns {Object} Challenge status information
   */
  function getChallengeStatus(challengeId) {
    const isCompleted = completedChallenges.includes(challengeId);
    const playerSolution = stateManager.getState(`challenges.${challengeId}.playerSolution`);
    const lastCompleted = stateManager.getState(`challenges.${challengeId}.lastCompleted`);
    
    return {
      isCompleted,
      playerSolution,
      lastCompleted
    };
  }
  
  /**
   * Get all challenge statuses
   * @returns {Object} Map of challenge IDs to status information
   */
  function getAllChallengeStatuses() {
    const challenges = challengeManager.getAllChallenges();
    const statuses = {};
    
    Object.keys(challenges).forEach(id => {
      statuses[id] = getChallengeStatus(id);
    });
    
    return statuses;
  }
  
  /**
   * Add event listeners for challenge system
   */
  function setupEventListeners() {
    // Listen for global challenge complete events (from CodeEditor)
    window.addEventListener('challenge-complete', (event) => {
      handleChallengeComplete(event.detail);
    });
    
    // Listen for Phaser events
    scene.events.on('challenge-success', (data) => {
      console.log('Challenge success:', data);
    });
    
    scene.events.on('challenge-failed', (data) => {
      console.log('Challenge failed:', data);
    });
    
    scene.events.on('code-error', (data) => {
      console.log('Code error:', data);
    });
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Return the public API
  return {
    launchChallenge,
    getChallengeStatus,
    getAllChallengeStatuses,
    getChallenge: challengeManager.getChallenge.bind(challengeManager),
    getChallengesByCategory: challengeManager.getChallengesByCategory.bind(challengeManager),
    getChallengesByDifficulty: challengeManager.getChallengesByDifficulty.bind(challengeManager)
  };
}

/**
 * Create a code challenge terminal
 * @param {Phaser.Scene} scene - The scene in which to create the terminal
 * @param {Object} options - Configuration options
 * @returns {InteractiveObject} The created interactive object
 */
export function createCodeChallengeTerminal(scene, options) {
  // InteractiveObject is already imported at the top level
  // No need to import or require it again here
  
  // Default options
  const defaultOptions = {
    x: 400,
    y: 300,
    width: 50,
    height: 50,
    name: 'Code Terminal',
    message: 'Press SPACE to start coding challenge',
    challengeId: null,
    missionId: null,
    skillType: 'programming'
  };
  
  // Merge options
  const config = { ...defaultOptions, ...options };
  
  // Create the interactive object
  return new InteractiveObject(
    scene,
    config.x,
    config.y,
    config.width,
    config.height,
    {
      name: config.name,
      type: 'code-terminal',
      properties: {
        message: config.message,
        codeChallenge: config.challengeId,
        missionId: config.missionId || config.challengeId,
        skillType: config.skillType
      }
    }
  );
}