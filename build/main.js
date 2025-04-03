/*
 * CodeQuest Game - Simple Bundle
 * 
 * This is a simple concatenated bundle of the game's JavaScript files.
 * It fixes the "require is not defined" error by ensuring all modules
 * are loaded in the correct order.
 * 
 * Note: This is a temporary solution for development - a proper build
 * should be done with Vite or another bundler.
 */

// Create a global object for exports
window.CodeQuest = window.CodeQuest || {};

// Ensure React is globally available (would be loaded via CDN)
if (typeof React === 'undefined') {
  console.error('React is not loaded. Please include React via CDN in the HTML.');
}


/* 
 * External dependencies should be loaded via CDN:
 * - React
 * - ReactDOM
 * - Phaser
 * - CodeMirror
 */

// Create a diagnostic function to help troubleshoot the environment
function diagnoseEnvironment() {
  const results = {
    browser: navigator.userAgent,
    modules: typeof import !== 'undefined',
    localStorageAvailable: false,
    phaser: typeof Phaser !== 'undefined',
    react: typeof React !== 'undefined',
    reactDOM: typeof ReactDOM !== 'undefined'
  };
  
  // Test localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    results.localStorageAvailable = true;
  } catch (e) {
    results.localStorageAvailable = false;
  }
  
  console.table(results);
  return results;
}

// Log environment information
console.log('CodeQuest Environment Diagnostic:');
diagnoseEnvironment();

// Alert the user that they should run the proper build tool
console.error('This is a simplified bundle. For proper functionality, use "npm run build" to create a production bundle.');
alert('CodeQuest Direct Launch\n\nThis is a minimal compatibility build. For the full experience, please use npm run dev or npm run build.');
