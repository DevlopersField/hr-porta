// app/(portal)/people/new/page.tsx

// ============= IMPORTS =============
import { listUsers } from '@/lib/db/users';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createUserAction } from '../actions';

// ============= PAGE =============
export default async function NewUserPage() {
  await requireSession(PERMISSIONS.CREATE_USERS);
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Add Employee</h1>
      <GlassPanel className="max-w-md">
        <form action={createUserAction} className="flex flex-col gap-4">
          <Input name="email"       type="email" label="Email"       required />
          <Input name="displayName" label="Display name" required />
          <Input name="department"  label="Department" />
          <Input name="jobTitle"    label="Job title" />
          <label className="text-sm font-medium">Manager (optional)</label>
          <select
            name="managerId"
            defaultValue=""
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            <option value="">— None —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </select>
          <Button type="submit">Create user</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
