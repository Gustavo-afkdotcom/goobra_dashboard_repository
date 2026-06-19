import { supabase } from './supabase';

export interface DbMoveAnalysis {
  id: string;
  move_id: string;
  game_id: string;
  player_id: string;
  turn_number: number;
  player_move_score: number;
  best_move_score: number;
  best_move_json: string;
  accuracy: number;
  label: string;
  explanation: string;
  computed_at: number;
}

export async function insertAnalysis(analysis: DbMoveAnalysis): Promise<void> {
  const { error } = await supabase.from('move_analysis').insert(analysis);
  if (error) throw error;
}

export async function getAnalysisForGame(gameId: string): Promise<DbMoveAnalysis[]> {
  const { data, error } = await supabase
    .from('move_analysis')
    .select('*')
    .eq('game_id', gameId)
    .order('turn_number', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbMoveAnalysis[];
}

export async function getPlayerAccuracyStats(playerId: string): Promise<{
  avgAccuracy: number;
  totalMoves: number;
  brilliantCount: number;
  blunderCount: number;
}> {
  const { data, error } = await supabase
    .from('move_analysis')
    .select('accuracy, label')
    .eq('player_id', playerId);

  if (error) throw error;
  if (!data || data.length === 0) {
    return { avgAccuracy: 0, totalMoves: 0, brilliantCount: 0, blunderCount: 0 };
  }

  const totalMoves = data.length;
  const avgAccuracy = data.reduce((sum, r) => sum + Number(r.accuracy), 0) / totalMoves;
  const brilliantCount = data.filter(r => r.label === 'brilliant').length;
  const blunderCount = data.filter(r => r.label === 'blunder').length;

  return { avgAccuracy: Math.round(avgAccuracy * 10) / 10, totalMoves, brilliantCount, blunderCount };
}
