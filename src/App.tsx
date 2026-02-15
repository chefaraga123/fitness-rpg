import { useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useMeals } from './hooks/useMeals';
import { useSleep } from './hooks/useSleep';
import { useSupplements } from './hooks/useSupplements';
import { usePushNotifications } from './hooks/usePushNotifications';
import { insertWorkoutSets } from './lib/fetchWorkouts';
import { insertMeals } from './lib/fetchMeals';
import { insertSleep } from './lib/fetchSleep';
import { insertSupplements } from './lib/fetchSupplements';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Login } from './components/Login';
import type { WorkoutSet, DailyLog } from './types';
import './App.css';

function App() {
  const { session, loading: authLoading, signIn, signOut } = useAuth();
  const { state, notifications, initializeCharacter, importSets, replaceSets, importLogs, addDailyLog, renameExercises } =
    useGameState();

  useSupabaseSync(state.initialized, replaceSets);
  const supabaseMeals = useMeals(state.initialized);
  const supabaseSleep = useSleep(state.initialized);
  const supabaseSupplements = useSupplements(state.initialized);
  const pushNotifications = usePushNotifications(!!session);

  const importSetsWithSync = useCallback(
    (sets: WorkoutSet[]) => {
      importSets(sets);
      insertWorkoutSets(sets);
    },
    [importSets]
  );

  const addDailyLogWithSync = useCallback(
    (log: DailyLog) => {
      addDailyLog(log);
      insertSleep(log);
      insertMeals(log);
      insertSupplements(log);
    },
    [addDailyLog]
  );

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Login onSignIn={signIn} />;
  }

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
      supabaseSupplements={supabaseSupplements}
      pushNotifications={pushNotifications}
      onImportSets={importSetsWithSync}
      onImportLogs={importLogs}
      onAddDailyLog={addDailyLogWithSync}
      onRenameExercises={renameExercises}
      onSignOut={signOut}
    />
  );
}

export default App;
