import { useState } from 'react';
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

interface Props {
  state: GameState;
  notifications: string[];
  supabaseMeals: DailyLogType[];
  onImportSets: (sets: WorkoutSet[]) => void;
  onImportLogs: (logs: DailyLogType[]) => void;
  onAddDailyLog: (log: DailyLogType) => void;
}

type Tab = 'overview' | 'log' | 'quests' | 'achievements' | 'meals' | 'supplements' | 'charts' | 'import';

export function Dashboard({
  state,
  notifications,
  supabaseMeals,
  onImportSets,
  onImportLogs,
  onAddDailyLog,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Fitness RPG</h1>
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
                  {state.workouts.slice(0, 5).map((workout) => (
                    <div key={workout.date} className={styles.workoutCard}>
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.dailyLogs.length > 0 && (
              <div className={styles.recentLogs}>
                <h3 className={styles.sectionTitle}>Recent Days</h3>
                <div className={styles.logList}>
                  {state.dailyLogs.slice(0, 5).map((log) => (
                    <div key={log.date} className={styles.logCard}>
                      <span className={styles.logDate}>{log.date}</span>
                      <div className={styles.logStats}>
                        {log.sleepDuration && (
                          <span className={styles.logSleep}>
                            {Math.floor(log.sleepDuration / 60)}h {log.sleepDuration % 60}m
                          </span>
                        )}
                        {log.sleepScore && (
                          <span className={styles.logScore}>{log.sleepScore}</span>
                        )}
                        {log.mealsLogged > 0 && (
                          <span className={styles.logMeals}>{log.mealsLogged} meals</span>
                        )}
                        {log.supplementsTaken > 0 && (
                          <span className={styles.logSupps}>
                            {log.supplementsTaken}/{log.supplementsTotal}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.workouts.length === 0 && state.dailyLogs.length === 0 && (
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
          <Meals dailyLogs={[...state.dailyLogs, ...supabaseMeals]} />
        )}

        {activeTab === 'supplements' && (
          <Supplements dailyLogs={state.dailyLogs} />
        )}

        {activeTab === 'charts' && (
          <Stats
            workouts={state.workouts}
            dailyLogs={state.dailyLogs}
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
