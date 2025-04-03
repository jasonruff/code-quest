/**
 * Tileset Generator
 * Utility to dynamically generate placeholder tilesets for development
 */
class TilesetGenerator {
  /**
   * Create a new tileset generator
   * @param {Phaser.Scene} scene - The scene to create textures in
   */
  constructor(scene) {
    this.scene = scene;
  }
  
  /**
   * Generate a sci-fi themed tileset texture
   * @param {String} key - The key to save the texture as
   * @param {Number} tileSize - The size of each tile in pixels
   * @param {Number} columns - Number of columns in the tileset
   * @param {Number} rows - Number of rows in the tileset
   */
  generateSciFiTileset(key = 'sci-fi-tileset', tileSize = 32, columns = 10, rows = 10) {
    // Create graphics object for generating the texture
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Create color palette
    const colors = {
      floor: 0x3A506B,      // Dark blue-gray
      floorAlt: 0x1C2541,   // Darker blue
      wall: 0x5BC0BE,       // Teal
      wallDark: 0x0B132B,   // Very dark blue
      highlight: 0x6FFFE9,  // Bright cyan
      computer: 0xFF5733,   // Orange
      door: 0xDAF7A6,       // Light green
      metal: 0x8D99AE,      // Gray
      metalDark: 0x444444,  // Dark gray
      screen: 0x58D68D      // Green
    };
    
    // Function to draw a tile at a specific position
    const drawTile = (col, row, fillColor, drawFunc) => {
      const x = col * tileSize;
      const y = row * tileSize;
      
      // Draw base tile
      graphics.fillStyle(fillColor);
      graphics.fillRect(x, y, tileSize, tileSize);
      
      // Call custom drawing function if provided
      if (drawFunc) {
        drawFunc(x, y);
      }
    };
    
    // Draw floor tiles (first row)
    drawTile(0, 0, colors.floor); // Basic floor
    drawTile(1, 0, colors.floorAlt); // Alternative floor
    drawTile(2, 0, colors.floor, (x, y) => {
      // Floor with grid pattern
      graphics.lineStyle(1, colors.floorAlt);
      graphics.beginPath();
      graphics.moveTo(x + tileSize/3, y);
      graphics.lineTo(x + tileSize/3, y + tileSize);
      graphics.moveTo(x + 2*tileSize/3, y);
      graphics.lineTo(x + 2*tileSize/3, y + tileSize);
      graphics.moveTo(x, y + tileSize/3);
      graphics.lineTo(x + tileSize, y + tileSize/3);
      graphics.moveTo(x, y + 2*tileSize/3);
      graphics.lineTo(x + tileSize, y + 2*tileSize/3);
      graphics.closePath();
      graphics.strokePath();
    });
    
    // Draw walls (indices 10-39)
    // Top wall (row 1)
    drawTile(0, 1, colors.wallDark); // Wall corner top-left
    for (let i = 1; i < columns - 1; i++) {
      drawTile(i, 1, colors.wall, (x, y) => {
        // Top wall with highlight
        graphics.fillStyle(colors.wallDark);
        graphics.fillRect(x, y, tileSize, tileSize/4);
        graphics.lineStyle(1, colors.highlight);
        graphics.beginPath();
        graphics.moveTo(x, y + tileSize/4);
        graphics.lineTo(x + tileSize, y + tileSize/4);
        graphics.closePath();
        graphics.strokePath();
      });
    }
    drawTile(columns - 1, 1, colors.wallDark); // Wall corner top-right
    
    // Side walls (row 2)
    drawTile(0, 2, colors.wall, (x, y) => {
      // Left wall with highlight
      graphics.fillStyle(colors.wallDark);
      graphics.fillRect(x, y, tileSize/4, tileSize);
      graphics.lineStyle(1, colors.highlight);
      graphics.beginPath();
      graphics.moveTo(x + tileSize/4, y);
      graphics.lineTo(x + tileSize/4, y + tileSize);
      graphics.closePath();
      graphics.strokePath();
    });
    for (let i = 1; i < columns - 1; i++) {
      drawTile(i, 2, colors.floor); // Floor for middle tiles
    }
    drawTile(columns - 1, 2, colors.wall, (x, y) => {
      // Right wall with highlight
      graphics.fillStyle(colors.wallDark);
      graphics.fillRect(x + 3*tileSize/4, y, tileSize/4, tileSize);
      graphics.lineStyle(1, colors.highlight);
      graphics.beginPath();
      graphics.moveTo(x + 3*tileSize/4, y);
      graphics.lineTo(x + 3*tileSize/4, y + tileSize);
      graphics.closePath();
      graphics.strokePath();
    });
    
    // Bottom walls (row 3)
    drawTile(0, 3, colors.wallDark); // Wall corner bottom-left
    for (let i = 1; i < columns - 1; i++) {
      drawTile(i, 3, colors.wall, (x, y) => {
        // Bottom wall with highlight
        graphics.fillStyle(colors.wallDark);
        graphics.fillRect(x, y + 3*tileSize/4, tileSize, tileSize/4);
        graphics.lineStyle(1, colors.highlight);
        graphics.beginPath();
        graphics.moveTo(x, y + 3*tileSize/4);
        graphics.lineTo(x + tileSize, y + 3*tileSize/4);
        graphics.closePath();
        graphics.strokePath();
      });
    }
    drawTile(columns - 1, 3, colors.wallDark); // Wall corner bottom-right
    
    // Computer terminals (row 4-5)
    drawTile(0, 4, colors.metal, (x, y) => {
      // Computer base
      graphics.fillStyle(colors.metalDark);
      graphics.fillRect(x + tileSize/8, y + tileSize/8, 6*tileSize/8, 6*tileSize/8);
    });
    drawTile(1, 4, colors.metal, (x, y) => {
      // Computer with screen
      graphics.fillStyle(colors.metalDark);
      graphics.fillRect(x + tileSize/8, y + tileSize/8, 6*tileSize/8, 6*tileSize/8);
      graphics.fillStyle(colors.computer);
      graphics.fillRect(x + tileSize/4, y + tileSize/4, tileSize/2, tileSize/3);
    });
    drawTile(2, 4, colors.metal, (x, y) => {
      // Terminal
      graphics.fillStyle(colors.metalDark);
      graphics.fillRect(x + tileSize/8, y + tileSize/8, 6*tileSize/8, 6*tileSize/8);
      graphics.fillStyle(colors.screen);
      graphics.fillRect(x + tileSize/4, y + tileSize/4, tileSize/2, tileSize/3);
      // Add buttons
      graphics.fillStyle(0xFFFFFF);
      graphics.fillRect(x + tileSize/4, y + 2*tileSize/3, tileSize/8, tileSize/12);
      graphics.fillRect(x + 3*tileSize/8, y + 2*tileSize/3, tileSize/8, tileSize/12);
      graphics.fillRect(x + tileSize/2, y + 2*tileSize/3, tileSize/8, tileSize/12);
      graphics.fillRect(x + 5*tileSize/8, y + 2*tileSize/3, tileSize/8, tileSize/12);
    });
    
    // Door (row 5)
    drawTile(0, 5, colors.metal); // Door frame
    drawTile(1, 5, colors.door, (x, y) => {
      // Door
      graphics.lineStyle(1, colors.metal);
      graphics.strokeRect(x, y, tileSize, tileSize);
      // Door handle
      graphics.fillStyle(colors.metal);
      graphics.fillRect(x + 3*tileSize/4, y + tileSize/2 - tileSize/8, tileSize/8, tileSize/4);
    });
    
    // Add more tiles as needed
    
    // Generate the texture
    graphics.generateTexture(key, tileSize * columns, tileSize * rows);
    graphics.destroy();
    
    console.log(`Generated ${key} tileset (${columns}x${rows} tiles)`);
    
    return key;
  }
}

export default TilesetGenerator;