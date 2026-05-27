# HR Portal — Donezo-Style Pivot (opaque cards + forest green)

**Status:** Approved 2026-05-27 (dark mode = warm-dark cousin: coffee bg + sage primary).
**Scope:** Aesthetic overhaul. No new routes, no new data, no permission changes.

---

## Goals

1. Replace glassmorphism with **opaque cards + soft elevated shadows** matching the Donezo reference.
2. New palette: cream + forest green for light, coffee + sage green for dark.
3. Bigger border-radius (24px on cards, pill 999px on buttons).
4. Two new reusable components: `StatCard` (default + featured-filled), `StatusPill` (green / amber / red tones).
5. Home dashboard becomes real: 4 stat cards wired to live data (`listUsers`, `listPendingForAll` etc.).
6. Sidebar active item: 3px green left bar + tinted background.
7. Search input becomes pill-shaped.

## Non-goals

- New routes / new modules.
- Donezo's chart widgets, time tracker UI, mobile-app promo card.
- Tweaking light-vs-dark separately in admin settings (still light-only overrides; dark fixed in v1).

---

## Architecture

### Surface model

Drop `backdrop-filter`. `.glass-panel` and `.glass-panel-strong` remain as **CSS aliases** of the new `.card-panel` so existing JSX doesn't need to be edited en masse — they all visually become opaque cards.

```css
.card-panel, .glass-panel, .glass-panel-strong {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.card-panel:hover, .glass-panel:hover { box-shadow: var(--shadow-elevated); transform: translateY(-1px); }
```

Note the `.glass-panel-strong` previous distinction (slightly higher blur + opacity) goes away. Both classes render identically. Acceptable simplification — the Donezo aesthetic doesn't differentiate.

### Palette tokens (replaces existing :root + [data-theme="dark"])

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#F5F5F0` | `#1A1A18` |
| `--color-card` | `#FFFFFF` | `#232320` |
| `--color-card-hover` | `#FAFAF7` | `#2A2A26` |
| `--color-surface` | `#F5F5F0` | `#1F1F1C` (legacy alias, used by topbar search input bg) |
| `--color-surface-strong` | `#FFFFFF` | `#232320` (legacy alias) |
| `--color-border` | `#E8E8E0` | `rgba(255,255,255,0.06)` |
| `--color-text` | `#1A1A1A` | `#F5F5F0` |
| `--color-text-muted` | `#6B7280` | `#A8A8A0` |
| `--color-primary` | `#1F4D2F` | `#4ADE80` |
| `--color-primary-hover` | `#143F2D` | `#22C55E` |
| `--color-primary-fill` | `#1F4D2F` | `#1F4D2F` |
| `--color-primary-fill-text` | `#FFFFFF` | `#FFFFFF` |
| `--color-accent` | `#22C55E` | `#22C55E` |
| `--status-green-bg` | `#D1FAE5` | `rgba(74,222,128,0.18)` |
| `--status-green-text` | `#065F46` | `#86EFAC` |
| `--status-amber-bg` | `#FEF3C7` | `rgba(251,191,36,0.18)` |
| `--status-amber-text` | `#92400E` | `#FCD34D` |
| `--status-red-bg` | `#FCE7F3` | `rgba(244,114,182,0.18)` |
| `--status-red-text` | `#9F1239` | `#FBCFE8` |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)` |
| `--shadow-elevated` | `0 1px 3px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.06)` | `0 1px 3px rgba(0,0,0,0.5), 0 12px 32px rgba(0,0,0,0.4)` |
| `--shadow-glass` (legacy alias) | same as `--shadow-card` | same as `--shadow-card` |
| `--radius-sm` | `8px` | `8px` |
| `--radius-md` | `12px` | `12px` |
| `--radius-lg` | `24px` | `24px` (bumped from 20) |
| `--radius-pill` | `999px` | `999px` (new — for buttons + search) |

### Components

#### `components/ui/StatCard.tsx` (new)

```tsx
type Props = {
  label: string;
  value: string | number;
  delta?: string;        // e.g. "+5 from last month"
  deltaTone?: 'green' | 'amber' | 'red' | 'neutral';
  featured?: boolean;    // filled with --color-primary-fill, white text
  hint?: string;         // small footer line
};
```

Two variants:
- **default**: white card, dark text, optional small delta pill
- **featured**: filled `--color-primary-fill` (deep forest), white text, white-on-translucent delta pill

#### `components/ui/StatusPill.tsx` (new)

```tsx
type Props = { tone: 'green' | 'amber' | 'red'; children: ReactNode };
```

Simple span with background+text tokens. Replaces ad-hoc "Pending"/"Active"/"In Progress" string text in Leave + People + Attendance pages.

#### `components/ui/Button.tsx` (modify)

- Primary: forest green fill, pill-shaped, white text. **Default shadow:** `0 4px 12px rgba(31,77,47,0.25)` (forest-green tinted).
- Secondary: white fill, border, dark text, pill-shaped.
- Ghost: transparent, dark text. Pill-shaped.
- Danger: red (#DC2626) fill, pill-shaped.
- Sizes unchanged.

The change is purely visual (pill + new colors). No API change.

#### `components/layout/Sidebar.module.css` (modify)

- Sidebar background → solid white via `var(--color-card)`
- Active `.item` → `--color-card-hover` background + `box-shadow: inset 3px 0 0 var(--color-primary)` + `color: var(--color-primary)`
- Nav item icon stays at 18px; remove emoji-style icon containers (already lucide)

#### `components/layout/TopBar.module.css` (modify)

- Topbar bg → solid `var(--color-card)`
- `.searchWrap` → `border-radius: var(--radius-pill)`, slimmer
- `.userBadge` → unchanged structurally; rounded pill

#### `components/layout/ThemeToggle.module.css` (modify)

- Dropdown `.menu` → solid `var(--color-card)`, drop blur

### Home dashboard refresh

`app/(portal)/home/page.tsx` becomes:

```tsx
const users = await listUsers();
const pending = await listPendingForAll();
const myLeaves = await listUserLeaves(session.user.id);
const myApprovedThisYear = myLeaves.filter(l => l.status === 'approved' && l.startDate.startsWith(String(new Date().getUTCFullYear()))).length;

<StatCard featured label="Total Employees" value={users.length} />
<StatCard label="Active Employees" value={users.filter(u => u.active).length} />
<StatCard label="Pending Leave Requests" value={pending.length} hint={pending.length > 0 ? 'Awaiting approval' : 'All clear'} />
<StatCard label="My Approved Leave" value={myApprovedThisYear} hint="this year" />
```

Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`.

Plus a heading "Welcome, {name}" above.

### Status pill rollout

Where to swap raw status text → `<StatusPill>`:
- `app/(portal)/leave/balance/page.tsx`: history table status column (`pending` → amber, `approved` → green, `rejected` → red)
- `app/(portal)/people/page.tsx`: status column (`Active` → green, `Inactive` → red)
- `app/(portal)/attendance/timesheet/page.tsx`: clockOut === null → amber "Open", else green "Closed"

### What we keep

- Three-mode theme system + toggle (light/dark/system)
- Responsive shell (drawer at <lg, table-to-card at <sm)
- All routes, server actions, permission gates, audit logging
- Existing tests (90 passing) — none should regress

### What we explicitly **remove**

- `.bg-mesh` is no longer applied to `<body>`. Body gets a solid background. The CSS class itself can stay defined for compat but is unused.

---

## File changes

### New

- `components/ui/StatCard.tsx` + `StatCard.module.css`
- `components/ui/StatusPill.tsx` + `StatusPill.module.css`
- `components/ui/StatCard.test.tsx` (renders both variants)
- `components/ui/StatusPill.test.tsx` (renders each tone)

### Modified

- `app/globals.css` — palette rewrite, `.glass-panel` → alias, button pill, surface aliases for legacy uses
- `app/layout.tsx` — drop `className="bg-mesh"` on `<body>`
- `components/ui/Button.module.css` — pill radius, new shadow on primary
- `components/layout/Sidebar.module.css` — active indicator change, colors
- `components/layout/TopBar.module.css` — pill search, color updates
- `components/layout/ThemeToggle.module.css` — drop blur, solid menu
- `app/(portal)/home/page.tsx` — 4 stat cards with live data
- `app/(portal)/leave/balance/page.tsx` — StatusPill in status column
- `app/(portal)/people/page.tsx` — StatusPill in status column
- `app/(portal)/attendance/timesheet/page.tsx` — StatusPill for open/closed

---

## Testing

### Unit (vitest)

- `components/ui/StatCard.test.tsx`:
  - Renders label + value
  - Renders delta when provided
  - Adds featured class when featured prop set
- `components/ui/StatusPill.test.tsx`:
  - Renders each tone (green/amber/red) with correct className

(Renders only, no behavior tests — these are pure display components. 6 new tests total.)

### Manual visual smoke

After implementation, in browser at desktop (1280) + mobile (375), both light and dark:
- Home: 4 stat cards render, featured one is deep forest, layout grid responsive
- People: status pills in directory
- Leave balance: status pills in history table
- Attendance timesheet: open/closed status pills
- Sidebar: active item has green left bar
- Topbar: pill-shaped search
- Theme toggle: dropdown is solid card (no blur)

---

## Acceptance criteria

- `node_modules/.bin/tsc --noEmit` clean
- `node_modules/.bin/vitest run` 96 passing (90 prior + 6 new)
- `node_modules/.bin/next build` exits 0
- `node_modules/.bin/eslint .` no new errors beyond baseline
- Dev server boots cleanly, login flow works, all pages render with new aesthetic

---

## Risks

1. **Legacy classnames** (`.glass-panel`, `.glass-panel-strong`) still referenced in ~12 JSX files. Aliasing them in CSS is the lightest path — pages keep working without edits.
2. **Tailwind utility classes** (`bg-text-muted`, etc.) in JSX expect specific color tokens. The token names stay identical (`--color-text`, `--color-text-muted`); only values change. No JSX edits needed for those.
3. **Inline-style usages of `var(--color-primary)`** etc. continue to work because token names are stable.
4. **`.bg-mesh` removal:** body had it. Drop it. If any other element references it, they keep their (now-unused) rule. No breakage.
5. **Button shadow change** with forest tint may look heavy on dark — verify visually; reduce intensity if needed.
