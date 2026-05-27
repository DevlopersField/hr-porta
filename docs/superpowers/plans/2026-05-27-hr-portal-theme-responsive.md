# HR Portal — Theme System + Responsive Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a three-mode theme system (light / dark / system) with no-FOUC SSR resolution + a responsive shell that collapses the sidebar into a hamburger drawer at `<lg` and converts data tables to card lists at `<sm`.

**Architecture:** Theme intent is stored in a `hrp_theme` cookie. RootLayout reads the cookie, sets `data-theme` on `<html>`, and renders an inline `<script>` in `<head>` for `'system'` mode that runs before first paint. CSS variables are split into `:root` (light) and `[data-theme="dark"]` blocks. A `PortalShell` client component holds drawer state via a data attribute; pure CSS handles the slide animation and table-to-card collapse.

**Tech Stack:** Next.js 16 App Router (server components + Server Actions), Tailwind 4, CSS Modules, lucide-react icons, Vitest. Existing stack — no new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-27-hr-portal-theme-responsive.md](../specs/2026-05-27-hr-portal-theme-responsive.md)

---

## File structure (this plan creates / modifies these files)

```
hr-porta/
├── app/
│   ├── layout.tsx                                     MODIFY (read cookie, set data-theme)
│   ├── globals.css                                    MODIFY (palette split, glass, responsive tables)
│   └── (portal)/
│       ├── layout.tsx                                 MODIFY (wrap in PortalShell)
│       ├── actions/
│       │   ├── theme.ts                               CREATE (Server Action)
│       │   └── theme.test.ts                          CREATE
│       ├── people/page.tsx                            MODIFY (responsive-card class on table)
│       ├── leave/balance/page.tsx                     MODIFY (same)
│       └── attendance/timesheet/page.tsx              MODIFY (same)
├── components/
│   └── layout/
│       ├── ThemeInjector.tsx                          MODIFY (emit both palettes + system script)
│       ├── ThemeToggle.tsx                            CREATE (client component)
│       ├── ThemeToggle.module.css                     CREATE
│       ├── PortalShell.tsx                            CREATE (client wrapper, drawer state)
│       ├── PortalShell.module.css                     CREATE
│       ├── Sidebar.module.css                         MODIFY (drawer transforms at <lg)
│       ├── TopBar.tsx                                 MODIFY (hamburger + ThemeToggle slots)
│       └── TopBar.module.css                          MODIFY (hide search at <sm)
└── lib/
    ├── theme.ts                                       MODIFY (add resolveTheme + types)
    └── theme.test.ts                                  CREATE
```

---

## Group A — Theme resolution core (pure logic, TDD-first)

### Task A1: `resolveTheme` failing tests

**Files:**
- Create: `lib/theme.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/theme.test.ts

// ============= IMPORTS =============
import { describe, it, expect } from 'vitest';
import { resolveTheme } from './theme';

// ============= TESTS =============
describe('resolveTheme', () => {
  it('cookie="light" resolves to light regardless of settings', () => {
    const out = resolveTheme({ cookie: 'light', settingsDefault: 'dark', prefersDark: undefined });
    expect(out).toEqual({ intent: 'light', resolved: 'light' });
  });

  it('cookie="dark" resolves to dark regardless of settings', () => {
    const out = resolveTheme({ cookie: 'dark', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'dark', resolved: 'dark' });
  });

  it('cookie="system" on server (prefersDark=undefined) returns intent=system and resolved=null', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'system', resolved: null });
  });

  it('cookie="system" on client with prefersDark=true resolves to dark', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'light', prefersDark: true });
    expect(out).toEqual({ intent: 'system', resolved: 'dark' });
  });

  it('cookie="system" on client with prefersDark=false resolves to light', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'dark', prefersDark: false });
    expect(out).toEqual({ intent: 'system', resolved: 'light' });
  });

  it('no cookie falls back to settingsDefault', () => {
    const out = resolveTheme({ cookie: undefined, settingsDefault: 'dark', prefersDark: undefined });
    expect(out).toEqual({ intent: 'dark', resolved: 'dark' });
  });

  it('invalid cookie value falls back to settingsDefault', () => {
    const out = resolveTheme({ cookie: 'banana', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'light', resolved: 'light' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run lib/theme.test.ts`
Expected: FAIL — `resolveTheme is not a function` or import error (function not yet exported).

---

### Task A2: Implement `resolveTheme` and types

**Files:**
- Modify: `lib/theme.ts`

- [ ] **Step 1: Add the resolveTheme function**

Edit `lib/theme.ts` — append to the bottom (DO NOT remove existing `settingsToCssVars` / `settingsToCssBlock`):

```ts

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
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node_modules/.bin/vitest run lib/theme.test.ts`
Expected: PASS — 7 tests pass.

- [ ] **Step 3: Run full suite to verify no regression**

Run: `node_modules/.bin/vitest run`
Expected: 87 passing (80 prior + 7 new).

- [ ] **Step 4: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean (exit 0, no output).

- [ ] **Step 5: Commit**

```bash
git add lib/theme.ts lib/theme.test.ts
git commit -m "feat(theme): resolveTheme + ThemeIntent/ThemeResolved types"
```

---

## Group B — Theme Server Action

### Task B1: `setThemeAction` failing test

**Files:**
- Create: `app/(portal)/actions/theme.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/(portal)/actions/theme.test.ts

// ============= IMPORTS =============
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============= MOCKS =============
const cookieStore = { set: vi.fn(), delete: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ============= TESTS =============
describe('setThemeAction', () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it('writes hrp_theme cookie with correct attrs', async () => {
    const { setThemeAction } = await import('./theme');
    await setThemeAction('dark');
    expect(cookieStore.set).toHaveBeenCalledWith('hrp_theme', 'dark', expect.objectContaining({
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    }));
  });

  it('accepts "light", "dark", and "system"', async () => {
    const { setThemeAction } = await import('./theme');
    await setThemeAction('light');
    await setThemeAction('dark');
    await setThemeAction('system');
    expect(cookieStore.set).toHaveBeenCalledTimes(3);
  });

  it('throws on invalid value', async () => {
    const { setThemeAction } = await import('./theme');
    await expect(setThemeAction('banana' as never)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run 'app/(portal)/actions/theme.test.ts'`
Expected: FAIL — module not found.

---

### Task B2: Implement `setThemeAction`

**Files:**
- Create: `app/(portal)/actions/theme.ts`

- [ ] **Step 1: Write the action**

```ts
// app/(portal)/actions/theme.ts

// ============= IMPORTS =============
'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============= SCHEMA =============
const ThemeIntentSchema = z.enum(['light', 'dark', 'system']);

// ============= ACTION =============
export async function setThemeAction(value: 'light' | 'dark' | 'system'): Promise<void> {
  const parsed = ThemeIntentSchema.parse(value);
  const store = await cookies();
  store.set('hrp_theme', parsed, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node_modules/.bin/vitest run 'app/(portal)/actions/theme.test.ts'`
Expected: 3 tests PASS.

- [ ] **Step 3: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add 'app/(portal)/actions/theme.ts' 'app/(portal)/actions/theme.test.ts'
git commit -m "feat(theme): setThemeAction server action with Zod validation"
```

---

## Group C — Global CSS palette split + glass refinements

### Task C1: Rewrite `app/globals.css` with palette split

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the file contents**

Read `app/globals.css` first to confirm current state, then replace with:

```css
/* app/globals.css */
@import "tailwindcss";

/* ============= LIGHT PALETTE (default) ============= */
:root {
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-accent: #06B6D4;
  --color-bg: #F5F7FB;
  --color-surface: rgba(255, 255, 255, 0.65);
  --color-surface-strong: rgba(255, 255, 255, 0.85);
  --color-border: rgba(255, 255, 255, 0.4);
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --glass-blur: 26px;
  --glass-opacity: 0.65;
  --glass-top-highlight: rgba(255, 255, 255, 0.5);
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
  --shadow-elevated: 0 12px 40px 0 rgba(31, 38, 135, 0.18);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --sidebar-width: 264px;
  --topbar-height: 64px;
  --mesh-1: rgba(79, 70, 229, 0.18);
  --mesh-2: rgba(6, 182, 212, 0.15);
  --mesh-3: rgba(168, 85, 247, 0.12);
  --mesh-4: rgba(236, 72, 153, 0.10);
}

/* ============= DARK PALETTE ============= */
[data-theme="dark"] {
  --color-primary: #F5F5F5;
  --color-primary-hover: #FFFFFF;
  --color-accent: #F59E0B;
  --color-bg: #0F0F12;
  --color-surface: rgba(255, 255, 255, 0.05);
  --color-surface-strong: rgba(255, 255, 255, 0.08);
  --color-border: rgba(255, 255, 255, 0.09);
  --color-text: #EAEAEA;
  --color-text-muted: #9A9A9A;
  --glass-top-highlight: rgba(255, 255, 255, 0.08);
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
  --shadow-elevated: 0 12px 48px 0 rgba(0, 0, 0, 0.6);
  --mesh-1: rgba(245, 158, 11, 0.08);
  --mesh-2: rgba(244, 63, 94, 0.06);
  --mesh-3: rgba(168, 85, 247, 0.05);
  --mesh-4: rgba(99, 102, 241, 0.04);
}

/* ============= BASE ============= */
html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 20px;
  transition: background-color 250ms ease, color 250ms ease;
}

/* ============= GLASS UTILITIES ============= */
.glass-panel {
  background: var(--color-surface);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--color-border);
  border-top: 1px solid var(--glass-top-highlight);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.glass-panel:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-elevated);
}
.glass-panel-strong {
  background: var(--color-surface-strong);
  backdrop-filter: blur(calc(var(--glass-blur) * 1.5)) saturate(200%);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 1.5)) saturate(200%);
  border: 1px solid var(--color-border);
  border-top: 1px solid var(--glass-top-highlight);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
}

/* ============= MESH GRADIENT BACKGROUND ============= */
.bg-mesh {
  background:
    radial-gradient(at 0% 0%, var(--mesh-1) 0px, transparent 50%),
    radial-gradient(at 100% 0%, var(--mesh-2) 0px, transparent 50%),
    radial-gradient(at 100% 100%, var(--mesh-3) 0px, transparent 50%),
    radial-gradient(at 0% 100%, var(--mesh-4) 0px, transparent 50%),
    var(--color-bg);
}

/* ============= RESPONSIVE TABLES → CARDS (<640px) ============= */
@media (max-width: 639px) {
  table.responsive-card thead { display: none; }
  table.responsive-card,
  table.responsive-card tbody,
  table.responsive-card tr,
  table.responsive-card td {
    display: block;
    width: 100%;
  }
  table.responsive-card tr {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
  }
  table.responsive-card td {
    padding: 4px 0 !important;
    border: none !important;
    text-align: left !important;
  }
  table.responsive-card td::before {
    content: attr(data-label);
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 2px;
  }
  table.responsive-card td:first-child::before {
    display: none;
  }
}

/* ============= MARKDOWN DOC CONTENT ============= */
.prose-doc h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px; line-height: 32px; }
.prose-doc h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; line-height: 28px; }
.prose-doc h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; line-height: 24px; }
.prose-doc p  { font-size: 14px; line-height: 22px; margin: 0 0 12px; }
.prose-doc ul, .prose-doc ol { padding-left: 24px; margin: 0 0 12px; }
.prose-doc li { font-size: 14px; line-height: 22px; margin: 4px 0; }
.prose-doc a  { color: var(--color-primary); text-decoration: underline; }
.prose-doc a:hover { color: var(--color-primary-hover); }
.prose-doc code {
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
  font-size: 13px;
  background: var(--color-surface);
  padding: 2px 6px;
  border-radius: 4px;
}
.prose-doc pre {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  overflow-x: auto;
  font-size: 13px;
  margin: 0 0 12px;
}
.prose-doc pre code { background: transparent; padding: 0; }
.prose-doc blockquote {
  border-left: 3px solid var(--color-border);
  padding: 0 16px;
  margin: 0 0 12px;
  color: var(--color-text-muted);
}
.prose-doc hr { border: none; border-top: 1px solid var(--color-border); margin: 24px 0; }
```

- [ ] **Step 2: Typecheck + lint**

Run: `node_modules/.bin/tsc --noEmit` (CSS doesn't affect tsc, but verify no .css import resolution broke)
Run: `node_modules/.bin/eslint .`
Expected: tsc clean, lint shows only pre-existing `tests/setup.ts` error.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): split palette into :root + [data-theme=dark]; glass + responsive-card CSS"
```

---

## Group D — ThemeInjector emits both palettes + system script

### Task D1: Rewrite `ThemeInjector` to support all three modes

**Files:**
- Modify: `components/layout/ThemeInjector.tsx`

- [ ] **Step 1: Replace the component**

```tsx
// components/layout/ThemeInjector.tsx

// ============= IMPORTS =============
import type { Settings } from '@/lib/db/settings';
import { settingsToCssBlock } from '@/lib/theme';
import type { ThemeIntent } from '@/lib/theme';

// ============= TYPES =============
type Props = {
  settings: Settings;
  intent: ThemeIntent;
};

// ============= SYSTEM-MODE SCRIPT =============
// This runs BEFORE first paint to prevent FOUC when intent is 'system'.
// It sets data-theme on <html> based on the current prefers-color-scheme,
// and attaches a listener so OS-level theme changes propagate live.
const SYSTEM_SCRIPT = `
(function() {
  function apply() {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  apply();
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  } catch (e) {}
})();
`.trim();

// ============= COMPONENT =============
export function ThemeInjector({ settings, intent }: Props) {
  // ============= ADMIN PALETTE OVERRIDES (light only in v1) =============
  // The Settings module lets admin override light-mode colors. These overrides
  // apply only when data-theme is NOT "dark" (i.e., light or system-resolved-light).
  const lightOverrides = settingsToCssBlock(settings);
  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: lightOverrides }}
      />
      {intent === 'system' && (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: SYSTEM_SCRIPT }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/layout/ThemeInjector.tsx
git commit -m "feat(theme): ThemeInjector emits admin light overrides + system-mode script"
```

---

## Group E — RootLayout reads cookie and sets data-theme

### Task E1: Update `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/layout.tsx

// ============= IMPORTS =============
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/db/settings';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { resolveTheme } from '@/lib/theme';
import './globals.css';

// ============= METADATA =============
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.branding.companyName + ' — HR Portal',
    icons: settings.branding.faviconPath ? [{ url: settings.branding.faviconPath }] : undefined,
  };
}

// ============= LAYOUT =============
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('hrp_theme')?.value;
  const { intent, resolved } = resolveTheme({
    cookie: themeCookie,
    settingsDefault: settings.appearance.defaultMode,
    prefersDark: undefined, // server can't know
  });

  // On server, if intent==='system' we DON'T set data-theme; the inline script
  // in ThemeInjector handles it before first paint. Otherwise, we set explicitly.
  const dataTheme = resolved ?? undefined;

  return (
    <html lang="en" {...(dataTheme ? { 'data-theme': dataTheme } : {})}>
      <head>
        <ThemeInjector settings={settings} intent={intent} />
      </head>
      <body className="bg-mesh">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Typecheck + build smoke**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

Run: `node_modules/.bin/next build > /tmp/theme-build.log 2>&1; echo "build exit: $?"; tail -20 /tmp/theme-build.log`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(theme): RootLayout reads hrp_theme cookie and sets data-theme"
```

---

## Group F — ThemeToggle component

### Task F1: Create `ThemeToggle.module.css`

**Files:**
- Create: `components/layout/ThemeToggle.module.css`

- [ ] **Step 1: Write CSS**

```css
/* components/layout/ThemeToggle.module.css */

/* ============= TRIGGER BUTTON ============= */
.trigger {
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms, color 120ms;
}
.trigger:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

/* ============= WRAPPER ============= */
.wrapper {
  position: relative;
}

/* ============= MENU ============= */
.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  background: var(--color-surface-strong);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
  padding: 4px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ============= ITEM ============= */
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 13px;
  text-align: left;
  width: 100%;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 100ms;
}
.item:hover {
  background: var(--color-surface);
}
.active {
  color: var(--color-primary);
  font-weight: 500;
}
.itemForm {
  display: contents;
}
```

- [ ] **Step 2: Commit (defer commit until F2 is done)**

(no commit yet — bundle with F2)

---

### Task F2: Create `ThemeToggle.tsx`

**Files:**
- Create: `components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit (bundled F1 + F2)**

```bash
git add components/layout/ThemeToggle.tsx components/layout/ThemeToggle.module.css
git commit -m "feat(theme): ThemeToggle client component with light/dark/system dropdown"
```

---

## Group G — PortalShell + drawer

### Task G1: Create `PortalShell.module.css`

**Files:**
- Create: `components/layout/PortalShell.module.css`

- [ ] **Step 1: Write CSS**

```css
/* components/layout/PortalShell.module.css */

/* ============= ROOT GRID ============= */
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
  padding: 16px;
  gap: 16px;
}

/* ============= TABLET/MOBILE: collapse grid + show drawer ============= */
@media (max-width: 1023px) {
  .shell {
    grid-template-columns: 1fr;
  }
}

/* ============= MAIN COLUMN ============= */
.main {
  display: grid;
  grid-template-rows: var(--topbar-height) 1fr;
  gap: 16px;
  min-width: 0;
}

/* ============= CONTENT ============= */
.content {
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 639px) {
  .shell { padding: 12px; gap: 12px; }
  .content { padding: 16px; }
}

/* ============= BACKDROP ============= */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 25;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
[data-drawer-open="true"] .backdrop {
  opacity: 1;
  pointer-events: auto;
}

/* Backdrop only matters at <lg */
@media (min-width: 1024px) {
  .backdrop { display: none; }
}
```

- [ ] **Step 2: Defer commit until G2 done**

---

### Task G2: Create `PortalShell.tsx`

**Files:**
- Create: `components/layout/PortalShell.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit (bundled G1 + G2)**

```bash
git add components/layout/PortalShell.tsx components/layout/PortalShell.module.css
git commit -m "feat(layout): PortalShell with drawer state + context for hamburger toggle"
```

---

## Group H — Sidebar drawer CSS

### Task H1: Update `Sidebar.module.css` for drawer mode

**Files:**
- Modify: `components/layout/Sidebar.module.css`

- [ ] **Step 1: Append drawer rules at the END of the file**

Read the file first. Append:

```css

/* ============= DRAWER MODE (<lg) ============= */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 16px;
    bottom: 16px;
    left: 16px;
    z-index: 30;
    transform: translateX(calc(-100% - 16px));
    transition: transform 220ms ease;
  }
  [data-drawer-open="true"] .sidebar {
    transform: translateX(0);
  }
}

/* ============= MOBILE (<sm): smaller padding ============= */
@media (max-width: 639px) {
  .sidebar {
    top: 12px;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-width: 320px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Sidebar.module.css
git commit -m "feat(layout): Sidebar slides as drawer at <lg, full overlay at <sm"
```

---

## Group I — TopBar: hamburger + ThemeToggle

### Task I1: Update `TopBar.tsx` to include hamburger + ThemeToggle

**Files:**
- Modify: `components/layout/TopBar.tsx`

- [ ] **Step 1: Replace the file**

```tsx
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
```

Note: `TopBar` is now a client component (`'use client'`) because it uses the `useDrawer` hook. This is fine — its only data inputs are simple props.

- [ ] **Step 2: Defer commit until I2 done**

---

### Task I2: Update `TopBar.module.css`

**Files:**
- Modify: `components/layout/TopBar.module.css`

- [ ] **Step 1: Replace the file**

```css
/* components/layout/TopBar.module.css */

/* ============= TOPBAR ============= */
.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
}

/* ============= LEADING (hamburger + search) ============= */
.leading {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* ============= HAMBURGER (only visible <lg) ============= */
.hamburger {
  display: none;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.hamburger:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
@media (max-width: 1023px) {
  .hamburger { display: inline-flex; align-items: center; justify-content: center; }
}

/* ============= SEARCH ============= */
.searchWrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  width: 360px;
  max-width: 50vw;
}
.search {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
  color: var(--color-text);
}
/* Hide search on phones */
@media (max-width: 639px) {
  .searchWrap { display: none; }
}

/* ============= ACTIONS ============= */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.iconBtn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
}
.iconBtn:hover { background: var(--color-surface); color: var(--color-text); }
.userBadge {
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Hide user-name text on phones (keep nothing — avatar comes in v2) */
@media (max-width: 639px) {
  .userBadge { display: none; }
}
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit (bundled I1 + I2)**

```bash
git add components/layout/TopBar.tsx components/layout/TopBar.module.css
git commit -m "feat(layout): TopBar gets hamburger + ThemeToggle; search hidden on phones"
```

---

## Group J — Portal layout wires PortalShell

### Task J1: Update `app/(portal)/layout.tsx`

**Files:**
- Modify: `app/(portal)/layout.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/(portal)/layout.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/db/settings';
import { resolveTheme } from '@/lib/theme';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PortalShell } from '@/components/layout/PortalShell';

// ============= LAYOUT =============
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const settings = await getSettings();

  // ============= RESOLVE THEME (for the toggle's current value) =============
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('hrp_theme')?.value;
  const { intent } = resolveTheme({
    cookie: themeCookie,
    settingsDefault: settings.appearance.defaultMode,
    prefersDark: undefined,
  });

  return (
    <PortalShell
      sidebar={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Sidebar user={session.user as any} settings={settings} />
      }
      topbar={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <TopBar user={session.user as any} themeIntent={intent} />
      }
    >
      {children}
    </PortalShell>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

Run: `node_modules/.bin/next build > /tmp/portal-build.log 2>&1; echo "exit: $?"; tail -20 /tmp/portal-build.log`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add 'app/(portal)/layout.tsx'
git commit -m "feat(layout): portal layout wires PortalShell, passes themeIntent to TopBar"
```

---

## Group K — Mark tables responsive-card with data-label

### Task K1: People directory table

**Files:**
- Modify: `app/(portal)/people/page.tsx`

- [ ] **Step 1: Update the table element**

Find the `<table>` element and:

1. Add `className="responsive-card"` to it
2. Add `data-label="..."` to each `<td>` matching its column header

Specifically: change

```tsx
<table style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
```

to

```tsx
<table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
```

And update each row's `<td>`s:

```tsx
<td data-label="Name" style={{ padding: '12px 16px' } as React.CSSProperties}>
  <Link href={`/people/${p.id}`} style={{ color: 'var(--color-primary)', fontWeight: 500 } as React.CSSProperties}>
    {p.displayName}
  </Link>
</td>
<td data-label="Email" style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{p.email}</td>
<td data-label="Department" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.department || '—'}</td>
<td data-label="Title" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.jobTitle || '—'}</td>
<td data-label="Status" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.active ? 'Active' : 'Inactive'}</td>
```

- [ ] **Step 2: Commit**

```bash
git add 'app/(portal)/people/page.tsx'
git commit -m "feat(people): mark directory table as responsive-card with data-labels"
```

---

### Task K2: Leave balance history table

**Files:**
- Modify: `app/(portal)/leave/balance/page.tsx`

- [ ] **Step 1: Same treatment — `className="responsive-card"` + `data-label` on each `<td>`**

Change `<table style={...}>` to `<table className="responsive-card" style={...}>`.

Add `data-label` to each `<td>`:
- `data-label="Type"` on the type cell
- `data-label="Dates"` on the dates cell
- `data-label="Days"` on the days cell
- `data-label="Status"` on the status cell
- `data-label="Action"` on the action cell

- [ ] **Step 2: Commit**

```bash
git add 'app/(portal)/leave/balance/page.tsx'
git commit -m "feat(leave): mark balance history table as responsive-card"
```

---

### Task K3: Attendance timesheet table

**Files:**
- Modify: `app/(portal)/attendance/timesheet/page.tsx`

- [ ] **Step 1: Same treatment**

Change `<table style={...}>` to `<table className="responsive-card" style={...}>`.

Add `data-label` to each `<td>`:
- `data-label="Date"`
- `data-label="In"`
- `data-label="Out"`
- `data-label="Hours"`
- `data-label="Note"`

- [ ] **Step 2: Commit**

```bash
git add 'app/(portal)/attendance/timesheet/page.tsx'
git commit -m "feat(attendance): mark timesheet table as responsive-card"
```

---

## Group L — Final verification

### Task L1: Full automated verification

- [ ] **Step 1: Tests**

Run: `node_modules/.bin/vitest run`
Expected: 90 passing, 0 failing (80 prior + 10 new: 7 resolveTheme + 3 setThemeAction).

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `node_modules/.bin/eslint .`
Expected: only the pre-existing `tests/setup.ts` error + the same baseline unused-disable warnings as before (no NEW errors).

- [ ] **Step 4: Build**

Run: `node_modules/.bin/next build > /tmp/final-build.log 2>&1; echo "exit: $?"; tail -20 /tmp/final-build.log`
Expected: exit 0. All previous routes still compile.

- [ ] **Step 5: Manual visual smoke**

If the parent controller will run this, hand off — otherwise document in the report.

Browser checklist at three breakpoints (375px / 768px / 1280px), in both light and dark modes (use DevTools device emulator + theme toggle in the UI):

- [ ] Login page (out of portal shell — must still respect theme)
- [ ] Home dashboard — 3 panels render, glass hover lift works in both modes
- [ ] People directory — table at desktop, card list at <640
- [ ] People detail — manager dropdown styled correctly in dark
- [ ] Settings → Appearance — color pickers visible in dark (browser-native, OK)
- [ ] Settings → Branding — image upload preview readable in dark
- [ ] Leave balance — balance cards + history → cards on mobile
- [ ] Leave request — date pickers + textarea readable in dark
- [ ] Leave approvals — pending list reads correctly
- [ ] Attendance clock + timesheet
- [ ] Document Center — markdown HTML readable in dark (`.prose-doc` styles)
- [ ] Drawer slides at <lg, hamburger toggles, backdrop closes
- [ ] Theme toggle dropdown opens, three options work, OS-theme change updates `system` mode live
- [ ] No FOUC on hard reload in any mode

- [ ] **Step 6: Final report**

Report:
- All commit SHAs in order
- Test count delta
- Build outcome
- Any visual issues found during smoke
- Any deviations from the plan

---

## Self-review checklist

- Each task has a single owner (file or small file pair)
- Every code step shows the actual code
- Every test step shows the actual test
- No "TBD", "implement later", "similar to Task N"
- Types defined in Task A2 (`ThemeIntent`, `ThemeResolved`) match usage in Task F2, I1, J1
- `resolveTheme` signature matches usage in E1 and J1
- `setThemeAction` signature matches usage in F2
- `useDrawer` defined in G2, used in I1
- `PortalShell` props match J1 usage
