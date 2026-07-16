# Timesheet modal entry + enterprise polish — design

**Date:** 2026-07-16
**Status:** approved (auto mode — user requested: popup instead of scroll for add/edit time, enterprise-grade look, full QA pass)

## Problem

Adding time uses an always-visible inline form at the top of `/attendance/timesheet`;
the grid's `+` icons anchor-scroll to it. Editing swaps a row into an inline form.
Both feel scrappy: the user asked for popups (modals) for add and edit, and a more
enterprise-grade look overall.

## Approach (chosen)

**URL-driven, server-rendered modals with a thin client shell.**

The page already drives add/edit through search params (`?add=<date>&pt=…`,
`?edit=<id>`). Keep that: the Server Component conditionally renders a `<Modal>`
when the param is present. The modal component itself is a small client component
that handles Escape / backdrop-click / X (all navigate to a `closeHref`) and body
scroll lock. Forms inside stay plain server-action forms — zero changes to
`actions.ts` semantics.

Rejected alternatives:
- Client-state modal (`useState`) — forces the form area into client components,
  breaking the server-action/URL pattern used everywhere else.
- Native `<dialog>.showModal()` — needs a client effect anyway; a fixed overlay is
  simpler and fully stylable with existing tokens.

## Components

### 1. `components/ui/Modal.tsx` (+ `.module.css`) — new primitive

- `'use client'`. Props: `title: string`, `closeHref: string`, `children`.
- Fixed full-screen backdrop (`rgba` scrim), centered panel: `--color-card`,
  `--radius-lg`, `--shadow-elevated`, max-width 520px, `max-height: 85vh` with
  internal scroll.
- Header row: title + X close button. Escape key and backdrop click both call
  `router.push(closeHref)`; X is a `<Link>`.
- Locks `document.body` overflow while mounted. `role="dialog"` `aria-modal`,
  focus moves into the panel on mount.

### 2. Timesheet page rework (`app/(portal)/attendance/timesheet/page.tsx`)

- **Header**: `Log time` primary button (→ `?week=…&add=<today>`) next to the
  ghost `Clock in / out` link.
- **Add modal**: shown when `?add` is a valid date. Vertical form: project/task
  select (full width), date + hours side-by-side, note, footer `Cancel` +
  `Add entry`. The inline "Log time" panel is removed.
- **Edit modal**: shown when `?edit=<id>` matches an entry. Same layout, prefilled.
  The inline `EntryEditRow` swap is removed.
- **Grid `+` icons** keep their hrefs (they set `?add`/`?pt`) — now they open the
  modal instead of anchor-scrolling. `#log-time` anchors removed.
- **New-project modal** (admins): the large always-visible "Add project" form
  becomes a `New project` button → `?newProject=1` modal. Project list stays
  inline.
- **Enterprise grid styling**: move table styles from inline `style=` props into
  `timesheet.module.css` — uppercase 11px muted column headers, today-column
  highlight, weekend columns muted, row hover, `font-variant-numeric: tabular-nums`
  right-of-center alignment, emphasized totals band, `+` affordances appear on
  cell hover.
- **Week nav**: compact segmented prev/‹week label›/next control + "This week";
  week/month/clocked summary as quiet stat chips on the right.

## Data flow / errors

No data-layer or action changes. Zod validation errors in actions still throw
(existing behavior); QA pass will note UX gaps but fixing server-side error
display is out of scope unless trivial.

## Testing

- `components/ui/Modal.test.tsx` — renders title/children, close link href,
  dialog role (renderToStaticMarkup, matching StatCard test style).
- Full suite: `tsc --noEmit`, `vitest run`, `next build` must stay clean.
- **Browser QA (Playwright)** against a seeded dev server (`SEED_DEMO=true`):
  admin login, create user + first-login password change, add/edit/delete time
  entries via modals, grid prefill via `+`, project + task creation, archive,
  week navigation, team view as manager, permission checks as regular employee,
  dark mode + mobile viewport spot checks.
