// components/ui/StatusPill.tsx

// ============= IMPORTS =============
import type { ReactNode } from 'react';
import styles from './StatusPill.module.css';

// ============= TYPES =============
type Props = { tone: 'green' | 'amber' | 'red'; children: ReactNode };

// ============= COMPONENT =============
export function StatusPill({ tone, children }: Props) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>;
}
