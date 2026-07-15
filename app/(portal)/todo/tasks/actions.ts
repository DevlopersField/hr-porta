// app/(portal)/todo/tasks/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createTask, toggleTask, deleteTask } from '@/lib/db/tasks';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const AddSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

// ============= ADD =============
export async function addTaskAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = AddSchema.parse(Object.fromEntries(formData));
  const created = await createTask({
    userId: user.id,
    title: input.title,
    dueDate: input.dueDate && input.dueDate !== '' ? input.dueDate : null,
  });
  await auditLog({ actorId: user.id, action: 'task.add', target: created.id });
  await setNoticeFlash('Task added');
  revalidatePath('/todo/tasks');
}

// ============= TOGGLE =============
export async function toggleTaskAction(taskId: string): Promise<void> {
  const user = await requireSession();
  await toggleTask(user.id, taskId);
  await auditLog({ actorId: user.id, action: 'task.toggle', target: taskId });
  await setNoticeFlash('Task updated');
  revalidatePath('/todo/tasks');
}

// ============= DELETE =============
export async function deleteTaskAction(taskId: string): Promise<void> {
  const user = await requireSession();
  await deleteTask(user.id, taskId);
  await auditLog({ actorId: user.id, action: 'task.delete', target: taskId });
  await setNoticeFlash('Task deleted');
  revalidatePath('/todo/tasks');
}
