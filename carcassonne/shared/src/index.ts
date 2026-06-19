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
