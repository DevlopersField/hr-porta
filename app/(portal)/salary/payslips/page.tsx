// app/(portal)/salary/payslips/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listPayslips } from '@/lib/db/salary';
import { getUserById, listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { addPayslipAction } from '../actions';

// ============= HELPERS =============
function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============= PAGE =============
export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const me = await requireSession();
  const { userId } = await searchParams;

  const canViewAll = hasPermission(me, PERMISSIONS.VIEW_ALL_SALARY);
  // Non-privileged users can only ever view their own records.
  const targetId = canViewAll && userId ? userId : me.id;

  const canEdit = hasPermission(me, PERMISSIONS.GENERATE_PAYSLIPS) || hasPermission(me, PERMISSIONS.EDIT_SALARY);

  const payslips = await listPayslips(targetId);
  const users = canViewAll ? await listUsers() : [];
  const targetUser = targetId === me.id ? null : await getUserById(targetId);

  const latest = payslips[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Payslips</h1>
      </div>

      {/* ============= USER SELECTOR (VIEW_ALL_SALARY) ============= */}
      {canViewAll && (
        <form method="GET" className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-muted">Viewing employee</span>
            <select
              name="userId"
              defaultValue={targetId}
              // eslint-disable-next-line react/forbid-dom-props
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
            >
              <option value={me.id}>Me ({me.name})</option>
              {users.filter(u => u.id !== me.id).map(u => (
                <option key={u.id} value={u.id}>{u.displayName} — {u.email}</option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">View</Button>
        </form>
      )}

      {targetUser && (
        <p className="text-sm text-text-muted">Showing records for <strong>{targetUser.displayName}</strong> ({targetUser.email}).</p>
      )}

      {/* ============= STATS ============= */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Latest net pay" value={latest ? formatMoney(latest.netPay, latest.currency) : '—'} />
        <StatCard label="Latest period" value={latest ? latest.period : '—'} />
        <StatCard label="Payslips on file" value={payslips.length} />
      </div>

      {/* ============= PAYSLIP TABLE ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Period</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Gross</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Net</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Currency</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Note</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Issued</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No payslips on file.</td>
              </tr>
            )}
            {payslips.map(p => (
              // eslint-disable-next-line react/forbid-dom-props
              <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Period" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.period}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Gross" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{formatMoney(p.grossPay, p.currency)}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Net" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{formatMoney(p.netPay, p.currency)}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Currency" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.currency}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Note" style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{p.note || '—'}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Issued" style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{new Date(p.issuedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>

      {/* ============= ADD PAYSLIP (privileged) ============= */}
      {canEdit && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">Add payslip</h2>
          <form action={addPayslipAction} className="flex flex-col gap-4">
            <input type="hidden" name="targetId" value={targetId} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Period (YYYY-MM)" name="period" placeholder="2026-05" required />
              <Input label="Currency" name="currency" defaultValue="USD" required />
              <Input label="Gross pay" name="grossPay" type="number" step="0.01" required />
              <Input label="Net pay" name="netPay" type="number" step="0.01" required />
            </div>
            <Input label="Note" name="note" placeholder="Optional" />
            <div>
              <Button type="submit">Add payslip</Button>
            </div>
          </form>
        </GlassPanel>
      )}
    </div>
  );
}
