import { useEffect, useRef } from 'react';
import { fetchWorkoutSets } from '../lib/fetchWorkouts';
import type { WorkoutSet } from '../types';

export function useSupabaseSync(
  initialized: boolean,
  existingSets: WorkoutSet[],
  onNewSets: (sets: WorkoutSet[]) => void
) {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!initialized || hasSynced.current) return;
    hasSynced.current = true;

    (async () => {
      const remoteSets = await fetchWorkoutSets();
      if (remoteSets.length === 0) return;

      const existingKeys = new Set(
        existingSets.map((s) => `${s.date}-${s.exercise}-${s.weight}-${s.reps}`)
      );

      const newSets = remoteSets.filter(
        (s) => !existingKeys.has(`${s.date}-${s.exercise}-${s.weight}-${s.reps}`)
      );

      if (newSets.length > 0) {
        onNewSets(newSets);
      }
    })();
  }, [initialized]);
}
