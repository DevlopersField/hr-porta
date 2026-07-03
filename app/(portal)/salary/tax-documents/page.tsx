// app/(portal)/salary/tax-documents/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listTaxDocs } from '@/lib/db/salary';
import { getUserById, listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { addTaxDocAction } from '../actions';

// ============= PAGE =============
export default async function TaxDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const me = await requireSession();
  const { userId } = await searchParams;

  const canViewAll = hasPermission(me, PERMISSIONS.VIEW_ALL_SALARY);
  // Non-privileged users can only ever view their own records.
  const targetId = canViewAll && userId ? userId : me.id;

  const canEdit = hasPermission(me, PERMISSIONS.EDIT_SALARY);

  const docs = await listTaxDocs(targetId);
  const users = canViewAll ? await listUsers() : [];
  const targetUser = targetId === me.id ? null : await getUserById(targetId);

  const latest = docs[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Tax documents</h1>
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
        <StatCard label="Latest year" value={latest ? latest.year : '—'} />
        <StatCard label="Documents on file" value={docs.length} />
      </div>

      {/* ============= TAX DOC TABLE ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Year</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Kind</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Label</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Issued</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No tax documents on file.</td>
              </tr>
            )}
            {docs.map(d => (
              // eslint-disable-next-line react/forbid-dom-props
              <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Year" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{d.year}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Kind" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{d.kind}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Label" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{d.label}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Issued" style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{new Date(d.issuedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>

      {/* ============= ADD DOCUMENT (EDIT_SALARY) ============= */}
      {canEdit && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">Add document</h2>
          <form action={addTaxDocAction} className="flex flex-col gap-4">
            <input type="hidden" name="targetId" value={targetId} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Year" name="year" type="number" placeholder="2026" required />
              <Input label="Kind" name="kind" placeholder="W-2" required />
              <Input label="Label" name="label" placeholder="Wage and Tax Statement" required />
            </div>
            <div>
              <Button type="submit">Add document</Button>
            </div>
          </form>
        </GlassPanel>
      )}
    </div>
  );
}
