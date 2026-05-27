// app/(portal)/attendance/timesheet/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { listMonth } from '@/lib/db/attendance';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

// ============= HELPERS =============
function formatHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

// ============= PAGE =============
export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireSession();
  const { year: yearStr, month: monthStr } = await searchParams;
  const now = new Date();
  const year = parseInt(yearStr ?? String(now.getUTCFullYear()), 10);
  const month = parseInt(monthStr ?? String(now.getUTCMonth() + 1), 10);

  const days = await listMonth(user.id, year, month);
  const totalMin = days.reduce((sum, d) => sum + d.totalMinutes, 0);

  // ============= NAV PREV/NEXT MONTH =============
  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Timesheet</h1>
        <Link href="/attendance/clock"><Button>Clock in / out</Button></Link>
      </div>

      {/* ============= MONTH NAV ============= */}
      <div className="flex items-center gap-4">
        <Link href={`/attendance/timesheet?year=${prevMonth.year}&month=${prevMonth.month}`}>
          <Button variant="ghost" size="sm">← Previous</Button>
        </Link>
        <span className="text-lg font-semibold">{label}</span>
        <Link href={`/attendance/timesheet?year=${nextMonth.year}&month=${nextMonth.month}`}>
          <Button variant="ghost" size="sm">Next →</Button>
        </Link>
        <span className="ml-auto text-sm text-text-muted">Total: {formatHM(totalMin)}</span>
      </div>

      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Date</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>In</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Out</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Hours</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties}>Note</th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>No clock-ins for {label}.</td>
              </tr>
            )}
            {days.map(d => (
              // eslint-disable-next-line react/forbid-dom-props
              <tr key={d.date} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Date" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{d.date}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="In" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{new Date(d.clockIn).toLocaleTimeString()}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Out" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{d.clockOut ? new Date(d.clockOut).toLocaleTimeString() : <em>open</em>}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Hours" style={{ padding: '12px 16px', fontSize: '13px' } as React.CSSProperties}>{formatHM(d.totalMinutes)}</td>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td data-label="Note" style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' } as React.CSSProperties}>{d.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
