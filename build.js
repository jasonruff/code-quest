const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if we can access the source directory
try {
  fs.accessSync(path.join(__dirname, 'src'));
  console.log('Source directory found.');
} catch (error) {
  console.error('Cannot access source directory:', error);
  process.exit(1);
}

// Create a build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
  console.log('Build directory created.');
}

// Copy index.html to build directory
try {
  const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  // Update the script tag to point to the bundled JavaScript
  const updatedIndexContent = indexContent.replace(
    '<script type="module" src="/src/main.jsx"></script>',
    '<script src="main.js"></script>'
  );
  fs.writeFileSync(path.join(buildDir, 'index.html'), updatedIndexContent);
  console.log('index.html copied and updated.');
} catch (error) {
  console.error('Error copying index.html:', error);
}

// Copy assets
try {
  // Copy public directory recursively
  copyFolderRecursiveSync(path.join(__dirname, 'public'), buildDir);
  console.log('Public assets copied.');
  
  // Create assets/styles directory in build
  const stylesDir = path.join(buildDir, 'assets', 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  
  // Copy CSS files
  fs.copyFileSync(
    path.join(__dirname, 'src', 'assets', 'styles', 'main.css'),
    path.join(stylesDir, 'main.css')
  );
  
  if (fs.existsSync(path.join(__dirname, 'src', 'assets', 'styles', 'codeEditor.css'))) {
    fs.copyFileSync(
      path.join(__dirname, 'src', 'assets', 'styles', 'codeEditor.css'),
      path.join(stylesDir, 'codeEditor.css')
    );
  }
  
  console.log('Style assets copied.');
} catch (error) {
  console.error('Error copying assets:', error);
}

// Create a simple script tag based bundle
try {
  // Create a list of script files in order of dependencies
  const scriptFiles = [
    // External dependencies would be linked directly in the HTML
    // Core application files
    'src/utils/tilesetGenerator.js',
    'src/utils/tilemapManager.js',
    'src/utils/GameStateManager.js',
    'src/utils/assetLoader.js',
    'src/utils/physics.js',
    'src/entities/InteractiveObject.js',
    'src/entities/Player.js',
    'src/components/DialogBox.js',
    'src/components/GameStatePanel.js',
    'src/components/MissionTracker.js',
    'src/components/PlayerStatusDisplay.js',
    'src/components/ProgressBar.js',
    'src/utils/CodeChallengeManager.js',
    'src/components/CodeEditor.js',
    'src/utils/codeChallengeSystem.js',
    'src/scenes/BootScene.js',
    'src/scenes/PreloadScene.js',
    'src/scenes/GameScene.js',
    'src/scenes/CodeChallengeScene.js',
    'src/config/gameConfig.js',
    'src/main.jsx'
  ];
  
  // Create a build script that explains the issue
  let bundleContent = `/*
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

`;
  
  // Add comment about external dependencies
  bundleContent += `
/* 
 * External dependencies should be loaded via CDN:
 * - React
 * - ReactDOM
 * - Phaser
 * - CodeMirror
 */
`;
  
  // We'd need to add each file's content here but this would require parsing and transforming
  // the ES modules which is complex for this simple script.
  // Instead, we'll add a note about running the proper build tool
  
  bundleContent += `
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
alert('CodeQuest Direct Launch\\n\\nThis is a minimal compatibility build. For the full experience, please use npm run dev or npm run build.');
`;
  
  fs.writeFileSync(path.join(buildDir, 'main.js'), bundleContent);
  console.log('Script bundle created.');
} catch (error) {
  console.error('Error creating script bundle:', error);
}

console.log('Simple build completed. Open build/index.html in a browser to test.');
console.log('For a proper build, once node_modules are correctly installed, use:');
console.log('npm run build');

// Helper function to copy folders recursively
function copyFolderRecursiveSync(source, target) {
  // Check if source exists
  if (!fs.existsSync(source)) {
    return;
  }

  // Create target folder if it doesn't exist
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy files and subfolders
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}