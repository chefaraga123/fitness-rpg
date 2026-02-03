import type { Character as CharacterType } from '../../types';
import styles from './Character.module.css';

interface Props {
  character: CharacterType;
}

export function Character({ character }: Props) {
  const xpPercentage = (character.xp / character.xpToNextLevel) * 100;

  const formatVolume = (kg: number) => {
    if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M`;
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}K`;
    return kg.toString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.name}>{character.name}</h2>
        <span className={styles.level}>Level {character.level}</span>
      </div>

      <div className={styles.xpSection}>
        <div className={styles.xpBar}>
          <div
            className={styles.xpFill}
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
        <span className={styles.xpText}>
          {character.xp} / {character.xpToNextLevel} XP
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{character.totalWorkouts}</span>
          <span className={styles.statLabel}>Workouts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{character.totalSets}</span>
          <span className={styles.statLabel}>Total Sets</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatVolume(character.totalWeight)}kg</span>
          <span className={styles.statLabel}>Volume Lifted</span>
        </div>
      </div>
    </div>
  );
}
