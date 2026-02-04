import { useMemo, useState } from 'react';
import type { DailyLog } from '../../types';
import styles from './Meals.module.css';

interface Props {
  dailyLogs: DailyLog[];
}

type TimeRange = '7d' | '30d' | 'all';

export function Meals({ dailyLogs }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const cutoffDate = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }, [timeRange]);

  const mealHistory = useMemo(() => {
    return dailyLogs
      .filter((l) => new Date(l.date) >= cutoffDate)
      .filter((l) => l.meal1 || l.meal2 || l.meal3 || l.snacks)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyLogs, cutoffDate]);

  // Get unique meals for quick stats
  const mealStats = useMemo(() => {
    const allMeals: string[] = [];
    mealHistory.forEach((log) => {
      if (log.meal1) allMeals.push(log.meal1);
      if (log.meal2) allMeals.push(log.meal2);
      if (log.meal3) allMeals.push(log.meal3);
    });

    const frequency = new Map<string, number>();
    allMeals.forEach((meal) => {
      const normalized = meal.trim().toLowerCase();
      if (normalized) {
        frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
      }
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([meal, count]) => ({ meal, count }));
  }, [mealHistory]);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Upcoming Meals Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.icon}>📅</span>
            Upcoming Meals
          </h3>
          <div className={styles.upcomingPlaceholder}>
            <p>No meals planned yet</p>
            <span className={styles.hint}>Meal planning coming soon</span>
          </div>
        </div>

        {/* Meal History Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>🍽️</span>
              Meal History
            </h3>
            <div className={styles.timeRangeSelector}>
              {(['7d', '30d', 'all'] as TimeRange[]).map((range) => (
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

          {mealHistory.length === 0 ? (
            <p className={styles.empty}>
              No meal data yet. Import lifestyle data with meal columns to see your history.
            </p>
          ) : (
            <>
              {mealStats.length > 0 && (
                <div className={styles.frequentMeals}>
                  <h4 className={styles.subTitle}>Most Frequent</h4>
                  <div className={styles.mealTags}>
                    {mealStats.map(({ meal, count }) => (
                      <span key={meal} className={styles.mealTag}>
                        {meal} <span className={styles.tagCount}>×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.historyList}>
                {mealHistory.map((log) => (
                  <div key={log.date} className={styles.dayCard}>
                    <div className={styles.dayHeader}>
                      <span className={styles.dayDate}>{formatDate(log.date)}</span>
                      <span className={styles.dayCount}>{log.mealsLogged} meals</span>
                    </div>
                    <div className={styles.mealsGrid}>
                      {log.meal1 && (
                        <div className={styles.mealItem}>
                          <span className={styles.mealLabel}>Breakfast</span>
                          <span className={styles.mealValue}>{log.meal1}</span>
                        </div>
                      )}
                      {log.meal2 && (
                        <div className={styles.mealItem}>
                          <span className={styles.mealLabel}>Lunch</span>
                          <span className={styles.mealValue}>{log.meal2}</span>
                        </div>
                      )}
                      {log.meal3 && (
                        <div className={styles.mealItem}>
                          <span className={styles.mealLabel}>Dinner</span>
                          <span className={styles.mealValue}>{log.meal3}</span>
                        </div>
                      )}
                      {log.snacks && (
                        <div className={styles.mealItem}>
                          <span className={styles.mealLabel}>Snacks</span>
                          <span className={styles.mealValue}>{log.snacks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  const currentYear = today.getFullYear();

  return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
}
