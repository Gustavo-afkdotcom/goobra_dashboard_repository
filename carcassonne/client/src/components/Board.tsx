import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Player } from '@carcassonne/shared';
import { drawTileGraphic } from '../render/tile';

interface Props {
  players: Player[];
  bottomOffset: number;
}

const TILE_SIZE = 76;

function getPlayerColor(playerId: string, players: Player[]): string {
  return players.find(p => p.id === playerId)?.color ?? '#fff';
}

export default function Board({ players, bottomOffset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useGameStore();
  const panRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerDownRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const worldToCanvas = (wx: number, wy: number) => ({
    cx: wx * TILE_SIZE + panRef.current.x,
    cy: wy * TILE_SIZE + panRef.current.y,
  });

  const canvasToWorld = (cx: number, cy: number) => ({
    wx: Math.floor((cx - panRef.current.x) / TILE_SIZE),
    wy: Math.floor((cy - panRef.current.y) / TILE_SIZE),
  });

  const drawMeeples = (
    ctx: CanvasRenderingContext2D,
    meeples: { playerId: string }[],
    cx: number,
    cy: number,
  ) => {
    meeples.forEach((m, i) => {
      const mx = cx + TILE_SIZE / 2 + (i - (meeples.length - 1) / 2) * 14;
      const my = cy + TILE_SIZE / 2;
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = getPlayerColor(m.playerId, players);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

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

    // faint grid
    ctx.strokeStyle = '#1d1d3a';
    ctx.lineWidth = 1;
    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        const { cx, cy } = worldToCanvas(gx, gy);
        ctx.strokeRect(cx + 0.5, cy + 0.5, TILE_SIZE, TILE_SIZE);
      }
    }

    const isMyTurn = gameState.currentPlayerId === playerId;
    const placing = isMyTurn && gameState.phase === 'PLACE_TILE' && gameState.currentTile;

    // bright valid-placement markers
    if (placing) {
      for (const vp of gameState.currentTile!.validPlacements) {
        const { cx, cy } = worldToCanvas(vp.x, vp.y);
        if (cx + TILE_SIZE < 0 || cx > canvas.width || cy + TILE_SIZE < 0 || cy > canvas.height) continue;
        ctx.fillStyle = 'rgba(90, 210, 130, 0.18)';
        ctx.fillRect(cx + 2, cy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = '#5fd07a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(cx + 3, cy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.setLineDash([]);
        // plus marker
        ctx.strokeStyle = 'rgba(150, 255, 190, 0.8)';
        ctx.lineWidth = 2;
        const mx = cx + TILE_SIZE / 2, my = cy + TILE_SIZE / 2;
        ctx.beginPath();
        ctx.moveTo(mx - 8, my); ctx.lineTo(mx + 8, my);
        ctx.moveTo(mx, my - 8); ctx.lineTo(mx, my + 8);
        ctx.stroke();
      }
    }

    // placed tiles
    for (const key of Object.keys(gameState.board)) {
      const tile = gameState.board[key];
      const { cx, cy } = worldToCanvas(tile.x, tile.y);
      if (cx + TILE_SIZE < 0 || cx > canvas.width || cy + TILE_SIZE < 0 || cy > canvas.height) continue;
      drawTileGraphic(ctx, tile.tileDefId, tile.rotation, cx, cy, TILE_SIZE);
      drawMeeples(ctx, tile.meeples ?? [], cx, cy);
    }

    // ghost preview under the cursor
    if (placing && hoveredCell) {
      const vp = gameState.currentTile!.validPlacements.find(
        p => p.x === hoveredCell.x && p.y === hoveredCell.y,
      );
      const { cx, cy } = worldToCanvas(hoveredCell.x, hoveredCell.y);
      if (vp) {
        const rot = vp.validRotations.includes(selectedRotation) ? selectedRotation : vp.validRotations[0];
        drawTileGraphic(ctx, gameState.currentTile!.tileDefId, rot, cx, cy, TILE_SIZE, 0.8);
        ctx.strokeStyle = '#7CFFB0';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx + 1.5, cy + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
      }
    }
  }, [store, players]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = (parent?.clientWidth ?? canvas.offsetWidth);
      canvas.height = (parent?.clientHeight ?? canvas.offsetHeight) - bottomOffset;
      if (!initializedRef.current && canvas.width > 0) {
        panRef.current = { x: canvas.width / 2 - TILE_SIZE / 2, y: canvas.height / 2 - TILE_SIZE / 2 };
        initializedRef.current = true;
      }
      draw();
    };
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();
    return () => ro.disconnect();
  }, [draw, bottomOffset]);

  useEffect(() => { draw(); }, [draw, store.gameState, store.hoveredCell, store.selectedRotation]);

  const getCanvasXY = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    draggingRef.current = false;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
    canvasRef.current?.setPointerCapture(e.pointerId);
    // show ghost immediately for touch (no hover)
    const { cx, cy } = getCanvasXY(e);
    const w = canvasToWorld(cx, cy);
    store.setHovered({ x: w.wx, y: w.wy });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const moving = pointerDownRef.current;
    if (moving) {
      const dx = e.clientX - dragStartRef.current.mx;
      const dy = e.clientY - dragStartRef.current.my;
      if (!draggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) draggingRef.current = true;
      if (draggingRef.current) {
        panRef.current = { x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy };
      }
    }
    const { cx, cy } = getCanvasXY(e);
    const w = canvasToWorld(cx, cy);
    store.setHovered({ x: w.wx, y: w.wy });
    draw();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointerDownRef.current = false;
    if (draggingRef.current) { draggingRef.current = false; return; }

    const { cx, cy } = getCanvasXY(e);
    const { wx, wy } = canvasToWorld(cx, cy);
    const { gameState, playerId, selectedRotation } = store;
    if (!gameState || gameState.currentPlayerId !== playerId) return;

    if (gameState.phase === 'PLACE_TILE') {
      const vp = gameState.currentTile?.validPlacements.find(p => p.x === wx && p.y === wy);
      if (vp) {
        // Always succeed on a highlighted cell: keep the chosen rotation if it
        // is legal here, otherwise snap to the first legal one.
        const rot = vp.validRotations.includes(selectedRotation) ? selectedRotation : vp.validRotations[0];
        if (rot !== selectedRotation) store.setRotation(rot);
        store.placeTile(wx, wy, rot);
      }
    }
    // Meeple placement is driven by the HUD buttons.
  };

  const handleWheel = (e: React.WheelEvent) => {
    panRef.current = { x: panRef.current.x - e.deltaX, y: panRef.current.y - e.deltaY };
    draw();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { pointerDownRef.current = false; store.setHovered(null); draw(); }}
      onWheel={handleWheel}
      style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%', height: '100%' }}
    />
  );
}
