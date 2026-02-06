import { useEffect, useRef, useState } from 'react';
import { fetchMeals } from '../lib/fetchMeals';
import type { DailyLog } from '../types';

export function useMeals(initialized: boolean): DailyLog[] {
  const [meals, setMeals] = useState<DailyLog[]>([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!initialized || hasFetched.current) return;
    hasFetched.current = true;

    fetchMeals().then(setMeals);
  }, [initialized]);

  return meals;
}
