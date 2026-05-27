// app/(portal)/leave/approvals/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { listPendingForAll, type LeaveType } from '@/lib/db/leaves';
import { listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { decideLeaveAction } from '../actions';

const TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
};

// ============= PAGE =============
export default async function ApprovalsPage() {
  await requireSession(PERMISSIONS.APPROVE_LEAVE);
  const [pending, users] = await Promise.all([listPendingForAll(), listUsers()]);
  const userMap = new Map(users.map(u => [u.id, u]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Pending approvals</h1>
      {pending.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-text-muted">No pending leave requests.</p>
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map(r => {
            const requester = userMap.get(r.userId);
            return (
              <GlassPanel key={r.id}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold">{requester?.displayName ?? r.userId}</h2>
                    <p className="text-sm text-text-muted">{requester?.email ?? ''}</p>
                    <p className="text-sm"><strong>{TYPE_LABELS[r.type]}</strong> · {r.startDate} → {r.endDate} · {r.days} day{r.days === 1 ? '' : 's'}</p>
                    <p className="text-sm text-text-muted whitespace-pre-line">{r.reason}</p>
                    <p className="text-xs text-text-muted">Submitted {new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <form action={decideLeaveAction} className="flex flex-col gap-2 min-w-[200px]">
                    <input type="hidden" name="userId" value={r.userId} />
                    <input type="hidden" name="requestId" value={r.id} />
                    <Input name="note" label="Note (optional)" />
                    <div className="flex gap-2">
                      <Button type="submit" name="decision" value="approved" variant="primary" size="sm">Approve</Button>
                      <Button type="submit" name="decision" value="rejected" variant="danger" size="sm">Reject</Button>
                    </div>
                  </form>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
