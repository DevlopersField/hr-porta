// lib/db/helpdesk.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= TYPES =============
export const TICKET_CATEGORIES = ['it', 'hr', 'facilities'] as const;
export type TicketCategory = typeof TICKET_CATEGORIES[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high'] as const;
export type TicketPriority = typeof TICKET_PRIORITIES[number];

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = typeof TICKET_STATUSES[number];

// ============= SCHEMA =============
export const ReplySchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  attachmentIds: z.array(z.string()).default([]),
});
export type Reply = z.infer<typeof ReplySchema>;

export const TicketSchema = z.object({
  id: z.string(),
  requesterId: z.string(),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES).default('normal'),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES).default('open'),
  createdAt: z.string(),
  updatedAt: z.string(),
  replies: z.array(ReplySchema).default([]),
  attachmentIds: z.array(z.string()).default([]),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const HelpdeskFileSchema = z.object({
  tickets: z.array(TicketSchema),
});
export type HelpdeskFile = z.infer<typeof HelpdeskFileSchema>;

const EMPTY: HelpdeskFile = { tickets: [] };
const PATH = 'helpdesk.json';

// ============= READS =============
export async function listAllTickets(): Promise<Ticket[]> {
  const data = await readJson(PATH, HelpdeskFileSchema, EMPTY);
  return [...data.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listUserTickets(requesterId: string): Promise<Ticket[]> {
  const all = await listAllTickets();
  return all.filter(t => t.requesterId === requesterId);
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const data = await readJson(PATH, HelpdeskFileSchema, EMPTY);
  return data.tickets.find(t => t.id === id) ?? null;
}

// ============= WRITES =============
export type CreateTicketInput = {
  requesterId: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  body: string;
  attachmentIds?: string[];
};

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: `tkt_${crypto.randomBytes(6).toString('hex')}`,
    requesterId: input.requesterId,
    category: input.category,
    priority: input.priority,
    subject: input.subject,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    replies: [
      {
        id: `rpl_${crypto.randomBytes(6).toString('hex')}`,
        authorId: input.requesterId,
        body: input.body,
        createdAt: now,
        attachmentIds: [],
      },
    ],
    attachmentIds: input.attachmentIds ?? [],
  };
  const result = await updateJson(PATH, HelpdeskFileSchema, EMPTY, (current) => ({
    tickets: [...current.tickets, ticket],
  }));
  return result.tickets.find(t => t.id === ticket.id)!;
}

export async function addReply(
  ticketId: string,
  authorId: string,
  body: string,
  attachmentIds: string[] = [],
): Promise<void> {
  await updateJson(PATH, HelpdeskFileSchema, EMPTY, (current) => {
    const target = current.tickets.find(t => t.id === ticketId);
    if (!target) throw new Error('Ticket not found');
    const now = new Date().toISOString();
    const reply: Reply = {
      id: `rpl_${crypto.randomBytes(6).toString('hex')}`,
      authorId,
      body,
      createdAt: now,
      attachmentIds,
    };
    return {
      tickets: current.tickets.map(t =>
        t.id === ticketId
          ? {
              ...t,
              replies: [...t.replies, reply],
              status: t.status === 'open' ? 'in_progress' : t.status,
              updatedAt: now,
            }
          : t,
      ),
    };
  });
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  await updateJson(PATH, HelpdeskFileSchema, EMPTY, (current) => {
    const target = current.tickets.find(t => t.id === ticketId);
    if (!target) throw new Error('Ticket not found');
    return {
      tickets: current.tickets.map(t =>
        t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t,
      ),
    };
  });
}

export async function setTicketAttachments(ticketId: string, ids: string[]): Promise<void> {
  await updateJson(PATH, HelpdeskFileSchema, EMPTY, (current) => {
    const target = current.tickets.find(t => t.id === ticketId);
    if (!target) throw new Error('Ticket not found');
    return {
      tickets: current.tickets.map(t =>
        t.id === ticketId
          ? { ...t, attachmentIds: ids, updatedAt: new Date().toISOString() }
          : t,
      ),
    };
  });
}
