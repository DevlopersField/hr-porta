# HR Portal — Theme System (light/dark/system) + Responsive Pass

**Status:** Approved 2026-05-27 (palette: warm pro / charcoal + amber; mobile: hamburger drawer).
**Author:** brainstormed with user, expert-mode pass.
**Scope:** Single feature batch — landing the theme system and the responsive shell. NOT a full module build.

---

## Goals

1. **Three theme modes** — `light`, `dark`, `system`. System tracks `prefers-color-scheme` live.
2. **No FOUC** on first paint. Server resolves theme from cookie before HTML ships.
3. **Toggle in TopBar** — dropdown picker. Setting persists per-device via cookie.
4. **Warm-pro dark palette** — charcoal background, white primary, amber accent. Light palette unchanged (admin-configurable in `/settings/appearance`).
5. **Responsive shell**:
   - `≥ lg (1024)`: current desktop layout (sidebar + topbar + main).
   - `md (768–1023)`: sidebar becomes overlay drawer; hamburger appears in topbar.
   - `< md (640 and below)`: drawer mode; topbar shows hamburger + brand only; data tables collapse to card lists.
6. **Glass refinement** — top-edge highlight, slight hover lift on `.glass-panel`, blur bumped.
7. **Zero new external font dependencies.** System stack stays.

---

## Non-goals

- Per-section dark palette overrides in admin Settings (admin only edits light v1).
- Animated mesh gradient (CSS perf cost; skip).
- Reduced-motion honoring (defer to v2 — easy add later).
- RTL support (deferred).
- Page-transition animations (Next suspense suffices).

---

## Architecture

### Theme resolution chain (SSR-safe)

```
incoming request
    │
    ▼
middleware (no change) ─► auth check
    │
    ▼
RootLayout (server component)
    ├─ reads cookie `hrp_theme` ∈ {'light','dark','system',null}
    ├─ reads settings.appearance.defaultMode ∈ {'light','dark'}
    ├─ resolves "intent" = cookie ?? settings.appearance.defaultMode
    │
    ├─ if intent ∈ {'light','dark'}: data-theme="<intent>" goes on <html>
    │
    └─ if intent === 'system':
         <head> injects inline <script> that runs BEFORE first paint:
            const dark = matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
         AND attaches a matchMedia listener that updates the attr live on OS toggle.
```

The inline script is small (<300 bytes minified), executes synchronously, and prevents flash of wrong theme. Standard pattern (Vercel's `next-themes`, Stripe, Linear).

### CSS structure (`app/globals.css`)

```css
/* ============= LIGHT PALETTE (default) ============= */
:root {
  --color-bg: #F5F7FB;
  --color-surface: rgba(255,255,255,0.65);
  /* … existing tokens … */
}

/* ============= DARK PALETTE ============= */
[data-theme="dark"] {
  --color-bg: #0F0F12;
  --color-surface: rgba(255,255,255,0.05);
  --color-surface-strong: rgba(255,255,255,0.08);
  --color-border: rgba(255,255,255,0.09);
  --color-text: #EAEAEA;
  --color-text-muted: #9A9A9A;
  --color-primary: #F5F5F5;
  --color-primary-hover: #FFFFFF;
  --color-accent: #F59E0B;
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.5);
  --shadow-elevated: 0 12px 48px rgba(0,0,0,0.6);
}

/* ============= SMOOTH TRANSITIONS BETWEEN MODES ============= */
:root, html, body {
  transition: background 250ms ease, color 250ms ease, border-color 250ms ease;
}

/* ============= GLASS REFINEMENTS ============= */
.glass-panel { border-top: 1px solid rgba(255,255,255,0.5); }
[data-theme="dark"] .glass-panel { border-top-color: rgba(255,255,255,0.08); }
.glass-panel { transition: transform 150ms ease, box-shadow 150ms ease; }
.glass-panel:hover { transform: translateY(-1px); box-shadow: var(--shadow-elevated); }

/* ============= RESPONSIVE TABLES → CARDS (<sm 640px) ============= */
@media (max-width: 639px) {
  table.responsive-card thead { display: none; }
  table.responsive-card, table.responsive-card tbody, table.responsive-card tr, table.responsive-card td {
    display: block;
    width: 100%;
  }
  table.responsive-card tr {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
    padding: 16px;
    border: 1px solid var(--color-border);
  }
  table.responsive-card td {
    padding: 4px 0;
    border: none;
  }
  table.responsive-card td::before {
    content: attr(data-label) ": ";
    color: var(--color-text-muted);
    font-size: 12px;
    margin-right: 8px;
  }
}
```

### Dark palette tokens (fixed in v1)

| Token | Value |
|---|---|
| `--color-bg` | `#0F0F12` |
| `--color-surface` | `rgba(255,255,255,0.05)` |
| `--color-surface-strong` | `rgba(255,255,255,0.08)` |
| `--color-border` | `rgba(255,255,255,0.09)` |
| `--color-text` | `#EAEAEA` |
| `--color-text-muted` | `#9A9A9A` |
| `--color-primary` | `#F5F5F5` |
| `--color-primary-hover` | `#FFFFFF` |
| `--color-accent` | `#F59E0B` |
| `--shadow-glass` | `0 8px 32px rgba(0,0,0,0.5)` |
| `--shadow-elevated` | `0 12px 48px rgba(0,0,0,0.6)` |
| Mesh gradient | amber/rose/neutral at low alpha |

### Cookie protocol

- Name: `hrp_theme`
- Values: `'light' | 'dark' | 'system'`
- Attributes: `Path=/`, `Max-Age=31536000` (1 year), `SameSite=Lax`. NOT HttpOnly — client script needs to read it for the system-mode media query listener.
- Set via Server Action: `setThemeAction(value)`. After write, action calls `revalidatePath('/', 'layout')` and `redirect(...)` is not needed; `router.refresh()` from the client component re-fetches.

### `lib/theme.ts` API additions

```ts
export type ThemeIntent = 'light' | 'dark' | 'system';
export type ThemeResolved = 'light' | 'dark';

export function resolveTheme(args: {
  cookie: string | undefined;          // hrp_theme cookie value
  settingsDefault: 'light' | 'dark';   // settings.appearance.defaultMode
  prefersDark: boolean | undefined;    // only known on client (passed null on server for 'system' intent)
}): { intent: ThemeIntent; resolved: ThemeResolved | null };

// resolved === null when intent === 'system' on server (must defer to client script).
// resolved === 'light' | 'dark' otherwise.
```

Pure function — no I/O, fully unit-testable.

### Toggle component

`components/layout/ThemeToggle.tsx` — client component:

- Renders a button with the icon for current intent: Sun (light) / Moon (dark) / Monitor (system)
- On click: opens a 3-item dropdown (Light / Dark / System) using a `<details>` element or a simple `useState` open flag
- Each item is a `<form action={setThemeAction.bind(null, value)}>` with a submit `<button>` — uses native Server Action progressive enhancement
- After action completes, the Server Action calls `revalidatePath('/', 'layout')` so the root layout re-renders with new `data-theme`
- The `<details>` closes via `onSubmit`

### Drawer state

`components/layout/PortalShell.tsx` — new client component wrapping the existing layout:

- Tracks `drawerOpen: boolean` in `useState`
- Sets `data-drawer-open` attribute on its root `<div>`
- Renders children + a hidden hamburger button (visible only at `<lg`)
- Closes drawer on route change (subscribe to `usePathname`)

CSS in `Sidebar.module.css`:

```css
.sidebar {
  /* desktop default — unchanged */
}

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    inset: 16px auto 16px 16px;
    z-index: 30;
    transform: translateX(calc(-100% - 16px));
    transition: transform 200ms ease;
  }
  [data-drawer-open="true"] .sidebar {
    transform: translateX(0);
  }
  [data-drawer-open="true"] .backdrop {
    opacity: 1;
    pointer-events: auto;
  }
}
```

Backdrop is a `<div>` inside the shell, default `opacity: 0; pointer-events: none;`, becomes interactive when drawer is open. Tapping closes the drawer.

### TopBar updates

- New hamburger button (lucide `Menu` icon) — visible only at `<lg` via CSS `@media`
- New ThemeToggle button — always visible, on the right side next to the user badge
- Search input collapses to a search icon button at `<sm`; tapping expands into a full-width sheet (defer the sheet to v2 — for v1, just hide the search at `<sm`)

### Table-to-card conversion (responsive)

Mark target tables with `className="responsive-card"`. The CSS rule above handles the layout swap. Each `<td>` gets a `data-label="<header text>"` attribute so the cards show field labels.

Tables affected:
- `/people` directory
- `/leave/balance` history
- `/leave/approvals` (already uses cards, no change)
- `/attendance/timesheet`

---

## File changes

### New
- `lib/theme.test.ts` — unit tests for `resolveTheme`
- `app/(portal)/actions/theme.ts` — `setThemeAction` Server Action
- `components/layout/ThemeToggle.tsx` + `ThemeToggle.module.css`
- `components/layout/PortalShell.tsx` (client wrapper for drawer state)
- `components/layout/MobileBackdrop.tsx` + `.module.css` (or inlined into PortalShell)

### Modified
- `lib/theme.ts` — add `resolveTheme`, `ThemeIntent`, `ThemeResolved` exports; keep existing `settingsToCssVars`/`settingsToCssBlock` for the light-mode admin overrides
- `components/layout/ThemeInjector.tsx` — emit both palettes and the inline system-mode script
- `app/layout.tsx` — read theme cookie, set `data-theme` on `<html>`, render system-mode script when intent==='system'
- `app/(portal)/layout.tsx` — wrap content in `PortalShell` for drawer state
- `app/globals.css` — palette split, glass refinements, responsive table CSS
- `components/layout/Sidebar.module.css` — drawer transforms at `<lg`
- `components/layout/TopBar.tsx` + `.module.css` — hamburger + ThemeToggle slots; search-hidden-at-sm
- `app/(portal)/people/page.tsx` — add `responsive-card` class + `data-label` to `<td>`s
- `app/(portal)/leave/balance/page.tsx` — same
- `app/(portal)/attendance/timesheet/page.tsx` — same

---

## Testing

### Unit (vitest)

- `lib/theme.test.ts` — `resolveTheme` matrix:
  1. Cookie `light` → `{ intent: 'light', resolved: 'light' }`
  2. Cookie `dark` → `{ intent: 'dark', resolved: 'dark' }`
  3. Cookie `system`, server (prefersDark=undefined) → `{ intent: 'system', resolved: null }`
  4. Cookie `system`, client prefersDark=true → `{ intent: 'system', resolved: 'dark' }`
  5. Cookie undefined, settingsDefault `dark` → `{ intent: 'dark', resolved: 'dark' }`
  6. Cookie `invalid` → falls back to settingsDefault
- `app/(portal)/actions/theme.test.ts` — action tests:
  1. Sets cookie with correct attrs (name, max-age, sameSite)
  2. Throws on invalid theme value (Zod-validated)

### Manual visual smoke

Browser checklist at three breakpoints (375px / 768px / 1280px), in both light and dark modes:

- [ ] Login page (out of portal shell — still must respect theme)
- [ ] Home dashboard — 3 panels render, glass + hover lift works
- [ ] People directory — table at desktop, card list at <640
- [ ] People detail — manager dropdown styled correctly in dark
- [ ] Settings → Appearance — color pickers visible in dark (browser-native, OK)
- [ ] Settings → Branding — image upload preview readable in dark
- [ ] Leave balance — balance cards + history table → cards on mobile
- [ ] Leave request — date pickers + textarea readable in dark
- [ ] Leave approvals — pending list reads correctly
- [ ] Attendance clock + timesheet
- [ ] Document Center — markdown HTML readable in dark (`.prose-doc` styles)
- [ ] Drawer slides at <lg, hamburger toggles, backdrop closes
- [ ] Theme toggle dropdown opens, three options work, OS-theme change updates `system` mode live
- [ ] No FOUC on hard reload in any mode

---

## Risks / open questions

1. **System mode live-update via `matchMedia` listener** — the inline script attaches a listener. Verify it survives client navigations (App Router preserves the document — should be fine).
2. **`prose-doc` markdown CSS in dark** — explicit colors (e.g., `var(--color-text)`) already wired in; should adapt automatically. Verify code blocks (`background: var(--color-surface)`) read well in dark.
3. **HTML `transition` on background** — applying `transition` to `:root` for color tokens means EVERY descendant inherits the transition timing for background. Could cause subtle "swimming" effect on first paint. Mitigation: limit transition to `html, body` only, not `:root`.
4. **Image content readability in dark** — uploaded logos with light-background-assumed designs will read poorly on dark surface. Out of scope; admin's call.
5. **`data-label` attribute on tables** — adds verbosity to JSX. Acceptable trade for the no-JS responsive table conversion.

---

## Acceptance criteria

- `pnpm tsc --noEmit` clean
- `pnpm test` — 80 existing + 8 new tests = 88 passing
- `pnpm build` succeeds
- `pnpm lint` — no new errors (pre-existing `tests/setup.ts` error allowed)
- Manual visual smoke at 3 breakpoints in both modes: all checkboxes pass
- No FOUC on hard reload in any mode (verified via DevTools "Disable cache" + reload)
- Theme cookie persists across page navigation
- System mode updates live when OS theme changes (verified by toggling macOS appearance setting)
