# Netlify Blobs persistence backend

**Date:** 2026-07-16
**Status:** approved

## Problem

The app persists everything as JSON/binary files under `data/` via `node:fs`.
On Netlify (serverless) there is no persistent, shared disk — `/tmp` resets on
cold start and isn't shared between concurrent function instances. Result: data
vanishes and login fails when a request hits an unseeded instance. The host is
not the problem; the file-based storage layer is.

## Fix: pluggable storage backend (fs locally, Netlify Blobs on Netlify)

Introduce a backend switch. **Local dev and the entire test suite keep using
`fs` unchanged** (backend only flips when `process.env.NETLIFY === 'true'`, which
Netlify sets automatically, or an explicit `STORAGE_BACKEND=blobs`). Netlify
Blobs is Netlify's native persistent store: free, no external service, strongly
consistent, shared across all instances, survives cold starts.

### Backend selector (`lib/db/core.ts`)

```ts
function useBlobs(): boolean {
  return process.env.STORAGE_BACKEND === 'blobs' || process.env.NETLIFY === 'true';
}
```

`getStore` is called lazily (inside the blobs branch only), never at module top
level, so local/test never touches Netlify context:
```ts
import { getStore } from '@netlify/blobs';
const store = getStore({ name: 'hr-portal', consistency: 'strong' });
```
Key = the existing relative path (`users.json`, `timesheets/<id>.json`, …) —
1:1 with today's `data/` layout (Blobs keys may contain slashes).

### JSON reads/writes

- `readJson(key, schema, fallback)` — blobs: `store.get(key, { type: 'json' })`;
  `null` → fallback (or throw if no fallback), else `schema.parse`.
- `updateJson(key, schema, fallback, mutator)` — blobs: optimistic
  read-modify-write with etag CAS retry (Blobs has no file lock):
  1. `const res = await store.getWithMetadata(key, { type: 'json' })`
  2. `current = res ? schema.parse(res.data) : fallback`
  3. `next = await mutator(current); schema.parse(next)`
  4. `const w = await store.set(key, JSON.stringify(next), res ? { onlyIfMatch: res.etag } : { onlyIfNew: true })`
  5. `if (w.modified) return next;` else back off and retry (cap ~25 attempts,
     then throw "too many write conflicts").
  This preserves the concurrency-safety `withLock` gave on fs.

### withLock / withLocks

Blobs has no lock primitive. On the blobs backend these just run the mutator
directly (no lock). Grep for direct callers outside `updateJson`; if any do a
manual read-modify-write across files, note it as an accepted last-write-wins
caveat for the demo (updateJson's CAS covers single-file writes, which is the
common case).

### Binary uploads (`lib/uploads.ts` + upload API routes)

Add backend-switched binary helpers to `core.ts`: `readBinary(key)`,
`writeBinary(key, buf)`, `deleteKey(key)`. On blobs: `store.get(key, { type:
'arrayBuffer' })` → `Buffer.from(...)`; write via `store.set(key, arrayBuffer)`.
`saveUploadedImage` / `saveUploadedFile` / `readUploadStream` use these instead
of direct `fs` — their signatures and return shapes are unchanged, so the
attachment registry and the `/api/uploads/[filename]` + `/api/files/[id]` routes
need no changes (they already call `readUploadStream`).

### Audit log (`lib/db/audit.ts`)

`fs.appendFile` has no Blobs equivalent. On blobs, write each entry as its own
key: `audit/<YYYY-MM-DD>/<ISO-ts>-<rand>.json` via `store.setJSON` — append-only,
race-free, and audit is never read back in the UI so the format change is safe.
Fs path unchanged.

### Seed (`lib/db/seed.ts`) — fixed global admin

- The `data-seed/` fs copy is a defaults convenience; on the blobs backend skip
  it (settings fall back to schema defaults, which already parse — the live
  health check confirmed `settingsParses: true`). Bootstrap admin + demo org go
  through the normal `createUser` path, which is now blobs-backed.
- **Fixed admin password from env** so login is stable:
  ```ts
  const fixed = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const password = fixed ?? crypto.randomBytes(12).toString('base64url');
  // ...createUser({ ..., mustChangePassword: fixed ? false : true })
  if (!fixed) logger.warn({ email, tempPassword: password }, '...');
  ```
  With `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` set in the Netlify
  dashboard (never committed), the admin logs in with those creds, no forced
  change, and persists in Blobs (seed is idempotent — runs once).

### Dependency + config

- Add `@netlify/blobs` to `package.json` dependencies.
- `netlify.toml` `[build.environment]`: add
  `BOOTSTRAP_ADMIN_EMAIL = "virajchaudhary@gmail.com"` and add
  `BOOTSTRAP_ADMIN_PASSWORD` to `SECRETS_SCAN_OMIT_KEYS`. Keep existing
  `AUTH_TRUST_HOST=true`, `SEED_DEMO=true`.
- **`BOOTSTRAP_ADMIN_PASSWORD` is NOT committed** — set in the Netlify dashboard
  (Site settings → Environment variables). Manual one-time step for the user.
- Ensure `NEXTAUTH_URL` is NOT set on Netlify (it forces localhost redirects;
  `AUTH_TRUST_HOST=true` infers the real host). Already flagged earlier.

## Out of scope

- Removing the fs backend (kept for local dev + the 237-test suite).
- Migrating existing local `data/` into Blobs (fresh seed on Netlify is fine).
- Blobs-path unit tests (can't run Netlify context locally) — verified on the
  live deploy via `/api/health` + browser login.

## Testing / verification

- Local (fs path, unchanged): `tsc --noEmit`, `vitest run` (expect 237),
  `next build` all clean.
- Live (blobs path): after deploy, `curl /api/health` → 200 all-true, then log
  in at the Netlify URL with the configured admin email + password and
  confirm it reaches `/home`; create a record, redeploy, confirm it persists.
