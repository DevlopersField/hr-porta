// app/(portal)/attendance/timesheet/page.tsx
// Weekly project timesheet: a Mon–Sun grid of project/task rows with per-day
// hours, week-by-week navigation, H:MM manual entry against a selected
// project + task, edit/delete on any entry, month summary, and a team view
// for managers. Clock in/out (presence) stays at /attendance/clock.

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listMonth } from '@/lib/db/attendance';
import { listUsers } from '@/lib/db/users';
import { listProjects, type Project } from '@/lib/db/projects';
import {
  listEntriesInRange,
  listMonthEntries,
  summarizeByProject,
  formatHoursHM,
  type TimesheetEntry,
} from '@/lib/db/timesheets';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  addTimesheetEntryAction,
  updateTimesheetEntryAction,
  deleteTimesheetEntryAction,
  createProjectAction,
  addProjectTaskAction,
  setProjectActiveAction,
} from './actions';

// ============= DATE HELPERS =============
function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============= STYLES =============
const selectStyle = {
  padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)',
  fontSize: '14px', minWidth: '220px',
} as React.CSSProperties;
const cellStyle = { padding: '10px 12px', fontSize: '13px', textAlign: 'center' } as React.CSSProperties;
const rowHeadStyle = { padding: '10px 12px', fontSize: '13px', textAlign: 'left' } as React.CSSProperties;

// ============= SHARED SELECT =============
// One grouped select drives both add and edit: value is "projectId|taskId"
// ('' task = the project's Other bucket).
function ProjectTaskSelect({
  projects, id, defaultValue,
}: {
  projects: Project[]; id: string; defaultValue?: string;
}) {
  return (
    <select
      id={id}
      name="projectTask"
      required
      defaultValue={defaultValue}
      // eslint-disable-next-line react/forbid-dom-props
      style={selectStyle}
    >
      {projects.map(p => (
        <optgroup key={p.id} label={p.code ? `${p.code} — ${p.name}` : p.name}>
          {p.tasks.map(t => (
            <option key={t.id} value={`${p.id}|${t.id}`}>{t.name}</option>
          ))}
          <option value={`${p.id}|`}>Other</option>
        </optgroup>
      ))}
    </select>
  );
}

// ============= ENTRY ROWS =============
function entryLabel(projectById: Map<string, Project>, e: TimesheetEntry): string {
  const p = projectById.get(e.projectId);
  if (!p) return 'Unknown project';
  const base = p.code ? `${p.code} — ${p.name}` : p.name;
  const task = e.taskId ? (p.tasks.find(t => t.id === e.taskId)?.name ?? 'Unknown task') : 'Other';
  return `${base} · ${task}`;
}

function EntryRow({
  entry, projectById, editHref,
}: {
  entry: TimesheetEntry; projectById: Map<string, Project>; editHref: string;
}) {
  const remove = async () => { 'use server'; await deleteTimesheetEntryAction(entry.id); };
  return (
    <div className="flex items-center gap-3 flex-wrap py-2">
      <span className="text-sm font-medium">{entryLabel(projectById, entry)}</span>
      <StatusPill tone="green">{formatHoursHM(entry.hours)}</StatusPill>
      {entry.note && <span className="text-sm text-text-muted">{entry.note}</span>}
      <span className="ml-auto flex items-center gap-1">
        <Link href={editHref}><Button variant="ghost" size="sm">Edit</Button></Link>
        <form action={remove}>
          <Button type="submit" variant="ghost" size="sm">Delete</Button>
        </form>
      </span>
    </div>
  );
}

function EntryEditRow({
  entry, activeProjects, cancelHref,
}: {
  entry: TimesheetEntry; activeProjects: Project[]; cancelHref: string;
}) {
  const save = updateTimesheetEntryAction.bind(null, entry.id);
  return (
    <form action={save} className="flex flex-wrap items-end gap-3 py-2">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`edit-pt-${entry.id}`}>Project / task</label>
        <ProjectTaskSelect
          projects={activeProjects}
          id={`edit-pt-${entry.id}`}
          defaultValue={`${entry.projectId}|${entry.taskId ?? ''}`}
        />
      </div>
      <Input name="date" type="date" label="Date" defaultValue={entry.date} required />
      <Input name="hours" label="Hours (H:MM)" defaultValue={formatHoursHM(entry.hours)} placeholder="5:30" required />
      <Input name="note" label="Note" defaultValue={entry.note} />
      <Button type="submit" size="sm">Save</Button>
      <Link href={cancelHref}><Button variant="ghost" size="sm">Cancel</Button></Link>
    </form>
  );
}

// ============= PAGE =============
export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; edit?: string; add?: string; pt?: string }>;
}) {
  const user = await requireSession();
  const { week: weekParam, edit: editId, add: addDate, pt: addProjectTask } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const prefillDate = /^\d{4}-\d{2}-\d{2}$/.test(addDate ?? '') ? addDate! : today;
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(weekParam ?? '') ? mondayOf(weekParam!) : mondayOf(today);
  const weekEnd = addDays(weekStart, 6);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthPrefix = weekStart.slice(0, 7);
  const [yearNum, monthNum] = [parseInt(weekStart.slice(0, 4), 10), parseInt(weekStart.slice(5, 7), 10)];

  const [weekEntries, monthEntries, allProjects, clockDays, users] = await Promise.all([
    listEntriesInRange(user.id, weekStart, weekEnd),
    listMonthEntries(user.id, monthPrefix),
    listProjects(),
    listMonth(user.id, yearNum, monthNum),
    listUsers(),
  ]);
  const activeProjects = allProjects.filter(p => p.active);
  const projectById = new Map(allProjects.map(p => [p.id, p]));
  const canManageProjects = hasPermission(user, PERMISSIONS.MANAGE_PROJECTS);

  // ============= WEEKLY GRID (project/task rows × Mon–Sun) =============
  // rowKey = projectId|taskId; cells sum hours per date.
  const gridRows = new Map<string, Map<string, number>>();
  for (const e of weekEntries) {
    const key = `${e.projectId}|${e.taskId ?? ''}`;
    if (!gridRows.has(key)) gridRows.set(key, new Map());
    const cells = gridRows.get(key)!;
    cells.set(e.date, (cells.get(e.date) ?? 0) + e.hours);
  }
  const rowLabel = (key: string): string => {
    const [pid, tid] = key.split('|', 2);
    const p = projectById.get(pid!);
    if (!p) return 'Unknown project';
    const task = tid ? (p.tasks.find(t => t.id === tid)?.name ?? 'Unknown task') : 'Other';
    return `${p.code ? `${p.code} — ${p.name}` : p.name} · ${task}`;
  };
  const sortedRows = [...gridRows.entries()].sort((a, b) => rowLabel(a[0]).localeCompare(rowLabel(b[0])));
  const dayTotals = weekDates.map(d => weekEntries.filter(e => e.date === d).reduce((s, e) => s + e.hours, 0));
  const weekTotal = dayTotals.reduce((s, h) => s + h, 0);

  // Day-grouped entry list under the grid (edit/delete lives here).
  const dayGroups = new Map<string, TimesheetEntry[]>();
  for (const e of weekEntries) {
    if (!dayGroups.has(e.date)) dayGroups.set(e.date, []);
    dayGroups.get(e.date)!.push(e);
  }

  // ============= MONTH SUMMARY + TEAM =============
  const monthTotal = monthEntries.reduce((s, e) => s + e.hours, 0);
  const totalClockedMin = clockDays.reduce((sum, d) => sum + d.totalMinutes, 0);
  const perProjectMonth = summarizeByProject(monthEntries);
  const monthLabel = new Date(`${weekStart}T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const seesAll = hasPermission(user, PERMISSIONS.VIEW_ALL_ATTENDANCE);
  const seesTeam = seesAll || hasPermission(user, PERMISSIONS.VIEW_TEAM_ATTENDANCE);
  const teamMembers = users.filter(u =>
    u.id !== user.id && u.active && (seesAll || (seesTeam && u.managerId === user.id)),
  );
  const teamRows = (await Promise.all(
    teamMembers.map(async m => {
      const mEntries = await listEntriesInRange(m.id, weekStart, weekEnd);
      return { member: m, total: mEntries.reduce((s, e) => s + e.hours, 0), perProject: summarizeByProject(mEntries) };
    }),
  )).filter(r => r.total > 0);

  const weekHref = (start: string, extra = '') => `/attendance/timesheet?week=${start}${extra}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Timesheet</h1>
        <Link href="/attendance/clock"><Button variant="ghost">Clock in / out</Button></Link>
      </div>

      {/* ============= WEEK NAV ============= */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={weekHref(addDays(weekStart, -7))}>
          <Button variant="ghost" size="sm">← Previous week</Button>
        </Link>
        <span className="text-lg font-semibold">{shortDate(weekStart)} – {shortDate(weekEnd)}, {weekStart.slice(0, 4)}</span>
        <Link href={weekHref(addDays(weekStart, 7))}>
          <Button variant="ghost" size="sm">Next week →</Button>
        </Link>
        {weekStart !== mondayOf(today) && (
          <Link href={weekHref(mondayOf(today))}>
            <Button variant="ghost" size="sm">This week</Button>
          </Link>
        )}
        <span className="ml-auto text-sm text-text-muted">
          Week: <strong>{formatHoursHM(weekTotal)}</strong> · {monthLabel}: {formatHoursHM(monthTotal)} · Clocked: {Math.floor(totalClockedMin / 60)}:{String(totalClockedMin % 60).padStart(2, '0')}
        </span>
      </div>

      {/* ============= LOG TIME ============= */}
      {/* Prefilled by the grid's + links via ?add=<date>&pt=<projectId|taskId>. */}
      <GlassPanel id="log-time">
        <h2 className="text-lg font-semibold mb-4">Log time</h2>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-text-muted">
            No active projects yet{canManageProjects ? ' — add one below.' : '. Ask an administrator to add projects.'}
          </p>
        ) : (
          <form action={addTimesheetEntryAction} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="ts-pt">Project / task</label>
              <ProjectTaskSelect projects={activeProjects} id="ts-pt" defaultValue={addProjectTask} />
            </div>
            <Input name="date" type="date" label="Date" defaultValue={prefillDate} required />
            <Input name="hours" label="Hours (H:MM)" placeholder="5:30" required />
            <Input name="note" label="Note (optional)" placeholder="What did you work on?" />
            <Button type="submit">Add entry</Button>
          </form>
        )}
      </GlassPanel>

      {/* ============= WEEKLY GRID ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <table style={{ width: '100%', borderCollapse: 'collapse' } as React.CSSProperties}>
          <thead>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <tr style={{ background: 'var(--color-surface)' } as React.CSSProperties}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ ...rowHeadStyle, fontWeight: 500 } as React.CSSProperties}>Project / task</th>
              {weekDates.map((d, i) => (
                // eslint-disable-next-line react/forbid-dom-props
                <th key={d} style={{ ...cellStyle, fontWeight: d === today ? 700 : 500 } as React.CSSProperties}>
                  {WEEKDAYS[i]}<br /><span className="text-xs text-text-muted">{shortDate(d)}</span>
                </th>
              ))}
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <th style={{ ...cellStyle, fontWeight: 600 } as React.CSSProperties}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' } as React.CSSProperties}>
                  No time logged this week.
                </td>
              </tr>
            )}
            {sortedRows.map(([key, cells]) => {
              const rowTotal = [...cells.values()].reduce((s, h) => s + h, 0);
              return (
                // eslint-disable-next-line react/forbid-dom-props
                <tr key={key} style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td style={rowHeadStyle}>{rowLabel(key)}</td>
                  {weekDates.map(d => (
                    // eslint-disable-next-line react/forbid-dom-props
                    <td key={d} style={cellStyle}>
                      {cells.has(d) ? (
                        // Filled cell: jump to that day's entries below for edit/delete.
                        <a href={`#day-${d}`} className="font-medium underline-offset-2 hover:underline">
                          {formatHoursHM(cells.get(d)!)}
                        </a>
                      ) : (
                        // Empty cell: + prefills the form with this date AND this row's project/task.
                        <Link
                          href={`${weekHref(weekStart, `&add=${d}&pt=${encodeURIComponent(key)}`)}#log-time`}
                          className="text-text-muted hover:text-text"
                          aria-label={`Log time for ${rowLabel(key)} on ${d}`}
                        >
                          +
                        </Link>
                      )}
                    </td>
                  ))}
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <td style={{ ...cellStyle, fontWeight: 600 } as React.CSSProperties}>{formatHoursHM(rowTotal)}</td>
                </tr>
              );
            })}
            {activeProjects.length > 0 && (
              // eslint-disable-next-line react/forbid-dom-props
              <tr style={{ borderTop: '1px solid var(--color-border)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ ...rowHeadStyle, color: 'var(--color-text-muted)', fontSize: '12px' } as React.CSSProperties}>Add entry</td>
                {weekDates.map(d => (
                  // eslint-disable-next-line react/forbid-dom-props
                  <td key={d} style={cellStyle}>
                    <Link
                      href={`${weekHref(weekStart, `&add=${d}`)}#log-time`}
                      className="text-text-muted hover:text-text text-base"
                      aria-label={`Log time on ${d}`}
                    >
                      +
                    </Link>
                  </td>
                ))}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={cellStyle}></td>
              </tr>
            )}
            {sortedRows.length > 0 && (
              // eslint-disable-next-line react/forbid-dom-props
              <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-surface)' } as React.CSSProperties}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ ...rowHeadStyle, fontWeight: 600 } as React.CSSProperties}>Day total</td>
                {dayTotals.map((h, i) => (
                  // eslint-disable-next-line react/forbid-dom-props
                  <td key={weekDates[i]} style={{ ...cellStyle, fontWeight: 600 } as React.CSSProperties}>
                    {h > 0 ? formatHoursHM(h) : <span className="text-text-muted">—</span>}
                  </td>
                ))}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <td style={{ ...cellStyle, fontWeight: 700 } as React.CSSProperties}>{formatHoursHM(weekTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassPanel>

      {/* ============= ENTRIES (edit/delete) ============= */}
      {[...dayGroups.entries()].map(([date, dayEntries]) => (
        <GlassPanel key={date} id={`day-${date}`}>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-semibold">{dayLabel(date)}</h3>
            <span className="text-sm text-text-muted">
              {formatHoursHM(dayEntries.reduce((s, e) => s + e.hours, 0))}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {dayEntries.map(e =>
              e.id === editId ? (
                <EntryEditRow key={e.id} entry={e} activeProjects={activeProjects} cancelHref={weekHref(weekStart)} />
              ) : (
                <EntryRow key={e.id} entry={e} projectById={projectById} editHref={weekHref(weekStart, `&edit=${e.id}`)} />
              ),
            )}
          </div>
        </GlassPanel>
      ))}

      {/* ============= MONTH SUMMARY ============= */}
      {perProjectMonth.size > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">{monthLabel} by project</h2>
          <div className="flex flex-wrap gap-3">
            {[...perProjectMonth.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([projectId, hours]) => (
                <GlassPanel key={projectId} className="flex items-center gap-3 py-3 px-4">
                  <span className="text-sm font-medium">{projectById.get(projectId)?.name ?? 'Unknown project'}</span>
                  <StatusPill tone="green">{formatHoursHM(hours)}</StatusPill>
                </GlassPanel>
              ))}
          </div>
        </section>
      )}

      {/* ============= TEAM TIME (this week) ============= */}
      {teamMembers.length > 0 && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">
            {seesAll ? 'Everyone' : 'My team'} — {shortDate(weekStart)} – {shortDate(weekEnd)}
          </h2>
          {teamRows.length === 0 ? (
            <p className="text-sm text-text-muted">No team time logged this week.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {teamRows.map(({ member, total, perProject: mp }) => (
                <li key={member.id} className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="font-medium min-w-[160px]">{member.displayName}</span>
                  <StatusPill tone="green">{formatHoursHM(total)}</StatusPill>
                  <span className="text-text-muted">
                    {[...mp.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([pid, h]) => `${projectById.get(pid)?.name ?? 'Unknown'} ${formatHoursHM(h)}`)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      )}

      {/* ============= PROJECT & TASK MANAGEMENT (admins) ============= */}
      {canManageProjects && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">Projects</h2>
          <form action={createProjectAction} className="flex flex-col gap-3 mb-6">
            <div className="flex flex-wrap items-end gap-3">
              <Input name="name" label="Project name" placeholder="e.g. Website Redesign" required />
              <Input name="code" label="Code (optional)" placeholder="e.g. WEB" />
              <Input name="tasks" label="Tasks (comma-separated)" placeholder="Design, Development, QA" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="prj-desc">Description (optional)</label>
              <textarea
                id="prj-desc"
                name="description"
                rows={2}
                placeholder="What is this project about?"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
              />
            </div>
            <div>
              <Button type="submit">Add project</Button>
            </div>
          </form>
          <ul className="flex flex-col gap-4">
            {allProjects.map(p => {
              const toggle = async () => { 'use server'; await setProjectActiveAction(p.id, !p.active); };
              const addTask = addProjectTaskAction.bind(null, p.id);
              return (
                <li key={p.id} className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{p.code ? `${p.code} — ${p.name}` : p.name}</span>
                    <StatusPill tone={p.active ? 'green' : 'amber'}>{p.active ? 'Active' : 'Archived'}</StatusPill>
                    <form action={toggle} className="ml-auto">
                      <Button type="submit" variant="ghost" size="sm">{p.active ? 'Archive' : 'Restore'}</Button>
                    </form>
                  </div>
                  {p.description && <p className="text-sm text-text-muted">{p.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted">
                    Tasks:
                    {p.tasks.length === 0
                      ? ' Other only'
                      : p.tasks.map(t => <StatusPill key={t.id} tone="green">{t.name}</StatusPill>)}
                  </div>
                  {p.active && (
                    <form action={addTask} className="flex items-end gap-2">
                      <Input name="taskName" label="" placeholder="New task name" required />
                      <Button type="submit" variant="ghost" size="sm">Add task</Button>
                    </form>
                  )}
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
