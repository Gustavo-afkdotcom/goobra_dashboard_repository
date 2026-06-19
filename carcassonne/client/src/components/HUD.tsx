import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SerializedGameState, MoveAnalysis } from '@carcassonne/shared';
import { drawTileGraphic } from '../render/tile';

interface Props {
  gameState: SerializedGameState;
  lastAnalysis: MoveAnalysis | null;
  currentPlayerId: string | null;
  isMobile: boolean;
}

const LABEL_COLOR: Record<string, string> = {
  brilliant: '#00e5ff', great: '#4caf50', good: '#8bc34a',
  inaccuracy: '#ff9800', mistake: '#ff5722', blunder: '#f44336',
};
const LABEL_ICON: Record<string, string> = {
  brilliant: '!!', great: '!', good: '✓', inaccuracy: '?!', mistake: '?', blunder: '??',
};

/** Small canvas that renders the current tile at the selected rotation. */
function TilePreview({ tileDefId, rotation, size }: { tileDefId: string | null; rotation: number; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (tileDefId) drawTileGraphic(ctx, tileDefId, rotation, 0, 0, size);
    else { ctx.fillStyle = '#1a1a3a'; ctx.fillRect(0, 0, size, size); }
  }, [tileDefId, rotation, size]);
  return <canvas ref={ref} style={{ width: size, height: size, borderRadius: 8, border: '2px solid #2a2a4a' }} />;
}

function RotateButton({ onClick, big }: { onClick: () => void; big?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#1a1206',
        border: 'none', borderRadius: 10, padding: big ? '12px 18px' : '8px 12px',
        fontSize: big ? 15 : 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      ⟳ Girar
    </button>
  );
}

function MeepleButtons({ canPlace }: { canPlace: boolean }) {
  const store = useGameStore();
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={() => store.placeMeeple('normal')}
        disabled={!canPlace}
        style={{
          flex: 1, padding: '10px 0', background: canPlace ? '#1f7a3a' : '#243a28',
          color: canPlace ? '#fff' : '#5a7a60', border: 'none', borderRadius: 10,
          fontSize: 13, fontWeight: 800, cursor: canPlace ? 'pointer' : 'default',
        }}
      >
        Colocar meeple
      </button>
      <button
        onClick={() => store.skipMeeple()}
        style={{
          flex: 1, padding: '10px 0', background: '#2a2a4a', color: '#c9a96e',
          border: '1px solid #c9a96e', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
        }}
      >
        Saltar
      </button>
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
  const tileId = gameState.currentTile?.tileDefId ?? null;
  const placeTilePhase = gameState.phase === 'PLACE_TILE';
  const meeplePhase = gameState.phase === 'PLACE_MEEPLE';

  const statusText = !isMyTurn
    ? `Turno de ${currentPlayer?.name ?? '...'}`
    : meeplePhase ? '¿Colocar meeple?'
    : 'Tu turno — toca una casilla verde';

  if (isMobile) {
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: '#14142a', borderTop: '1px solid #2a2a4a',
        display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: 6, zIndex: 100,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <TilePreview tileDefId={tileId} rotation={store.selectedRotation} size={58} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: isMyTurn ? '#7CFFB0' : '#888', fontWeight: 700, marginBottom: 6 }}>
              {statusText}
            </div>
            {isMyTurn && placeTilePhase && <RotateButton onClick={() => store.rotateRight()} />}
            {isMyTurn && meeplePhase && <MeepleButtons canPlace={(myPlayer?.meeples ?? 0) > 0} />}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {gameState.players.map(p => (
            <div key={p.id} style={{
              flex: 1, textAlign: 'center', padding: '4px 6px', borderRadius: 6,
              background: p.id === gameState.currentPlayerId ? '#1e1e4a' : 'transparent',
              border: `1px solid ${p.color ?? '#444'}`,
            }}>
              <div style={{ fontSize: 10, color: p.color ?? '#888', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 16, color: '#c9a96e', fontWeight: 900 }}>{gameState.scores?.[p.id] ?? p.score}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#444', textAlign: 'center' }}>
          {gameState.tilesRemaining} fichas · turno {gameState.turn}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 280, flexShrink: 0, background: '#14142a', borderLeft: '1px solid #2a2a4a',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px 14px', gap: 12,
    }}>
      <div style={{ fontSize: 10, color: '#383868', letterSpacing: 4, fontWeight: 700 }}>CARCASSONNE</div>

      {/* Turn indicator */}
      <div style={{
        background: '#1e1e4a', borderRadius: 8, padding: '10px 12px',
        border: `1px solid ${isMyTurn ? '#5fd07a' : (currentPlayer?.color ?? '#2a2a4a')}`,
      }}>
        <div style={{ fontSize: 9, color: '#555', marginBottom: 3, letterSpacing: 2 }}>TURNO {gameState.turn}</div>
        <div style={{ fontSize: 14, color: isMyTurn ? '#7CFFB0' : (currentPlayer?.color ?? '#c9a96e'), fontWeight: 800 }}>
          {statusText}
        </div>
      </div>

      {/* Current tile preview + rotate */}
      {gameState.currentTile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: 2, alignSelf: 'flex-start' }}>FICHA ACTUAL</div>
          <TilePreview tileDefId={tileId} rotation={store.selectedRotation} size={120} />
          {isMyTurn && placeTilePhase && <RotateButton onClick={() => store.rotateRight()} big />}
        </div>
      )}

      {/* Meeple controls */}
      {isMyTurn && meeplePhase && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
            Coloca un meeple en la ficha o sáltalo
          </div>
          <MeepleButtons canPlace={(myPlayer?.meeples ?? 0) > 0} />
        </div>
      )}

      {/* Scores */}
      <div>
        {gameState.players.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6,
            background: p.id === gameState.currentPlayerId ? '#1e1e3a' : 'transparent', marginBottom: 2,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color ?? '#888', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: p.id === currentPlayerId ? '#ddd' : '#888', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {p.name}{p.isAI ? ' 🤖' : ''}{p.id === currentPlayerId ? ' (tú)' : ''}
            </div>
            <div style={{ fontSize: 15, color: '#c9a96e', fontWeight: 700 }}>{gameState.scores?.[p.id] ?? p.score}</div>
            <div style={{ fontSize: 9, color: '#555', minWidth: 26 }}>♟{p.meeples}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#444' }}>
        {gameState.tilesRemaining} fichas restantes
      </div>

      {lastAnalysis && <AnalysisCard analysis={lastAnalysis} />}
    </div>
  );
}
