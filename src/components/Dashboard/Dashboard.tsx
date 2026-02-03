import type { GameState, WorkoutSet, DailyLog } from '../../types';
import { Character } from '../Character';
import { Quests } from '../Quests';
import { Achievements } from '../Achievements';
import { DataImport } from '../DataImport';
import { LifestyleImport } from '../LifestyleImport';
import { Stats } from '../Stats';
import styles from './Dashboard.module.css';

interface Props {
  state: GameState;
  notifications: string[];
  onImportSets: (sets: WorkoutSet[]) => void;
  onImportLogs: (logs: DailyLog[]) => void;
  onReset: () => void;
}

export function Dashboard({
  state,
  notifications,
  onImportSets,
  onImportLogs,
  onReset,
}: Props) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Fitness RPG</h1>
        <button onClick={onReset} className={styles.resetBtn}>
          Reset Progress
        </button>
      </header>

      <div className={styles.notifications}>
        {notifications.map((msg, i) => (
          <div key={i} className={styles.notification}>
            {msg}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <Character character={state.character} />
          <Quests quests={state.quests} />
          <Stats
            workouts={state.workouts}
            dailyLogs={state.dailyLogs}
            sets={state.sets}
          />
        </div>

        <div className={styles.sideColumn}>
          <DataImport existingSets={state.sets} onImport={onImportSets} />
          <LifestyleImport existingLogs={state.dailyLogs} onImport={onImportLogs} />
          <Achievements achievements={state.achievements} />
        </div>
      </div>

      {(state.workouts.length > 0 || state.dailyLogs.length > 0) && (
        <div className={styles.recentSection}>
          {state.workouts.length > 0 && (
            <div className={styles.recentWorkouts}>
              <h3 className={styles.recentTitle}>Recent Workouts</h3>
              <div className={styles.workoutList}>
                {state.workouts.slice(0, 6).map((workout) => (
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
                    <div className={styles.workoutStats}>{workout.sets.length} sets</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.dailyLogs.length > 0 && (
            <div className={styles.recentLogs}>
              <h3 className={styles.recentTitle}>Recent Days</h3>
              <div className={styles.logList}>
                {state.dailyLogs.slice(0, 6).map((log) => (
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
        </div>
      )}
    </div>
  );
}
