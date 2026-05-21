// lib/db/core.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import lockfile from 'proper-lockfile';
import type { z } from 'zod';

// ============= CONFIG =============
function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
}

const LOCK_OPTIONS = {
  retries: { retries: 10, minTimeout: 50, maxTimeout: 250, factor: 1.5 },
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
  const full = resolve(relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  try { await fs.access(full); } catch { await atomicWrite(full, '{}'); }
  const release = await lockfile.lock(full, LOCK_OPTIONS);
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
  const sorted = [...new Set(paths)].sort();
  const releases: Array<() => Promise<void>> = [];
  try {
    for (const p of sorted) {
      const full = resolve(p);
      await fs.mkdir(path.dirname(full), { recursive: true });
      try { await fs.access(full); } catch { await atomicWrite(full, '{}'); }
      releases.push(await lockfile.lock(full, LOCK_OPTIONS));
    }
    return await mutator();
  } finally {
    for (const release of releases.reverse()) {
      try { await release(); } catch { /* best effort */ }
    }
  }
}
