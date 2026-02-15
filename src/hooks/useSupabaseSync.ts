import { useEffect, useRef } from 'react';
import { fetchWorkoutSets } from '../lib/fetchWorkouts';
import type { WorkoutSet } from '../types';

export function useSupabaseSync(
  initialized: boolean,
  onReplaceSets: (sets: WorkoutSet[]) => void
) {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!initialized || hasSynced.current) return;
    hasSynced.current = true;

    (async () => {
      const remoteSets = await fetchWorkoutSets();
      if (remoteSets.length === 0) return;

      onReplaceSets(remoteSets);
    })();
  }, [initialized]);
}
