import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import * as db from './db/index.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SerializedGameState,
  Rotation,
  MeepleType,
} from '@carcassonne/shared';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

interface Room {
  state: SerializedGameState;
  p1Id: string;
  p2Id: string;
  aiDifficulty?: number;
}

// Active game rooms keyed by gameId
const rooms = new Map<string, Room>();

// ---------------------------------------------------------------------------
// HTTP routes
// ---------------------------------------------------------------------------

app.post('/api/games', async (req, res) => {
  const { player1Name, aiDifficulty } = req.body as { player1Name?: string; aiDifficulty?: number };
  const gameId = uuidv4();
  const p1Id = uuidv4();
  const p2Id = aiDifficulty ? 'ai' : uuidv4();

  try {
    await db.createGame({ id: gameId, player1Id: p1Id, player2Id: p2Id, aiDifficulty: aiDifficulty ?? null });

    const state: SerializedGameState = {
      gameId,
      board: {},
      currentTile: null, // TODO: draw first tile from shuffled deck
      currentPlayerId: p1Id,
      players: [
        { id: p1Id, name: player1Name ?? 'Player 1', color: '#4fc3f7', score: 0, meeples: 7 },
        { id: p2Id, name: aiDifficulty ? 'IA' : 'Player 2', color: '#ef9a9a', score: 0, meeples: 7, isAI: !!aiDifficulty },
      ],
      phase: 'PLACE_TILE',
      tilesRemaining: 71,
      turn: 1,
      scores: { [p1Id]: 0, [p2Id]: 0 },
      playerNames: { [p1Id]: player1Name ?? 'Player 1', [p2Id]: aiDifficulty ? 'IA' : 'Player 2' },
    };

    rooms.set(gameId, { state, p1Id, p2Id, aiDifficulty });
    res.json({ gameId, p1Id, p2Id, state });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const leaders = await db.getLeaderboard(20);
    res.json(leaders);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/games/:gameId/moves', async (req, res) => {
  try {
    const moves = await db.getMovesForGame(req.params.gameId);
    res.json(moves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moves' });
  }
});

app.get('/api/games/:gameId/analysis', async (req, res) => {
  try {
    const analysis = await db.getAnalysisForGame(req.params.gameId);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

app.get('/api/players/:playerId/stats', async (req, res) => {
  try {
    const [user, stats] = await Promise.all([
      db.getUser(req.params.playerId),
      db.getPlayerAccuracyStats(req.params.playerId),
    ]);
    res.json({ user, accuracyStats: stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// ---------------------------------------------------------------------------
// Socket.io events
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_game', async ({ gameId, playerName, playerId }) => {
    const room = rooms.get(gameId);
    if (!room) {
      socket.emit('move_result', { success: false, error: 'Game not found' });
      return;
    }

    socket.join(gameId);

    if (playerId) {
      await db.upsertUser(playerId, playerName).catch(console.error);
    }

    // Update p2 name when second human player joins
    if (playerId && playerId !== room.p1Id) {
      const p2 = room.state.players.find(p => p.id === room.p2Id);
      if (p2) p2.name = playerName;
      room.state.playerNames[room.p2Id] = playerName;
    }

    socket.emit('game_state', room.state);
    socket.to(gameId).emit('game_state', room.state);
  });

  socket.on('place_tile', async ({ gameId, x, y, rotation }) => {
    const room = rooms.get(gameId);
    if (!room) {
      socket.emit('move_result', { success: false, error: 'Game not found' });
      return;
    }

    // TODO: Validate placement with tile engine (edge matching rules)
    const tileDefId = room.state.currentTile?.tileDefId ?? 'UNKNOWN';
    room.state.board[`${x},${y}`] = { tileDefId, x, y, rotation, meeples: [] };
    room.state.phase = 'PLACE_MEEPLE';
    room.state.tilesRemaining = Math.max(0, room.state.tilesRemaining - 1);

    await db.insertMove({
      id: uuidv4(),
      game_id: gameId,
      player_id: room.state.currentPlayerId,
      turn_number: room.state.turn,
      tile_def_id: tileDefId,
      pos_x: x,
      pos_y: y,
      rotation,
      meeple_type: null,
      meeple_feature_index: null,
      meeple_farm_index: null,
      score_gained: 0,
      timestamp: new Date().toISOString(),
    }).catch(console.error);

    socket.emit('move_result', { success: true });
    io.to(gameId).emit('game_state', room.state);
  });

  socket.on('place_meeple', ({ gameId, type, featureIndex, farmIndex }) => {
    const room = rooms.get(gameId);
    if (!room) {
      socket.emit('move_result', { success: false, error: 'Game not found' });
      return;
    }

    // TODO: Validate meeple placement (feature availability, player meeple count)
    const player = room.state.players.find(p => p.id === room.state.currentPlayerId);
    if (player && player.meeples > 0) {
      player.meeples--;
      const keys = Object.keys(room.state.board);
      const lastKey = keys[keys.length - 1];
      if (lastKey) {
        room.state.board[lastKey].meeples.push({ playerId: room.state.currentPlayerId, type, featureIndex, farmIndex });
      }
    }

    advanceTurn(room, gameId);
    socket.emit('move_result', { success: true });
    io.to(gameId).emit('game_state', room.state);
  });

  socket.on('skip_meeple', ({ gameId }) => {
    const room = rooms.get(gameId);
    if (!room) {
      socket.emit('move_result', { success: false, error: 'Game not found' });
      return;
    }

    advanceTurn(room, gameId);
    socket.emit('move_result', { success: true });
    io.to(gameId).emit('game_state', room.state);
  });

  socket.on('request_ai_move', ({ gameId, difficulty }) => {
    const room = rooms.get(gameId);
    if (!room) return;
    // TODO: Implement AI tile selection based on difficulty level
    // For now just emit current state so the client shows it as AI's turn
    console.log(`AI move requested for game ${gameId}, difficulty ${difficulty}`);
    io.to(gameId).emit('game_state', room.state);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function advanceTurn(room: Room, gameId: string) {
  const { state } = room;
  const playerIds = state.players.map(p => p.id);
  const idx = playerIds.indexOf(state.currentPlayerId);
  state.currentPlayerId = playerIds[(idx + 1) % playerIds.length];
  state.phase = 'PLACE_TILE';
  state.turn++;

  // TODO: Draw next tile from deck; validate at least one valid placement exists
  // If none exists, skip to next tile or end game

  if (state.tilesRemaining === 0) {
    void endGame(room, gameId);
  }
}

async function endGame(room: Room, gameId: string) {
  const { state } = room;
  state.phase = 'GAME_OVER';

  // TODO: Calculate final farm scores (unfinished features scored at half)
  const scores: Record<string, number> = {};
  state.players.forEach(p => { scores[p.id] = state.scores[p.id] ?? p.score; });

  try {
    const result = await db.endGame({ gameId, scores });
    io.to(gameId).emit('game_ended', {
      winnerId: result.winnerId,
      scores,
      playerNames: state.playerNames,
    });
  } catch (err) {
    console.error('Error ending game:', err);
  }
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Carcassonne server listening on port ${PORT}`);
});
