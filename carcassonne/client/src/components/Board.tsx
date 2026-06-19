import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Player, BoardTile } from '@carcassonne/shared';

interface Props {
  players: Player[];
  bottomOffset: number;
}

const TILE_SIZE = 64;

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  const hue = ((hash >>> 0) % 60) + 55;
  return `hsl(${hue}, 28%, 24%)`;
}

function getPlayerColor(playerId: string, players: Player[]): string {
  return players.find(p => p.id === playerId)?.color ?? '#fff';
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: BoardTile,
  cx: number,
  cy: number,
  players: Player[],
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hashColor(tile.tileDefId);
  ctx.fillRect(cx, cy, TILE_SIZE, TILE_SIZE);

  ctx.strokeStyle = '#111122';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx, cy, TILE_SIZE, TILE_SIZE);

  // draw a subtle tile-id label
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '8px monospace';
  ctx.fillText(tile.tileDefId.slice(0, 4), cx + 3, cy + 11);

  tile.meeples?.forEach((m, i) => {
    const color = getPlayerColor(m.playerId, players);
    const mx = cx + TILE_SIZE / 2 + (i - (tile.meeples.length - 1) / 2) * 12;
    const my = cy + TILE_SIZE / 2;
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}

export default function Board({ players, bottomOffset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useGameStore();
  const panRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const worldToCanvas = (wx: number, wy: number) => ({
    cx: wx * TILE_SIZE + panRef.current.x,
    cy: wy * TILE_SIZE + panRef.current.y,
  });

  const canvasToWorld = (cx: number, cy: number) => ({
    wx: Math.floor((cx - panRef.current.x) / TILE_SIZE),
    wy: Math.floor((cy - panRef.current.y) / TILE_SIZE),
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { gameState, hoveredCell, selectedRotation, playerId } = store;

    ctx.fillStyle = '#12122a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState) return;

    const startX = Math.floor(-panRef.current.x / TILE_SIZE) - 1;
    const startY = Math.floor(-panRef.current.y / TILE_SIZE) - 1;
    const endX = startX + Math.ceil(canvas.width / TILE_SIZE) + 2;
    const endY = startY + Math.ceil(canvas.height / TILE_SIZE) + 2;

    // background grid cells
    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        const { cx, cy } = worldToCanvas(gx, gy);
        ctx.fillStyle = '#1a1a38';
        ctx.fillRect(cx + 1, cy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    const isMyTurn = gameState.currentPlayerId === playerId;

    // valid placement highlights
    if (isMyTurn && gameState.phase === 'PLACE_TILE' && gameState.currentTile) {
      gameState.currentTile.validPlacements.forEach(vp => {
        const { cx, cy } = worldToCanvas(vp.x, vp.y);
        if (cx + TILE_SIZE < 0 || cx > canvas.width || cy + TILE_SIZE < 0 || cy > canvas.height) return;
        ctx.fillStyle = 'rgba(76, 175, 80, 0.12)';
        ctx.fillRect(cx + 1, cy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 1, cy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      });
    }

    // placed tiles
    for (const key of Object.keys(gameState.board)) {
      const tile = gameState.board[key];
      const { cx, cy } = worldToCanvas(tile.x, tile.y);
      if (cx + TILE_SIZE < 0 || cx > canvas.width || cy + TILE_SIZE < 0 || cy > canvas.height) continue;
      drawTile(ctx, tile, cx, cy, players);
    }

    // hover preview
    if (hoveredCell && isMyTurn && gameState.phase === 'PLACE_TILE' && gameState.currentTile) {
      const { cx, cy } = worldToCanvas(hoveredCell.x, hoveredCell.y);
      const vp = gameState.currentTile.validPlacements.find(
        p => p.x === hoveredCell.x && p.y === hoveredCell.y,
      );
      const isValid = !!vp && vp.validRotations.includes(selectedRotation);

      if (isValid) {
        drawTile(
          ctx,
          { tileDefId: gameState.currentTile.tileDefId, x: hoveredCell.x, y: hoveredCell.y, rotation: selectedRotation, meeples: [] },
          cx, cy, players, 0.65,
        );
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = 'rgba(244, 67, 54, 0.25)';
        ctx.fillRect(cx, cy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, TILE_SIZE, TILE_SIZE);
      }
    }

    // current player cursor label
    if (isMyTurn && gameState.phase === 'PLACE_MEEPLE') {
      ctx.fillStyle = 'rgba(201, 169, 110, 0.9)';
      ctx.font = '12px system-ui';
      ctx.fillText('Haz clic en la ficha para colocar meeple', 10, canvas.height - 10);
    }
  }, [store, players]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight - bottomOffset;
      if (!initializedRef.current) {
        panRef.current = { x: canvas.width / 2 - TILE_SIZE / 2, y: canvas.height / 2 - TILE_SIZE / 2 };
        initializedRef.current = true;
      }
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, [draw, bottomOffset]);

  useEffect(() => { draw(); }, [draw, store.gameState, store.hoveredCell, store.selectedRotation]);

  const getCanvasXY = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = false;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - dragStartRef.current.mx;
    const dy = e.clientY - dragStartRef.current.my;

    if (!draggingRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      draggingRef.current = true;
    }

    if (draggingRef.current) {
      panRef.current = { x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy };
    }

    const { cx, cy } = getCanvasXY(e);
    const { wx, wy } = canvasToWorld(cx, cy);
    store.setHovered({ x: wx, y: wy });
    draw();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingRef.current) { draggingRef.current = false; return; }

    const { cx, cy } = getCanvasXY(e);
    const { wx, wy } = canvasToWorld(cx, cy);
    const { gameState, playerId, selectedRotation } = store;
    if (!gameState) return;

    if (gameState.phase === 'PLACE_TILE' && gameState.currentPlayerId === playerId) {
      const vp = gameState.currentTile?.validPlacements.find(p => p.x === wx && p.y === wy);
      if (vp && vp.validRotations.includes(selectedRotation)) {
        store.placeTile(wx, wy, selectedRotation);
      }
    } else if (gameState.phase === 'PLACE_MEEPLE' && gameState.currentPlayerId === playerId) {
      store.placeMeeple('normal');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // pan with scroll
    panRef.current = { x: panRef.current.x - e.deltaX, y: panRef.current.y - e.deltaY };
    draw();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { store.setHovered(null); draw(); }}
      onWheel={handleWheel}
      style={{ flex: 1, display: 'block', cursor: 'crosshair', width: '100%', height: '100%' }}
    />
  );
}
