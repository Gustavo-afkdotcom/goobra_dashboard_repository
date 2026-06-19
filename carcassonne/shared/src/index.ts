export type Rotation = 0 | 90 | 180 | 270;
export type MeepleType = 'normal' | 'big' | 'farmer';
export type GamePhase = 'PLACE_TILE' | 'PLACE_MEEPLE' | 'GAME_OVER';
export type AnalysisLabel = 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  meeples: number;
  isAI?: boolean;
}

export interface MeepleOnTile {
  playerId: string;
  type: MeepleType;
  featureIndex?: number;
  farmIndex?: number;
}

export interface BoardTile {
  tileDefId: string;
  x: number;
  y: number;
  rotation: Rotation;
  meeples: MeepleOnTile[];
}

export interface ValidPlacement {
  x: number;
  y: number;
  validRotations: Rotation[];
}

export interface CurrentTile {
  tileDefId: string;
  validPlacements: ValidPlacement[];
}

export interface MoveAnalysis {
  playerId: string;
  turnNumber: number;
  playerMoveScore: number;
  bestMoveScore: number;
  accuracy: number;
  label: AnalysisLabel;
  explanation: string;
  bestMoveSummary?: string;
}

export interface SerializedGameState {
  gameId: string;
  board: Record<string, BoardTile>;
  currentTile: CurrentTile | null;
  currentPlayerId: string;
  players: Player[];
  phase: GamePhase;
  tilesRemaining: number;
  turn: number;
  scores: Record<string, number>;
  playerNames: Record<string, string>;
}

export interface ClientToServerEvents {
  join_game: (data: { gameId: string; playerName: string; playerId?: string }) => void;
  place_tile: (data: { gameId: string; x: number; y: number; rotation: Rotation }) => void;
  place_meeple: (data: { gameId: string; type: MeepleType; featureIndex?: number; farmIndex?: number }) => void;
  skip_meeple: (data: { gameId: string }) => void;
  request_ai_move: (data: { gameId: string; difficulty: number }) => void;
}

export interface ServerToClientEvents {
  game_state: (state: SerializedGameState) => void;
  move_result: (result: { success: boolean; error?: string }) => void;
  analysis_update: (analysis: MoveAnalysis) => void;
  game_ended: (result: { winnerId: string | null; scores: Record<string, number>; playerNames: Record<string, string> }) => void;
}

// ---------------------------------------------------------------------------
// Tile geometry — single source of truth shared by client (rendering) and
// server (placement validation). Each tile's edges are [N, E, S, W] where:
//   'C' = city, 'R' = road, 'F' = field.
// ---------------------------------------------------------------------------
export type EdgeSide = 'C' | 'R' | 'F';
export type TileEdges = [EdgeSide, EdgeSide, EdgeSide, EdgeSide];

export const TILE_EDGES: Record<string, TileEdges> = {
  // Monasteries
  FFFF: ['F', 'F', 'F', 'F'],
  FFRF: ['F', 'F', 'R', 'F'],
  // Cities
  CCCC: ['C', 'C', 'C', 'C'],
  CCCF: ['C', 'C', 'C', 'F'],
  CCCR: ['C', 'C', 'C', 'R'],
  CCFF: ['C', 'C', 'F', 'F'],
  CCRR: ['C', 'C', 'R', 'R'],
  CFCF: ['C', 'F', 'C', 'F'],
  CFFF: ['C', 'F', 'F', 'F'],
  CRFR: ['C', 'R', 'F', 'R'],
  CRRR: ['C', 'R', 'R', 'R'],
  CRRF: ['C', 'R', 'R', 'F'],
  CFRR: ['C', 'F', 'R', 'R'],
  CFFR: ['C', 'F', 'F', 'R'],
  CFRF: ['C', 'F', 'R', 'F'],
  // Roads
  RFRF: ['R', 'F', 'R', 'F'],
  FFRR: ['F', 'F', 'R', 'R'],
  FRRR: ['F', 'R', 'R', 'R'],
  RRRR: ['R', 'R', 'R', 'R'],
  FFFR: ['F', 'F', 'F', 'R'],
};

export const MONASTERY_TILE_IDS = ['FFFF', 'FFRF'];

/** Rotate a tile's edges clockwise. 90° CW: [N,E,S,W] -> [W,N,E,S]. */
export function rotateTileEdges(edges: TileEdges, rotation: number): TileEdges {
  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  let e: TileEdges = [...edges] as TileEdges;
  for (let i = 0; i < steps; i++) e = [e[3], e[0], e[1], e[2]];
  return e;
}
