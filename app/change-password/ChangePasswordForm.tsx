// app/change-password/ChangePasswordForm.tsx
'use client';

// ============= IMPORTS =============
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { changeOwnPasswordAction, type ChangePwState } from './actions';

// ============= COMPONENT =============
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePwState, FormData>(
    changeOwnPasswordAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input name="currentPassword" type="password" label="Current password" required autoComplete="current-password" />
      <Input name="newPassword" type="password" label="New password" required minLength={8} autoComplete="new-password" />
      <Input name="confirmPassword" type="password" label="Confirm new password" required minLength={8} autoComplete="new-password" />
      {state.error && (
        // eslint-disable-next-line react/forbid-dom-props
        <p className="text-sm" style={{ color: 'var(--status-red-text)' } as React.CSSProperties}>{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Update password'}</Button>
    </form>
  );
}
