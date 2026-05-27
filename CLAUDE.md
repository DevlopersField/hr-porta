# CLAUDE.md — HR Portal handoff for future Claude sessions

> **Last updated:** 2026-05-27 · HEAD `31b393c` · 116 commits past baseline `da0d090`
> Read this first. It's a load-bearing summary so you can continue work without re-discovering everything.

## What this is

A **database-less HR portal** built on Next.js 16 App Router. All persistent state lives in JSON files under `data/` (which is gitignored at runtime). Auth via NextAuth v5 Credentials + JWT. Theme system with light/dark/system + responsive shell. UI follows a "Donezo-style" aesthetic: opaque cards + forest-green palette + soft shadows (no glassmorphism — `.glass-panel` is now a CSS alias of `.card-panel`).

The project deploys to a single Node process on a host with persistent disk (Railway / Fly.io / VPS). No serverless. No database. No external services beyond image uploads stored locally.

## Boot

```bash
cd "/Volumes/Dev Drive/vibecode/hr-porta"

# One-time env setup (if .env.local missing):
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
echo "DATA_DIR=$(pwd)/data" >> .env.local
echo "BOOTSTRAP_ADMIN_EMAIL=admin@local.test" >> .env.local

# Deps if not installed:
node_modules/.bin/next --version || pnpm install

# Run:
node_modules/.bin/next dev
```

First boot prints `BOOTSTRAP ADMIN CREATED — email=admin@local.test tempPassword=<...>` via Pino warn. Log in with that. The `mustChangePassword` flag is set but no forced-change UI exists yet (deferred).

**Do NOT use `BOOTSTRAP_ADMIN_EMAIL=admin@local`** — Zod v4's email validator requires a TLD. Use `admin@local.test` (already in `.env.example`).

## Critical: prefer `node_modules/.bin/*` over `pnpm`

`pnpm` (any version) auto-mutates `pnpm-workspace.yaml` on this project because of unapproved build scripts in `sharp` and `unrs-resolver` deps. To avoid committing the mutation accidentally, invoke binaries directly:

- `node_modules/.bin/tsc --noEmit`
- `node_modules/.bin/vitest run`
- `node_modules/.bin/eslint .`
- `node_modules/.bin/next dev`
- `node_modules/.bin/next build`

If `pnpm-workspace.yaml` shows as modified in `git status`, run `git checkout pnpm-workspace.yaml` before committing.

A proper fix is to run `pnpm approve-builds` once and commit the result. Hasn't been done.

## Status: shipped vs deferred

### Shipped modules (working end-to-end)

| Module | Routes | Backed by |
|---|---|---|
| Auth | `/login`, `/api/auth/[...nextauth]` | NextAuth v5 Credentials + JWT, edge-safe config split |
| Home | `/home` | 4 live stat cards (uses `listUsers`, `listPendingForAll`, `listUserLeaves`) |
| People | `/people`, `/people/[id]`, `/people/new` | `data/users.json`, custom per-user permissions, StatusPill on Active/Inactive |
| Settings | `/settings/{appearance,branding,layout,locale}` | `data/settings.json`, live theme customisation, image uploads |
| Leave | `/leave/{balance,request,approvals}` | `data/leaves/{userId}.json`, 4 types, status pills, self-approval blocked |
| Attendance | `/attendance/{clock,timesheet}` | `data/attendance/{userId}.json`, single open day, Open/Closed status pills |
| Document Center | `/document-center`, `/document-center/[slug]` | Markdown files in `content/document-center/`, gray-matter + marked + DOMPurify |
| Infra | `/api/{health,uploads/[filename]}` | health checks, image streaming |

### Deferred (nav references them, routes 404)

Engage, My Worklife, To do, Salary, Helpdesk, Request Hub, Workflow Delegates. Nav config in [components/layout/nav-config.ts](components/layout/nav-config.ts) already references all their routes — clicking them 404s. Each follows the foundation's pattern below.

## Architecture map

```
app/
├── layout.tsx                  Root layout. Reads hrp_theme cookie, sets data-theme.
│                               suppressHydrationWarning required (theme script races hydration).
├── page.tsx                    / → redirects to /home or /login based on auth
├── globals.css                 Palette tokens (light + dark via [data-theme="dark"]).
│                               .card-panel primitive + .glass-panel alias for back-compat.
├── login/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── health/route.ts
│   └── uploads/[filename]/route.ts
└── (portal)/
    ├── layout.tsx              Auth-gated route group. Wraps in PortalShell (drawer state).
    ├── actions/theme.ts        setThemeAction (cookie write)
    ├── home/page.tsx
    ├── people/{page,actions,[userId],new,components/PermissionEditor}.tsx
    ├── leave/{balance,request,approvals,actions,page}.tsx
    ├── attendance/{clock,timesheet,actions,page}.tsx
    ├── document-center/{page,[slug]}.tsx
    └── settings/{page,actions,appearance,branding,layout,locale}.tsx

auth.config.ts                  Edge-safe NextAuth config (NO db imports). Used by middleware.
middleware.ts                   Imports authConfig (edge-safe). Routes traffic, redirects to /login.

lib/
├── auth.ts                     Node-only NextAuth (with bcrypt + db lookups). Used by Server Actions.
├── permissions.ts              PERMISSIONS enum, hasPermission, canViewPeople,
│                               mergeSubmittedPermissions (preserves '*' wildcard).
├── theme.ts                    settingsToCssVars + resolveTheme (pure, unit-tested).
├── uploads.ts                  MIME-validated (no SVG). saveUploadedImage + readUploadStream.
├── logger.ts                   Pino structured logger.
└── db/
    ├── core.ts                 readJson, updateJson, withLock, atomicWrite, withLocks.
    │                           proper-lockfile with realpath:false + retries:100.
    ├── users.ts                CRUD; user record has permissions[] field.
    ├── settings.ts             Deep-merge save. Zod v4 schema with EXPLICIT defaults (not {}).
    ├── audit.ts                Append-only JSONL per day in data/audit/.
    ├── leaves.ts               Per-user shards. Self-approval enforced at data layer.
    │                           decideLeaveRequest validates status + existence.
    ├── attendance.ts           Per-user shards. Single open day invariant.
    ├── documents.ts            Reads content/document-center/*.md. Sanitizes HTML via DOMPurify.
    ├── seed.ts                 Bootstrap admin on first boot.
    ├── indexes.ts              [DEAD CODE] Built but never read. Candidate for removal.
    └── migrations.ts           [DEAD CODE] Skeleton only. Candidate for removal.

components/
├── ui/
│   ├── Button.tsx              Pill-shaped, 4 variants, 3 sizes
│   ├── Input.tsx               forwardRef'd, with label + error
│   ├── GlassPanel.tsx          Legacy name; renders as .card-panel
│   ├── StatCard.tsx            Default + featured (filled forest-green) variants
│   └── StatusPill.tsx          green / amber / red tones
├── layout/
│   ├── nav-config.ts           Single source of truth for sidebar nav
│   ├── ThemeInjector.tsx       Emits CSS overrides + system-mode inline script
│   ├── ThemeToggle.tsx         Client component, 3-item dropdown (Sun/Moon/Monitor)
│   ├── PortalShell.tsx         Client wrapper; holds drawer state via useDrawer context
│   ├── Sidebar.tsx + .module.css   Active item gets 3px green left bar
│   ├── SidebarItem.tsx, SidebarDropdown.tsx
│   └── TopBar.tsx + .module.css    Hamburger (<lg), pill search, ThemeToggle slot
└── settings/
    ├── SettingsTabs.tsx
    └── ImageUpload.tsx
```

## Patterns to follow when adding a new module

The foundation established these patterns. New modules MUST follow them.

### Data layer

- `lib/db/<module>.ts` with Zod schema + pure CRUD functions
- All file I/O goes through `readJson`, `updateJson`, `withLock`, `withLocks` from `lib/db/core.ts`
- For write-heavy data, per-user shard: `data/<module>/{userId}.json`
- For low-write / lookup data, monolithic file: `data/<module>.json`
- Schema defaults: explicit values, NOT `.default({})` (zod v4 requires output-typed values)

### Server Actions

- `app/(portal)/<module>/actions.ts` with `'use server'` at top
- Every action starts with `const user = await requireSession(PERMISSIONS.X)` for permission gating
- Audit-log every mutation: `await auditLog({ actorId, action, target, details })`
- **Never** put secrets (temp passwords, tokens) into `audit.details`. Already-known leak: `resetPasswordAction` URL query string.
- Use `revalidatePath('/<module>', 'layout')` after mutations

### Pages

- Server Components by default
- Top of every protected page: `await requireSession(PERMISSIONS.X)` — even if redundant with middleware (defense in depth)
- For pages exposing employee data: use `canViewPeople` helper from `lib/permissions.ts`
- Tables should have `className="responsive-card"` + `data-label="..."` on each `<td>` so they collapse to cards at `<sm`
- Use `<GlassPanel>` (legacy name, renders as opaque card) or just `className="card-panel"` for cards

### Components

- Existing UI primitives in `components/ui/`: `Button`, `Input`, `GlassPanel`, `StatCard`, `StatusPill`
- Inline `style={...}` requires `// eslint-disable-next-line react/forbid-dom-props` on the line directly above the JSX line with the `style=` prop (the only form that works — JSX-expression-internal does not)
- Section comments in components: `// ============= SECTION NAME =============`

### Testing

- Use Vitest. Tests in `<module>.test.ts` next to source
- Test setup at `tests/setup.ts` provides `makeTempDataDir()` for isolated DATA_DIR
- For new modules following TDD: write failing test → run vitest → verify RED → implement → verify GREEN → commit

## Theme system gotchas

1. **`suppressHydrationWarning` on `<html>`** — required because the inline script in `ThemeInjector.tsx` (only emitted when intent='system') mutates `data-theme` BEFORE React hydrates. Standard pattern from next-themes.

2. **Cookie name:** `hrp_theme`, values `'light' | 'dark' | 'system'`, written by `setThemeAction` in `app/(portal)/actions/theme.ts`. NOT HttpOnly (client script needs to read for system-mode matchMedia listener).

3. **Resolution chain:** `resolveTheme({cookie, settingsDefault, prefersDark})` in `lib/theme.ts`. Pure function. Unit-tested at `lib/theme.test.ts`. Server passes `prefersDark: undefined` (can't know); for 'system' intent, returns `resolved: null` — caller omits `data-theme` and the client script handles before paint.

4. **Admin only customizes LIGHT palette** in `/settings/appearance`. Dark palette is fixed in v1 (warm coffee + sage green).

## Auth gotchas

1. **Edge-safe split:** `middleware.ts` imports from `./auth.config.ts` (no db). Server Actions and Components import from `@/lib/auth.ts` (full, with bcrypt + db). Don't merge them — middleware runs on Edge runtime which can't import node:fs.

2. **`as any` casts on session.user** in pages: NextAuth v5 typing limitation; we cast at the boundary. See `lib/auth.ts` declaration merging.

3. **Stale permissions in JWT:** revoking permissions takes up to `SESSION_MAX_AGE` seconds (default 28800 = 8h) to take effect. JWT carries the snapshot. No DB roundtrip on session callback (perf tradeoff). Document for users.

## Known open issues (security follow-ups)

In rough priority order:

1. **Temp passwords in URL query strings.** `createUserAction` and `resetPasswordAction` redirect with `?newPassword=…` / `?resetPassword=…`. Leaks via browser history, server access logs, Referer header. Pre-flagged. The audit-log leak (same class) was fixed in `ea24b34`.

2. **`/api/uploads/[filename]` is public.** Anyone can `GET` any uploaded file by guessing the hash-derived filename. Acceptable for branding (logo/favicon used on login page must be public) but BAD if avatar uploads land here later — design choice needs revisiting.

3. **`countLeaveDays` counts weekends.** Documented as v2 deferred. Users with weekly leave hit annual quota faster than expected.

4. **`clockIn` UTC date boundary.** `todayInUtcDate()` uses `new Date().toISOString().slice(0,10)`. Users east of UTC who clock in early morning local get yesterday's date in UTC. settings.locale.timezone is captured but not consulted.

5. **Dead code:** `lib/db/indexes.ts` (write-only, never read), `lib/db/migrations.ts` (never invoked), `lib/db/users.ts:setPasswordResetToken` (token field never consumed).

6. **`PortalShell` route-change handler** triggers `react-hooks/set-state-in-effect` lint warning. Functional; minor smell. Could be reworked as a Layout Effect or via `usePathname` callback pattern.

7. **`auditLog` POSIX-append atomicity claim** is OS-fragile (only safe on Linux ext4/xfs under PIPE_BUF). Audit entries with rich details can exceed 4KB and interleave on concurrent writes.

## Test inventory

`node_modules/.bin/vitest run` → **98 tests passing** across 13 files:

- `lib/db/core.test.ts` — 5 tests (readJson + concurrent updateJson)
- `lib/db/users.test.ts` — 3 tests (CRUD + permissions)
- `lib/db/settings.test.ts` — 4 tests (deep-merge)
- `lib/db/audit.test.ts` — does not exist yet (audit is single-function)
- `lib/db/leaves.test.ts` — 14 tests (CRUD, balance, self-approval, status, withdraw)
- `lib/db/attendance.test.ts` — 8 tests (clockIn/Out invariants, listMonth)
- `lib/db/documents.test.ts` — 8 tests (slug regex, XSS sanitization)
- `lib/db/seed.test.ts` — 3 tests (bootstrap admin idempotency + default email)
- `lib/permissions.test.ts` — 24 tests (hasPermission, canViewPeople, mergeSubmittedPermissions)
- `lib/uploads.test.ts` — 9 tests (MIME, size, traversal)
- `lib/theme.test.ts` — 7 tests (resolveTheme matrix)
- `app/(portal)/actions/theme.test.ts` — 3 tests (cookie write + Zod validation)
- `components/ui/StatCard.test.tsx` — 4 tests
- `components/ui/StatusPill.test.tsx` — 4 tests

Baseline lint error to ignore: `tests/setup.ts:3` `no-restricted-imports` for `node:fs` (the test helper itself needs it). Plus a handful of "unused eslint-disable directive" warnings (benign — directives left as defensive markers).

## Skill / workflow conventions

This project has been built using the superpowers framework. The discipline that has been applied:

- **TDD for any new behavior:** failing test → red → green → commit. Bug fixes always start with a failing test that reproduces the bug.
- **Brainstorming → spec → plan → execute** for any creative work (new feature, UI overhaul). Specs live at `docs/superpowers/specs/`, plans at `docs/superpowers/plans/`.
- **Subagent-driven development:** one implementer subagent per task, two-stage review (spec compliance + code quality) after each.
- **One commit per fix.** No drive-by refactors. Commit messages reference the bug and the test.
- **No emojis in committed code** unless explicitly requested.
- **Auto mode:** the user prefers continuous execution over question loops. Make reasonable expert calls and report results; they'll redirect if needed.

## Quick-reference commands

```bash
# Verify everything passes
node_modules/.bin/tsc --noEmit && node_modules/.bin/vitest run && node_modules/.bin/next build

# Start fresh boot (deletes seeded data)
rm -rf data/ && node_modules/.bin/next dev

# Check what's running
lsof -ti :3000 && curl -s http://localhost:3000/api/health
```

## What to read before making changes

- This file (`CLAUDE.md`) — current state
- `docs/superpowers/specs/2026-05-19-hr-portal-design.md` — original design
- `docs/superpowers/specs/2026-05-27-hr-portal-donezo-style.md` — latest aesthetic spec (current truth on palette + components)
- `docs/superpowers/specs/2026-05-27-hr-portal-theme-responsive.md` — theme system spec
- `docs/superpowers/plans/2026-05-19-hr-portal-foundation.md` — foundation plan (47 tasks, all done)
- Latest 20 commits: `git log --oneline -20`

## When you're stuck

- Check this file's "Known open issues" — your problem might be tracked
- Read the corresponding `lib/db/<module>.ts` first — data layer is the load-bearing part
- For UI work, look at `app/globals.css` palette tokens before adding new colors
- Pattern unclear? Find the most-similar shipped module (Leave is canonical for full-stack module pattern; Document Center is canonical for read-only content pattern)
- If `tsc --noEmit` fails on something that looks unrelated to your change, run `git stash; node_modules/.bin/tsc --noEmit` to baseline whether it's pre-existing
