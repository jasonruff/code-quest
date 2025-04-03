/**
 * Tilemap Manager
 * Utility class for handling tilemaps, collision detection, and interactive objects
 */
class TilemapManager {
  /**
   * Create a new TilemapManager
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   */
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.layers = {};
    this.tilesets = {};
    this.interactiveObjects = [];
    this.collisionLayers = [];
  }

  /**
   * Load a tilemap into the scene
   * @param {String} key - The key of the tilemap to load
   * @param {Object} options - Options for loading the tilemap
   * @param {Array<String>} options.tilesets - Array of tileset keys to add
   * @param {Array<String>} options.layers - Array of layer names to create
   * @param {Array<String>} options.collisionLayers - Array of layer names that should have collision
   * @returns {Phaser.Tilemaps.Tilemap} The loaded tilemap
   */
  loadTilemap(key, options = {}) {
    // Create the tilemap
    this.map = this.scene.make.tilemap({ key });

    // Add all tilesets
    if (options.tilesets && options.tilesets.length > 0) {
      options.tilesets.forEach(tilesetData => {
        const { name, key } = tilesetData;
        this.tilesets[name] = this.map.addTilesetImage(name, key);
      });
    }

    // Create all layers
    if (options.layers && options.layers.length > 0) {
      options.layers.forEach(layerName => {
        // Get all tilesets as an array
        const tilesetArray = Object.values(this.tilesets);
        
        // Create the layer
        this.layers[layerName] = this.map.createLayer(layerName, tilesetArray, 0, 0);
      });
    }

    // Set up collision layers
    if (options.collisionLayers && options.collisionLayers.length > 0) {
      options.collisionLayers.forEach(layerName => {
        if (this.layers[layerName]) {
          // Set collisions by property
          this.layers[layerName].setCollisionByProperty({ collides: true });
          
          // Store reference to collision layer
          this.collisionLayers.push(this.layers[layerName]);
        }
      });
    }

    // Initialize interactive objects
    this.initializeInteractiveObjects();

    return this.map;
  }

  /**
   * Initialize interactive objects from the tilemap
   */
  initializeInteractiveObjects() {
    // Check for interactive objects in tilemap 
    const interactiveObjectsLayer = this.map.getObjectLayer('interactive');
    
    if (!interactiveObjectsLayer) return;
    
    // Create interactive object for each object in the layer
    interactiveObjectsLayer.objects.forEach(object => {
      const { x, y, width, height, name, type, properties } = object;
      
      // Create a zone to represent the interactive area
      const interactiveZone = this.scene.add.zone(x + width / 2, y + height / 2, width, height);
      
      // Enable physics on the zone
      this.scene.physics.world.enable(interactiveZone, Phaser.Physics.Arcade.STATIC_BODY);
      
      // Store object properties
      interactiveZone.name = name;
      interactiveZone.type = type;
      interactiveZone.properties = {};
      
      // Process properties
      if (properties && properties.length > 0) {
        properties.forEach(prop => {
          interactiveZone.properties[prop.name] = prop.value;
        });
      }
      
      // Add visual indicator for interactive objects
      this.addInteractiveIndicator(interactiveZone);
      
      // Add to interactive objects array
      this.interactiveObjects.push(interactiveZone);
    });
  }

  /**
   * Add a visual indicator for an interactive object
   * @param {Phaser.GameObjects.Zone} interactiveZone - The interactive zone to add an indicator to
   */
  addInteractiveIndicator(interactiveZone) {
    // Create a pulsing indicator effect
    const indicator = this.scene.add.ellipse(
      interactiveZone.x,
      interactiveZone.y,
      interactiveZone.width * 0.5,
      interactiveZone.height * 0.5,
      0xffff00,
      0.3
    );
    
    // Make the indicator pulse
    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Link the indicator to the zone
    interactiveZone.indicator = indicator;
  }

  /**
   * Set up collisions between the player and tilemap collision layers
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   */
  setupCollisions(player) {
    // Add colliders for each collision layer
    this.collisionLayers.forEach(layer => {
      this.scene.physics.add.collider(player, layer);
    });
  }

  /**
   * Check for interactive objects at a specific position
   * @param {Number} x - X coordinate to check
   * @param {Number} y - Y coordinate to check
   * @returns {Phaser.GameObjects.Zone|null} The interactive object found, or null
   */
  getInteractiveObjectAt(x, y) {
    // Find the first interactive object that overlaps with the position
    for (const object of this.interactiveObjects) {
      const bounds = object.getBounds();
      
      if (
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      ) {
        return object;
      }
    }
    
    return null;
  }

  /**
   * Get the player spawn point from the tilemap
   * @returns {Object|null} The spawn point {x, y} or null if not found
   */
  getPlayerSpawnPoint() {
    const spawnLayer = this.map.getObjectLayer('spawn_points');
    
    if (!spawnLayer) return null;
    
    const spawnPoint = spawnLayer.objects.find(obj => obj.name === 'player_spawn');
    
    if (!spawnPoint) return null;
    
    return {
      x: spawnPoint.x + (spawnPoint.width / 2),
      y: spawnPoint.y + (spawnPoint.height / 2)
    };
  }

  /**
   * Highlight an interactive object
   * @param {Phaser.GameObjects.Zone} interactiveObject - The object to highlight
   */
  highlightInteractiveObject(interactiveObject) {
    if (!interactiveObject || !interactiveObject.indicator) return;
    
    // Enhance the highlight effect
    this.scene.tweens.add({
      targets: interactiveObject.indicator,
      alpha: 0.6,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 0
    });
  }

  /**
   * Handle interaction with an interactive object
   * @param {Phaser.GameObjects.Zone} interactiveObject - The object to interact with
   * @returns {Object} The result of the interaction
   */
  interactWith(interactiveObject) {
    if (!interactiveObject) return null;
    
    // Highlight the object
    this.highlightInteractiveObject(interactiveObject);
    
    // Get object properties
    const { name, type, properties } = interactiveObject;
    
    // Return interaction data
    return {
      name,
      type,
      properties,
      message: properties.message || `Interacting with ${name}`
    };
  }

  /**
   * Cleanup resources when destroying the manager
   */
  destroy() {
    this.interactiveObjects.forEach(obj => {
      if (obj.indicator) {
        obj.indicator.destroy();
      }
      obj.destroy();
    });
    
    this.interactiveObjects = [];
    this.collisionLayers = [];
    this.layers = {};
    this.tilesets = {};
    this.map = null;
  }
}

export default TilemapManager;