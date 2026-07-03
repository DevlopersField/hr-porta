// app/(portal)/people/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, mergeSubmittedPermissions } from '@/lib/permissions';
import {
  createUser,
  deactivateUser,
  setPasswordHash,
  setPasswordResetToken,
  updateUserProfile,
  updateUserPermissions,
  getUserById,
} from '@/lib/db/users';
import { rebuildPeopleSearchIndex } from '@/lib/db/indexes';
import { auditLog } from '@/lib/db/audit';
import { setPasswordFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  department: z.string().max(80).optional(),
  jobTitle: z.string().max(80).optional(),
  managerId: z.string().optional(),
});

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  department: z.string().max(80).default(''),
  jobTitle: z.string().max(80).default(''),
  managerId: z.string().optional(),
});

// ============= CREATE USER =============
export async function createUserAction(formData: FormData): Promise<void> {
  const actor = await requireSession(PERMISSIONS.CREATE_USERS);
  const input = CreateUserSchema.parse(Object.fromEntries(formData));
  const tempPassword = crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const created = await createUser({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
    department: input.department,
    jobTitle: input.jobTitle,
    managerId: input.managerId || null,
    mustChangePassword: true,
  });
  await rebuildPeopleSearchIndex();
  await auditLog({ actorId: actor.id, action: 'user.create', target: created.id, details: { email: input.email } });
  // Show the temp password once via a short-lived HttpOnly cookie — never in the URL.
  await setPasswordFlash({ kind: 'create', value: tempPassword });
  revalidatePath('/people');
  redirect(`/people/${created.id}`);
}

// ============= UPDATE PROFILE =============
export async function updateProfileAction(userId: string, formData: FormData): Promise<void> {
  const actor = await requireSession(PERMISSIONS.EDIT_USER_PROFILES);
  const input = UpdateProfileSchema.parse(Object.fromEntries(formData));
  await updateUserProfile(userId, {
    displayName: input.displayName,
    department: input.department,
    jobTitle: input.jobTitle,
    managerId: input.managerId || null,
  });
  await rebuildPeopleSearchIndex();
  await auditLog({ actorId: actor.id, action: 'user.update_profile', target: userId, details: input });
  revalidatePath(`/people/${userId}`);
}

// ============= UPDATE PERMISSIONS =============
export async function updatePermissionsAction(userId: string, formData: FormData): Promise<void> {
  const actor = await requireSession(PERMISSIONS.MANAGE_PERMISSIONS);
  const submitted = formData.getAll('permissions').map(String);
  const target = await getUserById(userId);
  if (!target) throw new Error('User not found');
  const validated = mergeSubmittedPermissions(target.permissions, submitted);
  await updateUserPermissions(userId, validated);
  await auditLog({ actorId: actor.id, action: 'user.update_permissions', target: userId, details: { permissions: validated } });
  revalidatePath(`/people/${userId}`);
}

// ============= DEACTIVATE =============
export async function deactivateUserAction(userId: string): Promise<void> {
  const actor = await requireSession(PERMISSIONS.DEACTIVATE_USERS);
  if (userId === actor.id) throw new Error('Cannot deactivate yourself');
  await deactivateUser(userId);
  await rebuildPeopleSearchIndex();
  await auditLog({ actorId: actor.id, action: 'user.deactivate', target: userId });
  revalidatePath('/people');
  revalidatePath(`/people/${userId}`);
}

// ============= RESET PASSWORD =============
export async function resetPasswordAction(userId: string): Promise<void> {
  const actor = await requireSession(PERMISSIONS.EDIT_USER_PROFILES);
  const tempPassword = crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await setPasswordHash(userId, passwordHash, true);
  await setPasswordResetToken(userId, null);
  await auditLog({ actorId: actor.id, action: 'user.reset_password', target: userId });
  // Show the new temp password once via cookie flash, not the URL.
  await setPasswordFlash({ kind: 'reset', value: tempPassword });
  revalidatePath(`/people/${userId}`);
}

// Helper for the [userId]/page form
export async function getUserPageData(userId: string) {
  await requireSession();
  return getUserById(userId);
}
