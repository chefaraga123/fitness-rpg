export interface Character {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalWorkouts: number;
  totalSets: number;
  totalWeight: number;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
}

export interface Workout {
  date: string;
  sets: WorkoutSet[];
  totalVolume: number;
  exercises: string[];
}

export interface DailyLog {
  date: string;
  // Sleep
  bedtime?: string;
  wakeTime?: string;
  sleepDuration?: number; // in minutes
  sleepScore?: number;
  remMinutes?: number;
  sleepNotes?: string;
  // Meals
  meal1?: string;
  meal2?: string;
  meal3?: string;
  snacks?: string;
  mealsLogged: number;
  // Supplements (name -> dose string, e.g. "500mg")
  supplements: Record<string, string>;
  supplementsTaken: number;
  supplementsTotal: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'milestone';
  category: 'workout' | 'sleep' | 'nutrition' | 'general';
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'workout' | 'sleep' | 'nutrition' | 'general';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameState {
  character: Character;
  sets: WorkoutSet[];
  workouts: Workout[];
  dailyLogs: DailyLog[];
  quests: Quest[];
  achievements: Achievement[];
  initialized: boolean;
}

export interface WorkoutCSVMapping {
  date: string;
  exercise: string;
  weight: string;
  reps: string;
}

export interface LifestyleCSVMapping {
  date: string;
  sleepDuration?: string;
  sleepScore?: string;
  wakeTime?: string;
  meal1?: string;
  meal2?: string;
  meal3?: string;
  snacks?: string;
  supplements: string[]; // column names that are supplement columns
}
