// Tile definitions and deck management for Carcassonne

export type EdgeType = 'C' | 'R' | 'F';

export interface TileDef {
  id: string;
  edges: [EdgeType, EdgeType, EdgeType, EdgeType]; // [N, E, S, W]
  monastery?: boolean;
}

// All distinct tile type definitions
const TILE_DEFS: TileDef[] = [
  // All field — monastery tile
  { id: 'FFFF', edges: ['F', 'F', 'F', 'F'], monastery: true },

  // City tiles
  { id: 'CCCC', edges: ['C', 'C', 'C', 'C'] },
  { id: 'CCCF', edges: ['C', 'C', 'C', 'F'] },
  { id: 'CCFF', edges: ['C', 'C', 'F', 'F'] },
  { id: 'CFCF', edges: ['C', 'F', 'C', 'F'] },
  { id: 'CFFF', edges: ['C', 'F', 'F', 'F'] },
  { id: 'FCFF', edges: ['F', 'C', 'F', 'F'] },
  { id: 'FFCF', edges: ['F', 'F', 'C', 'F'] },
  { id: 'FFFC', edges: ['F', 'F', 'F', 'C'] },  // city on W
  { id: 'FCFC', edges: ['F', 'C', 'F', 'C'] },

  // Road + city tiles
  { id: 'CRRF', edges: ['C', 'R', 'R', 'F'] }, // city N, road E/S curve, field W
  { id: 'CFFR', edges: ['C', 'F', 'F', 'R'] }, // city N, field E/S, road W
  { id: 'CRFR', edges: ['C', 'R', 'F', 'R'] }, // city N, road E/W, field S
  { id: 'CFRR', edges: ['C', 'F', 'R', 'R'] }, // city N, field E, road S/W

  // Road tiles
  { id: 'RFRF', edges: ['R', 'F', 'R', 'F'] }, // road N/S straight
  { id: 'FRRR', edges: ['F', 'R', 'R', 'R'] }, // T-junction: road E/S/W
  { id: 'RFRR', edges: ['R', 'F', 'R', 'R'] }, // road N, field E, road S/W
  { id: 'RRRR', edges: ['R', 'R', 'R', 'R'] }, // X-junction
  { id: 'RRRF', edges: ['R', 'R', 'R', 'F'] }, // road N/E/S, field W
  { id: 'FFFR', edges: ['F', 'F', 'F', 'R'] }, // field N/E/S, road W (dead end)
  { id: 'FFRR', edges: ['F', 'F', 'R', 'R'] }, // field N/E, road S/W (curve)
  { id: 'FRRF', edges: ['F', 'R', 'R', 'F'] }, // field N/W, road E/S (curve)
];

// Map for fast lookup
const TILE_DEF_MAP = new Map<string, TileDef>(TILE_DEFS.map(t => [t.id, t]));

export function getTileDef(id: string): TileDef | undefined {
  return TILE_DEF_MAP.get(id);
}

// Deck counts: (id, count) pairs; total ~52 tiles
const DECK_COUNTS: [string, number][] = [
  ['FFFF', 4],   // monastery — 4 copies
  ['CCCC', 1],
  ['CCCF', 3],
  ['CCFF', 2],
  ['CFCF', 1],
  ['CFFF', 5],
  ['FCFF', 2],
  ['FFCF', 2],
  ['FFFC', 2],
  ['FCFC', 1],
  ['CRRF', 3],
  ['CFFR', 2],
  ['CRFR', 2],
  ['CFRR', 2],
  ['RFRF', 8],   // straight road — most common
  ['FRRR', 3],
  ['RFRR', 3],
  ['RRRR', 1],
  ['RRRF', 3],
  ['FFFR', 3],
  ['FFRR', 4],
  ['FRRF', 3],
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
