import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby';
import Board from './components/Board';
import HUD from './components/HUD';
import GameOver from './components/GameOver';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 700);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function App() {
  const store = useGameStore();
  const { gameState, gameId, playerId, gameEnded, error, inGame } = store;
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') store.rotateRight();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => store.clearError(), 3000);
    return () => clearTimeout(t);
  }, [error, store]);

  if (!inGame || !gameState) {
    return <Lobby onGameCreated={() => {
      window.history.replaceState({}, '', window.location.pathname);
      store.enterGame();
    }} />;
  }

  const players = gameState.players;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', flexDirection: 'row' }}>
      <Board players={players} bottomOffset={isMobile ? 180 : 0} />
      {!isMobile && (<HUD gameState={gameState} lastAnalysis={store.lastAnalysis} currentPlayerId={playerId} isMobile={false} />)}
      {isMobile && (<HUD gameState={gameState} lastAnalysis={store.lastAnalysis} currentPlayerId={playerId} isMobile={true} />)}
      {error && (
        <div onClick={() => store.clearError()} style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#2a1a1a', color: '#ff7043', border: '1px solid #ff4444', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', zIndex: 300 }}>⚠️ {error}</div>
      )}
      {gameEnded && <GameOver result={gameEnded} playerId={playerId} />}
    </div>
  );
}
