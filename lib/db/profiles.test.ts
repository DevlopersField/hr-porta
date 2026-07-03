// lib/db/profiles.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('getProfile', () => {
  it('returns empty-string defaults for a user with no profile file', async () => {
    const { getProfile } = await import('./profiles');
    const p = await getProfile('user-empty');
    expect(p).toEqual({
      userId: 'user-empty',
      phone: '',
      address: '',
      dateOfBirth: '',
      pronouns: '',
      bio: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
    });
  });
});

describe('upsertProfile', () => {
  it('persists a full patch and can be read back', async () => {
    const { upsertProfile, getProfile } = await import('./profiles');
    const saved = await upsertProfile('u1', {
      phone: '555-1234',
      address: '1 Main St',
      dateOfBirth: '1990-01-15',
      pronouns: 'they/them',
      bio: 'Engineer',
      emergencyContactName: 'Jamie',
      emergencyContactPhone: '555-9999',
      emergencyContactRelation: 'Sibling',
    });
    expect(saved.userId).toBe('u1');
    expect(saved.phone).toBe('555-1234');

    const read = await getProfile('u1');
    expect(read.phone).toBe('555-1234');
    expect(read.dateOfBirth).toBe('1990-01-15');
    expect(read.emergencyContactName).toBe('Jamie');
  });

  it('merges partial patches without clobbering existing fields', async () => {
    const { upsertProfile, getProfile } = await import('./profiles');
    await upsertProfile('u2', { phone: '111', pronouns: 'she/her' });
    await upsertProfile('u2', { address: '2 Oak Ave' });

    const read = await getProfile('u2');
    expect(read.phone).toBe('111');
    expect(read.pronouns).toBe('she/her');
    expect(read.address).toBe('2 Oak Ave');
    expect(read.bio).toBe('');
  });

  it('always pins userId to the requested id', async () => {
    const { upsertProfile } = await import('./profiles');
    const saved = await upsertProfile('u3', { phone: '999' });
    expect(saved.userId).toBe('u3');
  });
});
