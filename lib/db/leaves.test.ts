// lib/db/leaves.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('countLeaveDays', () => {
  it('returns 1 for same-day range', async () => {
    const { countLeaveDays } = await import('./leaves');
    expect(countLeaveDays('2026-05-01', '2026-05-01')).toBe(1);
  });

  it('returns 5 for May 1 - May 5 (inclusive)', async () => {
    const { countLeaveDays } = await import('./leaves');
    expect(countLeaveDays('2026-05-01', '2026-05-05')).toBe(5);
  });

  it('throws when endDate < startDate', async () => {
    const { countLeaveDays } = await import('./leaves');
    expect(() => countLeaveDays('2026-05-05', '2026-05-01')).toThrow(/endDate must be >= startDate/);
  });

  it('returns 10 for May 1 - May 10 (includes weekends — characterized)', async () => {
    const { countLeaveDays } = await import('./leaves');
    expect(countLeaveDays('2026-05-01', '2026-05-10')).toBe(10);
  });
});

describe('getLeaveBalance', () => {
  it('returns defaults for a user with no leave history', async () => {
    const { getLeaveBalance } = await import('./leaves');
    const bal = await getLeaveBalance('user-empty');
    expect(bal.annual).toEqual({ quota: 20, used: 0, remaining: 20 });
    expect(bal.sick).toEqual({ quota: 10, used: 0, remaining: 10 });
    expect(bal.casual).toEqual({ quota: 7, used: 0, remaining: 7 });
    expect(bal.unpaid).toEqual({ quota: null, used: 0, remaining: null });
  });
});

describe('createLeaveRequest', () => {
  it("creates a pending request with id 'lv_...' and status 'pending'", async () => {
    const { createLeaveRequest } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      reason: 'vacation',
    });
    expect(req.id.startsWith('lv_')).toBe(true);
    expect(req.status).toBe('pending');
    expect(req.userId).toBe('u1');
    expect(req.type).toBe('annual');
    expect(req.days).toBe(5);
  });
});

describe('decideLeaveRequest', () => {
  it("sets status, decidedBy, decidedAt when approved", async () => {
    const { createLeaveRequest, decideLeaveRequest, getLeaveRequest } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      reason: 'vacation',
    });
    await decideLeaveRequest('u1', req.id, 'approved', 'manager-x');
    const after = await getLeaveRequest('u1', req.id);
    expect(after?.status).toBe('approved');
    expect(after?.decidedBy).toBe('manager-x');
    expect(typeof after?.decidedAt).toBe('string');
    expect(after?.decidedAt).not.toBeNull();
  });

  it("does NOT enforce self-approval at the data layer (characterizes the gap)", async () => {
    const { createLeaveRequest, decideLeaveRequest, getLeaveRequest } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      reason: 'vacation',
    });
    // Same user approving themselves: the data layer accepts it silently.
    await decideLeaveRequest('u1', req.id, 'approved', 'u1');
    const after = await getLeaveRequest('u1', req.id);
    expect(after?.status).toBe('approved');
    expect(after?.decidedBy).toBe('u1');
  });
});

describe('withdrawLeaveRequest', () => {
  it('removes a pending request', async () => {
    const { createLeaveRequest, withdrawLeaveRequest, getLeaveRequest } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      reason: 'vacation',
    });
    await withdrawLeaveRequest('u1', req.id);
    expect(await getLeaveRequest('u1', req.id)).toBeNull();
  });

  it('does NOT remove an approved request', async () => {
    const { createLeaveRequest, decideLeaveRequest, withdrawLeaveRequest, getLeaveRequest } =
      await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      reason: 'vacation',
    });
    await decideLeaveRequest('u1', req.id, 'approved', 'manager-x');
    await withdrawLeaveRequest('u1', req.id);
    const after = await getLeaveRequest('u1', req.id);
    expect(after).not.toBeNull();
    expect(after?.status).toBe('approved');
  });
});

describe('balance counting', () => {
  it('counts approved annual leave days into used and remaining', async () => {
    const { createLeaveRequest, decideLeaveRequest, getLeaveBalance } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u1',
      type: 'annual',
      startDate: `${new Date().getFullYear()}-05-01`,
      endDate: `${new Date().getFullYear()}-05-05`,
      days: 5,
      reason: 'vacation',
    });
    await decideLeaveRequest('u1', req.id, 'approved', 'manager-x');
    const bal = await getLeaveBalance('u1');
    expect(bal.annual.used).toBe(5);
    expect(bal.annual.remaining).toBe(15);
  });

  it('does NOT count rejected requests into used', async () => {
    const { createLeaveRequest, decideLeaveRequest, getLeaveBalance } = await import('./leaves');
    const req = await createLeaveRequest({
      userId: 'u2',
      type: 'annual',
      startDate: `${new Date().getFullYear()}-05-01`,
      endDate: `${new Date().getFullYear()}-05-05`,
      days: 5,
      reason: 'vacation',
    });
    await decideLeaveRequest('u2', req.id, 'rejected', 'manager-x');
    const bal = await getLeaveBalance('u2');
    expect(bal.annual.used).toBe(0);
    expect(bal.annual.remaining).toBe(20);
  });
});
