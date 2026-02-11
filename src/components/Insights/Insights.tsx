import { useMemo, useState } from 'react';
import type { Workout, DailyLog } from '../../types';
import { calculateLogStreak } from '../../utils/gameLogic';
import styles from './Insights.module.css';

interface Props {
  workouts: Workout[];
  dailyLogs: DailyLog[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function timeToMinutes(time: string, isBedtime = false): number {
  const [h, m] = time.split(':').map(Number);
  const mins = h * 60 + m;
  if (isBedtime && mins < 720) return mins + 1440; // before noon → treat as after midnight
  return mins;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

function calculateWorkoutStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const dates = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(dates[i]);
    const next = new Date(dates[i + 1]);
    const diffDays = Math.floor(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function Insights({ workouts, dailyLogs }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

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

  // === A. Trend Cards (always last 7d vs prior 7d) ===
  const trends = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekLogs = dailyLogs.filter((l) => new Date(l.date) >= sevenDaysAgo);
    const lastWeekLogs = dailyLogs.filter(
      (l) => new Date(l.date) >= fourteenDaysAgo && new Date(l.date) < sevenDaysAgo
    );
    const thisWeekWorkouts = workouts.filter((w) => new Date(w.date) >= sevenDaysAgo);
    const lastWeekWorkouts = workouts.filter(
      (w) => new Date(w.date) >= fourteenDaysAgo && new Date(w.date) < sevenDaysAgo
    );

    const avgSleepThis = thisWeekLogs.filter((l) => l.sleepDuration != null);
    const avgSleepLast = lastWeekLogs.filter((l) => l.sleepDuration != null);
    const sleepDurThis =
      avgSleepThis.length > 0
        ? avgSleepThis.reduce((s, l) => s + l.sleepDuration!, 0) / avgSleepThis.length
        : 0;
    const sleepDurLast =
      avgSleepLast.length > 0
        ? avgSleepLast.reduce((s, l) => s + l.sleepDuration!, 0) / avgSleepLast.length
        : 0;

    const sleepScoreThis = thisWeekLogs.filter((l) => l.sleepScore != null);
    const sleepScoreLast = lastWeekLogs.filter((l) => l.sleepScore != null);
    const avgScoreThis =
      sleepScoreThis.length > 0
        ? sleepScoreThis.reduce((s, l) => s + l.sleepScore!, 0) / sleepScoreThis.length
        : 0;
    const avgScoreLast =
      sleepScoreLast.length > 0
        ? sleepScoreLast.reduce((s, l) => s + l.sleepScore!, 0) / sleepScoreLast.length
        : 0;

    const volThis = thisWeekWorkouts.reduce((s, w) => s + w.totalVolume, 0);
    const volLast = lastWeekWorkouts.reduce((s, w) => s + w.totalVolume, 0);

    const suppThis = thisWeekLogs.filter((l) => l.supplementsTotal > 0);
    const suppLast = lastWeekLogs.filter((l) => l.supplementsTotal > 0);
    const suppRateThis =
      suppThis.length > 0
        ? (suppThis.filter((l) => l.supplementsTaken >= l.supplementsTotal).length /
            suppThis.length) *
          100
        : 0;
    const suppRateLast =
      suppLast.length > 0
        ? (suppLast.filter((l) => l.supplementsTaken >= l.supplementsTotal).length /
            suppLast.length) *
          100
        : 0;

    const mealsThis =
      thisWeekLogs.length > 0
        ? thisWeekLogs.reduce((s, l) => s + l.mealsLogged, 0) / 7
        : 0;
    const mealsLast =
      lastWeekLogs.length > 0
        ? lastWeekLogs.reduce((s, l) => s + l.mealsLogged, 0) / 7
        : 0;

    function pctChange(curr: number, prev: number) {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    }

    return [
      {
        label: 'Avg Sleep Duration',
        value: sleepDurThis > 0 ? formatDuration(sleepDurThis) : '--',
        change: pctChange(sleepDurThis, sleepDurLast),
      },
      {
        label: 'Avg Sleep Score',
        value: avgScoreThis > 0 ? Math.round(avgScoreThis).toString() : '--',
        change: pctChange(avgScoreThis, avgScoreLast),
      },
      {
        label: 'Workout Volume',
        value: volThis > 0 ? `${(volThis / 1000).toFixed(1)}K` : '--',
        change: pctChange(volThis, volLast),
      },
      {
        label: 'Supplement Adherence',
        value: suppThis.length > 0 ? `${Math.round(suppRateThis)}%` : '--',
        change: pctChange(suppRateThis, suppRateLast),
      },
      {
        label: 'Meals / Day',
        value: mealsThis > 0 ? mealsThis.toFixed(1) : '--',
        change: pctChange(mealsThis, mealsLast),
      },
    ];
  }, [dailyLogs, workouts]);

  // === B. Current Streaks ===
  const streaks = useMemo(() => {
    const workoutStreak = calculateWorkoutStreak(workouts);
    const sleepStreak = calculateLogStreak(
      dailyLogs,
      (l) => !!(l.sleepDuration || l.sleepScore)
    );
    const supplementStreak = calculateLogStreak(
      dailyLogs.filter(
        (l) => l.supplementsTotal > 0 && l.supplementsTaken >= l.supplementsTotal
      ),
      () => true
    );
    const mealStreak = calculateLogStreak(dailyLogs, (l) => l.mealsLogged > 0);

    return [
      { label: 'Workout', value: workoutStreak },
      { label: 'Sleep Logging', value: sleepStreak },
      { label: 'Full Supplements', value: supplementStreak },
      { label: 'Meal Logging', value: mealStreak },
    ];
  }, [workouts, dailyLogs]);

  // === C. Correlations (filtered by timeRange) ===
  const correlations = useMemo(() => {
    const filteredLogs = dailyLogs.filter((l) => new Date(l.date) >= cutoffDate);
    const filteredWorkouts = workouts.filter((w) => new Date(w.date) >= cutoffDate);

    // Sleep vs Workout: avg volume on well-rested vs poorly-rested days
    const logsWithScore = filteredLogs.filter((l) => l.sleepScore != null);
    const scores = logsWithScore.map((l) => l.sleepScore!);
    const medianScore =
      scores.length > 0
        ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)]
        : 0;

    const workoutByDate = new Map<string, number>();
    for (const w of filteredWorkouts) {
      workoutByDate.set(w.date, (workoutByDate.get(w.date) || 0) + w.totalVolume);
    }

    // For each log with a sleep score, check if there's a workout the next day
    const wellRestedVolumes: number[] = [];
    const poorlyRestedVolumes: number[] = [];
    for (const log of logsWithScore) {
      const nextDay = getNextDay(log.date);
      const vol = workoutByDate.get(nextDay);
      if (vol != null) {
        if (log.sleepScore! > medianScore) {
          wellRestedVolumes.push(vol);
        } else {
          poorlyRestedVolumes.push(vol);
        }
      }
    }

    const sleepVsWorkout =
      wellRestedVolumes.length >= 4 && poorlyRestedVolumes.length >= 4
        ? {
            wellRested: Math.round(
              wellRestedVolumes.reduce((a, b) => a + b, 0) / wellRestedVolumes.length
            ),
            poorlyRested: Math.round(
              poorlyRestedVolumes.reduce((a, b) => a + b, 0) / poorlyRestedVolumes.length
            ),
          }
        : null;

    // Supplements vs Sleep: avg sleep score on full-adherence vs partial days
    const fullAdherenceScores: number[] = [];
    const partialAdherenceScores: number[] = [];
    for (const log of filteredLogs) {
      if (log.sleepScore == null || log.supplementsTotal === 0) continue;
      if (log.supplementsTaken >= log.supplementsTotal) {
        fullAdherenceScores.push(log.sleepScore);
      } else {
        partialAdherenceScores.push(log.sleepScore);
      }
    }

    const supplementsVsSleep =
      fullAdherenceScores.length >= 4 && partialAdherenceScores.length >= 4
        ? {
            fullAdherence: Math.round(
              fullAdherenceScores.reduce((a, b) => a + b, 0) / fullAdherenceScores.length
            ),
            partial: Math.round(
              partialAdherenceScores.reduce((a, b) => a + b, 0) /
                partialAdherenceScores.length
            ),
          }
        : null;

    return { sleepVsWorkout, supplementsVsSleep };
  }, [dailyLogs, workouts, cutoffDate]);

  // === D. Consistency Metrics (filtered by timeRange) ===
  const consistency = useMemo(() => {
    const filteredLogs = dailyLogs.filter((l) => new Date(l.date) >= cutoffDate);
    const filteredWorkouts = workouts.filter((w) => new Date(w.date) >= cutoffDate);

    const bedtimes = filteredLogs
      .filter((l) => l.bedtime)
      .map((l) => timeToMinutes(l.bedtime!, true));
    const wakeTimes = filteredLogs
      .filter((l) => l.wakeTime)
      .map((l) => timeToMinutes(l.wakeTime!));

    const bedtimeVariability = bedtimes.length >= 2 ? Math.round(stdDev(bedtimes)) : null;
    const wakeTimeVariability =
      wakeTimes.length >= 2 ? Math.round(stdDev(wakeTimes)) : null;

    let workoutsPerWeek: number | null = null;
    if (filteredWorkouts.length > 0) {
      const dates = filteredWorkouts.map((w) => new Date(w.date).getTime());
      const spanMs = Math.max(...dates) - Math.min(...dates);
      const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
      workoutsPerWeek = parseFloat((filteredWorkouts.length / spanWeeks).toFixed(1));
    }

    return { bedtimeVariability, wakeTimeVariability, workoutsPerWeek };
  }, [dailyLogs, workouts, cutoffDate]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Insights</h3>
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

      {/* A. Trend Cards */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>This Week vs Last Week</h4>
        <div className={styles.grid}>
          {trends.map((t) => (
            <div key={t.label} className={styles.card}>
              <div className={styles.cardLabel}>{t.label}</div>
              <div className={styles.cardValue}>{t.value}</div>
              {t.value !== '--' && (
                <div
                  className={`${styles.cardChange} ${
                    t.change > 0 ? styles.up : t.change < 0 ? styles.down : styles.flat
                  }`}
                >
                  {t.change > 0 ? '\u2191' : t.change < 0 ? '\u2193' : '\u2192'}{' '}
                  {Math.abs(t.change)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* B. Current Streaks */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Current Streaks</h4>
        <div className={styles.grid}>
          {streaks.map((s) => (
            <div key={s.label} className={styles.card}>
              <div className={styles.streakValue}>
                {s.value} {s.value === 1 ? 'day' : 'days'}
              </div>
              <div className={styles.streakLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* C. Correlations */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Correlations</h4>

        <div className={styles.correlationCard}>
          <div className={styles.correlationTitle}>Sleep Quality vs Workout Volume</div>
          {correlations.sleepVsWorkout ? (
            <>
              <div className={styles.correlationRow}>
                <span className={styles.correlationLabel}>Well-rested days</span>
                <span className={styles.correlationValue}>
                  {(correlations.sleepVsWorkout.wellRested / 1000).toFixed(1)}K kg
                </span>
              </div>
              <div className={styles.correlationRow}>
                <span className={styles.correlationLabel}>Poorly-rested days</span>
                <span className={styles.correlationValue}>
                  {(correlations.sleepVsWorkout.poorlyRested / 1000).toFixed(1)}K kg
                </span>
              </div>
            </>
          ) : (
            <div className={styles.insufficientData}>
              Insufficient data — need at least 4 workout days in each sleep quality group.
            </div>
          )}
        </div>

        <div className={styles.correlationCard}>
          <div className={styles.correlationTitle}>Supplements vs Sleep Quality</div>
          {correlations.supplementsVsSleep ? (
            <>
              <div className={styles.correlationRow}>
                <span className={styles.correlationLabel}>Full adherence days</span>
                <span className={styles.correlationValue}>
                  Score: {correlations.supplementsVsSleep.fullAdherence}
                </span>
              </div>
              <div className={styles.correlationRow}>
                <span className={styles.correlationLabel}>Partial adherence days</span>
                <span className={styles.correlationValue}>
                  Score: {correlations.supplementsVsSleep.partial}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.insufficientData}>
              Insufficient data — need at least 4 days in each adherence group with sleep
              scores.
            </div>
          )}
        </div>
      </div>

      {/* D. Consistency Metrics */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Consistency</h4>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.metricValue}>
              {consistency.bedtimeVariability != null
                ? `${consistency.bedtimeVariability} min`
                : '--'}
            </div>
            <div className={styles.metricLabel}>Bedtime variability (std dev)</div>
          </div>
          <div className={styles.card}>
            <div className={styles.metricValue}>
              {consistency.wakeTimeVariability != null
                ? `${consistency.wakeTimeVariability} min`
                : '--'}
            </div>
            <div className={styles.metricLabel}>Wake time variability (std dev)</div>
          </div>
          <div className={styles.card}>
            <div className={styles.metricValue}>
              {consistency.workoutsPerWeek != null
                ? consistency.workoutsPerWeek
                : '--'}
            </div>
            <div className={styles.metricLabel}>Workouts per week</div>
          </div>
        </div>
      </div>
    </div>
  );
}
