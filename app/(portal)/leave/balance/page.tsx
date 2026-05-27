// app/(portal)/leave/balance/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { listUserLeaves, getLeaveBalance, LEAVE_TYPES, type LeaveType } from '@/lib/db/leaves';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import Link from 'next/link';
import { withdrawLeaveAction } from '../actions';

const TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
};

// ============= PAGE =============
export default async function LeaveBalancePage() {
  const user = await requireSession();
  const balance = await getLeaveBalance(user.id);
  const history = (await listUserLeaves(user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Leave</h1>
        <Link href="/leave/request">
          <Button>Request time off</Button>
        </Link>
      </div>

      {/* ============= BALANCES ============= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEAVE_TYPES.map(t => {
          const b = balance[t];
          return (
            <GlassPanel key={t}>
              <h2 className="text-sm font-medium text-text-muted">{TYPE_LABELS[t]}</h2>
              <p className="text-3xl font-semibold mt-2">
                {b.quota === null ? '∞' : b.remaining}
                {b.quota !== null && <span className="text-sm text-text-muted"> / {b.quota}</span>}
              </p>
              <p className="text-xs text-text-muted mt-1">{b.used} used</p>
            </GlassPanel>
          );
        })}
      </div>

      {/* ============= HISTORY ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Type</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Dates</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Days</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Status</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}></th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No leave requests yet.</td>
              </tr>
            )}
            {history.map(r => (
              // eslint-disable-next-line react/forbid-dom-props
              <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Type" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{TYPE_LABELS[r.type]}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Dates" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{r.startDate} → {r.endDate}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Days" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{r.days}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Status" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                  <StatusPill tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'}>{r.status}</StatusPill>
                </td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Action" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>
                  {r.status === 'pending' && (
                    <form action={async () => { 'use server'; await withdrawLeaveAction(r.id); }}>
                      <Button type="submit" size="sm" variant="ghost">Withdraw</Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
