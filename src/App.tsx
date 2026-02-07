import { useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useMeals } from './hooks/useMeals';
import { useSleep } from './hooks/useSleep';
import { insertWorkoutSets } from './lib/fetchWorkouts';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { WorkoutSet } from './types';
import './App.css';

function App() {
  const { state, notifications, initializeCharacter, importSets, importLogs, addDailyLog } =
    useGameState();

  useSupabaseSync(state.initialized, state.sets, importSets);
  const supabaseMeals = useMeals(state.initialized);
  const supabaseSleep = useSleep(state.initialized);

  const importSetsWithSync = useCallback(
    (sets: WorkoutSet[]) => {
      importSets(sets);
      insertWorkoutSets(sets);
    },
    [importSets]
  );

  if (!state.initialized) {
    return <div className="loading">Loading...</div>;
  }

  if (state.sets.length === 0 && state.dailyLogs.length === 0 && state.character.name === 'Hero') {
    return <WelcomeScreen onStart={initializeCharacter} />;
  }

  return (
    <Dashboard
      state={state}
      notifications={notifications}
      supabaseMeals={supabaseMeals}
      supabaseSleep={supabaseSleep}
      onImportSets={importSetsWithSync}
      onImportLogs={importLogs}
      onAddDailyLog={addDailyLog}
    />
  );
}

export default App;
