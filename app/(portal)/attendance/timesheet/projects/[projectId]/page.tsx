// app/(portal)/attendance/timesheet/projects/[projectId]/page.tsx
// Per-project task board: the actual Trello-style kanban lives here, scoped
// to one project's tasks (projects themselves carry no lifecycle status —
// see lib/db/projects.ts). Guarded by MANAGE_PROJECTS; 404s if the project
// doesn't exist.

// ============= IMPORTS =============
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getProject, PROJECT_STATUSES } from '@/lib/db/projects';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProjectBoard, STATUS_LABEL } from '@/components/ui/ProjectBoard';
import {
  addProjectTaskAction,
  updateProjectTaskAction,
  moveProjectTaskStatusAction,
} from '../../actions';
import styles from '../../timesheet.module.css';

// ============= PAGE =============
export default async function ProjectBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string; newTask?: string }>;
}) {
  await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const { projectId } = await params;
  const { task: taskId, newTask } = await searchParams;

  const project = await getProject(projectId);
  if (!project) notFound();

  const closeHref = `/attendance/timesheet/projects/${projectId}`;
  const showNewTaskModal = newTask === '1';
  const activeTask = taskId ? project.tasks.find(t => t.id === taskId) : undefined;

  const moveAction = moveProjectTaskStatusAction.bind(null, projectId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <Link href="/attendance/timesheet/projects" className="text-xs text-text-muted hover:underline">
            &larr; Back to projects
          </Link>
          <h1 className="text-3xl font-semibold">
            {project.code ? `${project.code} — ${project.name}` : project.name}
          </h1>
          {project.description && <p className="text-sm text-text-muted max-w-2xl">{project.description}</p>}
          {project.dueDate && <p className="text-xs text-text-muted">Due {project.dueDate}</p>}
        </div>
        <Link href={`${closeHref}?newTask=1`}><Button>Add task</Button></Link>
      </div>

      {project.tasks.length === 0 ? (
        <GlassPanel><p className="text-sm text-text-muted">No tasks yet — add one to start the board.</p></GlassPanel>
      ) : (
        <ProjectBoard tasks={project.tasks} moveAction={moveAction} basePath={closeHref} />
      )}

      {/* ============= ADD TASK MODAL ============= */}
      {showNewTaskModal && (
        <Modal title="Add task" closeHref={closeHref}>
          <form action={addProjectTaskAction.bind(null, projectId)} className={styles.modalForm}>
            <Input name="taskName" label="Task name" placeholder="e.g. QA pass" required />
            <Input name="dueDate" type="date" label="Due date (optional)" />
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="new-task-desc">Description (optional)</label>
              <textarea id="new-task-desc" name="description" rows={3} className={styles.textarea} />
            </div>
            <div className={styles.modalFooter}>
              <Link href={closeHref}><Button type="button" variant="ghost">Cancel</Button></Link>
              <Button type="submit">Add task</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============= EDIT TASK MODAL ============= */}
      {activeTask && (
        <Modal title={activeTask.name} closeHref={closeHref}>
          <form action={updateProjectTaskAction.bind(null, projectId, activeTask.id)} className={styles.modalForm}>
            <Input id="task-name" name="name" label="Name" defaultValue={activeTask.name} required />
            <Input id="task-duedate" name="dueDate" type="date" label="Due date" defaultValue={activeTask.dueDate ?? ''} />
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                name="description"
                rows={3}
                defaultValue={activeTask.description}
                className={styles.textarea}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="task-status">Status</label>
              <select id="task-status" name="status" defaultValue={activeTask.status} className={styles.select}>
                {PROJECT_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalFooter}>
              <Link href={closeHref}><Button type="button" variant="ghost">Close</Button></Link>
              <Button type="submit">Save task</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
