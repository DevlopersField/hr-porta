// app/(portal)/todo/approvals/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { decideRequest } from '@/lib/db/requests';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const DecisionSchema = z.object({
  userId: z.string(),
  requestId: z.string(),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

// ============= DECIDE REQUEST =============
export async function decideRequestAction(formData: FormData): Promise<void> {
  const approver = await requireSession(PERMISSIONS.APPROVE_REQUESTS);
  const input = DecisionSchema.parse(Object.fromEntries(formData));
  if (input.userId === approver.id) {
    throw new Error('Cannot decide your own request');
  }
  await decideRequest(input.userId, input.requestId, input.decision, approver.id, input.note);
  await auditLog({
    actorId: approver.id,
    action: `request.${input.decision}`,
    target: input.requestId,
    details: { userId: input.userId, note: input.note },
  });
  revalidatePath('/todo/approvals');
}
