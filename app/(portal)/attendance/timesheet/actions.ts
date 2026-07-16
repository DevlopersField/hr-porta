// app/(portal)/attendance/timesheet/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import {
  addTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  parseHoursInput,
  sumHoursForProjectAllUsers,
} from '@/lib/db/timesheets';
import {
  createProject,
  setProjectDueDate,
  setProjectDescription,
  addProjectTask,
  updateProjectTask,
  deleteProject,
  PROJECT_STATUSES,
  type ProjectStatus,
} from '@/lib/db/projects';
import { listUsers } from '@/lib/db/users';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
// hours arrives as "5:30" or "7.5" — parsed by parseHoursInput after Zod.
// projectTask is the grouped select value: "<projectId>|<taskId>" ('' task = Other).
const AddEntrySchema = z.object({
  projectTask: z.string().regex(/^[^|]+\|[^|]*$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.string().min(1).max(10),
  note: z.string().max(300).optional(),
  // Week the user was viewing — actions redirect back to it to close the modal.
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  // Comma-separated initial task names.
  tasks: z.string().max(500).optional(),
});

const SetStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
});

const SetDueDateSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

function timesheetHref(week?: string): string {
  return week ? `/attendance/timesheet?week=${week}` : '/attendance/timesheet';
}

const AddTaskSchema = z.object({
  taskName: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

const UpdateTaskSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  status: z.enum(PROJECT_STATUSES),
});

const UpdateDescriptionSchema = z.object({
  description: z.string().max(2000).optional(),
});

function splitProjectTask(value: string): { projectId: string; taskId: string | null } {
  const [projectId, taskId] = value.split('|', 2);
  return { projectId: projectId!, taskId: taskId || null };
}

// ============= LOG TIME =============
export async function addTimesheetEntryAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = AddEntrySchema.parse(Object.fromEntries(formData));
  const hours = parseHoursInput(input.hours);
  const { projectId, taskId } = splitProjectTask(input.projectTask);
  const entry = await addTimesheetEntry({
    userId: user.id,
    projectId,
    taskId,
    date: input.date,
    hours,
    note: input.note,
  });
  await auditLog({
    actorId: user.id,
    action: 'timesheet.add',
    target: entry.id,
    details: { projectId, taskId, date: input.date, hours },
  });
  await setNoticeFlash('Time logged');
  revalidatePath('/attendance/timesheet');
  redirect(timesheetHref(input.week));
}

// ============= EDIT ENTRY =============
export async function updateTimesheetEntryAction(entryId: string, formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = AddEntrySchema.parse(Object.fromEntries(formData));
  const hours = parseHoursInput(input.hours);
  const { projectId, taskId } = splitProjectTask(input.projectTask);
  await updateTimesheetEntry(user.id, entryId, {
    projectId,
    taskId,
    date: input.date,
    hours,
    note: input.note ?? '',
  });
  await auditLog({
    actorId: user.id,
    action: 'timesheet.update',
    target: entryId,
    details: { projectId, taskId, date: input.date, hours },
  });
  await setNoticeFlash('Entry updated');
  revalidatePath('/attendance/timesheet');
  redirect(timesheetHref(input.week));
}

// ============= DELETE OWN ENTRY =============
export async function deleteTimesheetEntryAction(entryId: string): Promise<void> {
  const user = await requireSession();
  await deleteTimesheetEntry(user.id, entryId);
  await auditLog({ actorId: user.id, action: 'timesheet.delete', target: entryId });
  await setNoticeFlash('Entry deleted');
  revalidatePath('/attendance/timesheet');
}

// ============= MANAGE PROJECTS =============
export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = CreateProjectSchema.parse(Object.fromEntries(formData));
  const project = await createProject({
    name: input.name,
    code: input.code,
    description: input.description,
    tasks: input.tasks ? input.tasks.split(',') : [],
  });
  await auditLog({
    actorId: user.id,
    action: 'project.create',
    target: project.id,
    details: { name: project.name, tasks: project.tasks.map(t => t.name) },
  });
  await setNoticeFlash('Project created');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath('/attendance/timesheet');
  redirect('/attendance/timesheet/projects');
}

export async function addProjectTaskAction(projectId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = AddTaskSchema.parse(Object.fromEntries(formData));
  const task = await addProjectTask(projectId, input.taskName, {
    description: input.description,
    dueDate: input.dueDate ? input.dueDate : null,
  });
  await auditLog({ actorId: user.id, action: 'project.add_task', target: projectId, details: { taskId: task.id, name: task.name } });
  await setNoticeFlash('Task added');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath(`/attendance/timesheet/projects/${projectId}`);
  revalidatePath('/attendance/timesheet');
}

// ============= KANBAN DRAG-AND-DROP (task-level) =============
// Called directly from the client board's drop handler (plain args, no
// FormData/<form> submission) — so no redirect() here; a redirect() throw
// would surface as an uncaught error client-side. Just revalidate.
export async function moveProjectTaskStatusAction(
  projectId: string,
  taskId: string,
  status: ProjectStatus,
): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const parsed = SetStatusSchema.parse({ status });
  await updateProjectTask(projectId, taskId, { status: parsed.status });
  await auditLog({
    actorId: user.id,
    action: 'project.task.set_status',
    target: taskId,
    details: { projectId, status: parsed.status },
  });
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath(`/attendance/timesheet/projects/${projectId}`);
  revalidatePath('/attendance/timesheet');
}

// ============= PROJECT DETAIL MODAL =============
export async function updateProjectDescriptionAction(projectId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = UpdateDescriptionSchema.parse(Object.fromEntries(formData));
  await setProjectDescription(projectId, input.description ?? '');
  await auditLog({ actorId: user.id, action: 'project.set_description', target: projectId });
  await setNoticeFlash('Description updated');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath('/attendance/timesheet');
}

export async function updateProjectTaskAction(projectId: string, taskId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = UpdateTaskSchema.parse(Object.fromEntries(formData));
  await updateProjectTask(projectId, taskId, {
    name: input.name,
    description: input.description ?? '',
    dueDate: input.dueDate ? input.dueDate : null,
    status: input.status,
  });
  await auditLog({ actorId: user.id, action: 'project.update_task', target: projectId, details: { taskId } });
  await setNoticeFlash('Task updated');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath(`/attendance/timesheet/projects/${projectId}`);
  revalidatePath('/attendance/timesheet');
}

export async function deleteProjectAction(projectId: string, _formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const users = await listUsers();
  const totalHours = await sumHoursForProjectAllUsers(projectId, users.map(u => u.id));
  if (totalHours > 0) {
    throw new Error('Cannot delete a project with logged time — no time may be logged against a project you delete.');
  }
  await deleteProject(projectId);
  await auditLog({ actorId: user.id, action: 'project.delete', target: projectId });
  await setNoticeFlash('Project deleted');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath('/attendance/timesheet');
  redirect('/attendance/timesheet/projects');
}

export async function setProjectDueDateAction(projectId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = SetDueDateSchema.parse(Object.fromEntries(formData));
  const dueDate = input.dueDate ? input.dueDate : null;
  await setProjectDueDate(projectId, dueDate);
  await auditLog({ actorId: user.id, action: 'project.set_due_date', target: projectId, details: { dueDate } });
  await setNoticeFlash('Due date updated');
  revalidatePath('/attendance/timesheet/projects');
  revalidatePath('/attendance/timesheet');
}
