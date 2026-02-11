import { useState, useMemo } from 'react';
import type { GameState, WorkoutSet, DailyLog as DailyLogType } from '../../types';
import { Character } from '../Character';
import { Quests } from '../Quests';
import { Achievements } from '../Achievements';
import { DataImport } from '../DataImport';
import { LifestyleImport } from '../LifestyleImport';
import { Stats } from '../Stats';
import { Supplements } from '../Supplements';
import { Meals } from '../Meals';
import { DailyLog } from '../DailyLog';
import styles from './Dashboard.module.css';

interface PushNotificationsState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

interface Props {
  state: GameState;
  notifications: string[];
  supabaseMeals: DailyLogType[];
  supabaseSleep: DailyLogType[];
  pushNotifications: PushNotificationsState;
  onImportSets: (sets: WorkoutSet[]) => void;
  onImportLogs: (logs: DailyLogType[]) => void;
  onAddDailyLog: (log: DailyLogType) => void;
  onSignOut: () => void;
}

type Tab = 'overview' | 'log' | 'quests' | 'achievements' | 'meals' | 'supplements' | 'charts' | 'import';

export function Dashboard({
  state,
  notifications,
  supabaseMeals,
  supabaseSleep,
  pushNotifications,
  onImportSets,
  onImportLogs,
  onAddDailyLog,
  onSignOut,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const mergedLogs = useMemo(() => {
    const byDate = new Map<string, DailyLogType>();
    for (const log of [...state.dailyLogs, ...supabaseMeals, ...supabaseSleep]) {
      const existing = byDate.get(log.date);
      if (existing) {
        byDate.set(log.date, {
          ...existing,
          meal1: existing.meal1 || log.meal1,
          meal2: existing.meal2 || log.meal2,
          meal3: existing.meal3 || log.meal3,
          snacks: existing.snacks || log.snacks,
          mealsLogged: [existing.meal1 || log.meal1, existing.meal2 || log.meal2, existing.meal3 || log.meal3].filter(Boolean).length,
          sleepDuration: existing.sleepDuration ?? log.sleepDuration,
          sleepScore: existing.sleepScore ?? log.sleepScore,
          wakeTime: existing.wakeTime || log.wakeTime,
        });
      } else {
        byDate.set(log.date, { ...log });
      }
    }
    return Array.from(byDate.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.dailyLogs, supabaseMeals, supabaseSleep]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Fitness RPG</h1>
        <div className={styles.headerActions}>
          {pushNotifications.supported && (
            <button
              onClick={pushNotifications.subscribed ? pushNotifications.unsubscribe : pushNotifications.subscribe}
              className={`${styles.notifBtn} ${pushNotifications.subscribed ? styles.notifActive : ''}`}
              title={
                pushNotifications.permission === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : pushNotifications.subscribed
                    ? 'Disable notifications'
                    : 'Enable notifications'
              }
              disabled={pushNotifications.permission === 'denied'}
            >
              {pushNotifications.subscribed ? '\u{1F514}' : '\u{1F515}'}
            </button>
          )}
          <button onClick={onSignOut} className={styles.signOutBtn}>Sign Out</button>
        </div>
      </header>

      <div className={styles.notifications}>
        {notifications.map((msg, i) => (
          <div key={i} className={styles.notification}>
            {msg}
          </div>
        ))}
      </div>

      <Character character={state.character} />

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'log' ? styles.active : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'quests' ? styles.active : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          Quests
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'meals' ? styles.active : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          Meals
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'supplements' ? styles.active : ''}`}
          onClick={() => setActiveTab('supplements')}
        >
          Supplements
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'charts' ? styles.active : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'import' ? styles.active : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Import Data
        </button>
      </nav>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            {state.workouts.length > 0 && (
              <div className={styles.recentWorkouts}>
                <h3 className={styles.sectionTitle}>Recent Workouts</h3>
                <div className={styles.workoutList}>
                  {state.workouts.slice(0, 5).map((workout) => {
                    const isExpanded = expandedWorkout === workout.date;
                    return (
                      <div
                        key={workout.date}
                        className={`${styles.workoutCard} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => setExpandedWorkout(isExpanded ? null : workout.date)}
                      >
                        <div className={styles.workoutHeader}>
                          <span className={styles.workoutDate}>{workout.date}</span>
                          <span className={styles.workoutVolume}>
                            {(workout.totalVolume / 1000).toFixed(1)}K kg
                          </span>
                        </div>
                        <div className={styles.workoutExercises}>
                          {workout.exercises.slice(0, 3).map((ex) => (
                            <span key={ex} className={styles.exerciseTag}>
                              {ex}
                            </span>
                          ))}
                          {workout.exercises.length > 3 && (
                            <span className={styles.exerciseMore}>
                              +{workout.exercises.length - 3}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className={styles.workoutDetails}>
                            {workout.exercises.map((exercise) => {
                              const exerciseSets = workout.sets.filter((s) => s.exercise === exercise);
                              return (
                                <div key={exercise} className={styles.exerciseGroup}>
                                  <h4 className={styles.exerciseName}>{exercise}</h4>
                                  <div className={styles.setsList}>
                                    {exerciseSets.map((s, i) => (
                                      <div key={s.id} className={styles.setRow}>
                                        <span className={styles.setNumber}>Set {i + 1}</span>
                                        <span className={styles.setDetail}>{s.weight} kg x {s.reps}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mergedLogs.some((log) => log.sleepDuration || log.sleepScore) && (
              <div className={styles.recentSleep}>
                <h3 className={styles.sectionTitle}>Recent Sleeps</h3>
                <div className={styles.sleepList}>
                  {mergedLogs
                    .filter((log) => log.sleepDuration || log.sleepScore)
                    .slice(0, 5)
                    .map((log) => (
                      <div key={log.date} className={styles.sleepCard}>
                        <span className={styles.sleepDate}>{log.date}</span>
                        <div className={styles.sleepStats}>
                          {log.sleepDuration != null && (
                            <span className={styles.sleepDuration}>
                              {Math.floor(log.sleepDuration / 60)}h {log.sleepDuration % 60}m
                            </span>
                          )}
                          {log.sleepScore != null && (
                            <span className={styles.sleepScore}>Score: {log.sleepScore}</span>
                          )}
                          {log.bedtime && (
                            <span className={styles.sleepTime}>Bed: {log.bedtime}</span>
                          )}
                          {log.wakeTime && (
                            <span className={styles.sleepTime}>Wake: {log.wakeTime}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {state.workouts.length === 0 && !mergedLogs.some((log) => log.sleepDuration || log.sleepScore) && (
              <div className={styles.emptyState}>
                <p>No data yet. Import your workout or lifestyle data to get started!</p>
                <button
                  className={styles.importBtn}
                  onClick={() => setActiveTab('import')}
                >
                  Import Data
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <DailyLog
            existingSets={state.sets}
            existingLogs={state.dailyLogs}
            onAddSets={onImportSets}
            onAddLog={onAddDailyLog}
          />
        )}

        {activeTab === 'quests' && (
          <Quests quests={state.quests} />
        )}

        {activeTab === 'achievements' && (
          <Achievements achievements={state.achievements} />
        )}

        {activeTab === 'meals' && (
          <Meals dailyLogs={mergedLogs} />
        )}

        {activeTab === 'supplements' && (
          <Supplements dailyLogs={mergedLogs} />
        )}

        {activeTab === 'charts' && (
          <Stats
            workouts={state.workouts}
            dailyLogs={mergedLogs}
            sets={state.sets}
          />
        )}

        {activeTab === 'import' && (
          <div className={styles.importGrid}>
            <DataImport existingSets={state.sets} onImport={onImportSets} />
            <LifestyleImport existingLogs={state.dailyLogs} onImport={onImportLogs} />
          </div>
        )}
      </div>
    </div>
  );
}
