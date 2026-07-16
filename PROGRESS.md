# PROGRESS

A running log of what's been built and what's next. Newest first.
Detailed architecture lives in [CLAUDE.md](CLAUDE.md); key facts in [MEMORY.md](MEMORY.md);
deploy steps in [docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md).

---

## Current status

- **Local:** `tsc --noEmit` clean · **237/237 vitest** · `next build` clean.
- **Full browser QA passed** (auth, timesheet, projects/kanban, leave, clock,
  permissions, dark mode, mobile, all 25 routes). See "2026-07-16 — QA" below.
- **Netlify:** persistence rewired to Netlify Blobs (persists across deploys).
  Not yet re-deployed with the latest fixes — see "To ship" below.

### To ship (Netlify) — user actions
1. Push the latest commit(s) to `main`.
2. Netlify dashboard → set `AUTH_SECRET` and `BOOTSTRAP_ADMIN_PASSWORD` (a NEW
   password — the old `virajchaudhary` is public in git history), ensure
   `NEXTAUTH_URL` is unset.
3. Deploys → **Clear cache and deploy site**.
4. Log in with `virajchaudhary@gmail.com` + the dashboard password.
Full guide: [docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md).

---

## 2026-07-16 — Netlify Blobs persistence + hardening + QA

**Storage backend made pluggable** (`lib/db/core.ts`): `node:fs` locally / in tests
(unchanged), **Netlify Blobs** when deployed (`NETLIFY=true` or
`STORAGE_BACKEND=blobs`). `updateJson` uses etag compare-and-set on Blobs;
uploads + audit route through the same switch. Fixes serverless data loss and the
intermittent-login problem on Netlify. Fixed global admin seeded from
`BOOTSTRAP_ADMIN_PASSWORD`. Spec: `docs/superpowers/specs/2026-07-16-netlify-blobs-persistence.md`.

**QA (5 angles):** static (tsc/vitest/eslint), security review, and full browser
testing of every functional flow + dark/mobile/nav. Fixes made from findings:
- Renamed `useBlobs()`→`storageIsBlobs()` (react-hooks lint false-positive that
  broke the lint gate).
- Routed the new binary storage helpers through the path-traversal guard.
- `SEED_DEMO=false` in `netlify.toml` (demo accounts share a repo-public password
  and carry HR perms — must not seed on a public URL).
- **`/settings/*` now gated on `MANAGE_SETTINGS`** via a segment layout — QA found
  the settings pages were viewable by any logged-in user via direct URL (writes
  were already blocked). Now consistent with `/people`, `/workflow-delegates`, etc.

## 2026-07-16 — Project kanban → task-level kanban

Reworked the projects/timesheet UI over several iterations:
- Timesheet grid: filled cells open the **edit modal directly** (removed the old
  scrolled entry list); delete lives in the edit popup.
- **Project = a plain wrapper** (name/code/description/due date). Dropped its own
  lifecycle status.
- **Tasks carry the Trello board:** each task has name/description/due date/status
  (Discuss → Design → Development → QA → UAT → Completed). Per-project board at
  `/attendance/timesheet/projects/[projectId]` with drag-and-drop that persists.
- **Global "New task"** on the projects list: pick project + status in one modal.
- **Delete project** (guarded — blocked if any time is logged against it).
- Projects link in the sidebar (under Attendance, `MANAGE_PROJECTS`).
- Themed dark-mode scrollbars (`app/globals.css`).
Specs: `docs/superpowers/specs/2026-07-16-*.md`.

## Earlier

See `CLAUDE.md` and `git log` for the timesheet-modal / enterprise-grid work
(2026-07-16), attachment hardening + timesheet system (2026-07-15), and the
module buildout (2026-07-03).

---

## Known / accepted (pre-existing)

- Unauthorized page access returns a **500** (app-wide, consistent across all
  gated pages) rather than a clean 403/redirect — a UX nicety, not a leak.
- Server-action validation errors render Next's generic error page (CLAUDE.md #8).
- Others in CLAUDE.md "Known open issues" (weekend leave counting, UTC clock
  boundary, dead code).

## Verify commands
```bash
node_modules/.bin/tsc --noEmit && node_modules/.bin/vitest run && node_modules/.bin/next build
```
