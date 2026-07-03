// app/(portal)/workflow-delegates/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { addDelegation, removeDelegation, listMyDelegations } from '@/lib/db/delegates';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const AddSchema = z.object({
  toUserId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ============= ADD =============
export async function addDelegationAction(formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_DELEGATES);
  const input = AddSchema.parse(Object.fromEntries(formData));
  if (input.toUserId === user.id) {
    throw new Error('Cannot delegate to yourself');
  }
  if (input.endDate < input.startDate) {
    throw new Error('endDate must be >= startDate');
  }
  const created = await addDelegation({
    fromUserId: user.id,
    toUserId: input.toUserId,
    startDate: input.startDate,
    endDate: input.endDate,
  });
  await auditLog({
    actorId: user.id,
    action: 'delegate.add',
    target: created.id,
    details: { toUserId: input.toUserId, startDate: input.startDate, endDate: input.endDate },
  });
  revalidatePath('/workflow-delegates');
}

// ============= REMOVE =============
export async function removeDelegationAction(delegationId: string): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_DELEGATES);
  // Only allow removing delegations the caller owns.
  const mine = await listMyDelegations(user.id);
  if (!mine.some(d => d.id === delegationId)) {
    throw new Error('Delegation not found');
  }
  await removeDelegation(delegationId);
  await auditLog({ actorId: user.id, action: 'delegate.remove', target: delegationId });
  revalidatePath('/workflow-delegates');
}
