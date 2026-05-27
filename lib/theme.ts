// lib/theme.ts

// ============= IMPORTS =============
import type { Settings } from '@/lib/db/settings';

// ============= CSS VAR MAP =============
export function settingsToCssVars(settings: Settings): Record<string, string> {
  const a = settings.appearance;
  return {
    '--color-primary': a.primaryColor,
    '--color-primary-hover': a.primaryHoverColor,
    '--color-accent': a.accentColor,
    '--color-bg': a.backgroundTint,
    '--color-surface': a.surfaceColor,
    '--color-surface-strong': a.surfaceStrongColor,
    '--color-border': a.borderColor,
    '--color-text': a.textColor,
    '--color-text-muted': a.textMutedColor,
    '--glass-opacity': String(a.glassOpacity / 100),
    '--glass-blur': `${a.glassBlurPx}px`,
    '--shadow-glass': '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
    '--shadow-elevated': '0 12px 40px 0 rgba(31, 38, 135, 0.18)',
    '--radius-sm': '8px',
    '--radius-md': '12px',
    '--radius-lg': '20px',
    '--sidebar-width': `${settings.layout.sidebarWidthPx}px`,
    '--sidebar-width-collapsed': '72px',
    '--topbar-height': '64px',
  };
}

// ============= INLINE STYLE STRING =============
export function settingsToCssBlock(settings: Settings): string {
  const vars = settingsToCssVars(settings);
  const decls = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');
  return `:root { ${decls} }`;
}

// ============= THEME RESOLUTION =============
export type ThemeIntent = 'light' | 'dark' | 'system';
export type ThemeResolved = 'light' | 'dark';

const VALID_INTENTS = ['light', 'dark', 'system'] as const;

function isValidIntent(value: string | undefined): value is ThemeIntent {
  return value !== undefined && (VALID_INTENTS as readonly string[]).includes(value);
}

export function resolveTheme(args: {
  cookie: string | undefined;
  settingsDefault: 'light' | 'dark';
  prefersDark: boolean | undefined;
}): { intent: ThemeIntent; resolved: ThemeResolved | null } {
  const intent: ThemeIntent = isValidIntent(args.cookie) ? args.cookie : args.settingsDefault;
  if (intent === 'system') {
    if (args.prefersDark === undefined) return { intent, resolved: null };
    return { intent, resolved: args.prefersDark ? 'dark' : 'light' };
  }
  return { intent, resolved: intent };
}
