// components/layout/Sidebar.tsx

// ============= IMPORTS =============
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { NAV } from './nav-config';
import { SidebarItem } from './SidebarItem';
import { SidebarDropdown } from './SidebarDropdown';
import { hasPermission, type Permission } from '@/lib/permissions';
import { signOut } from '@/lib/auth';
import styles from './Sidebar.module.css';
import type { Settings } from '@/lib/db/settings';

// ============= TYPES =============
type Props = {
  user: { id: string; name: string; permissions: string[] };
  settings: Settings;
};

// ============= COMPONENT =============
export function Sidebar({ user, settings }: Props) {
  // ============= FILTER NAV BY PERMISSION =============
  const visibleItems = NAV.filter(item => {
    if (settings.layout.navItemsHidden.includes(item.id)) return false;
    if (item.requires && !hasPermission(user, item.requires as Permission)) return false;
    return true;
  });
  const topItems = visibleItems.filter(i => i.position !== 'bottom');
  const bottomItems = visibleItems.filter(i => i.position === 'bottom');

  return (
    <aside className={`${styles.sidebar} glass-panel-strong`}>
      {/* ============= LOGO ============= */}
      <div className={styles.brand}>
        {settings.branding.logoPath && (
          <Image
            src={settings.branding.logoPath}
            alt={settings.branding.companyName}
            width={32}
            height={32}
            unoptimized
          />
        )}
        <span className={styles.brandName}>{settings.branding.companyName}</span>
      </div>

      {/* ============= MAIN NAV ============= */}
      <nav className={styles.nav}>
        {topItems.map(item =>
          item.children ? (
            <SidebarDropdown
              key={item.id}
              label={item.label}
              iconName={item.iconName}
              basePath={`/${item.id}`}
            >
              {item.children
                .filter(c => !c.requires || hasPermission(user, c.requires as Permission))
                .map(c => (
                  <SidebarItem key={c.id} href={c.href!} label={c.label} iconName={c.iconName} nested />
                ))}
            </SidebarDropdown>
          ) : (
            <SidebarItem key={item.id} href={item.href!} label={item.label} iconName={item.iconName} />
          ),
        )}
      </nav>

      {/* ============= BOTTOM NAV + USER ============= */}
      <div className={styles.bottomGroup}>
        {bottomItems.map(item => (
          <SidebarItem key={item.id} href={item.href!} label={item.label} iconName={item.iconName} />
        ))}
        <div className={styles.userCard}>
          <div className={styles.userCardName}>{user.name}</div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button type="submit" className={styles.signOut} aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
