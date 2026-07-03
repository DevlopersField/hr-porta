// lib/theme.ts

// ============= IMPORTS =============
import type { Settings } from '@/lib/db/settings';

// ============= CSS VAR MAP =============
export function settingsToCssVars(settings: Settings): Record<string, string> {
  const a = settings.appearance;
  // Only palette + layout dimensions come from admin settings. Structural tokens
  // (radii, shadows) live in globals.css and are NOT overridden here, so the
  // Donezo look stays consistent and glass artifacts don't leak back in.
  return {
    '--color-primary': a.primaryColor,
    '--color-primary-hover': a.primaryHoverColor,
    '--color-primary-fill': a.primaryColor,
    '--color-accent': a.accentColor,
    '--color-bg': a.backgroundTint,
    '--color-surface': a.surfaceColor,
    '--color-surface-strong': a.surfaceStrongColor,
    '--color-border': a.borderColor,
    '--color-text': a.textColor,
    '--color-text-muted': a.textMutedColor,
    '--sidebar-width': `${settings.layout.sidebarWidthPx}px`,
    '--topbar-height': '64px',
  };
}

// ============= INLINE STYLE STRING =============
// Admin palette overrides apply to LIGHT mode only. The dark palette is fixed in
// globals.css under [data-theme="dark"]; scoping to :root:not([data-theme="dark"])
// (specificity 0,2,0) keeps these overrides from ever clobbering dark mode.
export function settingsToCssBlock(settings: Settings): string {
  const vars = settingsToCssVars(settings);
  const decls = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');
  return `:root:not([data-theme="dark"]) { ${decls} }`;
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
