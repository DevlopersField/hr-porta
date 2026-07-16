// lib/db/audit.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDataDir, storageIsBlobs, writeJson } from './core';

// ============= TYPES =============
export type AuditEntry = {
  ts: string;
  actorId: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
};



// ============= WRITE =============
export async function auditLog(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  const fullEntry: AuditEntry = { ts: new Date().toISOString(), ...entry };
  const day = fullEntry.ts.slice(0, 10);
  if (storageIsBlobs()) {
    // Blobs has no append. Write each entry as its own key — append-only and
    // race-free. Audit is never read back in the UI, so the layout is free.
    const rand = crypto.randomBytes(6).toString('hex');
    await writeJson(`audit/${day}/${fullEntry.ts}-${rand}.json`, fullEntry);
    return;
  }
  const file = path.join(getDataDir(), 'audit', `${day}.jsonl`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // POSIX guarantees atomic append for writes under PIPE_BUF (~4KB)
  await fs.appendFile(file, JSON.stringify(fullEntry) + '\n', 'utf8');
}
