// app/(portal)/request-hub/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { listUserRequests, REQUEST_TYPES, type RequestType } from '@/lib/db/requests';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { submitRequestAction, withdrawRequestAction } from './actions';

const TYPE_LABELS: Record<RequestType, string> = {
  equipment: 'Equipment',
  travel: 'Travel',
  wfh: 'Work from home',
  expense: 'Expense',
  general: 'General',
};

// ============= PAGE =============
export default async function RequestHubPage() {
  const user = await requireSession();
  const requests = (await listUserRequests(user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Request hub</h1>

      {/* ============= NEW REQUEST ============= */}
      <GlassPanel className="max-w-md">
        <form action={submitRequestAction} className="flex flex-col gap-4">
          <label className="text-sm font-medium">Request type</label>
          <select
            name="type"
            defaultValue="general"
            required
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            {REQUEST_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <Input name="title" label="Title" required maxLength={120} />
          <label className="text-sm font-medium">Details</label>
          <textarea
            name="details"
            required
            rows={4}
            maxLength={1000}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
          />
          <Input name="amount" type="number" step="0.01" min="0" label="Amount (expense only)" />
          <Button type="submit" className="self-start">Submit request</Button>
        </form>
      </GlassPanel>

      {/* ============= MY REQUESTS ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Type</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Title</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Amount</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Status</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No requests yet.</td>
              </tr>
            )}
            {requests.map(r => {
              const withdraw = async () => { 'use server'; await withdrawRequestAction(r.id); };
              return (
                // eslint-disable-next-line react/forbid-dom-props
                <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Type" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{TYPE_LABELS[r.type]}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Title" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{r.title}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Amount" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{r.amount === null ? '—' : r.amount.toFixed(2)}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Status" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                    <StatusPill tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'}>{r.status}</StatusPill>
                  </td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Action" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                    {r.status === 'pending' && (
                      <form action={withdraw}>
                        <Button type="submit" size="sm" variant="ghost">Withdraw</Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
