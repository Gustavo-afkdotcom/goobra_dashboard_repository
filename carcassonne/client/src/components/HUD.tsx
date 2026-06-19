import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { SerializedGameState, MoveAnalysis } from '@carcassonne/shared';

interface Props {
  gameState: SerializedGameState;
  lastAnalysis: MoveAnalysis | null;
  currentPlayerId: string | null;
  isMobile: boolean;
}

const LABEL_COLOR: Record<string, string> = {
  brilliant: '#00e5ff',
  great: '#4caf50',
  good: '#8bc34a',
  inaccuracy: '#ff9800',
  mistake: '#ff5722',
  blunder: '#f44336',
};

const LABEL_ICON: Record<string, string> = {
  brilliant: '!!',
  great: '!',
  good: '✓',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};

function RotationButtons({ selected, onSelect }: { selected: number; onSelect: (r: 0 | 90 | 180 | 270) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {([0, 90, 180, 270] as const).map(r => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          style={{
            flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 4,
            background: selected === r ? '#c9a96e' : '#2a2a4a',
            color: selected === r ? '#0d0d1a' : '#888',
            border: 'none', cursor: 'pointer', fontWeight: 700,
          }}
        >
          {r}°
        </button>
      ))}
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: MoveAnalysis }) {
  const color = LABEL_COLOR[analysis.label] ?? '#888';
  return (
    <div style={{ background: '#1a1a3a', borderRadius: 8, padding: '8px 10px', border: `1px solid ${color}` }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 4, letterSpacing: 2 }}>ÚLTIMO ANÁLISIS</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 15, color, fontWeight: 900 }}>{LABEL_ICON[analysis.label] ?? ''}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700, textTransform: 'capitalize' }}>{analysis.label}</span>
        <span style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>{Math.round(analysis.accuracy)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#666', marginBottom: 4 }}>
        <span>Tu jugada: <strong style={{ color: '#aaa' }}>{analysis.playerMoveScore}</strong></span>
        <span>Mejor: <strong style={{ color: '#aaa' }}>{analysis.bestMoveScore}</strong></span>
      </div>
      {analysis.explanation && (
        <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5 }}>{analysis.explanation}</div>
      )}
    </div>
  );
}

export default function HUD({ gameState, lastAnalysis, currentPlayerId, isMobile }: Props) {
  const store = useGameStore();
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const myPlayer = gameState.players.find(p => p.id === currentPlayerId);

  if (isMobile) {
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: '#14142a', borderTop: '1px solid #2a2a4a',
        display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: 6, zIndex: 100,
      }}>
        {/* Player scores row */}
        <div style={{ display: 'flex', gap: 6 }}>
          {gameState.players.map(p => (
            <div key={p.id} style={{
              flex: 1, textAlign: 'center', padding: '4px 6px', borderRadius: 6,
              background: p.id === gameState.currentPlayerId ? '#1e1e4a' : 'transparent',
              border: `1px solid ${p.color ?? '#444'}`,
            }}>
              <div style={{ fontSize: 10, color: p.color ?? '#888', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 16, color: '#c9a96e', fontWeight: 900 }}>{gameState.scores?.[p.id] ?? p.score}</div>
              <div style={{ fontSize: 9, color: '#555' }}>{'●'.repeat(Math.min(p.meeples, 7))}</div>
            </div>
          ))}
        </div>

        {/* Turn / phase */}
        <div style={{ textAlign: 'center', fontSize: 12, color: isMyTurn ? '#4caf50' : '#888' }}>
          {isMyTurn
            ? gameState.phase === 'PLACE_MEEPLE' ? 'Coloca meeple o salta' : 'Tu turno — coloca una ficha'
            : `Turno de ${currentPlayer?.name ?? '...'}`}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <RotationButtons selected={store.selectedRotation} onSelect={store.setRotation} />
          </div>
          {isMyTurn && gameState.phase === 'PLACE_MEEPLE' && (
            <button onClick={() => store.skipMeeple()} style={{
              padding: '5px 10px', fontSize: 11, borderRadius: 4,
              background: '#2a2a4a', color: '#c9a96e', border: '1px solid #c9a96e', cursor: 'pointer',
            }}>
              Saltar
            </button>
          )}
        </div>

        <div style={{ fontSize: 10, color: '#444', textAlign: 'center' }}>
          {gameState.tilesRemaining} fichas · turno {gameState.turn}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 260, flexShrink: 0, background: '#14142a', borderLeft: '1px solid #2a2a4a',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '14px 12px', gap: 10,
    }}>
      <div style={{ fontSize: 10, color: '#383868', letterSpacing: 4, fontWeight: 700 }}>CARCASSONNE</div>

      {/* Turn indicator */}
      <div style={{
        background: '#1e1e4a', borderRadius: 8, padding: '8px 10px',
        border: `1px solid ${currentPlayer?.color ?? '#2a2a4a'}`,
      }}>
        <div style={{ fontSize: 9, color: '#555', marginBottom: 3, letterSpacing: 2 }}>TURNO {gameState.turn}</div>
        <div style={{ fontSize: 13, color: currentPlayer?.color ?? '#c9a96e', fontWeight: 700 }}>
          {isMyTurn ? '● Tu turno' : `● ${currentPlayer?.name ?? '...'}`}
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
          {gameState.phase === 'PLACE_TILE' ? 'Coloca una ficha'
            : gameState.phase === 'PLACE_MEEPLE' ? 'Coloca un meeple'
            : 'Partida terminada'}
        </div>
      </div>

      {/* Scores */}
      <div>
        {gameState.players.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6,
            background: p.id === gameState.currentPlayerId ? '#1e1e3a' : 'transparent',
            marginBottom: 2,
          }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: p.color ?? '#888', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: p.id === currentPlayerId ? '#ddd' : '#777', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {p.name}{p.isAI ? ' 🤖' : ''}
            </div>
            <div style={{ fontSize: 14, color: '#c9a96e', fontWeight: 700 }}>{gameState.scores?.[p.id] ?? p.score}</div>
            <div style={{ fontSize: 9, color: '#555', minWidth: 28 }}>×{p.meeples}</div>
          </div>
        ))}
      </div>

      {/* Tiles remaining */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#444' }}>
        {gameState.tilesRemaining} fichas restantes
      </div>

      {/* Rotation */}
      <div>
        <div style={{ fontSize: 9, color: '#444', marginBottom: 5, letterSpacing: 2 }}>ROTACIÓN (tecla R)</div>
        <RotationButtons selected={store.selectedRotation} onSelect={store.setRotation} />
      </div>

      {/* Meeple skip */}
      {isMyTurn && gameState.phase === 'PLACE_MEEPLE' && (
        <button onClick={() => store.skipMeeple()} style={{
          width: '100%', padding: '8px 0', background: '#1a1a3a', color: '#c9a96e',
          border: '1px solid #c9a96e', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Saltar meeple
        </button>
      )}

      {/* AI suggestion */}
      {isMyTurn && gameState.phase === 'PLACE_TILE' && (
        <button onClick={() => store.requestAiMove()} style={{
          width: '100%', padding: '8px 0', background: '#0f1f0f', color: '#4caf50',
          border: '1px solid #4caf50', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Sugerir IA
        </button>
      )}

      {/* Meeple count for self */}
      {myPlayer && (
        <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
          Tus meeples: <strong style={{ color: myPlayer.color ?? '#c9a96e' }}>{myPlayer.meeples}</strong> / 7
        </div>
      )}

      {/* Analysis */}
      {lastAnalysis && <AnalysisCard analysis={lastAnalysis} />}
    </div>
  );
}
