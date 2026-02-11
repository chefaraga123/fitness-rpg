import { Fragment, useMemo } from 'react';
import type { Workout, DailyLog } from '../../types';
import styles from './Stats.module.css';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface Props {
  workouts: Workout[];
  dailyLogs: DailyLog[];
  timeRange: TimeRange;
}

const INTENSITY_COLORS = [
  'transparent',
  'rgba(74,222,128,0.15)',
  'rgba(74,222,128,0.3)',
  'rgba(74,222,128,0.5)',
  'rgba(74,222,128,0.7)',
  'rgba(74,222,128,1.0)',
];

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

export function ActivityHeatmap({ workouts, dailyLogs, timeRange }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const workoutDates = new Set(workouts.map((w) => w.date));

    const logMap = new Map<string, DailyLog>();
    dailyLogs.forEach((l) => logMap.set(l.date, l));

    // Build activity score map
    const scoreMap = new Map<string, number>();
    const allDates = new Set([...workoutDates, ...dailyLogs.map((l) => l.date)]);
    allDates.forEach((date) => {
      let score = 0;
      if (workoutDates.has(date)) score += 2;
      const log = logMap.get(date);
      if (log) {
        if (log.sleepDuration || log.sleepScore) score += 1;
        if (log.mealsLogged > 0) score += 1;
        if (log.supplementsTotal > 0 && log.supplementsTaken >= log.supplementsTotal) score += 1;
      }
      scoreMap.set(date, Math.min(score, 5));
    });

    // Determine start date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let startDate: Date;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 86400000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 86400000);
        break;
      default: {
        const allDatesSorted = [...allDates].sort();
        startDate = allDatesSorted.length > 0 ? new Date(allDatesSorted[0]) : new Date(now.getTime() - 90 * 86400000);
        break;
      }
    }

    // Align start to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // Build weeks grid
    const weeksArr: { date: string; score: number; dayOfWeek: number }[][] = [];
    const monthLabelsArr: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);

    while (cursor <= now) {
      const week: { date: string; score: number; dayOfWeek: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        const isInRange = cursor <= now;
        week.push({
          date: dateStr,
          score: isInRange ? (scoreMap.get(dateStr) || 0) : -1,
          dayOfWeek: d,
        });

        // Track month labels
        if (d === 0 && cursor.getMonth() !== lastMonth) {
          lastMonth = cursor.getMonth();
          monthLabelsArr.push({
            label: cursor.toLocaleDateString('en', { month: 'short' }),
            colIndex: weeksArr.length,
          });
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, monthLabels: monthLabelsArr };
  }, [workouts, dailyLogs, timeRange]);

  if (weeks.length === 0) {
    return <p className={styles.noData}>No activity data to display</p>;
  }

  return (
    <div className={styles.heatmapContainer}>
      <h4 className={styles.chartTitle}>Activity Heatmap</h4>
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div
          className={styles.heatmapGrid}
          style={{ gridTemplateColumns: `28px repeat(${weeks.length}, 1fr)` }}
        >
          {/* Month labels row */}
          <div />
          {weeks.map((_, colIdx) => {
            const ml = monthLabels.find((m) => m.colIndex === colIdx);
            return (
              <div key={colIdx} className={styles.heatmapMonthLabel}>
                {ml ? ml.label : ''}
              </div>
            );
          })}

          {/* Day rows */}
          {Array.from({ length: 7 }).map((_, rowIdx) => (
            <Fragment key={rowIdx}>
              <div className={styles.heatmapDayLabel}>
                {DAY_LABELS[rowIdx]}
              </div>
              {weeks.map((week, colIdx) => {
                const cell = week[rowIdx];
                if (!cell || cell.score === -1) {
                  return <div key={`${colIdx}-${rowIdx}`} className={styles.heatmapCell} />;
                }
                const logDetails: string[] = [cell.date];
                if (cell.score > 0) logDetails.push(`Activity score: ${cell.score}/5`);
                return (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    className={styles.heatmapCell}
                    style={{ backgroundColor: INTENSITY_COLORS[cell.score] }}
                    title={logDetails.join('\n')}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className={styles.heatmapCell}
            style={{ backgroundColor: color, display: 'inline-block' }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
