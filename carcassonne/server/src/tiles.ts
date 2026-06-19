// Tile deck management for Carcassonne.
// The per-tile edge geometry lives in @carcassonne/shared (TILE_EDGES) so the
// client renderer and this server validator share one source of truth.

import { TILE_EDGES, MONASTERY_TILE_IDS, type EdgeSide } from '@carcassonne/shared';

export type EdgeType = EdgeSide;

export interface TileDef {
  id: string;
  edges: [EdgeType, EdgeType, EdgeType, EdgeType]; // [N, E, S, W]
  monastery?: boolean;
}

// Built from the shared geometry table — no rotational duplicates.
const TILE_DEFS: TileDef[] = Object.entries(TILE_EDGES).map(([id, edges]) => ({
  id,
  edges,
  monastery: MONASTERY_TILE_IDS.includes(id),
}));

// Map for fast lookup
const TILE_DEF_MAP = new Map<string, TileDef>(TILE_DEFS.map(t => [t.id, t]));

export function getTileDef(id: string): TileDef | undefined {
  return TILE_DEF_MAP.get(id);
}

// ---------------------------------------------------------------------------
// Deck counts — total exactly 72 tiles (matching the Carcassonne base game).
// ---------------------------------------------------------------------------
const DECK_COUNTS: [string, number][] = [
  ['FFFF', 2],  // monastery, no road
  ['FFRF', 2],  // monastery + road

  ['CCCC', 1],

  ['CCCF', 3],
  ['CCCR', 2],

  ['CCFF', 4],
  ['CCRR', 5],

  ['CFCF', 5],  // opposite cities (disconnected + pennant variants)

  ['CFFF', 5],
  ['CRFR', 3],
  ['CRRR', 3],
  ['CRRF', 3],
  ['CFRR', 3],
  ['CFFR', 3],
  ['CFRF', 2],

  ['RFRF', 8],  // straight road
  ['FFRR', 9],  // curve road (all 4 rotations are same physical tile)
  ['FRRR', 4],  // T-junction
  ['RRRR', 1],  // X-junction
  ['FFFR', 4],  // road dead-end
  // Total: 2+2+1+3+2+4+5+5+5+3+3+3+3+3+2+8+9+4+1+4 = 72
];

// Fisher-Yates shuffle in place
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates and returns a shuffled deck of tile IDs (with repetition per counts).
 */
export function createDeck(): string[] {
  const deck: string[] = [];
  for (const [id, count] of DECK_COUNTS) {
    for (let i = 0; i < count; i++) {
      deck.push(id);
    }
  }
  return shuffle(deck);
}
