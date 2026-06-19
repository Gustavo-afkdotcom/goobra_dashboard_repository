import { supabase } from './supabase';

export interface DbUser {
  id: string;
  name: string;
  elo: number;
  games_played: number;
  games_won: number;
  created_at: number;
}

export async function upsertUser(id: string, name: string): Promise<DbUser> {
  const now = Date.now();

  const { data, error } = await supabase
    .from('users')
    .upsert({ id, name, created_at: now }, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) throw error;
  return data as DbUser;
}

export async function getUser(id: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DbUser | null;
}

export async function updateUserElo(
  id: string,
  eloAfter: number,
  won: boolean
): Promise<void> {
  const user = await getUser(id);
  if (!user) return;

  const { error } = await supabase
    .from('users')
    .update({
      elo: eloAfter,
      games_played: user.games_played + 1,
      games_won: user.games_won + (won ? 1 : 0),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getLeaderboard(limit = 20): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('elo', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as DbUser[];
}
