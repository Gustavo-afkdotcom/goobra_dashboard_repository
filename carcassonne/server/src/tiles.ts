// Tile definitions and deck management for Carcassonne

export type EdgeType = 'C' | 'R' | 'F';

export interface TileDef {
  id: string;
  edges: [EdgeType, EdgeType, EdgeType, EdgeType]; // [N, E, S, W]
  monastery?: boolean;
}

// ---------------------------------------------------------------------------
// Distinct tile types — no rotational duplicates.
// The engine applies rotation at placement time, so CFFF with rotation=90
// already gives city-East. FCFF, FFCF, FFFC are NOT separate tile types.
// ---------------------------------------------------------------------------
const TILE_DEFS: TileDef[] = [
  // Monasteries
  { id: 'FFFF', edges: ['F', 'F', 'F', 'F'], monastery: true }, // monastery, all fields
  { id: 'FFRF', edges: ['F', 'F', 'R', 'F'], monastery: true }, // monastery + road south

  // Full city
  { id: 'CCCC', edges: ['C', 'C', 'C', 'C'] },

  // Three-sided city (city N/E/S, field W — rotate for any orientation)
  { id: 'CCCF', edges: ['C', 'C', 'C', 'F'] },
  // Three-sided city + road on open side
  { id: 'CCCR', edges: ['C', 'C', 'C', 'R'] },

  // Two-sided city, adjacent corner (city N/E, fields S/W)
  { id: 'CCFF', edges: ['C', 'C', 'F', 'F'] },
  // Two-sided city, adjacent corner + road curve on field sides
  { id: 'CCRR', edges: ['C', 'C', 'R', 'R'] },

  // Two-sided city, opposite faces (city N/S, fields E/W — not connected)
  { id: 'CFCF', edges: ['C', 'F', 'C', 'F'] },

  // Single city face (city N, fields E/S/W)
  { id: 'CFFF', edges: ['C', 'F', 'F', 'F'] },
  // Single city + straight road through (city N, road E/W)
  { id: 'CRFR', edges: ['C', 'R', 'F', 'R'] },
  // Single city + T-road (city N, road E/S/W)
  { id: 'CRRR', edges: ['C', 'R', 'R', 'R'] },
  // Single city + road curve (city N, road E→S)
  { id: 'CRRF', edges: ['C', 'R', 'R', 'F'] },
  // Single city + road curve other direction (city N, road S→W)
  { id: 'CFRR', edges: ['C', 'F', 'R', 'R'] },
  // Single city + road dead-end on W
  { id: 'CFFR', edges: ['C', 'F', 'F', 'R'] },
  // Single city + road dead-end on S
  { id: 'CFRF', edges: ['C', 'F', 'R', 'F'] },

  // Pure road tiles
  { id: 'RFRF', edges: ['R', 'F', 'R', 'F'] }, // straight road N↔S
  { id: 'FFRR', edges: ['F', 'F', 'R', 'R'] }, // curve road S→W
  { id: 'FRRR', edges: ['F', 'R', 'R', 'R'] }, // T-junction (field N, roads E/S/W)
  { id: 'RRRR', edges: ['R', 'R', 'R', 'R'] }, // X-junction
  { id: 'FFFR', edges: ['F', 'F', 'F', 'R'] }, // dead-end road W
];

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
