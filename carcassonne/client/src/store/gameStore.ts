import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  SerializedGameState, BoardTile, MoveAnalysis, Rotation, MeepleType,
  ClientToServerEvents, ServerToClientEvents, Player
} from '@carcassonne/shared';

interface GameStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  gameId: string | null;
  playerId: string | null;
  playerName: string | null;
  gameState: SerializedGameState | null;
  analysisHistory: MoveAnalysis[];
  lastAnalysis: MoveAnalysis | null;
  selectedRotation: Rotation;
  hoveredCell: { x: number; y: number } | null;
  gameEnded: any | null;
  error: string | null;
  aiDifficulty: number;
  isConnecting: boolean;
  inGame: boolean;
  connect: () => void;
  enterGame: () => void;
  createGame: (opts: { p1Name: string }) => Promise<{ gameId: string; p1Id: string; p2Id: string }>;
  joinGame: (gameId: string, playerName: string, playerId?: string) => void;
  placeTile: (x: number, y: number, rotation?: Rotation) => void;
  placeMeeple: (type: MeepleType, featureIndex?: number, farmIndex?: number) => void;
  skipMeeple: () => void;
  requestAiMove: () => void;
  setRotation: (r: Rotation) => void;
  rotateRight: () => void;
  setHovered: (cell: { x: number; y: number } | null) => void;
  setAiDifficulty: (d: number) => void;
  clearError: () => void;
  leaveGame: () => void;
}

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameId: null,
  playerId: null,
  playerName: null,
  gameState: null,
  analysisHistory: [],
  lastAnalysis: null,
  selectedRotation: 0,
  hoveredCell: null,
  gameEnded: null,
  error: null,
  aiDifficulty: 3,
  isConnecting: false,
  inGame: false,

  connect: () => {
    if (get().socket?.connected) return;
    set({ isConnecting: true });
    const socket = io({ transports: ['websocket'] });
    socket.on('connect', () => set({ isConnecting: false }));
    socket.on('disconnect', () => set({ isConnecting: false }));
    socket.on('game_state', (state) => set({ gameState: state }));
    socket.on('move_result', ({ success, error }) => {
      if (!success) set({ error: error ?? 'Error desconocido' });
    });
    socket.on('analysis_update', (analysis) => {
      set(s => ({ lastAnalysis: analysis, analysisHistory: [analysis, ...s.analysisHistory].slice(0, 100) }));
    });
    socket.on('game_ended', (result) => set({ gameEnded: result }));
    set({ socket });
  },

  createGame: async ({ p1Name }) => {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1Name: p1Name }),
    });
    const data = await res.json();
    set({ gameId: data.gameId, playerId: data.p1Id, playerName: p1Name, gameState: data.state, gameEnded: null, analysisHistory: [], lastAnalysis: null });
    return { gameId: data.gameId, p1Id: data.p1Id as string, p2Id: data.p2Id as string };
  },

  joinGame: (gameId, playerName, playerId?: string) => {
    const { socket } = get();
    if (!socket) return;
    if (playerId) set({ gameId, playerName, playerId });
    else set({ gameId, playerName });
    socket.emit('join_game', { gameId, playerName, playerId } as any);
  },

  placeTile: (x, y, rotation?) => {
    const { socket, gameId, selectedRotation } = get();
    if (!socket || !gameId) return;
    socket.emit('place_tile', { gameId, x, y, rotation: rotation ?? selectedRotation });
  },

  placeMeeple: (type, featureIndex, farmIndex) => {
    const { socket, gameId } = get();
    if (!socket || !gameId) return;
    socket.emit('place_meeple', { gameId, type, featureIndex, farmIndex });
  },

  skipMeeple: () => {
    const { socket, gameId } = get();
    if (!socket || !gameId) return;
    socket.emit('skip_meeple', { gameId });
  },

  requestAiMove: () => {
    const { socket, gameId, aiDifficulty } = get();
    if (!socket || !gameId) return;
    socket.emit('request_ai_move', { gameId, difficulty: aiDifficulty });
  },

  enterGame: () => set({ inGame: true }),
  setRotation: (r) => set({ selectedRotation: r }),
  rotateRight: () => {
    const { selectedRotation } = get();
    const idx = ROTATIONS.indexOf(selectedRotation);
    set({ selectedRotation: ROTATIONS[(idx + 1) % 4] });
  },
  setHovered: (cell) => set({ hoveredCell: cell }),
  setAiDifficulty: (d) => set({ aiDifficulty: d }),
  clearError: () => set({ error: null }),
  leaveGame: () => set({ gameId: null, playerId: null, playerName: null, gameState: null, gameEnded: null, analysisHistory: [], lastAnalysis: null, selectedRotation: 0, hoveredCell: null, error: null, inGame: false }),
}));
