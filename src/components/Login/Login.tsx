import { useState } from 'react';
import styles from './Login.module.css';

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ error?: string }>;
}

export function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await onSignIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Fitness RPG</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
