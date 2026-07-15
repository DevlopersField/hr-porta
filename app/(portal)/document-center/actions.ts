// app/(portal)/document-center/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { createAttachmentsFromFiles, getUploadedFiles } from '@/lib/db/attachments';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= UPLOAD FILES =============
export async function uploadDocumentFilesAction(formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.EDIT_DOCUMENTS);
  const ids = await createAttachmentsFromFiles(getUploadedFiles(formData), user.id, 'document-center', null);
  await auditLog({
    actorId: user.id,
    action: 'document.upload',
    target: 'document-center',
    details: { count: ids.length, attachmentIds: ids },
  });
  await setNoticeFlash('Files uploaded');
  revalidatePath('/document-center');
}
