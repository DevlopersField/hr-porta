// app/(portal)/workflow-delegates/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { listMyDelegations } from '@/lib/db/delegates';
import { listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { addDelegationAction, removeDelegationAction } from './actions';

// ============= PAGE =============
export default async function WorkflowDelegatesPage() {
  const me = await requireSession(PERMISSIONS.MANAGE_DELEGATES);
  const today = new Date().toISOString().slice(0, 10);
  const [mine, users] = await Promise.all([listMyDelegations(me.id), listUsers()]);
  const userMap = new Map(users.map(u => [u.id, u]));
  const others = users.filter(u => u.id !== me.id && u.active);
  const sorted = [...mine].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Workflow delegates</h1>

      {/* ============= NEW DELEGATION ============= */}
      <GlassPanel className="max-w-md">
        <form action={addDelegationAction} className="flex flex-col gap-4">
          <label className="text-sm font-medium">Delegate authority to</label>
          <select
            name="toUserId"
            required
            defaultValue=""
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            <option value="" disabled>Select a colleague</option>
            {others.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </select>
          <Input name="startDate" type="date" label="Start date" required />
          <Input name="endDate" type="date" label="End date" required />
          <Button type="submit" className="self-start">Add delegation</Button>
        </form>
      </GlassPanel>

      {/* ============= MY DELEGATIONS ============= */}
      {sorted.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-text-muted">You have no active or upcoming delegations.</p>
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(d => {
            const active = d.startDate <= today && today <= d.endDate;
            const upcoming = d.startDate > today;
            const remove = async () => { 'use server'; await removeDelegationAction(d.id); };
            return (
              <GlassPanel key={d.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{userMap.get(d.toUserId)?.displayName ?? d.toUserId}</span>
                    <span className="text-xs text-text-muted">{d.startDate} → {d.endDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={active ? 'green' : upcoming ? 'amber' : 'red'}>
                      {active ? 'Active' : upcoming ? 'Upcoming' : 'Expired'}
                    </StatusPill>
                    <form action={remove}>
                      <Button type="submit" size="sm" variant="danger">Remove</Button>
                    </form>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
