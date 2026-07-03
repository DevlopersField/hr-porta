// lib/db/delegates.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('addDelegation / listDelegations', () => {
  it("creates a delegation with id 'del_...'", async () => {
    const { addDelegation, listDelegations } = await import('./delegates');
    const d = await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    expect(d.id.startsWith('del_')).toBe(true);
    expect(await listDelegations()).toHaveLength(1);
  });
});

describe('listMyDelegations', () => {
  it('returns only delegations from the given user', async () => {
    const { addDelegation, listMyDelegations } = await import('./delegates');
    await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    await addDelegation({ fromUserId: 'c', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    const mine = await listMyDelegations('a');
    expect(mine).toHaveLength(1);
    expect(mine[0]!.fromUserId).toBe('a');
  });
});

describe('removeDelegation', () => {
  it('removes by id', async () => {
    const { addDelegation, removeDelegation, listDelegations } = await import('./delegates');
    const d = await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    await removeDelegation(d.id);
    expect(await listDelegations()).toEqual([]);
  });
});

describe('getDelegatorsFor date range', () => {
  it('returns the delegator when isoDate is within the range (inclusive bounds)', async () => {
    const { addDelegation, getDelegatorsFor } = await import('./delegates');
    await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    expect(await getDelegatorsFor('b', '2026-07-05')).toEqual(['a']);
    expect(await getDelegatorsFor('b', '2026-07-01')).toEqual(['a']);
    expect(await getDelegatorsFor('b', '2026-07-10')).toEqual(['a']);
  });

  it('excludes the delegator when isoDate is outside the range', async () => {
    const { addDelegation, getDelegatorsFor } = await import('./delegates');
    await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    expect(await getDelegatorsFor('b', '2026-06-30')).toEqual([]);
    expect(await getDelegatorsFor('b', '2026-07-11')).toEqual([]);
  });

  it('does not return delegations addressed to another user', async () => {
    const { addDelegation, getDelegatorsFor } = await import('./delegates');
    await addDelegation({ fromUserId: 'a', toUserId: 'b', startDate: '2026-07-01', endDate: '2026-07-10' });
    expect(await getDelegatorsFor('c', '2026-07-05')).toEqual([]);
  });
});
