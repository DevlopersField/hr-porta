// app/(portal)/people/components/PermissionEditor.tsx

// ============= IMPORTS =============
import { PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';

// ============= TYPES =============
type Props = {
  userId: string;
  currentPermissions: string[];
  action: (formData: FormData) => Promise<void>;
};

// ============= GROUPS =============
const GROUPS: Array<{ label: string; perms: readonly string[] }> = [
  { label: 'People', perms: [PERMISSIONS.VIEW_ALL_PEOPLE, PERMISSIONS.EDIT_USER_PROFILES, PERMISSIONS.MANAGE_PERMISSIONS, PERMISSIONS.CREATE_USERS, PERMISSIONS.DEACTIVATE_USERS] },
  { label: 'Leave', perms: [PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.VIEW_TEAM_LEAVE, PERMISSIONS.VIEW_ALL_LEAVE] },
  { label: 'Attendance', perms: [PERMISSIONS.VIEW_TEAM_ATTENDANCE, PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.EDIT_ATTENDANCE_RECORDS] },
  { label: 'Salary', perms: [PERMISSIONS.VIEW_ALL_SALARY, PERMISSIONS.EDIT_SALARY, PERMISSIONS.GENERATE_PAYSLIPS] },
  { label: 'Requests', perms: [PERMISSIONS.APPROVE_REQUESTS, PERMISSIONS.VIEW_ALL_REQUESTS] },
  { label: 'Content', perms: [PERMISSIONS.EDIT_DOCUMENTS, PERMISSIONS.EDIT_HELPDESK, PERMISSIONS.PUBLISH_ENGAGE] },
  { label: 'Workflow', perms: [PERMISSIONS.MANAGE_DELEGATES] },
  { label: 'Settings', perms: [PERMISSIONS.MANAGE_SETTINGS] },
];

// ============= COMPONENT =============
export function PermissionEditor({ currentPermissions, action }: Props) {
  if (currentPermissions.includes('*')) {
    return (
      // eslint-disable-next-line react/forbid-dom-props
      <div className="p-4" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' } as React.CSSProperties}>
        <p className="text-sm font-medium">Super admin (all permissions)</p>
        <p className="text-xs text-text-muted mt-1">The wildcard `*` permission cannot be edited here.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {GROUPS.map(g => (
        // eslint-disable-next-line react/forbid-dom-props
        <fieldset key={g.label} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' } as React.CSSProperties}>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <legend className="text-sm font-semibold" style={{ padding: '0 8px' } as React.CSSProperties}>{g.label}</legend>
          <div className="flex flex-col gap-2 mt-2">
            {g.perms.map(p => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p}
                  defaultChecked={currentPermissions.includes(p)}
                />
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <code style={{ fontSize: '12px' } as React.CSSProperties}>{p}</code>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button type="submit" className="self-start">Save permissions</Button>
    </form>
  );
}
