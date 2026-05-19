# HR Portal — Design Spec

**Date:** 2026-05-19
**Status:** Draft — pending user review
**Scope:** All 13 modules in a single spec (user-directed; tradeoff acknowledged — shared infra detailed, per-module sections describe pattern + variation)

---

## 1. Goals & non-goals

### Goals

Build a database-less HR portal where the **filesystem is the only data store**. JSON for structured data, Markdown for content. Self-hosted on a long-running Node server with a persistent disk. Code lives on GitHub; deploys are triggered by GitHub pushes. Target scale: 200–1000 employees.

### Non-goals (v1)

Email notifications, 2FA, SSO, mobile app, public API, multi-tenancy, i18n, real-time push, salary CSV import, reporting dashboards. All addressable in v2+ without architecture change.

### Locked decisions

| Decision | Choice |
|---|---|
| Framework | Next.js (App Router) + React |
| Styling | Tailwind CSS + CSS Modules (px units only) |
| Data layer | `fs/promises` + JSON files + Markdown files |
| Locking | `proper-lockfile` (file-system locks) |
| Auth | NextAuth Credentials provider + bcrypt + JWT |
| Permissions | Custom per-user permission arrays (not roles) |
| Mutation layer | Pure Server Actions (no `/api` routes except `auth`, `uploads`, `health`) |
| Deployment | Fly.io or Railway, single instance, persistent volume mounted at `/data` |
| Markdown | `next-mdx-remote` for render, `gray-matter` for frontmatter |

---

## 2. Folder structure

```
hr-porta/
├── app/
│   ├── layout.tsx                        # Root layout, injects theme CSS vars from settings.json
│   ├── login/page.tsx
│   ├── (portal)/
│   │   ├── layout.tsx                    # Sidebar + main shell
│   │   ├── home/page.tsx
│   │   ├── engage/page.tsx
│   │   ├── my-worklife/{profile,goals,reviews}/page.tsx
│   │   ├── todo/{tasks,approvals}/page.tsx
│   │   ├── salary/{payslips,tax-documents}/page.tsx
│   │   ├── leave/{balance,request}/page.tsx
│   │   ├── leave/actions.ts
│   │   ├── attendance/{timesheet,clock}/page.tsx
│   │   ├── attendance/actions.ts
│   │   ├── document-center/{page.tsx, [slug]/page.tsx}
│   │   ├── people/{page.tsx, [userId]/page.tsx, actions.ts}
│   │   ├── helpdesk/{page.tsx, [slug]/page.tsx}
│   │   ├── request-hub/{page.tsx, new/page.tsx, actions.ts}
│   │   ├── workflow-delegates/{page.tsx, actions.ts}
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── appearance/page.tsx
│   │       ├── branding/page.tsx
│   │       ├── layout/page.tsx
│   │       ├── locale/page.tsx
│   │       └── actions.ts
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── uploads/[filename]/route.ts   # Read-only image stream
│       └── health/route.ts
├── components/
│   ├── layout/{Sidebar,SidebarItem,SidebarDropdown,TopBar,ThemeInjector,BackgroundCanvas}.tsx
│   ├── layout/nav-config.ts              # Single source of truth for nav tree
│   ├── ui/                               # Buttons, cards, inputs (glassmorphism kit)
│   ├── forms/                            # Form primitives wired to Server Actions
│   └── settings/{ColorPicker,ImageUpload,SettingsTabs}.tsx
├── lib/
│   ├── auth.ts                           # NextAuth config
│   ├── permissions.ts                    # PERMISSIONS enum, hasPermission, requirePermission
│   ├── theme.ts                          # settings → CSS variable map
│   ├── uploads.ts                        # Validate, name, save uploaded images
│   ├── markdown.ts                       # MD → HTML rendering
│   └── db/
│       ├── core.ts                       # readJson, withLock, updateJson, withLocks
│       ├── users.ts
│       ├── settings.ts
│       ├── attendance.ts
│       ├── leaves.ts
│       ├── salary.ts
│       ├── requests.ts
│       ├── tasks.ts
│       ├── goals.ts
│       ├── reviews.ts
│       ├── engage.ts
│       ├── delegates.ts
│       ├── content.ts                    # Markdown loader for /content
│       ├── indexes.ts                    # Rebuild helpers for /data/indexes/*
│       ├── audit.ts                      # Append-only audit log
│       ├── migrations.ts                 # Lazy schema migrations
│       └── seed.ts                       # First-boot seed from /data-seed
├── data/                                 # ⚠️ NOT committed — runtime data on persistent disk
│   ├── users.json
│   ├── settings.json
│   ├── attendance/{userId}.json          # Sharded per user
│   ├── leaves/{userId}.json
│   ├── salary/{userId}.json
│   ├── goals/{userId}.json
│   ├── reviews/{userId}.json
│   ├── requests.json
│   ├── tasks.json
│   ├── engage.json
│   ├── delegates.json
│   ├── indexes/{pending-approvals,attendance-today,people-search}.json
│   ├── uploads/                          # Uploaded images
│   ├── audit/{YYYY-MM-DD}.jsonl          # Append-only audit log
│   └── quarantine/                       # Files with failed Zod parse, moved aside
├── content/
│   ├── document-center/*.md
│   └── helpdesk/*.md
├── data-seed/                            # Defaults shipped with repo, copied to /data on first boot
│   ├── users.json                        # Bootstrap super-admin only
│   └── settings.json                     # Default theme + branding
├── scripts/
│   ├── seed.ts
│   ├── backup-snapshot.ts
│   └── rebuild-indexes.ts
├── docs/
│   ├── superpowers/specs/                # This file
│   └── runbook.md                        # Restore procedure
├── middleware.ts                         # Auth gate
├── instrumentation.ts                    # Runs seed on startup
├── fly.toml
├── Dockerfile
├── tailwind.config.ts
├── eslint.config.mjs                     # Forbid fs imports outside lib/db/*, forbid inline styles
└── .gitignore                            # /data/ ignored
```

---

## 3. Data layer (`lib/db/*`)

The single most load-bearing piece of the system.

### Core principles

1. Only `lib/db/*` touches the filesystem. ESLint rule enforces this.
2. Every write goes through `withLock()`. No direct `writeFile` calls.
3. Every write is atomic: write to `{path}.{rand}.tmp`, then `rename` (atomic on POSIX).
4. Every read validates with Zod. Corrupted file fails loudly, never silently.
5. Indexes are rebuilt by writers inside the same lock as the source mutation.

### `core.ts` API

```typescript
readJson<T>(relPath, schema, fallback?): Promise<T>
withLock<T>(relPath, mutator): Promise<T>
updateJson<T>(relPath, schema, fallback, mutator): Promise<T>
withLocks<T>(paths[], mutator): Promise<T>   // Sorted-order lock acquisition for multi-file actions
```

Path resolution is sandboxed to `DATA_DIR` — `path.resolve` + `startsWith` check blocks traversal.

### Per-domain module pattern

Every `lib/db/*.ts` module exports:

- A Zod schema describing the file's shape.
- Read functions: `getX`, `listX`, `findX`.
- Write functions: pure, take the existing state, return new state, called inside `updateJson`.

All writes that affect indexes call the relevant index rebuild inside the same lock.

### Index files

| Index | Purpose | Rebuilt when |
|---|---|---|
| `indexes/pending-approvals.json` | Pending leave + request approvals across all users | Leave/request status change |
| `indexes/attendance-today.json` | Who clocked in today vs. who hasn't | Clock-in/out |
| `indexes/people-search.json` | Searchable user directory (name, dept, email) | User create/edit |

Indexes are derivable — `scripts/rebuild-indexes.ts` regenerates any/all from source files.

### Validation

- Read: Zod parse → bad data on disk = throw.
- Write: Zod validate new state before writing.
- Server Actions: Zod validate user input before calling db layer (defense in depth).
- Schemas live with the db module that owns the data.

### Crash safety

| Scenario | Outcome |
|---|---|
| Crash mid-write | Atomic rename → either old or new file on disk, never partial. Stale `.tmp` swept on startup. |
| Crash holding lock | `proper-lockfile` stale detection reclaims after 10s. |
| Disk full | `writeFile` throws, lock releases cleanly, target file untouched. |
| Concurrent writes to same file | Serialized via lock; each sees prior writes. |
| Disk corruption | Zod parse fails → file moved to `data/quarantine/{name}-{ts}.json` → admin banner. |

---

## 4. Authentication & permissions

### `users.json` shape

```json
{
  "users": [
    {
      "id": "u_bootstrap",
      "email": "admin@company.com",
      "passwordHash": "$2b$12$...",
      "displayName": "Bootstrap Admin",
      "avatarPath": null,
      "department": "HR",
      "jobTitle": "HR Administrator",
      "managerId": null,
      "permissions": ["*"],
      "active": true,
      "createdAt": "2026-05-19T10:00:00Z",
      "lastLoginAt": null,
      "passwordResetToken": null,
      "mustChangePassword": true
    }
  ]
}
```

`"*"` is the wildcard granted only to the bootstrap super-admin. All other users have explicit permission strings.

### Permission enum (canonical list)

All permission strings are defined as constants in `lib/permissions.ts`:

```
VIEW_ALL_PEOPLE, EDIT_USER_PROFILES, MANAGE_PERMISSIONS, CREATE_USERS, DEACTIVATE_USERS,
APPROVE_LEAVE, VIEW_TEAM_LEAVE, VIEW_ALL_LEAVE,
VIEW_TEAM_ATTENDANCE, VIEW_ALL_ATTENDANCE, EDIT_ATTENDANCE_RECORDS,
VIEW_ALL_SALARY, EDIT_SALARY, GENERATE_PAYSLIPS,
APPROVE_REQUESTS, VIEW_ALL_REQUESTS,
EDIT_DOCUMENTS, EDIT_HELPDESK, PUBLISH_ENGAGE,
MANAGE_DELEGATES,
MANAGE_SETTINGS
```

Helpers:

```typescript
hasPermission(user, PERMISSIONS.APPROVE_LEAVE): boolean
requirePermission(user, PERMISSIONS.APPROVE_LEAVE): void  // throws ForbiddenError
```

### NextAuth configuration

- Provider: Credentials (email + password).
- Session strategy: JWT in httpOnly cookie, signed with `AUTH_SECRET`, 8-hour expiry.
- Permissions are baked into the JWT at login → no DB lookup per request.
- Tradeoff: permission changes take effect at next login (or token refresh). Acceptable for v1.

### Route protection (middleware)

`middleware.ts` redirects unauthenticated requests to `/login` and authenticated requests on `/login` to `/home`. Matches all routes except `/api/auth/*`, static assets.

### Server Action permission guard pattern

`lib/auth.ts` exports a `requireSession(permission?: Permission)` helper that combines `auth()` + `requirePermission()` into one call. Every mutating Server Action begins with:

```typescript
'use server';
export async function actionName(input: ...) {
  const user = await requireSession(PERMISSIONS.SOMETHING);  // throws if not authed / no perm
  const parsed = InputSchema.parse(input);
  await db.someMutator(...);
  await auditLog(user.id, 'action.name', { ... });
  revalidatePath('/relevant');
}
```

`requireSession()` without an argument enforces only the auth check (used for actions that operate on the caller's own data, like `clockIn`).

### Bootstrap super-admin

- `data-seed/users.json` ships one user with `permissions: ["*"]`.
- On first boot, `instrumentation.ts` calls `seedIfEmpty()`.
- Initial password: random 16-char string printed to server log, must be changed on first login.
- Email configurable via `BOOTSTRAP_ADMIN_EMAIL` env var (defaults to `admin@local`).

### Password rules

- Hashing: bcrypt, cost 12.
- Minimum length: 10 chars.
- Required complexity: ≥1 letter, ≥1 number.
- Reset: admin with `EDIT_USER_PROFILES` triggers reset → one-time token shown in admin UI (no email server in v1) → user changes password on next login.

---

## 5. Layout, sidebar & glassmorphism

### Design tokens (CSS variables)

`ThemeInjector` (Server Component in root layout) reads `settings.json` and renders an inline `<style>` block with all design tokens as CSS variables:

```
--color-primary, --color-primary-hover, --color-accent,
--color-bg, --color-surface, --color-surface-strong, --color-border,
--color-text, --color-text-muted,
--glass-blur, --glass-opacity, --shadow-glass, --shadow-elevated,
--radius-sm/md/lg,
--sidebar-width, --sidebar-width-collapsed, --topbar-height
```

Changing settings → rewrites `settings.json` → next render uses new values. No rebuild.

### Glass surface utilities

Two base classes in global CSS:

- `.glass-panel` — standard glass: `backdrop-filter: blur(var(--glass-blur)) saturate(180%)`, border, soft shadow.
- `.glass-panel-strong` — elevated glass: 1.5× blur, stronger saturation, deeper shadow.

### Portal shell layout

CSS Grid, fixed pixel measurements. Sidebar 264px wide, top bar 64px tall, 16px gap between panels, 16px outer padding. Mobile (<768px): sidebar becomes off-canvas drawer triggered by topbar hamburger; grid collapses to single column.

### Sidebar

Nav tree defined in `components/layout/nav-config.ts` — single source of truth. Each item has: `id`, `label`, `href` (or `children`), `icon`, optional `requires` (permission), optional `position: 'bottom'`.

Sidebar renders only items the user has permission for. Dropdowns expand inline. Active route gets a `--color-primary` left border. Logo + company name at top (from settings). User avatar + sign-out menu at bottom.

Keyboard support: Tab navigates, Arrow keys move within group, Enter activates.

### Code organization rules

Every component file structured as:

```
// ============= IMPORTS =============
// ============= TYPES =============
// ============= COMPONENT =============
//   ============= HOOKS =============
//   ============= HANDLERS =============
//   ============= RENDER =============
```

Styles in CSS Modules next to the component. **Zero inline styles** — ESLint `react/forbid-dom-props` enforces. Only exception: `ThemeInjector` emits CSS variables (unavoidable).

### px-only enforcement

- Tailwind config overrides `spacing`, `fontSize`, `borderRadius` with pixel scales.
- Stylelint `declaration-strict-value` flags `rem`, `em`, `%` on length properties.
- Allowed exceptions: `%` in `rgba()`, rare `100%` backgrounds (whitelisted per declaration).

---

## 6. Module pattern + per-module brief

### The standard 5-file module shape

```
app/(portal)/{module}/
├── page.tsx              # Server Component, reads from lib/db/*
├── [id]/page.tsx         # Detail view (if applicable)
├── actions.ts            # Server Actions, all mutations
└── components/           # Module-local components

lib/db/{module}.ts         # Zod schemas + read/write fns
```

### Conventions

- Server Components read. Server Actions write.
- Lists paginate: `?page=N&q=search`, default page size 25.
- Forms progressively enhance: `<form action={serverAction}>` works without JS.
- Indexes are rebuilt inside the same lock as the source mutation.

### Module table

13 distinct modules in the sidebar (Home, Engage, My Worklife, To do, Salary, Leave, Attendance, Document Center, People, Helpdesk, Request Hub, Workflow Delegates, Settings). The table below lists 19 rows because several modules contain multiple sub-pages — each row is a distinct page/route, not a distinct module.

| # | Module / Sub-page | Data file(s) | Key Server Actions | Required permissions |
|---|---|---|---|---|
| 1 | Home | reads multiple | none | logged-in |
| 2 | Engage | `engage.json` | `publishAnnouncement`, `archiveAnnouncement` | `PUBLISH_ENGAGE` to publish |
| 3 | My Worklife → Profile | `users.json` | `updateOwnProfile`, `changePassword` | own profile |
| 4 | My Worklife → Goals | `goals/{userId}.json` | `addGoal`, `updateGoalProgress`, `closeGoal` | self + managers see reports |
| 5 | My Worklife → Reviews | `reviews/{userId}.json` | `submitSelfReview`, `submitManagerReview` | mixed |
| 6 | To do → Tasks | `tasks.json` | `createTask`, `completeTask`, `deleteTask` | own |
| 7 | To do → Approvals | `indexes/pending-approvals.json` | (none — approve happens in source module) | `APPROVE_LEAVE` ∪ `APPROVE_REQUESTS` |
| 8 | Salary → Payslips | `salary/{userId}.json` | `uploadPayslip` | self view; `VIEW_ALL_SALARY` for others |
| 9 | Salary → Tax Documents | `salary/{userId}.json` (separate section) | `uploadTaxDoc` | same |
| 10 | Leave → Balance | `leaves/{userId}.json` | none | self / managers |
| 11 | Leave → Request | `leaves/{userId}.json` + index | `submitLeaveRequest`, `approveLeaveRequest`, `rejectLeaveRequest`, `cancelLeaveRequest` | self for submit; `APPROVE_LEAVE` for approve |
| 12 | Attendance → Timesheet | `attendance/{userId}.json` | (read only) | self / `VIEW_TEAM_ATTENDANCE` |
| 13 | Attendance → Clock | `attendance/{userId}.json` + index | `clockIn`, `clockOut` | own |
| 14 | Document Center | `content/document-center/*.md` | `createDocument`, `updateDocument`, `deleteDocument` | `EDIT_DOCUMENTS` for writes |
| 15 | People | `users.json` | `createUser`, `updateUserProfile`, `updateUserPermissions`, `deactivateUser`, `resetUserPassword` | various |
| 16 | Helpdesk | `content/helpdesk/*.md` | `createArticle`, `updateArticle`, `deleteArticle` | `EDIT_HELPDESK` for writes |
| 17 | Request Hub | `requests.json` + index | `submitRequest`, `approveRequest`, `rejectRequest`, `commentOnRequest` | self for submit; `APPROVE_REQUESTS` |
| 18 | Workflow Delegates | `delegates.json` | `createDelegation`, `revokeDelegation` | `MANAGE_DELEGATES` |
| 19 | Settings | `settings.json` + `data/uploads/` | `saveSettings`, `uploadImage`, `deleteImage` | `MANAGE_SETTINGS` |

### Approval routing

When `approveLeaveRequest` / `approveRequest` runs:

```
1. Look up employee.managerId
2. Check delegates.json for active delegation FROM managerId
3. If active delegation found and scope includes this action → route to delegate
4. Otherwise → route to manager
```

`delegates.json` entries have `fromUserId`, `toUserId`, `startsAt`, `endsAt`, `scope[]`. Active = current time within window.

### Markdown modules (Document Center, Helpdesk)

Read from `/content/{folder}/*.md` via `gray-matter` + `next-mdx-remote`. Frontmatter contract:

```yaml
---
title: string
category: string
updatedAt: YYYY-MM-DD
author: string
tags: string[]
---
```

Editing UI: textarea + live preview pane. No WYSIWYG in v1. Writes go through `withLock` like JSON files.

### Settings module tabs

| Tab | Controls |
|---|---|
| Appearance | primaryColor, accentColor, backgroundTint, glassOpacity (0–100), glassBlur (0–48 px), defaultMode (light/dark) |
| Branding | companyName, logo upload, favicon upload, login hero upload |
| Layout | sidebarPosition (left/right), sidebarWidth (200–320 px), nav visibility toggles, nav ordering (drag-drop) |
| Locale | dateFormat (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD), timezone, weekStartsOn |

All tabs POST to one `saveSettings` Server Action with a partial settings object.

### Image upload flow

1. Admin drops image in `ImageUpload` component.
2. Posts FormData to `uploadImage` Server Action.
3. Validates: MIME type whitelist (png/jpeg/webp/svg), max 2 MB.
4. Saves to `data/uploads/{purpose}-{contentHash}.{ext}`.
5. Returns `/api/uploads/{filename}` URL.
6. `/api/uploads/[filename]/route.ts` streams file with correct Content-Type + 1-day cache.

---

## 7. Concurrency

### Lock primitive

`proper-lockfile` creates an atomic `.lock/` directory next to each target file. Inside lives a `lockfile` with PID + heartbeat timestamp.

### Configuration

| Setting | Value | Rationale |
|---|---|---|
| Retry policy | 10 retries, 50ms→250ms backoff, factor 1.5 | Max wait ~2.5s before ELOCKED |
| Heartbeat | every 5s | Well under stale threshold |
| Stale timeout | 10s | Reclaims locks from crashed holders quickly |

### Multi-file actions — deadlock prevention

Hard rule: **acquire locks in lexicographic path order.** `withLocks(paths[], mutator)` sorts before acquiring. Any two actions wanting the same set of files will acquire in identical order → no circular wait.

### Lock granularity

| File | Granularity | Rationale |
|---|---|---|
| `attendance/{userId}.json` | Per file | Each user only writes own |
| `leaves/{userId}.json` | Per file | Same |
| `salary/{userId}.json` | Per file | Admin writes, employee reads |
| `users.json` | Whole file | Admin-only writes, low frequency |
| `requests.json` | Whole file | Revisit if hot — shard by month in v2 |
| `settings.json` | Whole file | Admin-only |
| `indexes/*.json` | Per index | Independent caches |
| `tasks.json` | Whole file initially | Shard if hot |

### Performance characteristics

| Operation | p50 / p95 |
|---|---|
| Lock acquire (uncontended) | 2ms / 8ms |
| Lock acquire (1 waiter) | 50ms / 100ms |
| Read + Zod + write small JSON | 6ms / 14ms |
| Full clock-in (lock + read + write + index + release) | 25ms / 60ms |
| Approval routing (3 files) | 40ms / 90ms |

Estimated ceiling: 50–100 writes/second total. Peak realistic load (200–1000 users, morning clock-in rush): ~5 writes/sec. Two orders of magnitude headroom.

### Audit log

Separate from main locking. `data/audit/{YYYY-MM-DD}.jsonl` is append-only. Each Server Action appends one line: `{actorId, action, target, timestamp, ip}`. POSIX guarantees atomic appends below PIPE_BUF (~4 KB) — no lock required.

---

## 8. Backup, operations & deployment

### Backup — three layers

1. **Hourly git snapshots.** Tarball of `/data` committed to a separate private GitHub repo (`hr-porta-data-backups`). 30-day retention (~720 commits). Lives in a different account from the code repo where possible.
2. **Daily off-site object storage.** Nightly upload of latest snapshot to S3-compatible storage (Backblaze B2 or Cloudflare R2). 90-day retention. Different provider, different credentials, separate failure domain.
3. **On-demand download.** Settings → "Download backup" generates and streams a tarball for manual archives or pre-risky-change snapshots.

### Restore procedure

Documented in `docs/runbook.md`. Steps: stop app → SSH to volume → move corrupted `/data` aside → extract snapshot → restart. **Test quarterly.** A backup never restored from is not a backup.

### Environment variables

Required:

```
AUTH_SECRET=                # 32-byte random
NEXTAUTH_URL=               # https://hr.company.com
DATA_DIR=/data              # Volume mount path
BOOTSTRAP_ADMIN_EMAIL=admin@company.com
BACKUP_REPO_PATH, BACKUP_REPO_REMOTE, BACKUP_SSH_KEY
S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
```

Optional with defaults:

```
LOG_LEVEL=info
SESSION_MAX_AGE=28800
LOCK_STALE_MS=10000
LOCK_HEARTBEAT_MS=5000
```

`.env.example` ships with placeholders. `.env.local` / `.env.production` gitignored.

### Deployment — Fly.io (recommended) or Railway

Fly.io configuration: single instance, persistent volume `hr_data` mounted at `/data`, immediate deploy strategy (old instance down before new one up), health check polls `/api/health` every 30s.

Volume sizing: 10 GB covers years of HR data for 1000 employees.

### Single-instance constraint

The architecture assumes one Node process. The lockfile coordination would still work across processes, but any in-memory cache we add later would diverge. Configuration enforces `min_machines_running = 1` and never scales above 1.

### Health check (`/api/health`)

Verifies: `DATA_DIR` readable + writable, `settings.json` parses. Returns 200 if all pass, 503 otherwise.

### Logging & observability

- Pino structured JSON to stdout.
- Audit log to `data/audit/{date}.jsonl`.
- Sentry for exception monitoring (free tier sufficient at this scale). Ignores `ELOCKED` and `ForbiddenError`.
- No metrics endpoint in v1.

### Schema migration strategy

JSON schemas evolve via lazy per-file migration:

1. Bump version field in Zod schema.
2. Add migration function in `lib/db/migrations.ts`.
3. On read, if `parsed.version < CURRENT`, run migrations in order, write migrated state back through `withLock`.

No batch migration job — first read of an old file migrates it. Acceptable because all reads pass through `lib/db/*`.

### CI/CD

GitHub Actions on push to `main`: `pnpm install` → `typecheck` → `lint` → `test` → `build` → `fly deploy`. Pre-commit hook (Husky) runs typecheck + lint on staged files. Tests use `fs.mkdtempSync` for isolated `DATA_DIR` — never touch real data.

---

## 9. Out of scope for v1

Explicit non-goals to prevent surprise gaps in the implementation plan:

- Email notifications (no SMTP)
- 2FA / SSO (Google, Microsoft, SAML)
- Mobile app
- Public API for third parties
- Multi-tenancy
- I18n (English only)
- Real-time push (WebSockets, SSE)
- File attachments on requests (beyond image upload for settings)
- Salary CSV import / payroll integration
- Reporting / analytics dashboards
- WYSIWYG markdown editor

All are addressable in v2+ without architecture change.

---

## 10. Open questions for implementation plan

These don't change the design but need decisions before coding:

1. **Initial seed users beyond bootstrap admin** — does the user want any sample employee accounts in `data-seed/users.json` for testing, or just the admin?
2. **Markdown content seeds** — do we ship a few sample policy docs and helpdesk articles in `/content`, or start empty?
3. **Avatar storage** — same `data/uploads/` pattern as branding images, or separate `data/avatars/`?
4. **Salary file structure** — payslip as PDF upload (referenced from JSON) or structured JSON only?
5. **Goal/review cycles** — does the company run annual cycles, quarterly, continuous? Affects data shape.

The implementation plan will start with these.
