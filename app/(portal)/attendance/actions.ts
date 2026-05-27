// app/(portal)/attendance/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { clockIn, clockOut } from '@/lib/db/attendance';
import { auditLog } from '@/lib/db/audit';

// ============= ACTIONS =============
export async function clockInAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const note = String(formData.get('note') ?? '');
  const day = await clockIn(user.id, new Date(), note);
  await auditLog({ actorId: user.id, action: 'attendance.clock_in', target: day.date });
  revalidatePath('/attendance/clock');
  revalidatePath('/attendance/timesheet');
}

export async function clockOutAction(): Promise<void> {
  const user = await requireSession();
  const day = await clockOut(user.id, new Date());
  await auditLog({ actorId: user.id, action: 'attendance.clock_out', target: day.date, details: { totalMinutes: day.totalMinutes } });
  revalidatePath('/attendance/clock');
  revalidatePath('/attendance/timesheet');
}
