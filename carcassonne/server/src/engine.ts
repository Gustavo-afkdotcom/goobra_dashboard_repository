// Placement validation engine for Carcassonne

import type { BoardTile, Rotation, ValidPlacement } from '@carcassonne/shared';
import type { TileDef, EdgeType } from './tiles.js';

// ---------------------------------------------------------------------------
// Edge rotation
// ---------------------------------------------------------------------------

/**
 * Rotate edges clockwise by the given rotation degrees.
 * Rotation of 90° CW: [N,E,S,W] → [W,N,E,S]
 * (What was West becomes the new North, etc.)
 */
export function rotateEdges(
  edges: [EdgeType, EdgeType, EdgeType, EdgeType],
  rotation: Rotation,
): [EdgeType, EdgeType, EdgeType, EdgeType] {
  const steps = rotation / 90;
  let e = [...edges] as [EdgeType, EdgeType, EdgeType, EdgeType];
  for (let i = 0; i < steps; i++) {
    e = [e[3], e[0], e[1], e[2]]; // W becomes N, N becomes E, E becomes S, S becomes W
  }
  return e;
}

// ---------------------------------------------------------------------------
// Adjacent cell discovery
// ---------------------------------------------------------------------------

/**
 * Returns the set of coordinate strings (e.g. "1,0") for all empty cells
 * that are orthogonally adjacent to at least one placed tile.
 * If the board is empty, returns {"0,0"} so the first tile goes at the origin.
 */
export function getAdjacentCoords(board: Record<string, BoardTile>): Set<string> {
  const result = new Set<string>();
  const keys = Object.keys(board);

  if (keys.length === 0) {
    result.add('0,0');
    return result;
  }

  const deltas = [
    [0, 1],   // N
    [1, 0],   // E
    [0, -1],  // S
    [-1, 0],  // W
  ];

  for (const key of keys) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      const nkey = `${nx},${ny}`;
      if (!board[nkey]) {
        result.add(nkey);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Edge matching
// ---------------------------------------------------------------------------

/**
 * Check whether placing `tileDef` at (x, y) with `rotation` is valid given the
 * existing board.  A placement is valid when every edge of the new tile that
 * faces an already-placed neighbour matches that neighbour's opposite edge.
 * Empty neighbour cells impose no constraint.
 */
export function edgesMatch(
  board: Record<string, BoardTile>,
  x: number,
  y: number,
  tileDef: TileDef,
  rotation: Rotation,
  getTileDef: (id: string) => TileDef | undefined,
): boolean {
  const rotated = rotateEdges(tileDef.edges, rotation);
  // [N, E, S, W] after rotation — index 0=N, 1=E, 2=S, 3=W

  // Neighbours: [coord, myEdgeIndex, theirOppositeEdgeIndex]
  const neighbours: [string, number, number][] = [
    [`${x},${y + 1}`, 0, 2],  // North neighbour — my N (0) vs their S (2)
    [`${x + 1},${y}`, 1, 3],  // East  neighbour — my E (1) vs their W (3)
    [`${x},${y - 1}`, 2, 0],  // South neighbour — my S (2) vs their N (0)
    [`${x - 1},${y}`, 3, 1],  // West  neighbour — my W (3) vs their E (1)
  ];

  for (const [nkey, myIdx, theirIdx] of neighbours) {
    const neighbour = board[nkey];
    if (!neighbour) continue; // empty cell — no constraint

    const neighbourDef = getTileDef(neighbour.tileDefId);
    if (!neighbourDef) continue; // unknown tile — skip

    const neighbourEdges = rotateEdges(neighbourDef.edges, neighbour.rotation);
    if (rotated[myIdx] !== neighbourEdges[theirIdx]) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Valid placements
// ---------------------------------------------------------------------------

const ALL_ROTATIONS: Rotation[] = [0, 90, 180, 270];

/**
 * Returns all (x, y, validRotations) combinations where `tileDef` can be
 * legally placed on the current board.
 */
export function getValidPlacements(
  board: Record<string, BoardTile>,
  tileDef: TileDef,
  getTileDefFn: (id: string) => TileDef | undefined,
): ValidPlacement[] {
  const adjacent = getAdjacentCoords(board);
  const placements: ValidPlacement[] = [];

  for (const coordStr of adjacent) {
    const [x, y] = coordStr.split(',').map(Number);
    const validRotations: Rotation[] = [];

    for (const rotation of ALL_ROTATIONS) {
      if (edgesMatch(board, x, y, tileDef, rotation, getTileDefFn)) {
        validRotations.push(rotation);
      }
    }

    if (validRotations.length > 0) {
      placements.push({ x, y, validRotations });
    }
  }

  return placements;
}
