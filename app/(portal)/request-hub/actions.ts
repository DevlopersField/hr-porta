// app/(portal)/request-hub/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createRequest, withdrawRequest, REQUEST_TYPES } from '@/lib/db/requests';
import { createAttachmentsFromFiles, setAttachmentsRecord, getUploadedFiles } from '@/lib/db/attachments';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const SubmitSchema = z.object({
  type: z.enum(REQUEST_TYPES),
  title: z.string().min(1).max(120),
  details: z.string().min(1).max(1000),
  amount: z.string().optional(),
});

// ============= SUBMIT =============
export async function submitRequestAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = SubmitSchema.parse(Object.fromEntries(formData));
  const amount =
    input.type === 'expense' && input.amount && input.amount.trim() !== ''
      ? Number(input.amount)
      : null;
  // Upload first: file validation failures abort before any record exists.
  const ids = await createAttachmentsFromFiles(getUploadedFiles(formData), user.id, 'request', null);
  const created = await createRequest({
    userId: user.id,
    type: input.type,
    title: input.title,
    details: input.details,
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    attachmentIds: ids,
  });
  await setAttachmentsRecord(ids, created.id);
  await auditLog({
    actorId: user.id,
    action: 'request.submit',
    target: created.id,
    details: { type: input.type, title: input.title, attachmentIds: ids },
  });
  revalidatePath('/request-hub');
}

// ============= WITHDRAW =============
export async function withdrawRequestAction(requestId: string): Promise<void> {
  const user = await requireSession();
  await withdrawRequest(user.id, requestId);
  await auditLog({ actorId: user.id, action: 'request.withdraw', target: requestId });
  revalidatePath('/request-hub');
}
