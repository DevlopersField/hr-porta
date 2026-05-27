// components/layout/PortalShell.tsx

// ============= IMPORTS =============
'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './PortalShell.module.css';

// ============= TYPES =============
type Props = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

// ============= COMPONENT =============
export function PortalShell({ sidebar, topbar, children }: Props) {
  // ============= DRAWER STATE =============
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  // ============= RENDER =============
  return (
    <div
      className={styles.shell}
      {...{ 'data-drawer-open': drawerOpen ? 'true' : 'false' }}
    >
      {sidebar}
      <div
        className={styles.backdrop}
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
      />
      <div className={styles.main}>
        {/* topbar is responsible for rendering its own hamburger that calls toggleDrawer via context */}
        <PortalShellContext.Provider value={{ drawerOpen, setDrawerOpen }}>
          {topbar}
          <main className={styles.content}>{children}</main>
        </PortalShellContext.Provider>
      </div>
    </div>
  );
}

// ============= CONTEXT (for TopBar's hamburger to call setDrawerOpen) =============
import { createContext, useContext } from 'react';

type ShellContext = {
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

const PortalShellContext = createContext<ShellContext | null>(null);

export function useDrawer() {
  const ctx = useContext(PortalShellContext);
  if (!ctx) throw new Error('useDrawer must be used inside PortalShell');
  return ctx;
}
