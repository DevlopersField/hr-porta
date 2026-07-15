// app/(portal)/my-worklife/profile/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { upsertProfile } from '@/lib/db/profiles';
import { updateUserProfile } from '@/lib/db/users';
import { saveUploadedImage } from '@/lib/uploads';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const ProfileFormSchema = z.object({
  phone: z.string().max(120).optional().default(''),
  address: z.string().max(300).optional().default(''),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).optional().default(''),
  pronouns: z.string().max(120).optional().default(''),
  bio: z.string().max(1000).optional().default(''),
  emergencyContactName: z.string().max(120).optional().default(''),
  emergencyContactPhone: z.string().max(120).optional().default(''),
  emergencyContactRelation: z.string().max(120).optional().default(''),
});

// ============= UPDATE PROFILE =============
export async function updateMyProfileAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = ProfileFormSchema.parse(Object.fromEntries(formData));
  await upsertProfile(user.id, input);
  await auditLog({
    actorId: user.id,
    action: 'profile.update',
    target: user.id,
    details: { fields: Object.keys(input) },
  });
  await setNoticeFlash('Profile saved');
  revalidatePath('/my-worklife/profile');
}

// ============= UPDATE DISPLAY NAME =============
const NameSchema = z.object({ displayName: z.string().min(1).max(120) });

export async function updateMyNameAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const input = NameSchema.parse(Object.fromEntries(formData));
  await updateUserProfile(user.id, { displayName: input.displayName.trim() });
  await auditLog({ actorId: user.id, action: 'profile.rename', target: user.id });
  await setNoticeFlash('Name updated');
  // Layout re-renders the shell, so the top bar picks up the new name at once.
  revalidatePath('/', 'layout');
}

// ============= UPDATE AVATAR =============
export async function updateMyAvatarAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const file = formData.get('avatar') as File | null;
  if (!file || file.size === 0) return;
  const result = await saveUploadedImage(file, 'avatar');
  await updateUserProfile(user.id, { avatarPath: result.publicUrl });
  await auditLog({
    actorId: user.id,
    action: 'profile.avatar',
    target: user.id,
    details: { filename: result.filename },
  });
  await setNoticeFlash('Photo updated');
  revalidatePath('/my-worklife/profile');
}
