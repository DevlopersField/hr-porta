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

  it('succeeds with default BOOTSTRAP_ADMIN_EMAIL when env var is unset', async () => {
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    const { seedIfEmpty } = await import('./seed');
    const { listUsers } = await import('./users');
    await expect(seedIfEmpty()).resolves.toBeUndefined();
    const users = await listUsers();
    expect(users.length).toBe(1);
    expect(users[0]!.email).toBe('admin@local.test');
    expect(users[0]!.displayName).toBe('Bootstrap Admin');
  });
});

describe('seedDemoOrg', () => {
  it('seeds a multi-team company with managers linked to reports, and is idempotent', async () => {
    const { seedDemoOrg } = await import('./seed');
    const { listUsers, getUserByEmail } = await import('./users');
    await seedDemoOrg();
    await seedDemoOrg(); // idempotent

    const users = await listUsers();
    expect(users.length).toBe(11);

    const departments = new Set(users.map(u => u.department));
    expect(departments).toEqual(new Set(['Engineering', 'Sales', 'HR']));

    // A report is linked to its manager.
    const sara = await getUserByEmail('sara.chen@acme.test');
    const alex = await getUserByEmail('alex.rivera@acme.test');
    expect(sara).not.toBeNull();
    expect(alex!.managerId).toBe(sara!.id);

    // Managers can approve leave; ICs cannot.
    expect(sara!.permissions).toContain('approve_leave');
    expect(alex!.permissions).toEqual([]);
  });
});
