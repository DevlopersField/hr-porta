// lib/db/audit.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';

// ============= TYPES =============
export type AuditEntry = {
  ts: string;
  actorId: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
};

// ============= CONFIG =============
function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
}

// ============= WRITE =============
export async function auditLog(entry: Omit<AuditEntry, 'ts'>): Promise<void> {
  const fullEntry: AuditEntry = { ts: new Date().toISOString(), ...entry };
  const day = fullEntry.ts.slice(0, 10);
  const file = path.join(getDataDir(), 'audit', `${day}.jsonl`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // POSIX guarantees atomic append for writes under PIPE_BUF (~4KB)
  await fs.appendFile(file, JSON.stringify(fullEntry) + '\n', 'utf8');
}
