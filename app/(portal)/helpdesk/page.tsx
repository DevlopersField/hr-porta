// app/(portal)/helpdesk/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  listAllTickets,
  listUserTickets,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/db/helpdesk';
import { listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { FileInput } from '@/components/ui/FileInput';
import { createTicketAction } from './actions';

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
export default async function HelpdeskPage() {
  const user = await requireSession();
  const isAgent = hasPermission(user, PERMISSIONS.EDIT_HELPDESK);

  const tickets: Ticket[] = isAgent ? await listAllTickets() : await listUserTickets(user.id);
  const users = isAgent ? await listUsers() : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Helpdesk</h1>

      {/* ============= RAISE TICKET ============= */}
      <GlassPanel className="max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Raise a ticket</h2>
        <form action={createTicketAction} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">Category</label>
              <select
                name="category"
                defaultValue="it"
                required
                // eslint-disable-next-line react/forbid-dom-props
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
              >
                {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">Priority</label>
              <select
                name="priority"
                defaultValue="normal"
                required
                // eslint-disable-next-line react/forbid-dom-props
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
              >
                {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>
          <Input name="subject" label="Subject" required maxLength={200} />
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="body"
            required
            rows={4}
            maxLength={2000}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
          />
          <FileInput name="attachments" label="Attachments (optional)" />
          <Button type="submit" className="self-start">Submit ticket</Button>
        </form>
      </GlassPanel>

      {/* ============= QUEUE ============= */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{isAgent ? 'All tickets' : 'My tickets'}</h2>
        <GlassPanel className="p-0 overflow-hidden">
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
            <thead>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
                {isAgent && (
                  // eslint-disable-next-line react/forbid-dom-props
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Requester</th>
                )}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Subject</th>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Category</th>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Priority</th>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td colSpan={isAgent ? 5 : 4} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No tickets yet.</td>
                </tr>
              )}
              {tickets.map(t => (
                // eslint-disable-next-line react/forbid-dom-props
                <tr key={t.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                  {isAgent && (
                    // eslint-disable-next-line react/forbid-dom-props
                    <td data-label="Requester" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{userMap.get(t.requesterId)?.displayName ?? t.requesterId}</td>
                  )}
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Subject" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                    <Link href={`/helpdesk/${t.id}`} className="font-medium hover:underline">{t.subject}</Link>
                  </td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Category" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{CATEGORY_LABELS[t.category]}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Priority" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{PRIORITY_LABELS[t.priority]}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Status" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                    <StatusPill tone={statusTone(t.status)}>{STATUS_LABELS[t.status]}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </div>
    </div>
  );
}
