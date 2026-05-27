// lib/db/seed.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

let prevEmail: string | undefined;

beforeEach(() => {
  makeTempDataDir();
  prevEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
});

afterEach(() => {
  if (prevEmail === undefined) delete process.env.BOOTSTRAP_ADMIN_EMAIL;
  else process.env.BOOTSTRAP_ADMIN_EMAIL = prevEmail;
});

describe('seedIfEmpty', () => {
  it("creates a Bootstrap Admin with permissions=['*'] and mustChangePassword=true (valid TLD email)", async () => {
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@local.test';
    const { seedIfEmpty } = await import('./seed');
    const { listUsers } = await import('./users');
    await seedIfEmpty();
    const users = await listUsers();
    expect(users.length).toBe(1);
    expect(users[0]!.email).toBe('admin@local.test');
    expect(users[0]!.displayName).toBe('Bootstrap Admin');
    expect(users[0]!.permissions).toEqual(['*']);
    expect(users[0]!.mustChangePassword).toBe(true);
  });

  it('is idempotent — calling twice creates only one admin', async () => {
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@local.test';
    const { seedIfEmpty } = await import('./seed');
    const { listUsers } = await import('./users');
    await seedIfEmpty();
    await seedIfEmpty();
    const users = await listUsers();
    expect(users.length).toBe(1);
  });

  it("with BOOTSTRAP_ADMIN_EMAIL='admin@local' (no TLD) — characterizes Zod email validation bug", async () => {
    // Headline bug: Zod email validation likely rejects 'admin@local' inside createUser,
    // making the default bootstrap value unusable.
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@local';
    const { seedIfEmpty } = await import('./seed');
    // Expect this to throw because Zod's email validator rejects an email without a TLD.
    await expect(seedIfEmpty()).rejects.toThrow();
  });
});
