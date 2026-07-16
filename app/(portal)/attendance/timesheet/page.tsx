// app/(portal)/attendance/timesheet/page.tsx
// Weekly project timesheet: a Mon–Sun grid of project/task rows with per-day
// hours, week-by-week navigation, H:MM entry against a selected project +
// task, edit/delete on any entry, month summary, and a team view for
// managers. Add/edit/new-project run in URL-driven modals (?add / ?edit /
// ?newProject). Clock in/out (presence) stays at /attendance/clock.

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
import { Modal } from '@/components/ui/Modal';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  addTimesheetEntryAction,
  updateTimesheetEntryAction,
  deleteTimesheetEntryAction,
  createProjectAction,
  addProjectTaskAction,
  setProjectActiveAction,
} from './actions';
import styles from './timesheet.module.css';

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

// ============= SHARED SELECT =============
// One grouped select drives both add and edit: value is "projectId|taskId"
// ('' task = the project's Other bucket).
function ProjectTaskSelect({
  projects, id, defaultValue,
}: {
  projects: Project[]; id: string; defaultValue?: string;
}) {
  return (
    <select id={id} name="projectTask" required defaultValue={defaultValue} className={styles.select}>
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

// ============= ENTRY FORM (shared by add + edit modals) =============
function EntryFields({
  activeProjects, weekStart, defaults,
}: {
  activeProjects: Project[];
  weekStart: string;
  defaults: { projectTask?: string; date: string; hours?: string; note?: string };
}) {
  return (
    <>
      <input type="hidden" name="week" value={weekStart} />
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="entry-pt">Project / task</label>
        <ProjectTaskSelect projects={activeProjects} id="entry-pt" defaultValue={defaults.projectTask} />
      </div>
      <div className={styles.fieldRow}>
        <Input name="date" type="date" label="Date" defaultValue={defaults.date} required />
        <Input
          name="hours"
          label="Hours (H:MM)"
          defaultValue={defaults.hours}
          placeholder="5:30"
          required
          pattern="\d{1,2}(:[0-5]\d)?|\d{1,2}\.\d+"
          title="H:MM (e.g. 5:30) or decimal hours (e.g. 7.5)"
        />
      </div>
      <Input name="note" label="Note (optional)" defaultValue={defaults.note} placeholder="What did you work on?" />
    </>
  );
}

// ============= ENTRY ROW =============
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

// ============= PAGE =============
export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; edit?: string; add?: string; pt?: string; newProject?: string }>;
}) {
  const user = await requireSession();
  const { week: weekParam, edit: editId, add: addDate, pt: addProjectTask, newProject } = await searchParams;
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

  // ============= MODAL STATE (from URL) =============
  const weekHref = (start: string, extra = '') => `/attendance/timesheet?week=${start}${extra}`;
  const closeHref = weekHref(weekStart);
  const showAddModal = Boolean(addDate);
  const editEntry = editId ? weekEntries.find(e => e.id === editId) : undefined;
  const showNewProjectModal = canManageProjects && newProject === '1';

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
  const dayClass = (d: string, i: number) =>
    [d === today ? styles.today : '', i >= 5 ? styles.weekend : ''].join(' ').trim();

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-semibold">Timesheet</h1>
        <span className="flex items-center gap-2">
          <Link href="/attendance/clock"><Button variant="ghost">Clock in / out</Button></Link>
          <Link href={weekHref(weekStart, `&add=${today}`)}><Button>Log time</Button></Link>
        </span>
      </div>

      {/* ============= WEEK NAV + SUMMARY ============= */}
      <div className="flex items-center gap-3 flex-wrap">
        <nav className={styles.weekNav} aria-label="Week navigation">
          <Link href={weekHref(addDays(weekStart, -7))} className={styles.weekNavBtn} aria-label="Previous week">‹</Link>
          <span className={styles.weekNavLabel}>{shortDate(weekStart)} – {shortDate(weekEnd)}, {weekStart.slice(0, 4)}</span>
          <Link href={weekHref(addDays(weekStart, 7))} className={styles.weekNavBtn} aria-label="Next week">›</Link>
        </nav>
        {weekStart !== mondayOf(today) && (
          <Link href={weekHref(mondayOf(today))}>
            <Button variant="ghost" size="sm">This week</Button>
          </Link>
        )}
        <div className={styles.statChips}>
          <span className={styles.statChip}>
            <span className={styles.statChipLabel}>Week</span>
            <span className={styles.statChipValue}>{formatHoursHM(weekTotal)}</span>
          </span>
          <span className={styles.statChip}>
            <span className={styles.statChipLabel}>{monthLabel.split(' ')[0]}</span>
            <span className={styles.statChipValue}>{formatHoursHM(monthTotal)}</span>
          </span>
          <span className={styles.statChip}>
            <span className={styles.statChipLabel}>Clocked</span>
            <span className={styles.statChipValue}>{Math.floor(totalClockedMin / 60)}:{String(totalClockedMin % 60).padStart(2, '0')}</span>
          </span>
        </div>
      </div>

      {/* ============= WEEKLY GRID ============= */}
      <GlassPanel className="p-0 overflow-hidden">
        <div className={styles.gridScroll}>
          <table className={styles.grid}>
            <thead>
              <tr>
                <th className={styles.rowHead}>Project / task</th>
                {weekDates.map((d, i) => (
                  <th key={d} className={d === today ? styles.todayHead : (i >= 5 ? styles.weekend : undefined)}>
                    {WEEKDAYS[i]}
                    <span className={styles.dateSub}>{shortDate(d)}</span>
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>No time logged this week.</td>
                </tr>
              )}
              {sortedRows.map(([key, cells]) => {
                const rowTotal = [...cells.values()].reduce((s, h) => s + h, 0);
                return (
                  <tr key={key}>
                    <td className={styles.rowHead}>{rowLabel(key)}</td>
                    {weekDates.map((d, i) => (
                      <td key={d} className={dayClass(d, i)}>
                        {cells.has(d) ? (
                          // Filled cell: jump to that day's entries below for edit/delete.
                          <a href={`#day-${d}`} className={styles.cellHours}>
                            {formatHoursHM(cells.get(d)!)}
                          </a>
                        ) : (
                          // Empty cell: + opens the log modal prefilled with this date AND row's project/task.
                          <Link
                            href={weekHref(weekStart, `&add=${d}&pt=${encodeURIComponent(key)}`)}
                            className={styles.addCell}
                            aria-label={`Log time for ${rowLabel(key)} on ${d}`}
                          >
                            +
                          </Link>
                        )}
                      </td>
                    ))}
                    <td className={styles.totalCol}>{formatHoursHM(rowTotal)}</td>
                  </tr>
                );
              })}
              {activeProjects.length > 0 && (
                <tr>
                  <td className={`${styles.rowHead} ${styles.mutedRowLabel}`}>Add entry</td>
                  {weekDates.map((d, i) => (
                    <td key={d} className={dayClass(d, i)}>
                      <Link
                        href={weekHref(weekStart, `&add=${d}`)}
                        className={styles.addCell}
                        aria-label={`Log time on ${d}`}
                      >
                        +
                      </Link>
                    </td>
                  ))}
                  <td></td>
                </tr>
              )}
              {sortedRows.length > 0 && (
                <tr className={styles.totalsRow}>
                  <td className={styles.rowHead}>Day total</td>
                  {dayTotals.map((h, i) => (
                    <td key={weekDates[i]}>
                      {h > 0 ? formatHoursHM(h) : <span className={styles.emptyCell}>—</span>}
                    </td>
                  ))}
                  <td>{formatHoursHM(weekTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            {dayEntries.map(e => (
              <EntryRow key={e.id} entry={e} projectById={projectById} editHref={weekHref(weekStart, `&edit=${e.id}`)} />
            ))}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link href={weekHref(weekStart, '&newProject=1')}>
              <Button variant="secondary" size="sm">New project</Button>
            </Link>
          </div>
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

      {/* ============= LOG TIME MODAL ============= */}
      {showAddModal && (
        <Modal title="Log time" closeHref={closeHref}>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-text-muted">
              No active projects yet{canManageProjects ? ' — create one from the Projects panel.' : '. Ask an administrator to add projects.'}
            </p>
          ) : (
            <form action={addTimesheetEntryAction} className={styles.modalForm}>
              <EntryFields
                activeProjects={activeProjects}
                weekStart={weekStart}
                defaults={{ projectTask: addProjectTask, date: prefillDate }}
              />
              <div className={styles.modalFooter}>
                <Link href={closeHref}><Button type="button" variant="ghost">Cancel</Button></Link>
                <Button type="submit">Add entry</Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ============= EDIT ENTRY MODAL ============= */}
      {editEntry && (
        <Modal title="Edit entry" closeHref={closeHref}>
          <form action={updateTimesheetEntryAction.bind(null, editEntry.id)} className={styles.modalForm}>
            <EntryFields
              activeProjects={activeProjects}
              weekStart={weekStart}
              defaults={{
                projectTask: `${editEntry.projectId}|${editEntry.taskId ?? ''}`,
                date: editEntry.date,
                hours: formatHoursHM(editEntry.hours),
                note: editEntry.note,
              }}
            />
            <div className={styles.modalFooter}>
              <Link href={closeHref}><Button type="button" variant="ghost">Cancel</Button></Link>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============= NEW PROJECT MODAL ============= */}
      {showNewProjectModal && (
        <Modal title="New project" closeHref={closeHref}>
          <form action={createProjectAction} className={styles.modalForm}>
            <input type="hidden" name="week" value={weekStart} />
            <Input name="name" label="Project name" placeholder="e.g. Website Redesign" required />
            <div className={styles.fieldRow}>
              <Input name="code" label="Code (optional)" placeholder="e.g. WEB" />
              <Input name="tasks" label="Tasks (comma-separated)" placeholder="Design, Development, QA" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prj-desc">Description (optional)</label>
              <textarea
                id="prj-desc"
                name="description"
                rows={2}
                placeholder="What is this project about?"
                className={styles.textarea}
              />
            </div>
            <div className={styles.modalFooter}>
              <Link href={closeHref}><Button type="button" variant="ghost">Cancel</Button></Link>
              <Button type="submit">Create project</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
