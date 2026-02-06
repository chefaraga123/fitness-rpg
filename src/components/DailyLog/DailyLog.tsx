import { useState, useMemo } from 'react';
import type { WorkoutSet, DailyLog as DailyLogType } from '../../types';
import styles from './DailyLog.module.css';

interface Props {
  existingSets: WorkoutSet[];
  existingLogs: DailyLogType[];
  onAddSets: (sets: WorkoutSet[]) => void;
  onAddLog: (log: DailyLogType) => void;
}

type Section = 'workout' | 'lifestyle';

export function DailyLog({ existingSets, existingLogs, onAddSets, onAddLog }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('workout');

  // Workout state
  const [workoutDate, setWorkoutDate] = useState(getTodayDate());
  const [sets, setSets] = useState<Array<{ exercise: string; weight: string; reps: string }>>([
    { exercise: '', weight: '', reps: '' },
  ]);

  // Lifestyle state
  const [logDate, setLogDate] = useState(getTodayDate());
  const [sleepHours, setSleepHours] = useState('');
  const [sleepMinutes, setSleepMinutes] = useState('');
  const [sleepScore, setSleepScore] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [meal1, setMeal1] = useState('');
  const [meal2, setMeal2] = useState('');
  const [meal3, setMeal3] = useState('');
  const [snacks, setSnacks] = useState('');
  const [selectedSupplements, setSelectedSupplements] = useState<Set<string>>(new Set());
  const [newSupplement, setNewSupplement] = useState('');

  // Get known exercises for autocomplete
  const knownExercises = useMemo(() => {
    const exercises = new Set<string>();
    existingSets.forEach((s) => exercises.add(s.exercise));
    return Array.from(exercises).sort();
  }, [existingSets]);

  // Get known supplements from existing logs
  const knownSupplements = useMemo(() => {
    const supplements = new Set<string>();
    existingLogs.forEach((log) => {
      Object.keys(log.supplements).forEach((s) => supplements.add(s));
    });
    return Array.from(supplements).sort();
  }, [existingLogs]);

  const addSetRow = () => {
    setSets([...sets, { exercise: '', weight: '', reps: '' }]);
  };

  const updateSet = (index: number, field: 'exercise' | 'weight' | 'reps', value: string) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleSubmitWorkout = () => {
    const validSets = sets.filter(
      (s) => s.exercise.trim() && s.weight && s.reps
    );

    if (validSets.length === 0) {
      alert('Please add at least one complete set');
      return;
    }

    const newSets: WorkoutSet[] = validSets.map((s, i) => ({
      id: `${workoutDate}-${Date.now()}-${i}`,
      date: workoutDate,
      exercise: s.exercise.trim(),
      weight: parseFloat(s.weight),
      reps: parseInt(s.reps, 10),
    }));

    onAddSets(newSets);
    setSets([{ exercise: '', weight: '', reps: '' }]);
    alert(`Added ${newSets.length} sets!`);
  };

  const toggleSupplement = (supp: string) => {
    setSelectedSupplements((prev) => {
      const next = new Set(prev);
      if (next.has(supp)) {
        next.delete(supp);
      } else {
        next.add(supp);
      }
      return next;
    });
  };

  const addNewSupplement = () => {
    const trimmed = newSupplement.trim();
    if (trimmed && !knownSupplements.includes(trimmed)) {
      setSelectedSupplements((prev) => new Set([...prev, trimmed]));
      setNewSupplement('');
    }
  };

  const handleSubmitLifestyle = () => {
    const sleepDuration = sleepHours || sleepMinutes
      ? (parseInt(sleepHours || '0', 10) * 60) + parseInt(sleepMinutes || '0', 10)
      : undefined;

    const supplements: Record<string, boolean> = {};
    const allSupps = new Set([...knownSupplements, ...selectedSupplements]);
    allSupps.forEach((supp) => {
      supplements[supp] = selectedSupplements.has(supp);
    });

    const mealsLogged = [meal1, meal2, meal3].filter((m) => m.trim()).length;
    const supplementsTaken = selectedSupplements.size;
    const supplementsTotal = allSupps.size;

    const log: DailyLogType = {
      date: logDate,
      sleepDuration,
      sleepScore: sleepScore ? parseInt(sleepScore, 10) : undefined,
      wakeTime: wakeTime || undefined,
      meal1: meal1.trim() || undefined,
      meal2: meal2.trim() || undefined,
      meal3: meal3.trim() || undefined,
      snacks: snacks.trim() || undefined,
      mealsLogged,
      supplements,
      supplementsTaken,
      supplementsTotal,
    };

    onAddLog(log);

    // Reset form
    setSleepHours('');
    setSleepMinutes('');
    setSleepScore('');
    setWakeTime('');
    setMeal1('');
    setMeal2('');
    setMeal3('');
    setSnacks('');
    setSelectedSupplements(new Set());

    alert('Daily log saved!');
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeSection === 'workout' ? styles.active : ''}`}
          onClick={() => setActiveSection('workout')}
        >
          Log Workout
        </button>
        <button
          className={`${styles.tab} ${activeSection === 'lifestyle' ? styles.active : ''}`}
          onClick={() => setActiveSection('lifestyle')}
        >
          Log Day
        </button>
      </div>

      {activeSection === 'workout' && (
        <div className={styles.section}>
          <div className={styles.dateField}>
            <label>Date</label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.setsSection}>
            <h4 className={styles.setsTitle}>Sets</h4>
            {sets.map((set, index) => (
              <div key={index} className={styles.setRow}>
                <input
                  type="text"
                  placeholder="Exercise"
                  value={set.exercise}
                  onChange={(e) => updateSet(index, 'exercise', e.target.value)}
                  list="exercises"
                  className={styles.exerciseInput}
                />
                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight}
                  onChange={(e) => updateSet(index, 'weight', e.target.value)}
                  className={styles.numberInput}
                />
                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) => updateSet(index, 'reps', e.target.value)}
                  className={styles.numberInput}
                />
                <button
                  onClick={() => removeSet(index)}
                  className={styles.removeBtn}
                  disabled={sets.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <datalist id="exercises">
              {knownExercises.map((ex) => (
                <option key={ex} value={ex} />
              ))}
            </datalist>
            <button onClick={addSetRow} className={styles.addSetBtn}>
              + Add Set
            </button>
          </div>

          <button onClick={handleSubmitWorkout} className={styles.submitBtn}>
            Save Workout
          </button>
        </div>
      )}

      {activeSection === 'lifestyle' && (
        <div className={styles.section}>
          <div className={styles.dateField}>
            <label>Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.groupTitle}>Sleep</h4>
            <div className={styles.sleepRow}>
              <div className={styles.sleepDuration}>
                <input
                  type="number"
                  placeholder="hrs"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className={styles.smallInput}
                  min="0"
                  max="24"
                />
                <span>h</span>
                <input
                  type="number"
                  placeholder="min"
                  value={sleepMinutes}
                  onChange={(e) => setSleepMinutes(e.target.value)}
                  className={styles.smallInput}
                  min="0"
                  max="59"
                />
                <span>m</span>
              </div>
              <input
                type="number"
                placeholder="Score (0-100)"
                value={sleepScore}
                onChange={(e) => setSleepScore(e.target.value)}
                className={styles.scoreInput}
                min="0"
                max="100"
              />
              <input
                type="time"
                placeholder="Wake time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className={styles.timeInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.groupTitle}>Meals</h4>
            <div className={styles.mealsGrid}>
              <input
                type="text"
                placeholder="Breakfast"
                value={meal1}
                onChange={(e) => setMeal1(e.target.value)}
                className={styles.mealInput}
              />
              <input
                type="text"
                placeholder="Lunch"
                value={meal2}
                onChange={(e) => setMeal2(e.target.value)}
                className={styles.mealInput}
              />
              <input
                type="text"
                placeholder="Dinner"
                value={meal3}
                onChange={(e) => setMeal3(e.target.value)}
                className={styles.mealInput}
              />
              <input
                type="text"
                placeholder="Snacks"
                value={snacks}
                onChange={(e) => setSnacks(e.target.value)}
                className={styles.mealInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.groupTitle}>Supplements</h4>
            <div className={styles.supplementGrid}>
              {knownSupplements.map((supp) => (
                <button
                  key={supp}
                  type="button"
                  className={`${styles.suppBtn} ${selectedSupplements.has(supp) ? styles.selected : ''}`}
                  onClick={() => toggleSupplement(supp)}
                >
                  {supp}
                </button>
              ))}
            </div>
            <div className={styles.addSuppRow}>
              <input
                type="text"
                placeholder="Add new supplement..."
                value={newSupplement}
                onChange={(e) => setNewSupplement(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewSupplement()}
                className={styles.addSuppInput}
              />
              <button onClick={addNewSupplement} className={styles.addSuppBtn}>
                Add
              </button>
            </div>
          </div>

          <button onClick={handleSubmitLifestyle} className={styles.submitBtn}>
            Save Day
          </button>
        </div>
      )}
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
