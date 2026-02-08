import { supabase } from './supabase';
import type { DailyLog } from '../types';

const PAGE_SIZE = 1000;

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export async function insertSleep(log: DailyLog): Promise<void> {
  if (!supabase) return;
  if (!log.sleepDuration && !log.sleepScore && !log.wakeTime) return;

  const row: Record<string, unknown> = { date: log.date };
  if (log.sleepDuration) row.duration_hours = minutesToTime(log.sleepDuration);
  if (log.sleepScore) row.quality = String(log.sleepScore);
  if (log.wakeTime) row.wake_time = log.wakeTime;

  const { error } = await supabase.from('sleep').insert(row);
  if (error) {
    console.error('Failed to insert sleep to Supabase:', error.message);
  }
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
