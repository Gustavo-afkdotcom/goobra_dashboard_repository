import { supabase } from './supabase';
import { updateUserElo, getUser } from './users';
import { calculateEloForScores } from './elo';

export interface DbGame {
  id: string;
  player1_id: string;
  player2_id: string | null;
  ai_difficulty: number | null;
  winner_id: string | null;
  started_at: number;
  ended_at: number | null;
  duration_seconds: number | null;
  tile_sequence: string[];
}

export async function createGame(opts: {
  id: string;
  player1Id: string;
  player2Id: string | null;
  aiDifficulty?: number;
  tileSequence?: string[];
}): Promise<void> {
  const { error } = await supabase.from('games').insert({
    id: opts.id,
    player1_id: opts.player1Id,
    player2_id: opts.player2Id,
    ai_difficulty: opts.aiDifficulty ?? null,
    started_at: Date.now(),
    tile_sequence: opts.tileSequence ?? [],
  });

  if (error) throw error;
}

export async function endGame(opts: {
  gameId: string;
  scores: Record<string, number>;
  tileSequence?: string[];
}): Promise<{ winnerId: string | null }> {
  const { gameId, scores, tileSequence } = opts;

  const { data: game, error: fetchErr } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (fetchErr) throw fetchErr;

  const now = Date.now();
  const durationSeconds = Math.round((now - game.started_at) / 1000);

  // Only apply ELO for human vs human
  let winnerId: string | null = null;
  if (game.player2_id && !game.ai_difficulty) {
    const [p1, p2] = await Promise.all([
      getUser(game.player1_id),
      getUser(game.player2_id),
    ]);

    if (p1 && p2) {
      const result = calculateEloForScores(
        { id: p1.id, elo: p1.elo, score: scores[p1.id] ?? 0 },
        { id: p2.id, elo: p2.elo, score: scores[p2.id] ?? 0 }
      );

      winnerId = result.winnerId;

      await Promise.all([
        updateUserElo(p1.id, result.player1.eloAfter, winnerId === p1.id),
        updateUserElo(p2.id, result.player2.eloAfter, winnerId === p2.id),
        supabase.from('game_players').upsert([
          {
            game_id: gameId,
            player_id: p1.id,
            final_score: scores[p1.id] ?? 0,
            elo_before: result.player1.eloBefore,
            elo_after: result.player1.eloAfter,
            color: '',
          },
          {
            game_id: gameId,
            player_id: p2.id,
            final_score: scores[p2.id] ?? 0,
            elo_before: result.player2.eloBefore,
            elo_after: result.player2.eloAfter,
            color: '',
          },
        ]),
      ]);
    }
  } else if (game.player2_id) {
    // vs AI — just record winner by score
    const p1Score = scores[game.player1_id] ?? 0;
    const aiScore = scores[game.player2_id] ?? 0;
    winnerId = p1Score > aiScore ? game.player1_id : game.player2_id;
  }

  const { error: updateErr } = await supabase
    .from('games')
    .update({
      winner_id: winnerId,
      ended_at: now,
      duration_seconds: durationSeconds,
      ...(tileSequence ? { tile_sequence: tileSequence } : {}),
    })
    .eq('id', gameId);

  if (updateErr) throw updateErr;

  return { winnerId };
}
