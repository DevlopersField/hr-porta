// app/(portal)/attendance/timesheet/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { addTimesheetEntry, updateTimesheetEntry, deleteTimesheetEntry, parseHoursInput } from '@/lib/db/timesheets';
import { createProject, setProjectActive, addProjectTask } from '@/lib/db/projects';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
// hours arrives as "5:30" or "7.5" — parsed by parseHoursInput after Zod.
// projectTask is the grouped select value: "<projectId>|<taskId>" ('' task = Other).
const AddEntrySchema = z.object({
  projectTask: z.string().regex(/^[^|]+\|[^|]*$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.string().min(1).max(10),
  note: z.string().max(300).optional(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  // Comma-separated initial task names.
  tasks: z.string().max(500).optional(),
});

const AddTaskSchema = z.object({
  taskName: z.string().min(1).max(120),
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
  revalidatePath('/attendance/timesheet');
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
  revalidatePath('/attendance/timesheet');
  redirect('/attendance/timesheet');
}

// ============= DELETE OWN ENTRY =============
export async function deleteTimesheetEntryAction(entryId: string): Promise<void> {
  const user = await requireSession();
  await deleteTimesheetEntry(user.id, entryId);
  await auditLog({ actorId: user.id, action: 'timesheet.delete', target: entryId });
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
  revalidatePath('/attendance/timesheet');
}

export async function addProjectTaskAction(projectId: string, formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  const input = AddTaskSchema.parse(Object.fromEntries(formData));
  const task = await addProjectTask(projectId, input.taskName);
  await auditLog({ actorId: user.id, action: 'project.add_task', target: projectId, details: { taskId: task.id, name: task.name } });
  revalidatePath('/attendance/timesheet');
}

export async function setProjectActiveAction(projectId: string, active: boolean): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  await setProjectActive(projectId, active);
  await auditLog({ actorId: user.id, action: active ? 'project.restore' : 'project.archive', target: projectId });
  revalidatePath('/attendance/timesheet');
}
