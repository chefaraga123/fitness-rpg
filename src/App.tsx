import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import './App.css';

function App() {
  const { state, notifications, initializeCharacter, importSets, importLogs, resetProgress } =
    useGameState();

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
      onImportSets={importSets}
      onImportLogs={importLogs}
      onReset={resetProgress}
    />
  );
}

export default App;
