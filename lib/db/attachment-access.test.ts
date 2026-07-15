// lib/db/attachment-access.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';
import { PERMISSIONS } from '../permissions';

beforeEach(() => {
  makeTempDataDir();
});

function pngFile(name = 'shot.png'): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: 'image/png' });
}

async function makeUser(email: string, permissions: string[] = [], managerId: string | null = null) {
  const { createUser } = await import('./users');
  return createUser({ email, passwordHash: 'x', displayName: email, permissions, managerId });
}

describe('canAccessAttachment', () => {
  it('always allows the uploader', async () => {
    const { createAttachment } = await import('./attachments');
    const { canAccessAttachment } = await import('./attachment-access');
    const att = await createAttachment({ file: pngFile(), ownerId: 'u_owner', module: 'request' });
    expect(await canAccessAttachment({ id: 'u_owner', permissions: [] }, att)).toBe(true);
  });

  it('allows any authenticated user for engage and document-center', async () => {
    const { createAttachment } = await import('./attachments');
    const { canAccessAttachment } = await import('./attachment-access');
    const engage = await createAttachment({ file: pngFile(), ownerId: 'u_a', module: 'engage' });
    const doc = await createAttachment({ file: pngFile(), ownerId: 'u_a', module: 'document-center' });
    const stranger = { id: 'u_b', permissions: [] };
    expect(await canAccessAttachment(stranger, engage)).toBe(true);
    expect(await canAccessAttachment(stranger, doc)).toBe(true);
  });

  it('helpdesk: allows agents and the ticket requester, denies others', async () => {
    const { createAttachment } = await import('./attachments');
    const { createTicket } = await import('./helpdesk');
    const { canAccessAttachment } = await import('./attachment-access');
    const ticket = await createTicket({ requesterId: 'u_req', category: 'it', priority: 'normal', subject: 's', body: 'b' });
    const att = await createAttachment({ file: pngFile(), ownerId: 'u_agent', module: 'helpdesk', recordId: ticket.id });
    expect(await canAccessAttachment({ id: 'u_x', permissions: [PERMISSIONS.EDIT_HELPDESK] }, att)).toBe(true);
    expect(await canAccessAttachment({ id: 'u_req', permissions: [] }, att)).toBe(true);
    expect(await canAccessAttachment({ id: 'u_other', permissions: [] }, att)).toBe(false);
  });

  it("request: allows the requester's manager, denies an unrelated approver", async () => {
    const { createAttachment } = await import('./attachments');
    const { canAccessAttachment } = await import('./attachment-access');
    const manager = await makeUser('mgr@t.test', [PERMISSIONS.APPROVE_REQUESTS]);
    const outsider = await makeUser('outsider@t.test', [PERMISSIONS.APPROVE_REQUESTS]);
    const employee = await makeUser('emp@t.test', [], manager.id);
    const att = await createAttachment({ file: pngFile(), ownerId: employee.id, module: 'request' });
    expect(await canAccessAttachment({ id: manager.id, permissions: manager.permissions }, att)).toBe(true);
    // Holding APPROVE_REQUESTS alone must NOT grant org-wide receipt access.
    expect(await canAccessAttachment({ id: outsider.id, permissions: outsider.permissions }, att)).toBe(false);
  });

  it('request: VIEW_ALL_REQUESTS grants access regardless of routing', async () => {
    const { createAttachment } = await import('./attachments');
    const { canAccessAttachment } = await import('./attachment-access');
    const manager = await makeUser('mgr2@t.test', []);
    const auditor = await makeUser('auditor@t.test', [PERMISSIONS.VIEW_ALL_REQUESTS]);
    const employee = await makeUser('emp2@t.test', [], manager.id);
    const att = await createAttachment({ file: pngFile(), ownerId: employee.id, module: 'request' });
    expect(await canAccessAttachment({ id: auditor.id, permissions: auditor.permissions }, att)).toBe(true);
  });

  it('request: manager-less requester is visible to any approver (mirrors inbox routing)', async () => {
    const { createAttachment } = await import('./attachments');
    const { canAccessAttachment } = await import('./attachment-access');
    const approver = await makeUser('appr@t.test', [PERMISSIONS.APPROVE_REQUESTS]);
    const orphan = await makeUser('orphan@t.test', [], null);
    const att = await createAttachment({ file: pngFile(), ownerId: orphan.id, module: 'request' });
    expect(await canAccessAttachment({ id: approver.id, permissions: approver.permissions }, att)).toBe(true);
  });

  it("request: a delegate of the requester's manager gets access for today", async () => {
    const { createAttachment } = await import('./attachments');
    const { addDelegation } = await import('./delegates');
    const { canAccessAttachment } = await import('./attachment-access');
    const manager = await makeUser('mgr3@t.test', [PERMISSIONS.APPROVE_REQUESTS]);
    const delegate = await makeUser('del@t.test', [PERMISSIONS.APPROVE_REQUESTS]);
    const employee = await makeUser('emp3@t.test', [], manager.id);
    const today = new Date().toISOString().slice(0, 10);
    await addDelegation({ fromUserId: manager.id, toUserId: delegate.id, startDate: today, endDate: today });
    const att = await createAttachment({ file: pngFile(), ownerId: employee.id, module: 'request' });
    expect(await canAccessAttachment({ id: delegate.id, permissions: delegate.permissions }, att)).toBe(true);
  });
});
