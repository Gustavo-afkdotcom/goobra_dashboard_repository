import React from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  result: any;
  playerId: string | null;
}

export default function GameOver({ result, playerId }: Props) {
  const store = useGameStore();
  const isWinner = result?.winnerId === playerId;
  const isDraw = !result?.winnerId;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#14142a', border: '1px solid #2a2a4a', borderRadius: 16, padding: '32px 40px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {isDraw ? '🤝' : isWinner ? '🏆' : '💀'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#c9a96e', letterSpacing: 4, marginBottom: 8 }}>
          {isDraw ? 'EMPATE' : isWinner ? 'GANASTE' : 'PERDISTE'}
        </h2>
        {result?.scores && (
          <div style={{ marginBottom: 20 }}>
            {Object.entries(result.scores as Record<string, number>).map(([pid, score]) => (
              <div key={pid} style={{ fontSize: 14, color: pid === playerId ? '#c9a96e' : '#888', marginBottom: 4 }}>
                {result.playerNames?.[pid] ?? pid.slice(0, 8)}: <strong>{score}</strong> pts
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => store.leaveGame()}
          style={{ background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Volver al lobby
        </button>
      </div>
    </div>
  );
}
