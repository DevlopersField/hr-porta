// lib/db/core.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import lockfile from 'proper-lockfile';
import { getStore } from '@netlify/blobs';
import type { z } from 'zod';

// ============= BACKEND SELECTOR =============
// fs (local dev + the entire test suite) stays the default and behaves exactly
// as before. The Netlify Blobs backend only activates when running on Netlify
// (which sets NETLIFY=true automatically) or when explicitly forced via
// STORAGE_BACKEND=blobs. This is the single signal every module branches on.
export function storageIsBlobs(): boolean {
  return process.env.STORAGE_BACKEND === 'blobs' || process.env.NETLIFY === 'true';
}
// Internal alias so the branches below read naturally.
function useBlobs(): boolean {
  return storageIsBlobs();
}

// Lazily obtain the Netlify Blobs store. Called ONLY inside blobs branches so
// local/test runs never touch Netlify context. getStore auto-configures on a
// deployed Netlify site — no siteID/token passed.
function blobStore() {
  return getStore({ name: 'hr-portal', consistency: 'strong' });
}

// ============= CONFIG =============
export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  if (process.env.NETLIFY === 'true') {
    return '/tmp/data';
  }
  return path.join(process.cwd(), 'data');
}

const LOCK_OPTIONS = {
  retries: { retries: 100, minTimeout: 20, maxTimeout: 250, factor: 1.5, randomize: true },
  stale: Number(process.env.LOCK_STALE_MS ?? 10000),
  update: Number(process.env.LOCK_HEARTBEAT_MS ?? 5000),
};

// ============= TYPES =============
export type DbPath = string;

// ============= PATH RESOLUTION =============
function resolve(relPath: DbPath): string {
  const dataDir = getDataDir();
  const full = path.resolve(dataDir, relPath);
  if (!full.startsWith(path.resolve(dataDir))) {
    throw new Error(`Path traversal blocked: ${relPath}`);
  }
  return full;
}

// ============= READ =============
export async function readJson<T>(
  relPath: DbPath,
  schema: z.ZodType<T>,
  fallback?: T,
): Promise<T> {
  if (useBlobs()) {
    const store = blobStore();
    const data = await store.get(relPath, { type: 'json' });
    if (data == null) {
      if (fallback !== undefined) return fallback;
      // Mirror the fs ENOENT-with-no-fallback behavior (throw).
      throw new Error(`readJson: key not found and no fallback: ${relPath}`);
    }
    return schema.parse(data);
  }
  const full = resolve(relPath);
  try {
    const raw = await fs.readFile(full, 'utf8');
    return schema.parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT' && fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

// ============= ATOMIC WRITE =============
async function atomicWrite(full: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(full), { recursive: true });
  const tmp = `${full}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmp, data, 'utf8');
  await fs.rename(tmp, full);
}

// ============= LOCK + MUTATE =============
export async function withLock<T>(
  relPath: DbPath,
  mutator: () => Promise<T>,
): Promise<T> {
  if (useBlobs()) {
    // Blobs has no file-lock primitive. Single-file write safety is provided by
    // updateJson's etag CAS loop; here we just run the mutator directly.
    return await mutator();
  }
  const full = resolve(relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const release = await lockfile.lock(full, { ...LOCK_OPTIONS, realpath: false });
  try { return await mutator(); }
  finally { await release(); }
}

// ============= READ-MODIFY-WRITE =============
export async function updateJson<T>(
  relPath: DbPath,
  schema: z.ZodType<T>,
  fallback: T,
  mutator: (current: T) => T | Promise<T>,
): Promise<T> {
  if (useBlobs()) {
    // Optimistic read-modify-write with etag compare-and-set. Preserves the
    // concurrency safety withLock gave on fs, since Blobs has no lock.
    const store = blobStore();
    const MAX_ATTEMPTS = 25;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const res = await store.getWithMetadata(relPath, { type: 'json' });
      const current = res ? schema.parse(res.data) : fallback;
      const next = await mutator(current);
      schema.parse(next);
      const w = await store.set(
        relPath,
        JSON.stringify(next),
        res ? { onlyIfMatch: res.etag } : { onlyIfNew: true },
      );
      if (w.modified) return next;
      // Conditional write lost a race — back off (jittered) and retry.
      const backoff = 20 + Math.floor(Math.random() * 40);
      await new Promise((r) => setTimeout(r, backoff));
    }
    throw new Error(`updateJson: too many write conflicts on ${relPath}`);
  }
  return withLock(relPath, async () => {
    const current = await readJson(relPath, schema, fallback);
    const next = await mutator(current);
    schema.parse(next);
    await atomicWrite(resolve(relPath), JSON.stringify(next, null, 2));
    return next;
  });
}

// ============= MULTI-FILE LOCK (deadlock-safe) =============
export async function withLocks<T>(
  paths: DbPath[],
  mutator: () => Promise<T>,
): Promise<T> {
  if (useBlobs()) {
    // No lock primitive on Blobs; cross-file writes are last-write-wins.
    return await mutator();
  }
  const sorted = [...new Set(paths)].sort();
  const releases: Array<() => Promise<void>> = [];
  try {
    for (const p of sorted) {
      const full = resolve(p);
      await fs.mkdir(path.dirname(full), { recursive: true });
      releases.push(await lockfile.lock(full, { ...LOCK_OPTIONS, realpath: false }));
    }
    return await mutator();
  } finally {
    for (const release of releases.reverse()) {
      try { await release(); } catch { /* best effort */ }
    }
  }
}

// ============= BINARY + RAW JSON HELPERS (backend-switched) =============
// Used for uploads (binary) and per-entry audit writes. Keys are the same
// relative paths as the fs layout (e.g. 'uploads/<filename>').
export async function readBinary(key: string): Promise<Buffer | null> {
  if (useBlobs()) {
    const store = blobStore();
    const ab = await store.get(key, { type: 'arrayBuffer' });
    return ab == null ? null : Buffer.from(ab);
  }
  const full = path.join(getDataDir(), key);
  try {
    return await fs.readFile(full);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeBinary(key: string, buf: Buffer): Promise<void> {
  if (useBlobs()) {
    const store = blobStore();
    // Copy into a fresh Uint8Array so its backing ArrayBuffer is exactly the
    // bytes we want (no shared-buffer / offset surprises).
    await store.set(key, new Uint8Array(buf).buffer);
    return;
  }
  const full = path.join(getDataDir(), key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
}

export async function deleteKey(key: string): Promise<void> {
  if (useBlobs()) {
    const store = blobStore();
    await store.delete(key);
    return;
  }
  const full = path.join(getDataDir(), key);
  try {
    await fs.rm(full);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }
}

// Write a JSON value at an arbitrary key (append-only style writes, e.g. audit
// entries). Blobs → setJSON; fs → atomic write at the key path.
export async function writeJson(key: string, value: unknown): Promise<void> {
  if (useBlobs()) {
    const store = blobStore();
    await store.setJSON(key, value);
    return;
  }
  const full = path.join(getDataDir(), key);
  await atomicWrite(full, JSON.stringify(value, null, 2));
}
