import { useState } from 'react';
import styles from './WelcomeScreen.module.css';

interface Props {
  onStart: (name: string) => void;
}

export function WelcomeScreen({ onStart }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Fitness RPG</h1>
        <p className={styles.subtitle}>
          Transform your workouts into epic quests
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Enter your character name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hero"
            className={styles.input}
            autoFocus
          />
          <button type="submit" className={styles.button} disabled={!name.trim()}>
            Begin Your Journey
          </button>
        </form>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📊</span>
            <span>Import workout data from CSV</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📜</span>
            <span>Complete quests for XP</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🏆</span>
            <span>Unlock achievements</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⬆️</span>
            <span>Level up your character</span>
          </div>
        </div>
      </div>
    </div>
  );
}
