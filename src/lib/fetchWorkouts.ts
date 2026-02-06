import { supabase } from './supabase';
import type { WorkoutSet } from '../types';

export async function insertWorkoutSets(sets: WorkoutSet[]): Promise<void> {
  if (!supabase || sets.length === 0) return;

  const rows = sets.map((s) => ({
    date: s.date,
    exercise: s.exercise,
    weight: s.weight,
    reps: s.reps,
  }));

  const { error } = await supabase.from('workouts').insert(rows);

  if (error) {
    console.error('Failed to insert workouts to Supabase:', error.message);
  }
}

const PAGE_SIZE = 1000;

export async function fetchWorkoutSets(): Promise<WorkoutSet[]> {
  if (!supabase) return [];

  const allRows: WorkoutSet[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Failed to fetch workouts from Supabase:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    allRows.push(
      ...data.map((row) => ({
        id: String(row.id),
        date: row.date,
        exercise: row.exercise,
        weight: Number(row.weight),
        reps: Number(row.reps),
      }))
    );

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}
