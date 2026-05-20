// ============= IMPORTS =============
import { afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ============= STATE =============
const tmpRoots: string[] = [];

// ============= EXPORTS =============
export function makeTempDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hr-portal-test-'));
  tmpRoots.push(dir);
  process.env.DATA_DIR = dir;
  return dir;
}

// ============= CLEANUP =============
afterEach(() => {
  for (const dir of tmpRoots.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
