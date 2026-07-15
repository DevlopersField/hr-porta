// app/(portal)/attendance/timesheet/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { addTimesheetEntry, deleteTimesheetEntry } from '@/lib/db/timesheets';
import { createProject, setProjectActive } from '@/lib/db/projects';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const AddEntrySchema = z.object({
  projectId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.coerce.number().positive().max(24),
  note: z.string().max(300).optional(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(20).optional(),
});

// ============= LOG TIME =============
export async function addTimesheetEntryAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = AddEntrySchema.parse(Object.fromEntries(formData));
  const entry = await addTimesheetEntry({
    userId: user.id,
    projectId: input.projectId,
    date: input.date,
    hours: input.hours,
    note: input.note,
  });
  await auditLog({
    actorId: user.id,
    action: 'timesheet.add',
    target: entry.id,
    details: { projectId: input.projectId, date: input.date, hours: input.hours },
  });
  revalidatePath('/attendance/timesheet');
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
  const project = await createProject({ name: input.name, code: input.code });
  await auditLog({ actorId: user.id, action: 'project.create', target: project.id, details: { name: project.name } });
  revalidatePath('/attendance/timesheet');
}

export async function setProjectActiveAction(projectId: string, active: boolean): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_PROJECTS);
  await setProjectActive(projectId, active);
  await auditLog({ actorId: user.id, action: active ? 'project.restore' : 'project.archive', target: projectId });
  revalidatePath('/attendance/timesheet');
}
