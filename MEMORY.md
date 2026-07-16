# MEMORY — key facts to remember

Distilled, durable facts for anyone (human or AI) picking this project up.
For the full handoff read [CLAUDE.md](CLAUDE.md); for a dated log read [PROGRESS.md](PROGRESS.md).

## What this is
Database-less HR portal on Next.js 16 App Router. All state = JSON/binary blobs.
Auth = NextAuth v5 (Credentials + JWT). Deploys to **Netlify** (serverless).

## Storage (the load-bearing decision)
- Pluggable backend in `lib/db/core.ts` via `storageIsBlobs()`:
  - **Local + tests:** `node:fs` under `data/` (default; unchanged).
  - **Netlify:** **Netlify Blobs** (auto: `NETLIFY=true`), a persistent site-wide
    named store (`getStore({ name: 'hr-portal' })`) that survives cold starts AND
    redeploys. This is what makes serverless data long-term.
- `updateJson` on Blobs = etag compare-and-set retry (no file locks on Blobs).
- Force the backend explicitly with `STORAGE_BACKEND=blobs` if ever needed.

## Credentials / login
- Fixed admin is seeded from env: `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`.
  Set the password ONLY in the Netlify dashboard — never commit it.
- The admin seeds **once, into an empty store**, then persists. Changing the env
  password later does not rewrite an existing admin (change in-app or clear the store).
- Local dev admin: `admin@local.test` (temp password printed to logs on first boot
  unless `BOOTSTRAP_ADMIN_PASSWORD` is set).
- Demo org (`SEED_DEMO=true`, local only): 11 `*@acme.test` users / `Password123!`.
  **OFF in production** — those creds are public in the repo and some carry HR perms.

## Netlify gotchas (learned the hard way)
- **Never set `NEXTAUTH_URL` on Netlify** — next-auth treats it as authoritative and
  redirects users to `localhost`. `AUTH_TRUST_HOST=true` infers the real host.
- **Never set `DATA_DIR` on Netlify** — it forces the file backend and breaks Blobs.
- After changing env vars, always **Clear cache and deploy**.
- `virajchaudhary` was committed as a password to a public repo → it is BURNED; use
  a different admin password.

## Architecture quick-refs
- Projects are plain wrappers; **tasks** carry status + the kanban board
  (`/attendance/timesheet/projects/[projectId]`). Statuses: discuss/design/
  development/qa/uat/completed.
- Timesheet grid: filled cell → edit modal (no separate entry list).
- `PROJECT_STATUSES`/`ProjectStatus` live in `lib/project-status.ts` (client-safe),
  `formatHoursHM` in `lib/format-hours.ts` (client-safe, no `node:fs`).
- Gate every protected page with `requireSession(PERMISSIONS.X)` — settings is now
  gated via `app/(portal)/settings/layout.tsx`.

## Dev gotchas
- Prefer `node_modules/.bin/*` over `pnpm` (pnpm mutates `pnpm-workspace.yaml`).
- Sidebar Sign-out is the FIRST `button[type=submit]` on every portal page — in
  tests, target buttons by visible text, never a generic selector.
- Multiple `next dev` can't share `.next/`; isolate via a worktree on the SAME
  volume with a COW-cloned `node_modules` (Turbopack rejects cross-volume symlinks).

## Verify
```bash
node_modules/.bin/tsc --noEmit && node_modules/.bin/vitest run && node_modules/.bin/next build
```
237 tests green. Deploy steps: [docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md).
