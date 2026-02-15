import { useState, useMemo } from 'react';
import type { WorkoutSet } from '../../types';
import { renameExercise } from '../../lib/fetchWorkouts';
import styles from './ExerciseMerge.module.css';

interface Props {
  sets: WorkoutSet[];
  onMerge: (oldNames: string[], newName: string) => void;
}

export function ExerciseMerge({ sets, onMerge }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [targetName, setTargetName] = useState('');
  const [customName, setCustomName] = useState('');
  const [merging, setMerging] = useState(false);

  const exercises = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sets) {
      counts.set(s.exercise, (counts.get(s.exercise) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [sets]);

  const selectedExercises = useMemo(
    () => exercises.filter((e) => checked.has(e.name)),
    [exercises, checked]
  );

  const toggleExercise = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const resolvedTarget = targetName === '__custom__' ? customName.trim() : targetName;
  const canMerge = checked.size >= 2 && resolvedTarget.length > 0 && !merging;

  const handleMerge = async () => {
    if (!canMerge) return;

    const oldNames = Array.from(checked).filter((n) => n !== resolvedTarget);
    if (oldNames.length === 0) return;

    setMerging(true);
    try {
      await renameExercise(oldNames, resolvedTarget);
      onMerge(oldNames, resolvedTarget);
      setChecked(new Set());
      setTargetName('');
      setCustomName('');
    } catch {
      alert('Failed to merge exercises. Check the console for details.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Manage Exercises</h3>

      {exercises.length === 0 ? (
        <p className={styles.empty}>No exercises found. Import workout data first.</p>
      ) : (
        <div className={styles.list}>
          {exercises.map(({ name, count }) => (
            <label key={name} className={styles.row}>
              <input
                type="checkbox"
                checked={checked.has(name)}
                onChange={() => toggleExercise(name)}
                className={styles.checkbox}
              />
              <span className={styles.exerciseName}>{name}</span>
              <span className={styles.setCount}>{count} sets</span>
            </label>
          ))}
        </div>
      )}

      {checked.size >= 2 && (
        <div className={styles.mergeBar}>
          <span className={styles.mergeLabel}>
            Merge {checked.size} exercises into:
          </span>
          <div className={styles.mergeControls}>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className={styles.mergeSelect}
            >
              <option value="">Select name...</option>
              {selectedExercises.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>
            {targetName === '__custom__' && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter exercise name"
                className={styles.customInput}
                autoFocus
              />
            )}
            <button
              onClick={handleMerge}
              disabled={!canMerge}
              className={styles.mergeBtn}
            >
              {merging ? 'Merging...' : 'Merge'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
