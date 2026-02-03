import type { Quest } from '../../types';
import styles from './Quests.module.css';

interface Props {
  quests: Quest[];
}

const categoryLabels: Record<Quest['category'], string> = {
  workout: 'Workout',
  sleep: 'Sleep',
  nutrition: 'Nutrition',
  general: 'General',
};

const categoryIcons: Record<Quest['category'], string> = {
  workout: '🏋️',
  sleep: '😴',
  nutrition: '🥗',
  general: '⭐',
};

const typeColors: Record<Quest['type'], string> = {
  daily: '#4ade80',
  weekly: '#60a5fa',
  monthly: '#a78bfa',
  milestone: '#fbbf24',
};

export function Quests({ quests }: Props) {
  const activeQuests = quests.filter((q) => !q.completed);
  const completedCount = quests.filter((q) => q.completed).length;

  // Group by category
  const workoutQuests = activeQuests.filter((q) => q.category === 'workout');
  const sleepQuests = activeQuests.filter((q) => q.category === 'sleep');
  const nutritionQuests = activeQuests.filter((q) => q.category === 'nutrition');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Active Quests</h3>
        <span className={styles.completed}>{completedCount} completed</span>
      </div>

      {activeQuests.length === 0 ? (
        <p className={styles.empty}>All quests completed!</p>
      ) : (
        <div className={styles.categories}>
          {workoutQuests.length > 0 && (
            <QuestCategory
              category="workout"
              quests={workoutQuests}
            />
          )}
          {sleepQuests.length > 0 && (
            <QuestCategory
              category="sleep"
              quests={sleepQuests}
            />
          )}
          {nutritionQuests.length > 0 && (
            <QuestCategory
              category="nutrition"
              quests={nutritionQuests}
            />
          )}
        </div>
      )}
    </div>
  );
}

function QuestCategory({
  category,
  quests,
}: {
  category: Quest['category'];
  quests: Quest[];
}) {
  return (
    <div className={styles.category}>
      <div className={styles.categoryHeader}>
        <span className={styles.categoryIcon}>{categoryIcons[category]}</span>
        <span className={styles.categoryLabel}>{categoryLabels[category]}</span>
      </div>
      <div className={styles.questList}>
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>
    </div>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const progress = Math.min((quest.progress / quest.target) * 100, 100);

  return (
    <div className={`${styles.quest} ${quest.completed ? styles.completed : ''}`}>
      <div className={styles.questHeader}>
        <span
          className={styles.questType}
          style={{ backgroundColor: typeColors[quest.type] }}
        >
          {quest.type}
        </span>
        <span className={styles.xpReward}>+{quest.xpReward} XP</span>
      </div>

      <h4 className={styles.questTitle}>{quest.title}</h4>
      <p className={styles.questDesc}>{quest.description}</p>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${progress}%`,
              backgroundColor: quest.completed ? '#4ade80' : typeColors[quest.type],
            }}
          />
        </div>
        <span className={styles.progressText}>
          {quest.progress} / {quest.target}
        </span>
      </div>
    </div>
  );
}
