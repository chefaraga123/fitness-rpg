import type { Achievement } from '../../types';
import styles from './Achievements.module.css';

interface Props {
  achievements: Achievement[];
}

export function Achievements({ achievements }: Props) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Achievements ({unlocked.length}/{achievements.length})
      </h3>

      <div className={styles.grid}>
        {unlocked.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
        {locked.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={`${styles.badge} ${achievement.unlocked ? styles.unlocked : styles.locked}`}
    >
      <span className={styles.icon}>
        {achievement.unlocked ? achievement.icon : '🔒'}
      </span>
      <span className={styles.badgeTitle}>{achievement.title}</span>
      <div className={styles.tooltip}>
        <strong>{achievement.title}</strong>
        <p>{achievement.description}</p>
        {achievement.unlocked && achievement.unlockedAt && (
          <span className={styles.unlockedDate}>
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
