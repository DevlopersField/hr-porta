// app/(portal)/engage/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { createPost, toggleReaction, ALLOWED_EMOJIS } from '@/lib/db/engage';
import { createAttachmentsFromFiles, setAttachmentsRecord, getUploadedFiles } from '@/lib/db/attachments';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const CreatePostSchema = z.object({
  title: z.string().min(1).max(140),
  body: z.string().min(1).max(5000),
});

const ReactionSchema = z.object({
  postId: z.string(),
  emoji: z.enum(ALLOWED_EMOJIS),
});

// ============= CREATE POST =============
export async function createPostAction(formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.PUBLISH_ENGAGE);
  const input = CreatePostSchema.parse(Object.fromEntries(formData));
  const ids = await createAttachmentsFromFiles(getUploadedFiles(formData), user.id, 'engage', null);
  const created = await createPost({ authorId: user.id, title: input.title, body: input.body, attachmentIds: ids });
  await setAttachmentsRecord(ids, created.id);
  await auditLog({ actorId: user.id, action: 'engage.post', target: created.id, details: { title: input.title, attachmentIds: ids } });
  await setNoticeFlash('Posted');
  revalidatePath('/engage');
}

// ============= TOGGLE REACTION =============
export async function toggleReactionAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = ReactionSchema.parse(Object.fromEntries(formData));
  await toggleReaction(input.postId, user.id, input.emoji);
  // Reactions are high-volume; intentionally not audit-logged.
  revalidatePath('/engage');
}
