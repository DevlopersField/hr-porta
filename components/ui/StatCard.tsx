// components/ui/StatCard.tsx

// ============= IMPORTS =============
import { ArrowUpRight } from 'lucide-react';
import styles from './StatCard.module.css';

// ============= TYPES =============
type Props = {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: 'green' | 'amber' | 'red' | 'neutral';
  featured?: boolean;
  hint?: string;
};

// ============= COMPONENT =============
export function StatCard({ label, value, delta, deltaTone = 'green', featured = false, hint }: Props) {
  const deltaClass =
    deltaTone === 'amber' ? styles.deltaAmber :
    deltaTone === 'red' ? styles.deltaRed :
    deltaTone === 'neutral' ? styles.deltaNeutral :
    '';
  return (
    <div className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.iconBtn} aria-hidden="true">
          <ArrowUpRight size={14} />
        </span>
      </div>
      <p className={styles.value}>{value}</p>
      {delta && (
        <span className={`${styles.delta} ${deltaClass}`}>{delta}</span>
      )}
      {hint && !delta && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
