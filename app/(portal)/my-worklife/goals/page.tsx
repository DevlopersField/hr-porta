// app/(portal)/my-worklife/goals/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { listGoals, type Goal, type GoalStatus } from '@/lib/db/performance';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { createGoalAction, updateGoalProgressAction, setGoalStatusAction, deleteGoalAction } from '../actions';

// ============= HELPERS =============
const STATUS_TONE: Record<GoalStatus, 'green' | 'amber' | 'red'> = {
  active: 'amber',
  done: 'green',
  archived: 'green',
};

function statusOrder(g: Goal): number {
  return g.status === 'active' ? 0 : g.status === 'done' ? 1 : 2;
}

// ============= PAGE =============
export default async function GoalsPage() {
  const user = await requireSession();
  const goals = (await listGoals(user.id)).sort(
    (a, b) => statusOrder(a) - statusOrder(b) || b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Goals</h1>

      {/* ============= CREATE GOAL ============= */}
      <GlassPanel className="max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Add a goal</h2>
        <form action={createGoalAction} className="flex flex-col gap-4">
          <Input name="title" label="Title" required maxLength={200} />
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
          />
          <Button type="submit" className="self-start">Add goal</Button>
        </form>
      </GlassPanel>

      {/* ============= GOAL LIST ============= */}
      {goals.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-text-muted">No goals yet. Add your first goal above.</p>
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map(g => (
            <GlassPanel key={g.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">{g.title}</h2>
                  {g.description && <p className="text-sm text-text-muted whitespace-pre-line">{g.description}</p>}
                </div>
                <StatusPill tone={STATUS_TONE[g.status]}>{g.status}</StatusPill>
              </div>

              {/* ============= PROGRESS BAR ============= */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{g.progress}%</span>
                </div>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div style={{ height: '8px', width: '100%', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', overflow: 'hidden' } as React.CSSProperties}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div style={{ height: '100%', width: `${g.progress}%`, background: 'var(--color-primary)' } as React.CSSProperties} />
                </div>
              </div>

              {/* ============= CONTROLS ============= */}
              <div className="flex flex-wrap items-end gap-3 mt-4">
                <form action={updateGoalProgressAction} className="flex items-end gap-2">
                  <input type="hidden" name="goalId" value={g.id} />
                  <Input name="progress" type="number" min={0} max={100} defaultValue={g.progress} label="Update %" className="w-24" />
                  <Button type="submit" size="sm" variant="secondary">Save</Button>
                </form>

                {g.status !== 'archived' && (
                  <form action={setGoalStatusAction}>
                    <input type="hidden" name="goalId" value={g.id} />
                    <input type="hidden" name="status" value="archived" />
                    <Button type="submit" size="sm" variant="ghost">Archive</Button>
                  </form>
                )}
                {g.status === 'archived' && (
                  <form action={setGoalStatusAction}>
                    <input type="hidden" name="goalId" value={g.id} />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit" size="sm" variant="ghost">Reactivate</Button>
                  </form>
                )}

                <form action={deleteGoalAction}>
                  <input type="hidden" name="goalId" value={g.id} />
                  <Button type="submit" size="sm" variant="danger">Delete</Button>
                </form>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
