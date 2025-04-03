import { useRef, useEffect } from 'react';

/**
 * Game container component that hosts the Phaser game instance
 * @param {Object} props - Component props
 * @param {Phaser.Game} props.gameInstance - The Phaser game instance
 */
function GameContainer({ gameInstance }) {
  const gameContainerRef = useRef(null);

  useEffect(() => {
    // The game parent is set to the container ref id in the gameConfig
    if (gameContainerRef.current) {
      gameContainerRef.current.id = 'phaser-game';
    }
  }, []);

  return (
    <div className="game-container">
      <div ref={gameContainerRef} className="game-content" />
    </div>
  );
}

export default GameContainer;