import Papa from 'papaparse';
import type { WorkoutSet, Workout, WorkoutCSVMapping, DailyLog, LifestyleCSVMapping } from '../types';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function mapCSVToSets(
  rows: Record<string, string>[],
  mapping: WorkoutCSVMapping,
  existingSets: WorkoutSet[]
): WorkoutSet[] {
  const existingIds = new Set(
    existingSets.map((s) => `${s.date}-${s.exercise}-${s.weight}-${s.reps}`)
  );
  const newSets: WorkoutSet[] = [];

  for (const row of rows) {
    const dateValue = row[mapping.date];
    const exerciseValue = row[mapping.exercise];
    const weightValue = row[mapping.weight];
    const repsValue = row[mapping.reps];

    if (!dateValue || !exerciseValue) continue;

    const date = normalizeDate(dateValue);
    if (!date) continue;

    const weight = parseNumber(weightValue) || 0;
    const reps = parseNumber(repsValue) || 0;

    const uniqueKey = `${date}-${exerciseValue}-${weight}-${reps}`;
    if (existingIds.has(uniqueKey)) continue;

    const set: WorkoutSet = {
      id: generateId(date, exerciseValue, weight, reps),
      date,
      exercise: exerciseValue,
      weight,
      reps,
    };

    newSets.push(set);
    existingIds.add(uniqueKey);
  }

  return newSets;
}

export function mapCSVToLifestyleLogs(
  rows: Record<string, string>[],
  mapping: LifestyleCSVMapping,
  existingLogs: DailyLog[]
): DailyLog[] {
  const existingDates = new Set(existingLogs.map((l) => l.date));
  const newLogs: DailyLog[] = [];

  for (const row of rows) {
    const dateValue = row[mapping.date];
    if (!dateValue) continue;

    const date = normalizeDate(dateValue);
    if (!date || existingDates.has(date)) continue;

    // Parse sleep data
    const sleepDuration = mapping.sleepDuration
      ? parseDuration(row[mapping.sleepDuration])
      : undefined;
    const sleepScore = mapping.sleepScore
      ? parseNumber(row[mapping.sleepScore])
      : undefined;
    const wakeTime = mapping.wakeTime ? row[mapping.wakeTime] : undefined;

    // Parse meals
    const meal1 = mapping.meal1 ? row[mapping.meal1]?.trim() : undefined;
    const meal2 = mapping.meal2 ? row[mapping.meal2]?.trim() : undefined;
    const meal3 = mapping.meal3 ? row[mapping.meal3]?.trim() : undefined;
    const snacks = mapping.snacks ? row[mapping.snacks]?.trim() : undefined;

    const mealsLogged = [meal1, meal2, meal3].filter(
      (m) => m && m !== '-' && m !== ''
    ).length;

    // Parse supplements
    const supplements: Record<string, boolean> = {};
    let supplementsTaken = 0;
    for (const col of mapping.supplements) {
      const value = row[col]?.trim().toLowerCase();
      // Consider it taken if there's any truthy value (not empty, not '-', not 'no', not '0')
      const taken = value && value !== '-' && value !== 'no' && value !== '0' && value !== '';
      supplements[col] = !!taken;
      if (taken) supplementsTaken++;
    }

    const log: DailyLog = {
      date,
      sleepDuration,
      sleepScore,
      wakeTime,
      meal1: meal1 && meal1 !== '-' ? meal1 : undefined,
      meal2: meal2 && meal2 !== '-' ? meal2 : undefined,
      meal3: meal3 && meal3 !== '-' ? meal3 : undefined,
      snacks: snacks && snacks !== '-' ? snacks : undefined,
      mealsLogged,
      supplements,
      supplementsTaken,
      supplementsTotal: mapping.supplements.length,
    };

    newLogs.push(log);
    existingDates.add(date);
  }

  return newLogs;
}

export function groupSetsIntoWorkouts(sets: WorkoutSet[]): Workout[] {
  const workoutMap = new Map<string, WorkoutSet[]>();

  for (const set of sets) {
    const existing = workoutMap.get(set.date) || [];
    existing.push(set);
    workoutMap.set(set.date, existing);
  }

  const workouts: Workout[] = [];
  for (const [date, daySets] of workoutMap) {
    const exercises = [...new Set(daySets.map((s) => s.exercise))];
    const totalVolume = daySets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    workouts.push({
      date,
      sets: daySets,
      totalVolume,
      exercises,
    });
  }

  return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function normalizeDate(value: string): string | null {
  // Try parsing as-is first
  const directParse = new Date(value);
  if (!isNaN(directParse.getTime()) && directParse.getFullYear() > 1900) {
    return directParse.toISOString().split('T')[0];
  }

  // Handle DD/MM/YYYY or MM/DD/YYYY format
  const parts = value.split(/[/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);

    // DD/MM/YYYY format (day <= 31, month <= 12, year >= 1900)
    if (a <= 31 && b <= 12 && c >= 1900) {
      const date = new Date(c, b - 1, a);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // MM/DD/YYYY format
    if (a <= 12 && b <= 31 && c >= 1900) {
      const date = new Date(c, a - 1, b);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // YYYY/MM/DD format
    if (a >= 1900) {
      const date = new Date(a, b - 1, c);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return null;
}

function parseDuration(value: string | undefined): number | undefined {
  if (!value || value === '-') return undefined;

  // Handle HH:MM:SS or H:MM:SS format
  const timeParts = value.split(':');
  if (timeParts.length >= 2) {
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    return hours * 60 + minutes;
  }

  // Handle plain number (assume minutes)
  const num = parseFloat(value);
  return isNaN(num) ? undefined : Math.round(num);
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value || value === '-') return undefined;
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

function generateId(...parts: (string | number)[]): string {
  return `${parts.join('-')}-${Math.random().toString(36).substr(2, 9)}`;
}
