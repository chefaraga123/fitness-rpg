import { useState } from 'react';
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const activeQuests = quests.filter((q) => !q.completed);
  const completedCount = quests.filter((q) => q.completed).length;

  const workoutQuests = activeQuests.filter((q) => q.category === 'workout');
  const sleepQuests = activeQuests.filter((q) => q.category === 'sleep');
  const nutritionQuests = activeQuests.filter((q) => q.category === 'nutrition');

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categories = [
    { key: 'workout', quests: workoutQuests },
    { key: 'sleep', quests: sleepQuests },
    { key: 'nutrition', quests: nutritionQuests },
  ].filter((c) => c.quests.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Quests</h3>
        <span className={styles.completed}>{completedCount} completed</span>
      </div>

      {activeQuests.length === 0 ? (
        <p className={styles.empty}>All quests completed!</p>
      ) : (
        <div className={styles.categories}>
          {categories.map(({ key, quests: categoryQuests }) => {
            const isExpanded = expandedCategories.has(key);
            const category = key as Quest['category'];
            const activeCount = categoryQuests.filter((q) => !q.completed).length;
            const progressCount = categoryQuests.filter((q) => q.progress > 0 && !q.completed).length;

            return (
              <div key={key} className={styles.category}>
                <button
                  className={styles.categoryHeader}
                  onClick={() => toggleCategory(key)}
                >
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryIcon}>{categoryIcons[category]}</span>
                    <span className={styles.categoryLabel}>{categoryLabels[category]}</span>
                    <span className={styles.categoryCount}>
                      {progressCount > 0 ? `${progressCount} in progress` : `${activeCount} active`}
                    </span>
                  </div>
                  <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                    ▶
                  </span>
                </button>

                {isExpanded && (
                  <div className={styles.questList}>
                    {categoryQuests.map((quest) => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const progress = Math.min((quest.progress / quest.target) * 100, 100);

  return (
    <div className={`${styles.quest} ${quest.completed ? styles.completedQuest : ''}`}>
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
