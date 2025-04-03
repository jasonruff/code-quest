/**
 * Physics utility functions
 * Provides helper methods for physics interactions
 */

/**
 * Calculate distance between two points
 * @param {Number} x1 - X coordinate of first point
 * @param {Number} y1 - Y coordinate of first point
 * @param {Number} x2 - X coordinate of second point
 * @param {Number} y2 - Y coordinate of second point
 * @returns {Number} Distance between the points
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in radians
 * @param {Number} x1 - X coordinate of first point
 * @param {Number} y1 - Y coordinate of first point
 * @param {Number} x2 - X coordinate of second point
 * @param {Number} y2 - Y coordinate of second point
 * @returns {Number} Angle in radians
 */
export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize a vector to a given length
 * @param {Object} vector - Vector with x and y properties
 * @param {Number} length - Desired length (default: 1)
 * @returns {Object} Normalized vector {x, y}
 */
export function normalizeVector(vector, length = 1) {
  const currentLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  
  if (currentLength === 0) {
    return { x: 0, y: 0 };
  }
  
  const scale = length / currentLength;
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}

/**
 * Check if a point is inside a rectangle
 * @param {Number} x - X coordinate of point
 * @param {Number} y - Y coordinate of point
 * @param {Number} rx - X coordinate of rectangle's top-left corner
 * @param {Number} ry - Y coordinate of rectangle's top-left corner
 * @param {Number} rw - Width of rectangle
 * @param {Number} rh - Height of rectangle
 * @returns {Boolean} True if point is inside rectangle
 */
export function pointInRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

/**
 * Check for rectangle-rectangle collision
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {Boolean} True if rectangles intersect
 */
export function rectIntersect(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Apply a movement vector to an object with proper collision detection
 * @param {Phaser.Physics.Arcade.Sprite} sprite - The sprite to move
 * @param {Object} vector - Movement vector {x, y}
 * @param {Number} speed - Movement speed
 * @param {Boolean} normalize - Whether to normalize the vector first
 */
export function moveWithCollision(sprite, vector, speed, normalize = true) {
  if (!sprite.body) return;
  
  let moveX = vector.x;
  let moveY = vector.y;
  
  // Normalize if requested
  if (normalize && (moveX !== 0 || moveY !== 0)) {
    const normalized = normalizeVector({ x: moveX, y: moveY });
    moveX = normalized.x;
    moveY = normalized.y;
  }
  
  // Apply movement
  sprite.body.setVelocity(
    moveX * speed,
    moveY * speed
  );
}

export default {
  distance,
  angle,
  normalizeVector,
  pointInRect,
  rectIntersect,
  moveWithCollision
};