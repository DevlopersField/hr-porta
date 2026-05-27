// app/(portal)/people/[userId]/page.tsx

// ============= IMPORTS =============
import { notFound } from 'next/navigation';
import { getUserById, listUsers } from '@/lib/db/users';
import { requireSession } from '@/lib/auth';
import { canViewPeople, ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionEditor } from '../components/PermissionEditor';
import {
  updateProfileAction,
  updatePermissionsAction,
  deactivateUserAction,
  resetPasswordAction,
} from '../actions';

// ============= PAGE =============
export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ newPassword?: string; resetPassword?: string }>;
}) {
  const actor = await requireSession();
  if (!canViewPeople(actor)) {
    throw new ForbiddenError('You do not have permission to view people');
  }
  const { userId } = await params;
  const { newPassword, resetPassword } = await searchParams;
  const user = await getUserById(userId);
  if (!user) notFound();
  const allUsers = await listUsers();

  const canEditProfile = hasPermission(actor, PERMISSIONS.EDIT_USER_PROFILES);
  const canManagePerms = hasPermission(actor, PERMISSIONS.MANAGE_PERMISSIONS);
  const canDeactivate = hasPermission(actor, PERMISSIONS.DEACTIVATE_USERS) && actor.id !== user.id;

  // ============= BIND ACTIONS =============
  const profileAction = async (fd: FormData) => { 'use server'; await updateProfileAction(userId, fd); };
  const permAction    = async (fd: FormData) => { 'use server'; await updatePermissionsAction(userId, fd); };
  const deactivate    = async ()             => { 'use server'; await deactivateUserAction(userId); };
  const resetPw       = async ()             => {
    'use server';
    const pw = await resetPasswordAction(userId);
    const { redirect } = await import('next/navigation');
    redirect(`/people/${userId}?resetPassword=${encodeURIComponent(pw)}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">{user.displayName}</h1>
        <p className="text-sm text-text-muted">{user.email} {user.active ? '' : '(inactive)'}</p>
      </div>

      {newPassword && (
        // eslint-disable-next-line react/forbid-dom-props
        <GlassPanel variant="strong" className="border-l-4" style={{ borderLeftColor: '#10B981' } as React.CSSProperties}>
          <p className="text-sm font-semibold">User created — temporary password:</p>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <code style={{ fontSize: '14px', display: 'block', marginTop: '8px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px' } as React.CSSProperties}>{newPassword}</code>
          <p className="text-xs text-text-muted mt-2">Share this out-of-band. User must change on first login.</p>
        </GlassPanel>
      )}
      {resetPassword && (
        <GlassPanel variant="strong">
          <p className="text-sm font-semibold">Password reset — new temporary password:</p>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <code style={{ fontSize: '14px', display: 'block', marginTop: '8px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px' } as React.CSSProperties}>{resetPassword}</code>
        </GlassPanel>
      )}

      {/* ============= PROFILE FORM ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <form action={profileAction} className="flex flex-col gap-3 max-w-md">
          <Input name="displayName" label="Display name" defaultValue={user.displayName} disabled={!canEditProfile} required />
          <Input name="department"  label="Department"   defaultValue={user.department}   disabled={!canEditProfile} />
          <Input name="jobTitle"    label="Job title"    defaultValue={user.jobTitle}     disabled={!canEditProfile} />
          <label className="text-sm font-medium">Manager</label>
          <select
            name="managerId"
            defaultValue={user.managerId ?? ''}
            disabled={!canEditProfile}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            <option value="">— None —</option>
            {allUsers.filter(u => u.id !== user.id).map(u => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
          {canEditProfile && <Button type="submit" className="self-start">Save profile</Button>}
        </form>
      </GlassPanel>

      {/* ============= PERMISSIONS ============= */}
      {canManagePerms && (
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-4">Permissions</h2>
          <PermissionEditor userId={user.id} currentPermissions={user.permissions} action={permAction} />
        </GlassPanel>
      )}

      {/* ============= ADMIN ACTIONS ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold mb-4">Admin actions</h2>
        <div className="flex gap-3">
          {canEditProfile && (
            <form action={resetPw}><Button type="submit" variant="secondary">Reset password</Button></form>
          )}
          {canDeactivate && user.active && (
            <form action={deactivate}><Button type="submit" variant="danger">Deactivate user</Button></form>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
