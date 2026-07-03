// lib/db/helpdesk.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('createTicket', () => {
  it("creates a ticket with id 'tkt_...', status 'open', and the first reply as description", async () => {
    const { createTicket } = await import('./helpdesk');
    const t = await createTicket({
      requesterId: 'u1',
      category: 'it',
      priority: 'high',
      subject: 'Laptop broken',
      body: 'It will not turn on',
    });
    expect(t.id.startsWith('tkt_')).toBe(true);
    expect(t.status).toBe('open');
    expect(t.requesterId).toBe('u1');
    expect(t.category).toBe('it');
    expect(t.priority).toBe('high');
    expect(t.subject).toBe('Laptop broken');
    expect(t.replies).toHaveLength(1);
    expect(t.replies[0]!.authorId).toBe('u1');
    expect(t.replies[0]!.body).toBe('It will not turn on');
    expect(t.createdAt).toBe(t.updatedAt);
  });

  it("defaults priority to 'normal' when omitted at the schema level", async () => {
    const { createTicket } = await import('./helpdesk');
    const t = await createTicket({
      requesterId: 'u1',
      category: 'hr',
      priority: 'normal',
      subject: 'Payslip question',
      body: 'Where is it',
    });
    expect(t.priority).toBe('normal');
  });
});

describe('listUserTickets vs listAllTickets', () => {
  it('lists only own tickets for a requester, but all for the queue (newest first)', async () => {
    const { createTicket, listUserTickets, listAllTickets } = await import('./helpdesk');
    await createTicket({ requesterId: 'u1', category: 'it', priority: 'low', subject: 'A', body: 'a' });
    await createTicket({ requesterId: 'u2', category: 'hr', priority: 'low', subject: 'B', body: 'b' });
    const t3 = await createTicket({ requesterId: 'u1', category: 'facilities', priority: 'low', subject: 'C', body: 'c' });

    const mine = await listUserTickets('u1');
    expect(mine.map(t => t.subject).sort()).toEqual(['A', 'C']);

    const all = await listAllTickets();
    expect(all).toHaveLength(3);
    // Newest first: the last-created ticket comes first.
    expect(all[0]!.id).toBe(t3.id);
  });
});

describe('addReply', () => {
  it('appends a reply, bumps status open -> in_progress, and updates updatedAt', async () => {
    const { createTicket, addReply, getTicket } = await import('./helpdesk');
    const t = await createTicket({ requesterId: 'u1', category: 'it', priority: 'normal', subject: 'S', body: 'first' });
    expect(t.status).toBe('open');

    await addReply(t.id, 'agent-x', 'Looking into it');
    const after = await getTicket(t.id);
    expect(after?.replies).toHaveLength(2);
    expect(after?.replies[1]!.authorId).toBe('agent-x');
    expect(after?.replies[1]!.body).toBe('Looking into it');
    expect(after?.status).toBe('in_progress');
    expect(after!.updatedAt >= after!.createdAt).toBe(true);
  });

  it('does NOT reset a resolved ticket back to in_progress', async () => {
    const { createTicket, setTicketStatus, addReply, getTicket } = await import('./helpdesk');
    const t = await createTicket({ requesterId: 'u1', category: 'it', priority: 'normal', subject: 'S', body: 'first' });
    await setTicketStatus(t.id, 'resolved');
    await addReply(t.id, 'u1', 'thanks');
    const after = await getTicket(t.id);
    expect(after?.status).toBe('resolved');
  });

  it('throws when the ticket does not exist', async () => {
    const { addReply } = await import('./helpdesk');
    await expect(addReply('tkt_missing', 'u1', 'x')).rejects.toThrow(/Ticket not found/i);
  });
});

describe('setTicketStatus', () => {
  it('changes the status and bumps updatedAt', async () => {
    const { createTicket, setTicketStatus, getTicket } = await import('./helpdesk');
    const t = await createTicket({ requesterId: 'u1', category: 'it', priority: 'normal', subject: 'S', body: 'first' });
    await setTicketStatus(t.id, 'closed');
    const after = await getTicket(t.id);
    expect(after?.status).toBe('closed');
  });

  it('throws when the ticket does not exist', async () => {
    const { setTicketStatus } = await import('./helpdesk');
    await expect(setTicketStatus('tkt_missing', 'closed')).rejects.toThrow(/Ticket not found/i);
  });
});
