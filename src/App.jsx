import { useState, useEffect } from 'react';
import GameContainer from './components/GameContainer';
import { initGame } from './config/gameConfig';

function App() {
  const [gameInstance, setGameInstance] = useState(null);

  useEffect(() => {
    const game = initGame();
    setGameInstance(game);

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  return (
    <div className="app">
      <GameContainer gameInstance={gameInstance} />
    </div>
  );
}

export default App;