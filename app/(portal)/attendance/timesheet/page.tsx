// app/(portal)/attendance/timesheet/page.tsx
// Project timesheet: pick a project, log hours manually. Clock in/out
// (attendance presence) lives separately at /attendance/clock.

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listMonth } from '@/lib/db/attendance';
import { listProjects } from '@/lib/db/projects';
import { listMonthEntries, summarizeByProject } from '@/lib/db/timesheets';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  addTimesheetEntryAction,
  deleteTimesheetEntryAction,
  createProjectAction,
  setProjectActiveAction,
} from './actions';

// ============= HELPERS =============
function formatHours(h: number): string {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(2).replace(/\.?0+$/, '')}h`;
}

const cellStyle = { padding: '12px 16px', fontSize: '13px' } as React.CSSProperties;
const headStyle = { textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '13px' } as React.CSSProperties;

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
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);

  const [entries, allProjects, clockDays] = await Promise.all([
    listMonthEntries(user.id, monthPrefix),
    listProjects(),
    listMonth(user.id, year, month),
  ]);
  const activeProjects = allProjects.filter(p => p.active);
  const projectById = new Map(allProjects.map(p => [p.id, p]));
  const canManageProjects = hasPermission(user, PERMISSIONS.MANAGE_PROJECTS);

  const totalLogged = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalClockedMin = clockDays.reduce((sum, d) => sum + d.totalMinutes, 0);
  const perProject = summarizeByProject(entries);

  // ============= NAV PREV/NEXT MONTH =============
  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Timesheet</h1>
        <Link href="/attendance/clock"><Button variant="ghost">Clock in / out</Button></Link>
      </div>

      {/* ============= MONTH NAV ============= */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/attendance/timesheet?year=${prevMonth.year}&month=${prevMonth.month}`}>
          <Button variant="ghost" size="sm">← Previous</Button>
        </Link>
        <span className="text-lg font-semibold">{label}</span>
        <Link href={`/attendance/timesheet?year=${nextMonth.year}&month=${nextMonth.month}`}>
          <Button variant="ghost" size="sm">Next →</Button>
        </Link>
        <span className="ml-auto text-sm text-text-muted">
          Logged: <strong>{formatHours(totalLogged)}</strong> · Clocked: {Math.floor(totalClockedMin / 60)}h {totalClockedMin % 60}m
        </span>
      </div>

      {/* ============= LOG TIME ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold mb-4">Log time</h2>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-text-muted">
            No active projects yet{canManageProjects ? ' — add one below.' : '. Ask an administrator to add projects.'}
          </p>
        ) : (
          <form action={addTimesheetEntryAction} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="ts-project">Project</label>
              <select
                id="ts-project"
                name="projectId"
                required
                // eslint-disable-next-line react/forbid-dom-props
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', minWidth: '220px' } as React.CSSProperties}
              >
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.code ? `${p.code} — ${p.name}` : p.name}</option>
                ))}
              </select>
            </div>
            <Input name="date" type="date" label="Date" defaultValue={today} required />
            <Input name="hours" type="number" label="Hours" step="0.25" min="0.25" max="24" placeholder="e.g. 7.5" required />
            <Input name="note" label="Note (optional)" placeholder="What did you work on?" />
            <Button type="submit">Add entry</Button>
          </form>
        )}
      </GlassPanel>

      {/* ============= PER-PROJECT TOTALS ============= */}
      {perProject.size > 0 && (
        <div className="flex flex-wrap gap-3">
          {[...perProject.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([projectId, hours]) => (
              <GlassPanel key={projectId} className="flex items-center gap-3 py-3 px-4">
                <span className="text-sm font-medium">{projectById.get(projectId)?.name ?? 'Unknown project'}</span>
                <StatusPill tone="green">{formatHours(hours)}</StatusPill>
              </GlassPanel>
            ))}
        </div>
      )}

      {/* ============= ENTRIES ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table className="responsive-card" style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={headStyle}>Date</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={headStyle}>Project</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={headStyle}>Hours</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={headStyle}>Note</th>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={headStyle}></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>
                  No time logged for {label}.
                </td>
              </tr>
            )}
            {entries.map(e => {
              const remove = async () => { 'use server'; await deleteTimesheetEntryAction(e.id); };
              const project = projectById.get(e.projectId);
              return (
                // eslint-disable-next-line react/forbid-dom-props
                <tr key={e.id} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Date" style={cellStyle}>{e.date}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Project" style={cellStyle}>{project ? (project.code ? `${project.code} — ${project.name}` : project.name) : 'Unknown project'}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Hours" style={cellStyle}>{formatHours(e.hours)}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="Note" style={{ ...cellStyle, color: 'var(--color-text-muted)' } as React.CSSProperties}>{e.note}</td>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td data-label="" style={cellStyle}>
                    <form action={remove}>
                      <Button type="submit" variant="ghost" size="sm">Delete</Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassPanel>

      {/* ============= PROJECT MANAGEMENT (admins) ============= */}
      {canManageProjects && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">Projects</h2>
          <form action={createProjectAction} className="flex flex-wrap items-end gap-3 mb-6">
            <Input name="name" label="Project name" placeholder="e.g. Website Redesign" required />
            <Input name="code" label="Code (optional)" placeholder="e.g. WEB" />
            <Button type="submit">Add project</Button>
          </form>
          <ul className="flex flex-col gap-2">
            {allProjects.map(p => {
              const toggle = async () => { 'use server'; await setProjectActiveAction(p.id, !p.active); };
              return (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{p.code ? `${p.code} — ${p.name}` : p.name}</span>
                  <StatusPill tone={p.active ? 'green' : 'amber'}>{p.active ? 'Active' : 'Archived'}</StatusPill>
                  <form action={toggle} className="ml-auto">
                    <Button type="submit" variant="ghost" size="sm">{p.active ? 'Archive' : 'Restore'}</Button>
                  </form>
                </li>
              );
            })}
            {allProjects.length === 0 && <li className="text-sm text-text-muted">No projects yet.</li>}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
