// app/change-password/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { getUserById } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ChangePasswordForm } from './ChangePasswordForm';

// ============= PAGE =============
export default async function ChangePasswordPage() {
  const me = await requireSession();
  const user = await getUserById(me.id);
  const forced = user?.mustChangePassword ?? false;

  return (
    // eslint-disable-next-line react/forbid-dom-props
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' } as React.CSSProperties}>
      <GlassPanel className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Change your password</h1>
        <p className="text-sm text-text-muted mt-1 mb-5">
          {forced
            ? 'For security, you must set a new password before continuing.'
            : 'Update the password for your account.'}
        </p>
        <ChangePasswordForm />
      </GlassPanel>
    </div>
  );
}
