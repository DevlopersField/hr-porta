// components/layout/TopBar.tsx

// ============= IMPORTS =============
import { Bell, Search } from 'lucide-react';
import styles from './TopBar.module.css';

// ============= TYPES =============
type Props = { user: { name: string } };

// ============= COMPONENT =============
export function TopBar({ user }: Props) {
  return (
    <header className={`${styles.topbar} glass-panel`}>
      <div className={styles.searchWrap}>
        <Search size={16} />
        <input
          className={styles.search}
          type="search"
          placeholder="Search..."
          aria-label="Global search"
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className={styles.userBadge}>{user.name}</div>
      </div>
    </header>
  );
}
