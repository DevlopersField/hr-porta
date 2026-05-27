// components/layout/TopBar.tsx

// ============= IMPORTS =============
'use client';
import { Bell, Search, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useDrawer } from './PortalShell';
import type { ThemeIntent } from '@/lib/theme';
import styles from './TopBar.module.css';

// ============= TYPES =============
type Props = {
  user: { name: string };
  themeIntent: ThemeIntent;
};

// ============= COMPONENT =============
export function TopBar({ user, themeIntent }: Props) {
  const { setDrawerOpen } = useDrawer();
  return (
    <header className={`${styles.topbar} glass-panel`}>
      <div className={styles.leading}>
        <button
          type="button"
          className={styles.hamburger}
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className={styles.searchWrap}>
          <Search size={16} />
          <input
            className={styles.search}
            type="search"
            placeholder="Search..."
            aria-label="Global search"
          />
        </div>
      </div>
      <div className={styles.actions}>
        <ThemeToggle current={themeIntent} />
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className={styles.userBadge}>{user.name}</div>
      </div>
    </header>
  );
}
