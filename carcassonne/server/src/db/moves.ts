import { supabase } from './supabase';

export interface DbMove {
  id: string;
  game_id: string;
  player_id: string;
  turn_number: number;
  tile_def_id: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  meeple_type: string | null;
  meeple_feature_index: number | null;
  meeple_farm_index: number | null;
  score_gained: number;
  timestamp: number;
}

export async function insertMove(move: DbMove): Promise<void> {
  const { error } = await supabase.from('moves').insert(move);
  if (error) throw error;
}

export async function getMovesForGame(gameId: string): Promise<DbMove[]> {
  const { data, error } = await supabase
    .from('moves')
    .select('*')
    .eq('game_id', gameId)
    .order('turn_number', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbMove[];
}
