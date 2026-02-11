import { useMemo, useState } from 'react';
import type { DailyLog } from '../../types';
import styles from './Stats.module.css';

interface Props {
  dailyLogs: DailyLog[];
}

type DayStatus = 'full' | 'partial' | 'missed' | 'empty';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SupplementCalendar({ dailyLogs }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    dailyLogs.forEach((l) => map.set(l.date, l));
    return map;
  }, [dailyLogs]);

  const { days, fullCount, totalTracked } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pad start with empty cells for alignment
    const startPadding = firstDay.getDay();
    const daysArr: { day: number; status: DayStatus; dateStr: string }[] = [];

    // Empty padding cells
    for (let i = 0; i < startPadding; i++) {
      daysArr.push({ day: 0, status: 'empty', dateStr: '' });
    }

    let full = 0;
    let tracked = 0;

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      if (date > today) {
        daysArr.push({ day: d, status: 'empty', dateStr });
        continue;
      }

      const log = logMap.get(dateStr);
      let status: DayStatus = 'empty';

      if (log && log.supplementsTotal > 0) {
        tracked++;
        if (log.supplementsTaken >= log.supplementsTotal) {
          status = 'full';
          full++;
        } else if (log.supplementsTaken > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      daysArr.push({ day: d, status, dateStr });
    }

    return { days: daysArr, fullCount: full, totalTracked: tracked };
  }, [currentMonth, logMap]);

  const monthLabel = currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const pct = totalTracked > 0 ? Math.round((fullCount / totalTracked) * 100) : 0;

  const prevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const now = new Date();
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date(now.getFullYear(), now.getMonth() + 1, 1)) {
      setCurrentMonth(next);
    }
  };

  return (
    <div className={styles.calendarContainer}>
      <h4 className={styles.chartTitle}>Supplement Adherence</h4>
      <div className={styles.calendarNav}>
        <button className={styles.calendarNavBtn} onClick={prevMonth}>&lt;</button>
        <span>{monthLabel}</span>
        <button className={styles.calendarNavBtn} onClick={nextMonth}>&gt;</button>
      </div>

      <div className={styles.calendarGrid}>
        {DAY_HEADERS.map((dh) => (
          <div key={dh} className={styles.calendarDayHeader}>{dh}</div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className={`${styles.calendarCell} ${d.status !== 'empty' ? styles[d.status] : ''}`}
            title={d.dateStr && d.status !== 'empty' ? `${d.dateStr}: ${d.status}` : d.dateStr || ''}
          >
            {d.day > 0 ? d.day : ''}
          </div>
        ))}
      </div>

      <div className={styles.calendarSummary}>
        {totalTracked > 0
          ? `${fullCount}/${totalTracked} days full adherence (${pct}%)`
          : 'No supplement data this month'}
      </div>
    </div>
  );
}
