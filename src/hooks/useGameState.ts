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

  const addDailyLog = useCallback(
    (log: DailyLog) => {
      setState((prev) => {
        // Check if log for this date already exists
        const existingIndex = prev.dailyLogs.findIndex((l) => l.date === log.date);
        let allLogs: DailyLog[];
        let isNew = true;

        if (existingIndex >= 0) {
          // Merge with existing log - only update fields that are filled in
          const existing = prev.dailyLogs[existingIndex];
          const merged: DailyLog = {
            date: log.date,
            // Sleep - use new value if provided, otherwise keep existing
            sleepDuration: log.sleepDuration ?? existing.sleepDuration,
            sleepScore: log.sleepScore ?? existing.sleepScore,
            wakeTime: log.wakeTime ?? existing.wakeTime,
            // Meals - use new value if provided (non-empty string), otherwise keep existing
            meal1: log.meal1 || existing.meal1,
            meal2: log.meal2 || existing.meal2,
            meal3: log.meal3 || existing.meal3,
            snacks: log.snacks || existing.snacks,
            mealsLogged: 0, // Will recalculate below
            // Supplements - merge the two records
            supplements: { ...existing.supplements, ...log.supplements },
            supplementsTaken: 0, // Will recalculate below
            supplementsTotal: 0, // Will recalculate below
          };

          // Recalculate meal count
          merged.mealsLogged = [merged.meal1, merged.meal2, merged.meal3].filter((m) => m?.trim()).length;

          // Recalculate supplement counts
          const suppEntries = Object.entries(merged.supplements);
          merged.supplementsTotal = suppEntries.length;
          merged.supplementsTaken = suppEntries.filter(([, taken]) => taken).length;

          allLogs = [...prev.dailyLogs];
          allLogs[existingIndex] = merged;
          isNew = false;
        } else {
          allLogs = [...prev.dailyLogs, log];
        }

        allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let character = { ...prev.character };

        // Only award XP for new logs
        if (isNew) {
          const xpFromLog = calculateXpForLogs([log]);
          character = addXpToCharacter(character, xpFromLog);
        }

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

      addNotification(`Daily log saved!`);
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
    addDailyLog,
    resetProgress,
    addNotification,
  };
}
