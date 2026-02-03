import { useState, useEffect, useCallback } from 'react';
import type { GameState, WorkoutSet, DailyLog, Character } from '../types';
import { createDefaultQuests, createDefaultAchievements } from '../data/questDefinitions';
import { groupSetsIntoWorkouts } from '../utils/csvParser';
import {
  calculateXpForSets,
  calculateXpForLogs,
  calculateXpToNextLevel,
  addXpToCharacter,
  updateQuestProgress,
  checkAchievements,
} from '../utils/gameLogic';

const STORAGE_KEY = 'fitness-rpg-state';

const createInitialCharacter = (name: string): Character => ({
  name,
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXpToNextLevel(1),
  totalWorkouts: 0,
  totalSets: 0,
  totalWeight: 0,
  createdAt: new Date().toISOString(),
});

const createInitialState = (): GameState => ({
  character: createInitialCharacter('Hero'),
  sets: [],
  workouts: [],
  dailyLogs: [],
  quests: createDefaultQuests(),
  achievements: createDefaultAchievements(),
  initialized: false,
});

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...parsed, initialized: true });
      } catch {
        setState((s) => ({ ...s, initialized: true }));
      }
    } else {
      setState((s) => ({ ...s, initialized: true }));
    }
  }, []);

  useEffect(() => {
    if (state.initialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
  }, []);

  const initializeCharacter = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      character: createInitialCharacter(name),
      initialized: true,
    }));
  }, []);

  const importSets = useCallback(
    (newSets: WorkoutSet[]) => {
      if (newSets.length === 0) return;

      setState((prev) => {
        const allSets = [...prev.sets, ...newSets];
        const workouts = groupSetsIntoWorkouts(allSets);
        const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

        let character: Character = {
          ...prev.character,
          totalWorkouts: workouts.length,
          totalSets: allSets.length,
          totalWeight: totalVolume,
        };

        const xpFromSets = calculateXpForSets(newSets);
        character = addXpToCharacter(character, xpFromSets);

        const { quests, xpEarned } = updateQuestProgress(
          prev.quests,
          workouts,
          prev.dailyLogs,
          allSets.length
        );
        character = addXpToCharacter(character, xpEarned);

        const newState: GameState = {
          ...prev,
          character,
          sets: allSets,
          workouts,
          quests,
        };

        const { achievements } = checkAchievements(prev.achievements, newState);

        return { ...newState, achievements };
      });

      const workoutDays = new Set(newSets.map((s) => s.date)).size;
      addNotification(
        `Imported ${newSets.length} sets from ${workoutDays} workout${workoutDays > 1 ? 's' : ''}!`
      );
    },
    [addNotification]
  );

  const importLogs = useCallback(
    (newLogs: DailyLog[]) => {
      if (newLogs.length === 0) return;

      setState((prev) => {
        const allLogs = [...prev.dailyLogs, ...newLogs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let character = { ...prev.character };

        const xpFromLogs = calculateXpForLogs(newLogs);
        character = addXpToCharacter(character, xpFromLogs);

        const { quests, xpEarned } = updateQuestProgress(
          prev.quests,
          prev.workouts,
          allLogs,
          prev.sets.length
        );
        character = addXpToCharacter(character, xpEarned);

        const newState: GameState = {
          ...prev,
          character,
          dailyLogs: allLogs,
          quests,
        };

        const { achievements } = checkAchievements(prev.achievements, newState);

        return { ...newState, achievements };
      });

      addNotification(`Imported ${newLogs.length} days of lifestyle data!`);
    },
    [addNotification]
  );

  const resetProgress = useCallback(() => {
    const freshState = createInitialState();
    freshState.initialized = true;
    setState(freshState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state,
    notifications,
    initializeCharacter,
    importSets,
    importLogs,
    resetProgress,
    addNotification,
  };
}
