import { supabase } from './supabase';
import type { DailyLog } from '../types';

const PAGE_SIZE = 1000;

export async function insertSupplements(log: DailyLog): Promise<void> {
  if (!supabase) return;

  const rows: Array<{ date: string; supplement: string; dose: string }> = [];
  for (const [name, dose] of Object.entries(log.supplements)) {
    if (dose) {
      rows.push({ date: log.date, supplement: name, dose });
    }
  }

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('supplements')
    .upsert(rows, { onConflict: 'user_id,date,supplement' });
  if (error) {
    console.error('Failed to insert supplements to Supabase:', error.message);
  }
}

export async function fetchSupplements(): Promise<DailyLog[]> {
  if (!supabase) return [];

  const allRows: Array<{ date: string; supplement: string; dose: string }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('supplements')
      .select('date, supplement, dose')
      .order('date', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Failed to fetch supplements from Supabase:', error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Group by date into DailyLog-compatible objects
  const byDate = new Map<string, Record<string, string>>();

  for (const row of allRows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, {});
    }
    const supps = byDate.get(row.date)!;
    supps[row.supplement] = row.dose;
  }

  return Array.from(byDate.entries()).map(([date, supplements]) => {
    const total = Object.keys(supplements).length;
    const taken = Object.values(supplements).filter(Boolean).length;
    return {
      date,
      mealsLogged: 0,
      supplements,
      supplementsTaken: taken,
      supplementsTotal: total,
    };
  });
}
