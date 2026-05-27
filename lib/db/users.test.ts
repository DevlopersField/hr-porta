// lib/db/users.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('users db', () => {
  it('returns null for missing user', async () => {
    const { getUserByEmail } = await import('./users');
    expect(await getUserByEmail('nobody@x.com')).toBeNull();
  });

  it('creates and retrieves a user', async () => {
    const { createUser, getUserByEmail } = await import('./users');
    const user = await createUser({
      email: 'a@b.com',
      passwordHash: 'hash',
      displayName: 'Alice',
      permissions: ['view_all_people'],
    });
    expect(user.id).toBeTruthy();
    const fetched = await getUserByEmail('a@b.com');
    expect(fetched?.displayName).toBe('Alice');
  });

  it('updates user permissions atomically', async () => {
    const { createUser, updateUserPermissions, getUserById } = await import('./users');
    const u = await createUser({ email: 'b@c.com', passwordHash: 'h', displayName: 'Bob', permissions: [] });
    await updateUserPermissions(u.id, ['manage_settings', 'approve_leave']);
    const updated = await getUserById(u.id);
    expect(updated?.permissions).toEqual(['manage_settings', 'approve_leave']);
  });
});
