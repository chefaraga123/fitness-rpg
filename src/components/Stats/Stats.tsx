import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Workout, DailyLog, WorkoutSet } from '../../types';
import styles from './Stats.module.css';

interface Props {
  workouts: Workout[];
  dailyLogs: DailyLog[];
  sets: WorkoutSet[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';
type Tab = 'workouts' | 'sleep' | 'exercises';

export function Stats({ workouts, dailyLogs, sets }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeTab, setActiveTab] = useState<Tab>('workouts');
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const cutoffDate = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }, [timeRange]);

  const filteredWorkouts = useMemo(
    () => workouts.filter((w) => new Date(w.date) >= cutoffDate),
    [workouts, cutoffDate]
  );

  const filteredLogs = useMemo(
    () => dailyLogs.filter((l) => new Date(l.date) >= cutoffDate),
    [dailyLogs, cutoffDate]
  );

  const filteredSets = useMemo(
    () => sets.filter((s) => new Date(s.date) >= cutoffDate),
    [sets, cutoffDate]
  );

  const exercises = useMemo(() => {
    const unique = [...new Set(sets.map((s) => s.exercise))];
    return unique.sort();
  }, [sets]);

  // Weekly volume aggregation
  const weeklyVolumeData = useMemo(() => {
    const weeks = new Map<string, { volume: number; sets: number; workouts: number }>();

    filteredWorkouts.forEach((w) => {
      const weekStart = getWeekStart(new Date(w.date));
      const key = weekStart.toISOString().split('T')[0];
      const existing = weeks.get(key) || { volume: 0, sets: 0, workouts: 0 };
      weeks.set(key, {
        volume: existing.volume + w.totalVolume,
        sets: existing.sets + w.sets.length,
        workouts: existing.workouts + 1,
      });
    });

    return Array.from(weeks.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, data]) => ({
        week: formatDate(date),
        volume: Math.round(data.volume),
        sets: data.sets,
        workouts: data.workouts,
      }));
  }, [filteredWorkouts]);

  // Sleep data with 7-day moving averages
  const sleepData = useMemo(() => {
    const sorted = filteredLogs
      .filter((l) => l.sleepDuration || l.sleepScore || l.wakeTime)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const points = sorted.map((l) => ({
      date: formatDate(l.date),
      hours: l.sleepDuration ? +(l.sleepDuration / 60).toFixed(1) : null,
      score: l.sleepScore || null,
      wakeHour: l.wakeTime ? timeToDecimal(l.wakeTime) : null,
      wakeTime: l.wakeTime || null,
      avgHours: null as number | null,
      avgScore: null as number | null,
      avgWake: null as number | null,
    }));

    // Compute 7-day moving averages
    for (let i = 0; i < points.length; i++) {
      const window = points.slice(Math.max(0, i - 6), i + 1);
      const hoursVals = window.map((p) => p.hours).filter((v): v is number => v != null);
      const scoreVals = window.map((p) => p.score).filter((v): v is number => v != null);
      const wakeVals = window.map((p) => p.wakeHour).filter((v): v is number => v != null);
      if (hoursVals.length >= 2) points[i].avgHours = +(hoursVals.reduce((a, b) => a + b, 0) / hoursVals.length).toFixed(1);
      if (scoreVals.length >= 2) points[i].avgScore = +(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(0);
      if (wakeVals.length >= 2) points[i].avgWake = +(wakeVals.reduce((a, b) => a + b, 0) / wakeVals.length).toFixed(2);
    }

    return points;
  }, [filteredLogs]);

  // Exercise progression data
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return [];

    const exerciseSets = filteredSets
      .filter((s) => s.exercise === selectedExercise)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date and get max weight
    const byDate = new Map<string, { maxWeight: number; totalVolume: number; sets: number }>();

    exerciseSets.forEach((s) => {
      const existing = byDate.get(s.date);
      const volume = s.weight * s.reps;
      if (existing) {
        byDate.set(s.date, {
          maxWeight: Math.max(existing.maxWeight, s.weight),
          totalVolume: existing.totalVolume + volume,
          sets: existing.sets + 1,
        });
      } else {
        byDate.set(s.date, { maxWeight: s.weight, totalVolume: volume, sets: 1 });
      }
    });

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date: formatDate(date),
      maxWeight: data.maxWeight,
      volume: Math.round(data.totalVolume),
      sets: data.sets,
    }));
  }, [filteredSets, selectedExercise]);

  if (workouts.length === 0 && dailyLogs.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Progress Charts</h3>
        <p className={styles.empty}>Import some data to see your progress charts!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Progress Charts</h3>
        <div className={styles.timeRangeSelector}>
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              className={`${styles.rangeBtn} ${timeRange === range ? styles.active : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range === 'all' ? 'All' : range}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'workouts' ? styles.active : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          Workouts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sleep' ? styles.active : ''}`}
          onClick={() => setActiveTab('sleep')}
        >
          Sleep
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'exercises' ? styles.active : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          Exercises
        </button>
      </div>

      <div className={styles.chartArea}>
        {activeTab === 'workouts' && (
          <>
            {weeklyVolumeData.length > 1 ? (
              <>
                <h4 className={styles.chartTitle}>Weekly Volume (kg)</h4>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="week" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="volume" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <h4 className={styles.chartTitle}>Weekly Sets & Workouts</h4>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="week" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sets" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="workouts" stroke="#fbbf24" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className={styles.noData}>Not enough workout data for charts</p>
            )}
          </>
        )}

        {activeTab === 'sleep' && (
          <>
            {sleepData.length > 1 ? (
              <>
                <h4 className={styles.chartTitle}>Sleep Duration (hours)</h4>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} domain={[0, 12]} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ fill: '#60a5fa', r: 3 }}
                        connectNulls
                        name="Duration"
                      />
                      <Line
                        type="monotone"
                        dataKey="avgHours"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                        strokeDasharray="5 5"
                        name="7-day avg"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {sleepData.some((d) => d.score) && (
                  <>
                    <h4 className={styles.chartTitle}>Sleep Score</h4>
                    <div className={styles.chart}>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={sleepData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" fontSize={12} />
                          <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            dot={{ fill: '#a78bfa', r: 3 }}
                            connectNulls
                            name="Score"
                          />
                          <Line
                            type="monotone"
                            dataKey="avgScore"
                            stroke="#fbbf24"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                            strokeDasharray="5 5"
                            name="7-day avg"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {sleepData.some((d) => d.wakeHour) && (
                  <>
                    <h4 className={styles.chartTitle}>Wake-up Time</h4>
                    <div className={styles.chart}>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={sleepData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" fontSize={12} />
                          <YAxis
                            stroke="#888"
                            fontSize={12}
                            domain={[5, 11]}
                            tickFormatter={(v: number) => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`}
                          />
                          <Tooltip
                            contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: number) => {
                              const h = Math.floor(value);
                              const m = String(Math.round((value % 1) * 60)).padStart(2, '0');
                              return [`${h}:${m}`, ''];
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="wakeHour"
                            stroke="#4ade80"
                            strokeWidth={2}
                            dot={{ fill: '#4ade80', r: 3 }}
                            connectNulls
                            name="Wake time"
                          />
                          <Line
                            type="monotone"
                            dataKey="avgWake"
                            stroke="#fbbf24"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                            strokeDasharray="5 5"
                            name="7-day avg"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className={styles.noData}>Not enough sleep data for charts</p>
            )}
          </>
        )}

        {activeTab === 'exercises' && (
          <>
            <div className={styles.exerciseSelector}>
              <label>Select exercise:</label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className={styles.exerciseSelect}
              >
                <option value="">-- Choose --</option>
                {exercises.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            {selectedExercise && exerciseData.length > 1 ? (
              <>
                <h4 className={styles.chartTitle}>{selectedExercise} - Max Weight (kg)</h4>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={exerciseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ fill: '#4ade80', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <h4 className={styles.chartTitle}>{selectedExercise} - Session Volume (kg)</h4>
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={exerciseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="volume" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : selectedExercise ? (
              <p className={styles.noData}>Not enough data for {selectedExercise}</p>
            ) : (
              <p className={styles.noData}>Select an exercise to see progression</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

function timeToDecimal(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
