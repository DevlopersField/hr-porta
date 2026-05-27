// components/settings/SettingsTabs.tsx

// ============= IMPORTS =============
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============= CONFIG =============
const TABS = [
  { href: '/settings/appearance', label: 'Appearance' },
  { href: '/settings/branding', label: 'Branding' },
  { href: '/settings/layout', label: 'Layout' },
  { href: '/settings/locale', label: 'Locale' },
];

// ============= COMPONENT =============
export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map(t => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="px-4 py-2 rounded-md text-sm font-medium"
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              background: active ? 'var(--color-surface-strong)' : 'transparent',
              border: active ? '1px solid var(--color-border)' : '1px solid transparent',
            } as React.CSSProperties}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
