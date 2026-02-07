import { useEffect, useRef, useState } from 'react';
import { fetchSleep } from '../lib/fetchSleep';
import type { DailyLog } from '../types';

export function useSleep(initialized: boolean): DailyLog[] {
  const [sleep, setSleep] = useState<DailyLog[]>([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!initialized || hasFetched.current) return;
    hasFetched.current = true;

    fetchSleep().then(setSleep);
  }, [initialized]);

  return sleep;
}
