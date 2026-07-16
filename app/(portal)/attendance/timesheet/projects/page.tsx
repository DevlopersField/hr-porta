// app/(portal)/attendance/timesheet/projects/page.tsx
// Plain project wrapper list: name/code, description, due date, hours
// logged, task count, delete (guarded), and a link to the project's own
// task board. The Trello-style board itself lives at
// /attendance/timesheet/projects/[projectId] — projects are just containers
// now, they carry no lifecycle status of their own. Guarded by MANAGE_PROJECTS.

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { listUsers } from '@/lib/db/users';
import { listProjects } from '@/lib/db/projects';
import { sumHoursForProjectAllUsers, formatHoursHM } from '@/lib/db/timesheets';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  createProjectAction,
  setProjectDueDateAction,
  updateProjectDescriptionAction,
  deleteProjectAction,
} from '../actions';
import styles from '../timesheet.module.css';
import listStyles from './projects.module.css';

// ============= PAGE =============
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ newProject?: string }>;
}) {
  await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const { newProject } = await searchParams;
  const closeHref = '/attendance/timesheet/projects';
  const showNewProjectModal = newProject === '1';

  const [allProjects, users] = await Promise.all([listProjects(), listUsers()]);
  const userIds = users.map(u => u.id);
  const projects = await Promise.all(
    allProjects.map(async p => ({ ...p, hoursLogged: await sumHoursForProjectAllUsers(p.id, userIds) })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <span className="flex items-center gap-2">
          <Link href="/attendance/timesheet"><Button variant="ghost">Back to timesheet</Button></Link>
          <Link href={`${closeHref}?newProject=1`}><Button>New project</Button></Link>
        </span>
      </div>

      {projects.length === 0 ? (
        <GlassPanel><p className="text-sm text-text-muted">No projects yet.</p></GlassPanel>
      ) : (
        <div className={listStyles.grid}>
          {projects.map(p => (
            <GlassPanel key={p.id} className={listStyles.card}>
              <div className="flex items-start justify-between gap-2">
                <h2 className={listStyles.cardTitle}>{p.code ? `${p.code} — ${p.name}` : p.name}</h2>
              </div>

              {p.description && <p className={listStyles.cardDescription}>{p.description}</p>}

              <div className={listStyles.cardMeta}>
                <span>{formatHoursHM(p.hoursLogged)} logged</span>
                <span>{p.tasks.length} task{p.tasks.length === 1 ? '' : 's'}</span>
                {p.dueDate && <span>Due {p.dueDate}</span>}
              </div>

              {/* ============= INLINE EDIT: DESCRIPTION + DUE DATE ============= */}
              <details className={listStyles.details}>
                <summary className={listStyles.detailsSummary}>Edit details</summary>
                <div className={listStyles.detailsBody}>
                  <form action={updateProjectDescriptionAction.bind(null, p.id)} className={listStyles.inlineForm}>
                    <label className={styles.fieldLabel} htmlFor={`desc-${p.id}`}>Description</label>
                    <textarea
                      id={`desc-${p.id}`}
                      name="description"
                      rows={2}
                      defaultValue={p.description}
                      className={styles.textarea}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="ghost" size="sm">Save description</Button>
                    </div>
                  </form>

                  <form action={setProjectDueDateAction.bind(null, p.id)} className={listStyles.inlineForm}>
                    <Input id={`duedate-${p.id}`} name="dueDate" type="date" label="Due date" defaultValue={p.dueDate ?? ''} />
                    <div className="flex justify-end">
                      <Button type="submit" variant="ghost" size="sm">Save due date</Button>
                    </div>
                  </form>
                </div>
              </details>

              <div className={listStyles.cardActions}>
                <Link href={`${closeHref}/${p.id}`}>
                  <Button variant="secondary" size="sm">Open board</Button>
                </Link>
                <form action={deleteProjectAction.bind(null, p.id)}>
                  <Button type="submit" variant="danger" size="sm">Delete</Button>
                </form>
              </div>
              {p.hoursLogged > 0 && (
                <p className={listStyles.cardHint}>Delete is blocked while any time is logged against this project.</p>
              )}
            </GlassPanel>
          ))}
        </div>
      )}

      {/* ============= NEW PROJECT MODAL ============= */}
      {showNewProjectModal && (
        <Modal title="New project" closeHref={closeHref}>
          <form action={createProjectAction} className={styles.modalForm}>
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
