# Deploying the HR Portal to Netlify with long-term (persistent) data

This app has **no database** — it stores everything (users, timesheets, projects,
leave, uploads, audit) as JSON/binary blobs. On a normal server it writes files to
disk. On Netlify (serverless) there is no persistent, shared disk, so it uses
**Netlify Blobs** instead — a built-in, free, persistent key/value store that is
shared across every function instance and **survives cold starts and redeploys**.

You do not have to change any code. The app auto-detects Netlify (`NETLIFY=true`)
and switches from files to Blobs automatically (see `lib/db/core.ts`,
`storageIsBlobs()`). Locally it keeps using files, unchanged.

---

## One-time setup

### 1. Connect the repo (already done)
Netlify is connected to the GitHub repo `DevlopersField/hr-porta` and builds on push.
No extra plugin is needed — Netlify auto-detects Next.js and applies its Next.js
runtime, which is what makes Blobs available inside the server functions.

### 2. Set environment variables
Netlify dashboard → **Site configuration → Environment variables**. Add:

| Key | Value | Notes |
|---|---|---|
| `AUTH_SECRET` | output of `openssl rand -base64 32` | **Required.** Signs the login session (JWT). |
| `BOOTSTRAP_ADMIN_PASSWORD` | a strong password you choose | **Required for a stable login.** Never commit it. |

Already set for you in `netlify.toml` (no action needed): `AUTH_TRUST_HOST=true`,
`SEED_DEMO=false`, `BOOTSTRAP_ADMIN_EMAIL=virajchaudhary@gmail.com`, `NODE_VERSION=20`.

**Do NOT set these on Netlify:**
- `NEXTAUTH_URL` — if present, next-auth uses it for every redirect and sends users
  to `localhost`. Leave it unset; `AUTH_TRUST_HOST=true` infers the real host.
- `DATA_DIR` — would force the file backend and defeat Blobs. Leave it unset.

> Blobs itself needs **no** credentials or config. On a deployed Netlify site the
> runtime injects the Blobs context automatically, and the app uses a **site-wide
> named store** (`getStore({ name: 'hr-portal' })`) that persists across deploys —
> not a per-deploy store, so your data is NOT wiped when you redeploy.

### 3. Deploy
Push to the connected branch, **or** Netlify → **Deploys → Trigger deploy →
"Clear cache and deploy site"** (always use clear-cache after changing env vars).

---

## First login

Log in at `https://<your-site>.netlify.app/login` with:
- **Email:** the `BOOTSTRAP_ADMIN_EMAIL` value (`virajchaudhary@gmail.com`)
- **Password:** the `BOOTSTRAP_ADMIN_PASSWORD` you set in step 2

This admin (full permissions) is seeded **once**, the first time the Blobs store is
empty, and then persists. There is no forced password change when a fixed password
is set.

---

## Verify it works (and that data is long-term)

1. `curl -s https://<your-site>.netlify.app/api/health` → `{"dataDirReadable":true,"dataDirWritable":true,"settingsParses":true}`
   (Note: on Blobs these flags reflect the store being reachable/writable.)
2. Log in, create something (a project, a timesheet entry).
3. Netlify → **Deploys → Trigger deploy → Clear cache and deploy**.
4. Log back in — the record you created is **still there**. That confirms Blobs
   persistence across deploys.

---

## Operating notes for long-term data

- **Store of record:** the site-wide Blobs store named `hr-portal`. It holds the
  same keys the file layout used (`users.json`, `timesheets/<id>.json`,
  `projects.json`, `uploads/<file>`, `audit/<day>/…`).
- **Persistence:** survives cold starts and redeploys. It is NOT tied to a single
  function instance (unlike the earlier `/tmp` behavior, which is why login used
  to fail intermittently).
- **The fixed admin only seeds into an EMPTY store.** If the store already has a
  partial/broken state from earlier testing and login misbehaves, clear it (below)
  so it re-seeds cleanly.
- **Changing the admin password later:** change it in-app (Change Password), or
  clear the store to re-seed with a new `BOOTSTRAP_ADMIN_PASSWORD`. Editing the env
  var alone won't rewrite an already-seeded admin.
- **Backups:** Netlify Blobs does not auto-version your data. If this becomes a
  real production system, add a periodic export (a scheduled function that lists
  the store and writes a snapshot elsewhere). Not needed for a demo.

### Clearing / inspecting the store (Netlify CLI)
```bash
npm i -g netlify-cli
netlify login
netlify link                      # run in the repo, pick the site
netlify blobs:list hr-portal      # inspect keys
netlify blobs:delete hr-portal <key>   # delete a key
```

---

## Concurrency caveat (by design)

Blobs has no file locks. Single-record writes are made safe with an **etag
compare-and-set retry** in `updateJson` (a lost race retries with fresh data).
Cross-file operations are last-write-wins. For a small org / demo this is fine; a
high-concurrency production deployment should move to a real database.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Every page returns **500** | `AUTH_SECRET` missing, or an env/runtime error — check Netlify → **Logs → Functions**. |
| After login you land on **localhost:3000** | `NEXTAUTH_URL` is set — delete it, clear-cache redeploy. |
| **Invalid email or password** for the admin | Store already seeded with a different/empty admin. Set `BOOTSTRAP_ADMIN_PASSWORD`, clear the `hr-portal` store, redeploy. |
| Data disappears after a redeploy | You'd be on the file backend or a per-deploy store — confirm `DATA_DIR` is unset and you did not switch to `getDeployStore`. The code uses the persistent named store. |
| Env var change didn't take effect | Trigger **Clear cache and deploy** — plain redeploys reuse the old build env. |

---

## Security reminder

- `SEED_DEMO` is **off** in production on purpose: the demo accounts share a
  repo-public password and some carry HR permissions — never seed them on a public
  URL. To use demo data anyway, set `SEED_DEMO=true` **and** a strong `DEMO_PASSWORD`
  in the dashboard (never the committed default).
- Keep `BOOTSTRAP_ADMIN_PASSWORD` only in the Netlify dashboard, never in git.
