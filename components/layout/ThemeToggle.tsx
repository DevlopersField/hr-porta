// components/layout/ThemeToggle.tsx

// ============= IMPORTS =============
'use client';
import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { setThemeAction } from '@/app/(portal)/actions/theme';
import type { ThemeIntent } from '@/lib/theme';
import styles from './ThemeToggle.module.css';

// ============= TYPES =============
type Props = { current: ThemeIntent };

// ============= ICONS BY INTENT =============
const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const LABELS: Record<ThemeIntent, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

// ============= COMPONENT =============
export function ThemeToggle({ current }: Props) {
  // ============= STATE =============
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = ICONS[current];

  // ============= CLOSE ON OUTSIDE CLICK =============
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // ============= RENDER =============
  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle theme"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Icon size={18} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {(['light', 'dark', 'system'] as const).map(value => {
            const ItemIcon = ICONS[value];
            const isActive = current === value;
            return (
              <form
                key={value}
                action={async () => {
                  await setThemeAction(value);
                  setOpen(false);
                }}
                className={styles.itemForm}
              >
                <button
                  type="submit"
                  className={`${styles.item} ${isActive ? styles.active : ''}`}
                  role="menuitemradio"
                  aria-checked={isActive}
                >
                  <ItemIcon size={14} />
                  <span>{LABELS[value]}</span>
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
