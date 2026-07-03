// lib/db/requests.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('createRequest', () => {
  it("creates a pending request with id 'req_...' and null amount for non-expense", async () => {
    const { createRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'equipment', title: 'New laptop', details: 'Mine broke' });
    expect(req.id.startsWith('req_')).toBe(true);
    expect(req.status).toBe('pending');
    expect(req.userId).toBe('u1');
    expect(req.type).toBe('equipment');
    expect(req.amount).toBeNull();
  });

  it('defaults attachmentIds to [] when none provided', async () => {
    const { createRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    expect(req.attachmentIds).toEqual([]);
  });

  it('persists provided attachmentIds', async () => {
    const { createRequest, getRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y', attachmentIds: ['att_a', 'att_b'] });
    expect(req.attachmentIds).toEqual(['att_a', 'att_b']);
    const after = await getRequest('u1', req.id);
    expect(after?.attachmentIds).toEqual(['att_a', 'att_b']);
  });

  it('retains amount only for expense type', async () => {
    const { createRequest } = await import('./requests');
    const exp = await createRequest({ userId: 'u1', type: 'expense', title: 'Taxi', details: 'Client visit', amount: 42.5 });
    expect(exp.amount).toBe(42.5);
    const gen = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y', amount: 99 });
    expect(gen.amount).toBeNull();
  });
});

describe('listUserRequests', () => {
  it('returns an empty array for a user with no requests', async () => {
    const { listUserRequests } = await import('./requests');
    expect(await listUserRequests('nobody')).toEqual([]);
  });

  it('lists created requests', async () => {
    const { createRequest, listUserRequests } = await import('./requests');
    await createRequest({ userId: 'u1', type: 'travel', title: 'Conf', details: 'Berlin' });
    const list = await listUserRequests('u1');
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Conf');
  });
});

describe('withdrawRequest', () => {
  it('removes a pending request', async () => {
    const { createRequest, withdrawRequest, getRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    await withdrawRequest('u1', req.id);
    expect(await getRequest('u1', req.id)).toBeNull();
  });

  it('does NOT remove a decided request', async () => {
    const { createRequest, decideRequest, withdrawRequest, getRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    await decideRequest('u1', req.id, 'approved', 'mgr');
    await withdrawRequest('u1', req.id);
    const after = await getRequest('u1', req.id);
    expect(after).not.toBeNull();
    expect(after?.status).toBe('approved');
  });
});

describe('decideRequest', () => {
  it('sets status, decidedBy, decidedAt, decisionNote when approved', async () => {
    const { createRequest, decideRequest, getRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    await decideRequest('u1', req.id, 'approved', 'mgr', 'ok');
    const after = await getRequest('u1', req.id);
    expect(after?.status).toBe('approved');
    expect(after?.decidedBy).toBe('mgr');
    expect(typeof after?.decidedAt).toBe('string');
    expect(after?.decisionNote).toBe('ok');
  });

  it('throws when request not found', async () => {
    const { decideRequest } = await import('./requests');
    await expect(decideRequest('u1', 'req_nope', 'approved', 'mgr')).rejects.toThrow(/not found/i);
  });

  it('throws when request already decided', async () => {
    const { createRequest, decideRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    await decideRequest('u1', req.id, 'approved', 'mgr');
    await expect(decideRequest('u1', req.id, 'rejected', 'mgr')).rejects.toThrow(/already approved/i);
  });

  it('enforces self-approval check (throws when userId === decidedBy)', async () => {
    const { createRequest, decideRequest, getRequest } = await import('./requests');
    const req = await createRequest({ userId: 'u1', type: 'general', title: 'X', details: 'Y' });
    await expect(decideRequest('u1', req.id, 'approved', 'u1')).rejects.toThrow(/Cannot decide your own/i);
    const after = await getRequest('u1', req.id);
    expect(after?.status).toBe('pending');
  });
});

describe('listPendingRoutedTo', () => {
  it("routes a requester's pending requests to their manager", async () => {
    const { createUser } = await import('./users');
    const { createRequest, listPendingRoutedTo } = await import('./requests');
    const mgr = await createUser({ email: 'mgr@x.test', passwordHash: 'h', displayName: 'Mgr' });
    const emp = await createUser({ email: 'emp@x.test', passwordHash: 'h', displayName: 'Emp', managerId: mgr.id });
    const req = await createRequest({ userId: emp.id, type: 'general', title: 'X', details: 'Y' });
    const routed = await listPendingRoutedTo(mgr.id);
    expect(routed.map(r => r.id)).toContain(req.id);
  });

  it('does not route to an unrelated approver', async () => {
    const { createUser } = await import('./users');
    const { createRequest, listPendingRoutedTo } = await import('./requests');
    const mgr = await createUser({ email: 'mgr2@x.test', passwordHash: 'h', displayName: 'Mgr' });
    const other = await createUser({ email: 'other@x.test', passwordHash: 'h', displayName: 'Other' });
    const emp = await createUser({ email: 'emp2@x.test', passwordHash: 'h', displayName: 'Emp', managerId: mgr.id });
    const req = await createRequest({ userId: emp.id, type: 'general', title: 'X', details: 'Y' });
    const routed = await listPendingRoutedTo(other.id);
    expect(routed.map(r => r.id)).not.toContain(req.id);
  });

  it('routes manager-less requesters to any approver (but not to themselves)', async () => {
    const { createUser } = await import('./users');
    const { createRequest, listPendingRoutedTo } = await import('./requests');
    const orphan = await createUser({ email: 'orphan@x.test', passwordHash: 'h', displayName: 'Orphan' });
    const approver = await createUser({ email: 'appr@x.test', passwordHash: 'h', displayName: 'Appr' });
    const req = await createRequest({ userId: orphan.id, type: 'general', title: 'X', details: 'Y' });
    const routedToApprover = await listPendingRoutedTo(approver.id);
    expect(routedToApprover.map(r => r.id)).toContain(req.id);
    const routedToSelf = await listPendingRoutedTo(orphan.id);
    expect(routedToSelf.map(r => r.id)).not.toContain(req.id);
  });

  it('excludes already-decided requests', async () => {
    const { createUser } = await import('./users');
    const { createRequest, decideRequest, listPendingRoutedTo } = await import('./requests');
    const mgr = await createUser({ email: 'mgr3@x.test', passwordHash: 'h', displayName: 'Mgr' });
    const emp = await createUser({ email: 'emp3@x.test', passwordHash: 'h', displayName: 'Emp', managerId: mgr.id });
    const req = await createRequest({ userId: emp.id, type: 'general', title: 'X', details: 'Y' });
    await decideRequest(emp.id, req.id, 'approved', mgr.id);
    const routed = await listPendingRoutedTo(mgr.id);
    expect(routed.map(r => r.id)).not.toContain(req.id);
  });
});
