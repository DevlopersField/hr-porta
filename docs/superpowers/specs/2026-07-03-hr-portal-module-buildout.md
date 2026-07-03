# HR Portal — Module Buildout Roadmap

> **Date:** 2026-07-03 · Author: Claude (autonomous build authorized by user)
> Turns the 7 deferred nav modules (currently 404) into working, permission-gated,
> responsive modules following the established foundation patterns.

## Goal

Deliver a "proper HR portal with proper UI/UX for multiple users/teams." Single company,
many teams (department string + `managerId` hierarchy — no separate tenant/team entity).
Every currently-404 route becomes a real, end-to-end module.

## Non-goals (YAGNI)

- Multi-tenancy / org isolation.
- Real payroll calculation engine (Salary shows records that admins enter/generate; no tax math).
- Real-time / websockets.
- Email delivery (invites shown in-app, not emailed).

## Architecture (unchanged foundation)

Every module follows the canonical Leave pattern:

- **Data layer** `lib/db/<module>.ts` — Zod schema (explicit defaults, not `.default({})`),
  pure CRUD via `readJson`/`updateJson`/`withLock` from `lib/db/core.ts`.
  Write-heavy → per-user shard `data/<module>/{userId}.json`; low-write → monolithic `data/<module>.json`.
- **Server Actions** `app/(portal)/<module>/actions.ts` — `'use server'`, every action begins
  `const user = await requireSession(PERMISSIONS.X)`, audit-logs mutations via `auditLog`,
  `revalidatePath` after writes. Never put secrets in `audit.details`.
- **Pages** — Server Components, `await requireSession(...)` at top, responsive tables
  (`className="responsive-card"` + `data-label` on each `<td>`), UI primitives from `components/ui/`.
- **Tests** — Vitest next to source, `makeTempDataDir()` for isolation. Data-layer TDD.

Permissions already exist in `lib/permissions.ts` for every module. Nav already references
every route in `components/layout/nav-config.ts`. No new colors outside `globals.css` tokens.

## Phases

### Phase 0 — Foundation: users, teams, first-login security
- **Demo-org seed** (`data-seed/` + `seedIfEmpty`): optional realistic company —
  3 teams (Engineering, Sales, HR), ~12 employees with managers, sample leave/attendance.
  Gated behind `SEED_DEMO=true` so real deploys stay clean. Password for all demo users printed once.
- **First-login password change**: `/change-password` page + `changeOwnPasswordAction`;
  middleware/layout redirects users with `mustChangePassword` there. Closes the deferred forced-change gap.
- **Security fix**: stop leaking temp passwords in URL query strings — show the generated
  password once via a server-rendered banner keyed off a short-lived flag, not `?newPassword=`.
- Routes: `/change-password`; hardens `/people/new`.

### Phase 1 — Employee Profile (`/my-worklife/profile`)
- Self-service view/edit of own record (personal, job, emergency contact, avatar upload via `lib/uploads`).
- New per-user file `data/profiles/{userId}.json` for extended fields (phone, address, emergency contact,
  bio, pronouns) — core identity stays in `users.json`.
- Manager/admin read-only view of reports.

### Phase 2 — Requests & Approvals (`/request-hub`, `/todo/tasks`, `/todo/approvals`, `/workflow-delegates`)
- Generic request engine: types (Equipment, Travel, WFH, Expense, General), routed to the
  requester's manager (or a fallback approver with `APPROVE_REQUESTS`). Statuses pending/approved/rejected.
- **Request Hub**: raise + track own requests.
- **To-do / Approvals**: unified inbox of everything awaiting the current user's decision
  (generic requests + it also surfaces pending leave for approvers).
- **To-do / Tasks**: personal task list (self-created + auto-tasks like "review request X").
- **Workflow Delegates**: an approver delegates their approval authority to another user for a date range;
  approvals inbox honors active delegations.

### Phase 3 — Helpdesk (`/helpdesk`)
- Tickets with category (IT/HR/Facilities), priority, threaded replies, status (open/in_progress/resolved/closed).
- Employees raise + view own; agents with `EDIT_HELPDESK` see the full queue and respond.

### Phase 4 — Engage (`/engage`)
- Announcement feed. `PUBLISH_ENGAGE` can post; everyone reads and can react (emoji counts).
- Monolithic `data/engage.json` (low write volume).

### Phase 5 — Salary (`/salary/payslips`, `/salary/tax-documents`)
- Per-user payslip + tax-document records. Employees view/download own only.
- `EDIT_SALARY`/`GENERATE_PAYSLIPS` create records; `VIEW_ALL_SALARY` sees everyone.
- Strict gating — sensitive. No amounts in audit details.

### Phase 6 — Performance: Goals + Reviews (`/my-worklife/goals`, `/my-worklife/reviews`)
- **Goals**: employee sets goals with progress %; manager can view/comment.
- **Reviews**: review cycle — employee self-assessment + manager rating/notes; status draft/submitted/finalized.

## Cross-cutting acceptance criteria

- `node_modules/.bin/tsc --noEmit` clean.
- `node_modules/.bin/vitest run` — all existing 98 tests still pass + new data-layer tests pass.
- `node_modules/.bin/next build` succeeds.
- No route in `nav-config.ts` 404s for a permitted user.
- Every mutation permission-gated + audit-logged; responsive at `<640px`.
- One commit per phase, message references the phase.

## Execution note

Phase 0 is built first (shared/foundational). Phases 1–6 create disjoint file sets and are
implemented as independent module builds, each verified against the acceptance criteria before commit.
