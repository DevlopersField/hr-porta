/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/SidebarDropdown.tsx

// ============= IMPORTS =============
'use client';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import styles from './Sidebar.module.css';

// ============= TYPES =============
type Props = { label: string; iconName: string; basePath: string; children: ReactNode };

// ============= COMPONENT =============
export function SidebarDropdown({ label, iconName, basePath, children }: Props) {
  const pathname = usePathname();
  const startsInside = pathname.startsWith(basePath);
  const [open, setOpen] = useState(startsInside);
  const Icon = (Icons as any)[iconName] ?? Icons.Circle;
  return (
    <div className={styles.dropdown}>
      <button
        type="button"
        className={`${styles.item} ${styles.dropdownHeader}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <Icon size={18} />
        <span>{label}</span>
        <Icons.ChevronDown size={16} className={open ? styles.chevronOpen : styles.chevron} />
      </button>
      {open && <div className={styles.dropdownBody}>{children}</div>}
    </div>
  );
}
