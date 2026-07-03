// app/change-password/actions.ts

// ============= IMPORTS =============
'use server';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { getUserById, setPasswordHash } from '@/lib/db/users';
import { auditLog } from '@/lib/db/audit';

// ============= TYPES =============
export type ChangePwState = { error?: string };

// ============= SCHEMA =============
const Schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
  confirmPassword: z.string().min(8).max(200),
});

// ============= CHANGE OWN PASSWORD =============
export async function changeOwnPasswordAction(
  _prev: ChangePwState,
  formData: FormData,
): Promise<ChangePwState> {
  const me = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'New password must be at least 8 characters, and all fields are required.' };
  }
  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) return { error: 'New passwords do not match.' };
  if (newPassword === currentPassword) return { error: 'New password must be different from the current one.' };

  const user = await getUserById(me.id);
  if (!user) return { error: 'Account not found.' };
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return { error: 'Current password is incorrect.' };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await setPasswordHash(user.id, passwordHash, false); // clears mustChangePassword
  await auditLog({ actorId: user.id, action: 'user.change_own_password', target: user.id });
  redirect('/home');
}
