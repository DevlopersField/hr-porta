// app/(portal)/helpdesk/[ticketId]/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  getTicket,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/db/helpdesk';
import { listUsers } from '@/lib/db/users';
import { listAttachments, type Attachment } from '@/lib/db/attachments';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { FileInput } from '@/components/ui/FileInput';
import { AttachmentList } from '@/components/ui/AttachmentList';
import { addReplyAction, setStatusAction } from '../actions';

// ============= LABELS =============
const CATEGORY_LABELS: Record<TicketCategory, string> = {
  it: 'IT',
  hr: 'HR',
  facilities: 'Facilities',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function statusTone(status: TicketStatus): 'green' | 'amber' | 'red' {
  return status === 'resolved' || status === 'closed' ? 'green' : 'amber';
}

// ============= PAGE =============
export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const user = await requireSession();
  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);
  if (!ticket) notFound();

  const isAgent = hasPermission(user, PERMISSIONS.EDIT_HELPDESK);
  // Non-agents may only view their own tickets.
  if (!isAgent && ticket.requesterId !== user.id) notFound();

  const users = await listUsers();
  const userMap = new Map(users.map(u => [u.id, u]));

  // ============= ATTACHMENTS =============
  // Batch-resolve every attachment referenced by the ticket and its replies.
  const allAttachmentIds = [
    ...ticket.attachmentIds,
    ...ticket.replies.flatMap(r => r.attachmentIds),
  ];
  const resolvedAttachments = await listAttachments(allAttachmentIds);
  const attachmentMap = new Map<string, Attachment>(resolvedAttachments.map(a => [a.id, a]));
  const pickAttachments = (ids: string[]): Attachment[] =>
    ids.map(id => attachmentMap.get(id)).filter((a): a is Attachment => a !== undefined);
  const ticketAttachments = pickAttachments(ticket.attachmentIds);

  // ============= PER-ID BINDINGS =============
  const doReply = async (fd: FormData) => {
    'use server';
    await addReplyAction(ticket.id, fd);
  };
  const doStatus = async (fd: FormData) => {
    'use server';
    await setStatusAction(ticket.id, fd);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/helpdesk">
          <Button variant="ghost" size="sm">← All tickets</Button>
        </Link>
      </div>

      {/* ============= HEADER ============= */}
      <GlassPanel>
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <p className="text-sm text-text-muted">
              {CATEGORY_LABELS[ticket.category]} · {PRIORITY_LABELS[ticket.priority]} priority · Raised by {userMap.get(ticket.requesterId)?.displayName ?? ticket.requesterId}
            </p>
            <p className="text-xs text-text-muted">Opened {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <StatusPill tone={statusTone(ticket.status)}>{STATUS_LABELS[ticket.status]}</StatusPill>
        </div>

        {ticketAttachments.length > 0 && (
          <div className="mt-4">
            <AttachmentList attachments={ticketAttachments} />
          </div>
        )}

        {isAgent && (
          <form action={doStatus} className="flex items-end gap-2 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Change status</label>
              <select
                name="status"
                defaultValue={ticket.status}
                required
                // eslint-disable-next-line react/forbid-dom-props
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
              >
                {TICKET_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <Button type="submit" variant="secondary" size="sm">Update</Button>
          </form>
        )}
      </GlassPanel>

      {/* ============= THREAD ============= */}
      <div className="flex flex-col gap-3">
        {ticket.replies.map(reply => (
          <GlassPanel key={reply.id} variant="strong">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">{userMap.get(reply.authorId)?.displayName ?? reply.authorId}</span>
              <span className="text-xs text-text-muted">{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm mt-2 whitespace-pre-line">{reply.body}</p>
            {reply.attachmentIds.length > 0 && (
              <div className="mt-2">
                <AttachmentList attachments={pickAttachments(reply.attachmentIds)} compact />
              </div>
            )}
          </GlassPanel>
        ))}
      </div>

      {/* ============= REPLY FORM ============= */}
      <GlassPanel>
        <form action={doReply} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Add a reply</label>
          <textarea
            name="body"
            required
            rows={4}
            maxLength={2000}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
          />
          <FileInput name="attachments" label="Attach files (optional)" />
          <Button type="submit" className="self-start">Send reply</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
