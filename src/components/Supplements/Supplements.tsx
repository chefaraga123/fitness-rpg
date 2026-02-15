import { useMemo, useState } from 'react';
import type { DailyLog } from '../../types';
import styles from './Supplements.module.css';

interface Props {
  dailyLogs: DailyLog[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function Supplements({ dailyLogs }: Props) {
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

  const filteredLogs = useMemo(
    () => dailyLogs
      .filter((l) => new Date(l.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [dailyLogs, cutoffDate]
  );

  // Get all unique supplements across all logs
  const allSupplements = useMemo(() => {
    const supplementSet = new Set<string>();
    dailyLogs.forEach((log) => {
      Object.keys(log.supplements).forEach((supp) => supplementSet.add(supp));
    });
    return Array.from(supplementSet).sort();
  }, [dailyLogs]);

  // Calculate compliance stats per supplement
  const supplementStats = useMemo(() => {
    return allSupplements.map((supp) => {
      const logsWithSupplement = filteredLogs.filter((log) => supp in log.supplements);
      const taken = logsWithSupplement.filter((log) => log.supplements[supp]).length;
      const total = logsWithSupplement.length;
      const compliance = total > 0 ? Math.round((taken / total) * 100) : 0;

      // Get recent streak
      let streak = 0;
      for (const log of filteredLogs) {
        if (log.supplements[supp]) {
          streak++;
        } else if (supp in log.supplements) {
          break;
        }
      }

      return { name: supp, taken, total, compliance, streak };
    });
  }, [allSupplements, filteredLogs]);

  // Recent consumption history
  const recentHistory = useMemo(() => {
    return filteredLogs.slice(0, 14).map((log) => ({
      date: log.date,
      supplements: log.supplements,
    }));
  }, [filteredLogs]);

  if (dailyLogs.length === 0 || allSupplements.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Supplements</h3>
        <p className={styles.empty}>
          No supplement data yet. Import lifestyle data with supplement columns to track your intake.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Supplements</h3>
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

      <div className={styles.statsGrid}>
        {supplementStats.map((stat) => (
          <div key={stat.name} className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statName}>{stat.name}</span>
              {stat.streak > 0 && (
                <span className={styles.streak}>{stat.streak} day streak</span>
              )}
            </div>
            <div className={styles.statBody}>
              <div className={styles.complianceBar}>
                <div
                  className={styles.complianceFill}
                  style={{
                    width: `${stat.compliance}%`,
                    backgroundColor: stat.compliance >= 80 ? '#4ade80' : stat.compliance >= 50 ? '#fbbf24' : '#ef4444',
                  }}
                />
              </div>
              <div className={styles.statNumbers}>
                <span className={styles.compliancePercent}>{stat.compliance}%</span>
                <span className={styles.statCount}>{stat.taken}/{stat.total} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.historySection}>
        <h4 className={styles.historyTitle}>Recent History</h4>
        <div className={styles.historyTable}>
          <div className={styles.historyHeader}>
            <div className={styles.dateCol}>Date</div>
            {allSupplements.map((supp) => (
              <div key={supp} className={styles.suppCol} title={supp}>
                {supp.length > 10 ? supp.slice(0, 8) + '...' : supp}
              </div>
            ))}
          </div>
          {recentHistory.map((day) => (
            <div key={day.date} className={styles.historyRow}>
              <div className={styles.dateCol}>{formatDate(day.date)}</div>
              {allSupplements.map((supp) => (
                <div key={supp} className={styles.suppCol}>
                  {supp in day.supplements ? (
                    day.supplements[supp] ? (
                      <span className={styles.taken} title={String(day.supplements[supp])}>
                        {day.supplements[supp] !== 'true' && typeof day.supplements[supp] === 'string'
                          ? day.supplements[supp]
                          : '✓'}
                      </span>
                    ) : (
                      <span className={styles.missed}>✗</span>
                    )
                  ) : (
                    <span className={styles.na}>-</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
}
