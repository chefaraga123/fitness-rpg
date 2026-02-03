import type { Character, WorkoutSet, Workout, DailyLog, Quest, Achievement, GameState } from '../types';

const XP_PER_SET = 10;
const XP_PER_1000_VOLUME = 5;
const XP_PER_LEVEL_MULTIPLIER = 100;
const XP_PER_SLEEP_LOG = 5;
const XP_PER_MEAL_LOGGED = 3;
const XP_PER_SUPPLEMENT = 2;

export function calculateXpForSets(sets: WorkoutSet[]): number {
  const baseXp = sets.length * XP_PER_SET;
  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const volumeBonus = Math.floor(totalVolume / 1000) * XP_PER_1000_VOLUME;
  return baseXp + volumeBonus;
}

export function calculateXpForLogs(logs: DailyLog[]): number {
  let xp = 0;
  for (const log of logs) {
    if (log.sleepDuration || log.sleepScore) xp += XP_PER_SLEEP_LOG;
    xp += log.mealsLogged * XP_PER_MEAL_LOGGED;
    xp += log.supplementsTaken * XP_PER_SUPPLEMENT;
  }
  return xp;
}

export function calculateXpToNextLevel(level: number): number {
  return level * XP_PER_LEVEL_MULTIPLIER;
}

export function addXpToCharacter(character: Character, xp: number): Character {
  let newXp = character.xp + xp;
  let newLevel = character.level;
  let xpToNext = character.xpToNextLevel;

  while (newXp >= xpToNext) {
    newXp -= xpToNext;
    newLevel++;
    xpToNext = calculateXpToNextLevel(newLevel);
  }

  return {
    ...character,
    xp: newXp,
    level: newLevel,
    xpToNextLevel: xpToNext,
  };
}

export function updateQuestProgress(
  quests: Quest[],
  workouts: Workout[],
  dailyLogs: DailyLog[],
  _totalSets: number
): { quests: Quest[]; xpEarned: number } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);

  const todayLog = dailyLogs.find((l) => l.date === today);
  const weekLogs = dailyLogs.filter((l) => new Date(l.date) >= weekStart);
  const monthLogs = dailyLogs.filter((l) => new Date(l.date) >= monthStart);

  let xpEarned = 0;

  const updatedQuests = quests.map((quest) => {
    if (quest.completed) return quest;

    let progress = 0;

    switch (quest.id) {
      // Workout quests
      case 'daily-workout':
        progress = workouts.filter((w) => w.date === today).length;
        break;
      case 'weekly-workout-3':
        progress = workouts.filter((w) => new Date(w.date) >= weekStart).length;
        break;
      case 'weekly-sets-50':
        progress = workouts
          .filter((w) => new Date(w.date) >= weekStart)
          .reduce((sum, w) => sum + w.sets.length, 0);
        break;
      case 'monthly-workout-12':
        progress = workouts.filter((w) => new Date(w.date) >= monthStart).length;
        break;
      case 'milestone-workouts-100':
        progress = workouts.length;
        break;

      // Sleep quests
      case 'daily-sleep-8h':
        progress = todayLog?.sleepDuration && todayLog.sleepDuration >= 480 ? 1 : 0;
        break;
      case 'daily-sleep-score-85':
        progress = todayLog?.sleepScore && todayLog.sleepScore >= 85 ? 1 : 0;
        break;
      case 'weekly-sleep-7days':
        progress = weekLogs.filter((l) => l.sleepDuration || l.sleepScore).length;
        break;
      case 'weekly-good-sleep-5':
        progress = weekLogs.filter((l) => l.sleepDuration && l.sleepDuration >= 480).length;
        break;

      // Nutrition quests
      case 'daily-meals-3':
        progress = todayLog?.mealsLogged || 0;
        break;
      case 'daily-supplements':
        progress = todayLog && todayLog.supplementsTaken >= todayLog.supplementsTotal ? 1 : 0;
        break;
      case 'weekly-meals-logged':
        progress = weekLogs.filter((l) => l.mealsLogged > 0).length;
        break;
      case 'weekly-supplements-7':
        progress = calculateSupplementStreak(dailyLogs, 7);
        break;
      case 'monthly-supplement-streak':
        progress = monthLogs.filter((l) => l.supplementsTaken > 0).length;
        break;

      default:
        progress = quest.progress;
    }

    const completed = progress >= quest.target;
    if (completed && !quest.completed) {
      xpEarned += quest.xpReward;
    }

    return {
      ...quest,
      progress: Math.min(progress, quest.target),
      completed,
      completedAt: completed ? now.toISOString() : undefined,
    };
  });

  return { quests: updatedQuests, xpEarned };
}

export function checkAchievements(
  achievements: Achievement[],
  state: GameState
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = [];
  const now = new Date().toISOString();

  const uniqueExercises = new Set(state.sets.map((s) => s.exercise.toLowerCase()));
  const sleepStreak = calculateLogStreak(state.dailyLogs, (l) => !!(l.sleepDuration || l.sleepScore));
  const supplementStreak = calculateSupplementStreak(state.dailyLogs, 999);
  const daysWithMeals = state.dailyLogs.filter((l) => l.mealsLogged > 0).length;

  const updatedAchievements = achievements.map((achievement) => {
    if (achievement.unlocked) return achievement;

    let shouldUnlock = false;

    switch (achievement.id) {
      // Workout
      case 'first-workout':
        shouldUnlock = state.workouts.length >= 1;
        break;
      case 'variety-5':
        shouldUnlock = uniqueExercises.size >= 5;
        break;
      case 'century-sets':
        shouldUnlock = state.sets.length >= 100;
        break;
      case 'volume-king':
        shouldUnlock = state.character.totalWeight >= 100000;
        break;

      // Level
      case 'level-5':
        shouldUnlock = state.character.level >= 5;
        break;
      case 'level-10':
        shouldUnlock = state.character.level >= 10;
        break;
      case 'level-25':
        shouldUnlock = state.character.level >= 25;
        break;

      // Sleep
      case 'first-sleep-log':
        shouldUnlock = state.dailyLogs.some((l) => l.sleepDuration || l.sleepScore);
        break;
      case 'sleep-streak-7':
        shouldUnlock = sleepStreak >= 7;
        break;
      case 'sleep-streak-30':
        shouldUnlock = sleepStreak >= 30;
        break;
      case 'perfect-sleep-score':
        shouldUnlock = state.dailyLogs.some((l) => l.sleepScore && l.sleepScore >= 90);
        break;

      // Nutrition
      case 'first-meal-log':
        shouldUnlock = state.dailyLogs.some((l) => l.mealsLogged > 0);
        break;
      case 'supplement-streak-7':
        shouldUnlock = supplementStreak >= 7;
        break;
      case 'supplement-streak-30':
        shouldUnlock = supplementStreak >= 30;
        break;
      case 'meal-logger-100':
        shouldUnlock = daysWithMeals >= 100;
        break;

      // General
      case 'quest-master':
        shouldUnlock = state.quests.filter((q) => q.completed).length >= 50;
        break;
    }

    if (shouldUnlock) {
      const unlocked = { ...achievement, unlocked: true, unlockedAt: now };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }

    return achievement;
  });

  return { achievements: updatedAchievements, newlyUnlocked };
}

function calculateLogStreak(
  logs: DailyLog[],
  predicate: (log: DailyLog) => boolean
): number {
  const validDates = logs.filter(predicate).map((l) => l.date);
  if (validDates.length === 0) return 0;

  const sortedDates = [...new Set(validDates)].sort().reverse();
  let streak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateSupplementStreak(logs: DailyLog[], _maxDays: number): number {
  const logsWithSupplements = logs.filter(
    (l) => l.supplementsTotal > 0 && l.supplementsTaken >= l.supplementsTotal
  );
  return calculateLogStreak(logsWithSupplements, () => true);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
