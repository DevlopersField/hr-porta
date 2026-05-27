// app/(portal)/people/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { listUsers } from '@/lib/db/users';
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

// ============= PAGE =============
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireSession();
  const { q = '', page = '1' } = await searchParams;
  const allUsers = await listUsers();

  // ============= FILTER =============
  const filtered = q
    ? allUsers.filter(u =>
        [u.displayName, u.email, u.department, u.jobTitle]
          .some(f => f.toLowerCase().includes(q.toLowerCase())))
    : allUsers;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const PAGE_SIZE = 25;
  const start = (pageNum - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const canCreate = hasPermission(user, PERMISSIONS.CREATE_USERS);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">People</h1>
        {canCreate && (
          <Link href="/people/new">
            <Button>Add Employee</Button>
          </Link>
        )}
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, department..."
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-strong)',
            fontSize: '14px',
            width: '360px',
          } as React.CSSProperties}
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Name</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Email</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Department</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Title</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(p => (
              // eslint-disable-next-line react/forbid-dom-props
              <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ padding: '12px 16px' } as React.CSSProperties}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <Link href={`/people/${p.id}`} style={{ color: 'var(--color-primary)', fontWeight: 500 } as React.CSSProperties}>
                    {p.displayName}
                  </Link>
                </td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{p.email}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.department || '—'}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.jobTitle || '—'}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{p.active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>

      <div className="flex justify-between text-sm">
        <span>{filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}</span>
        <div className="flex gap-2">
          {pageNum > 1 && (
            <Link href={`/people?q=${q}&page=${pageNum - 1}`}>
              <Button variant="ghost" size="sm">Previous</Button>
            </Link>
          )}
          <span>Page {pageNum} of {totalPages}</span>
          {pageNum < totalPages && (
            <Link href={`/people?q=${q}&page=${pageNum + 1}`}>
              <Button variant="ghost" size="sm">Next</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
