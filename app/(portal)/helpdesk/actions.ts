// app/(portal)/helpdesk/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, hasPermission, ForbiddenError } from '@/lib/permissions';
import {
  createTicket,
  addReply,
  setTicketStatus,
  setTicketAttachments,
  getTicket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '@/lib/db/helpdesk';
import { createAttachmentsFromFiles } from '@/lib/db/attachments';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const CreateSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES).default('normal'),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

const ReplySchema = z.object({
  body: z.string().min(1).max(2000),
});

const StatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});

// ============= CREATE =============
export async function createTicketAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = CreateSchema.parse(Object.fromEntries(formData));
  const created = await createTicket({
    requesterId: user.id,
    category: input.category,
    priority: input.priority,
    subject: input.subject,
    body: input.body,
  });
  const files = formData.getAll('attachments').filter((f): f is File => f instanceof File);
  const ids = await createAttachmentsFromFiles(files, user.id, 'helpdesk', created.id);
  await setTicketAttachments(created.id, ids);
  await auditLog({
    actorId: user.id,
    action: 'helpdesk.create',
    target: created.id,
    details: { category: input.category, priority: input.priority, subject: input.subject },
  });
  revalidatePath('/helpdesk');
  redirect(`/helpdesk/${created.id}`);
}

// ============= REPLY =============
export async function addReplyAction(ticketId: string, formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = ReplySchema.parse(Object.fromEntries(formData));
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new ForbiddenError('Ticket not found');
  // Non-agents may only reply on their own tickets.
  if (!hasPermission(user, PERMISSIONS.EDIT_HELPDESK) && ticket.requesterId !== user.id) {
    throw new ForbiddenError('Cannot reply to this ticket');
  }
  const files = formData.getAll('attachments').filter((f): f is File => f instanceof File);
  const ids = await createAttachmentsFromFiles(files, user.id, 'helpdesk', ticketId);
  await addReply(ticketId, user.id, input.body, ids);
  await auditLog({ actorId: user.id, action: 'helpdesk.reply', target: ticketId });
  revalidatePath(`/helpdesk/${ticketId}`);
  revalidatePath('/helpdesk');
}

// ============= STATUS =============
export async function setStatusAction(ticketId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.EDIT_HELPDESK);
  const input = StatusSchema.parse(Object.fromEntries(formData));
  await setTicketStatus(ticketId, input.status);
  await auditLog({ actorId: user.id, action: 'helpdesk.status', target: ticketId, details: { status: input.status } });
  revalidatePath(`/helpdesk/${ticketId}`);
  revalidatePath('/helpdesk');
}
