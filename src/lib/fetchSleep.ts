import { supabase } from './supabase';
import type { DailyLog } from '../types';

const PAGE_SIZE = 1000;

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export async function fetchSleep(): Promise<DailyLog[]> {
  if (!supabase) return [];

  const allRows: Array<{
    date: string;
    wake_time: string | null;
    duration_hours: string | null;
    quality: string | null;
  }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('sleep')
      .select('date, wake_time, duration_hours, quality')
      .order('date', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Failed to fetch sleep from Supabase:', error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows.map((row) => ({
    date: row.date,
    sleepDuration: row.duration_hours ? timeToMinutes(row.duration_hours) : undefined,
    sleepScore: row.quality ? parseInt(row.quality, 10) : undefined,
    wakeTime: row.wake_time ?? undefined,
    mealsLogged: 0,
    supplements: {},
    supplementsTaken: 0,
    supplementsTotal: 0,
  }));
}
