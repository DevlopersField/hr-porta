// components/ui/Toast.tsx
// Server-rendered save confirmation: appears bottom-right after an action
// sets the notice flash, fades out via CSS. No client JS needed.

// ============= IMPORTS =============
import styles from './Toast.module.css';

// ============= COMPONENT =============
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      {message}
    </div>
  );
}
