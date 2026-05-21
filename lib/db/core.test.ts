// lib/db/core.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs/promises';
import { makeTempDataDir } from '../../tests/setup';

let dir: string;
beforeEach(() => { dir = makeTempDataDir(); });

const Schema = z.object({ count: z.number() });

describe('readJson', () => {
  it('returns fallback when file does not exist', async () => {
    const { readJson } = await import('./core');
    const result = await readJson('missing.json', Schema, { count: 0 });
    expect(result).toEqual({ count: 0 });
  });

  it('reads and parses existing valid JSON', async () => {
    await fs.writeFile(path.join(dir, 'data.json'), JSON.stringify({ count: 7 }));
    const { readJson } = await import('./core');
    const result = await readJson('data.json', Schema);
    expect(result).toEqual({ count: 7 });
  });

  it('throws when JSON is malformed', async () => {
    await fs.writeFile(path.join(dir, 'bad.json'), 'not json');
    const { readJson } = await import('./core');
    await expect(readJson('bad.json', Schema)).rejects.toThrow();
  });

  it('throws when schema validation fails', async () => {
    await fs.writeFile(path.join(dir, 'wrong.json'), JSON.stringify({ count: 'not-a-number' }));
    const { readJson } = await import('./core');
    await expect(readJson('wrong.json', Schema)).rejects.toThrow();
  });
});

describe('updateJson concurrency', () => {
  it('serializes 50 concurrent increments to the same file', async () => {
    const { updateJson } = await import('./core');
    const Schema = z.object({ count: z.number() });
    const ops = Array.from({ length: 50 }, () =>
      updateJson('counter.json', Schema, { count: 0 }, (c) => ({ count: c.count + 1 }))
    );
    await Promise.all(ops);
    const { readJson } = await import('./core');
    const final = await readJson('counter.json', Schema);
    expect(final.count).toBe(50);
  }, 30000);
});
