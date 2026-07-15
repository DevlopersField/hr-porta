// app/(portal)/leave/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import {
  createLeaveRequest,
  withdrawLeaveRequest,
  decideLeaveRequest,
  countLeaveDays,
  LEAVE_TYPES,
} from '@/lib/db/leaves';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const RequestSchema = z.object({
  type: z.enum(LEAVE_TYPES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(500),
});

// ============= SUBMIT =============
export async function submitLeaveAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = RequestSchema.parse(Object.fromEntries(formData));
  const days = countLeaveDays(input.startDate, input.endDate);
  const created = await createLeaveRequest({
    userId: user.id,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    reason: input.reason,
  });
  await auditLog({ actorId: user.id, action: 'leave.submit', target: created.id, details: { ...input, days } });
  await setNoticeFlash('Leave request submitted');
  revalidatePath('/leave/balance');
  redirect('/leave/balance');
}

// ============= WITHDRAW =============
export async function withdrawLeaveAction(requestId: string): Promise<void> {
  const user = await requireSession();
  await withdrawLeaveRequest(user.id, requestId);
  await auditLog({ actorId: user.id, action: 'leave.withdraw', target: requestId });
  await setNoticeFlash('Request withdrawn');
  revalidatePath('/leave/balance');
}

// ============= APPROVE =============
const DecisionSchema = z.object({
  userId: z.string(),
  requestId: z.string(),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

export async function decideLeaveAction(formData: FormData): Promise<void> {
  const approver = await requireSession(PERMISSIONS.APPROVE_LEAVE);
  const input = DecisionSchema.parse(Object.fromEntries(formData));
  if (input.userId === approver.id) {
    throw new Error('Cannot decide your own leave request');
  }
  await decideLeaveRequest(input.userId, input.requestId, input.decision, approver.id, input.note);
  await auditLog({ actorId: approver.id, action: `leave.${input.decision}`, target: input.requestId, details: { userId: input.userId, note: input.note } });
  await setNoticeFlash('Decision saved');
  revalidatePath('/leave/approvals');
}
