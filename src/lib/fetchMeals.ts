import { supabase } from './supabase';
import type { DailyLog } from '../types';

const PAGE_SIZE = 1000;

export async function fetchMeals(): Promise<DailyLog[]> {
  if (!supabase) return [];

  const allRows: Array<{ date: string; meal_type: string; food: string }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('meals')
      .select('date, meal_type, food')
      .order('date', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Failed to fetch meals from Supabase:', error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Group by date into DailyLog-compatible objects
  const byDate = new Map<string, Partial<DailyLog>>();

  for (const row of allRows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date });
    }
    const entry = byDate.get(row.date)!;
    const type = row.meal_type?.toLowerCase().trim();

    if (type === 'meal 1' || type === 'breakfast') {
      entry.meal1 = row.food;
    } else if (type === 'meal 2' || type === 'lunch') {
      entry.meal2 = row.food;
    } else if (type === 'meal 3' || type === 'dinner') {
      entry.meal3 = row.food;
    } else if (type === 'snack' || type === 'snacks') {
      entry.snacks = entry.snacks ? `${entry.snacks}, ${row.food}` : row.food;
    }
  }

  return Array.from(byDate.values()).map((entry) => ({
    date: entry.date!,
    meal1: entry.meal1,
    meal2: entry.meal2,
    meal3: entry.meal3,
    snacks: entry.snacks,
    mealsLogged: [entry.meal1, entry.meal2, entry.meal3].filter(Boolean).length,
    supplements: {},
    supplementsTaken: 0,
    supplementsTotal: 0,
  }));
}
