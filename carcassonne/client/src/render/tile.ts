// Canvas drawing for a single Carcassonne tile.
// Used by both the board (placed tiles + ghost preview) and the HUD (current
// tile preview), so the player always sees exactly what they are placing.

import { TILE_EDGES, MONASTERY_TILE_IDS, rotateTileEdges } from '@carcassonne/shared';
import type { EdgeSide } from '@carcassonne/shared';

const FIELD = '#5a8c43';
const FIELD_ALT = '#4f7d3b';
const CITY = '#caa46a';
const CITY_BORDER = '#8a6a38';
const ROAD = '#efe7d0';
const ROAD_BORDER = '#5b5036';

/**
 * Draw a tile's terrain (fields, cities, roads, monastery) into the given
 * context at (px, py) spanning `size` pixels, with `rotation` applied.
 */
export function drawTileGraphic(
  ctx: CanvasRenderingContext2D,
  tileDefId: string,
  rotation: number,
  px: number,
  py: number,
  size: number,
  alpha = 1,
) {
  const base = TILE_EDGES[tileDefId];
  if (!base) {
    // Unknown tile — fall back to a plain field square.
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = FIELD;
    ctx.fillRect(px, py, size, size);
    ctx.restore();
    return;
  }

  const e = rotateTileEdges(base, rotation); // [N, E, S, W]
  ctx.save();
  ctx.globalAlpha = alpha;

  // Field base (two-tone so adjacent field tiles are still distinguishable)
  ctx.fillStyle = ((px + py) & 64) ? FIELD : FIELD_ALT;
  ctx.fillRect(px, py, size, size);

  // Cities: a block reaching inward from each city edge
  const depth = size * 0.36;
  ctx.fillStyle = CITY;
  ctx.strokeStyle = CITY_BORDER;
  ctx.lineWidth = 1;
  const cityRects: [number, number, number, number][] = [];
  if (e[0] === 'C') cityRects.push([px, py, size, depth]);                 // N
  if (e[1] === 'C') cityRects.push([px + size - depth, py, depth, size]);  // E
  if (e[2] === 'C') cityRects.push([px, py + size - depth, size, depth]);  // S
  if (e[3] === 'C') cityRects.push([px, py, depth, size]);                 // W
  for (const [rx, ry, rw, rh] of cityRects) {
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
  }

  // Roads: a segment from the tile centre to each road edge
  const cx = px + size / 2;
  const cy = py + size / 2;
  const mids: [number, number][] = [
    [px + size / 2, py],          // N
    [px + size, py + size / 2],   // E
    [px + size / 2, py + size],   // S
    [px, py + size / 2],          // W
  ];
  const roadDirs = [0, 1, 2, 3].filter(i => e[i] === 'R');
  if (roadDirs.length > 0) {
    ctx.lineCap = 'round';
    // dark border pass
    ctx.strokeStyle = ROAD_BORDER;
    ctx.lineWidth = Math.max(4, size * 0.2);
    ctx.beginPath();
    for (const i of roadDirs) { ctx.moveTo(cx, cy); ctx.lineTo(mids[i][0], mids[i][1]); }
    ctx.stroke();
    // light surface pass
    ctx.strokeStyle = ROAD;
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.beginPath();
    for (const i of roadDirs) { ctx.moveTo(cx, cy); ctx.lineTo(mids[i][0], mids[i][1]); }
    ctx.stroke();
  }

  // Monastery building in the centre
  if (MONASTERY_TILE_IDS.includes(tileDefId)) {
    const b = size * 0.26;
    ctx.fillStyle = '#9c4b2e';
    ctx.fillRect(cx - b / 2, cy - b / 2, b, b);
    ctx.fillStyle = '#7a3722';
    ctx.beginPath();
    ctx.moveTo(cx - b / 2 - 2, cy - b / 2);
    ctx.lineTo(cx, cy - b / 2 - b * 0.6);
    ctx.lineTo(cx + b / 2 + 2, cy - b / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Tile outline
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

  ctx.restore();
}

export type { EdgeSide };
