// app/(portal)/todo/approvals/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { listPendingRoutedTo, type Request, type RequestType } from '@/lib/db/requests';
import { getDelegatorsFor } from '@/lib/db/delegates';
import { listPendingForAll, type LeaveType } from '@/lib/db/leaves';
import { listUsers } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { decideRequestAction } from './actions';
import { decideLeaveAction } from '../../leave/actions';

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  equipment: 'Equipment',
  travel: 'Travel',
  wfh: 'Work from home',
  expense: 'Expense',
  general: 'General',
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
};

// ============= PAGE =============
export default async function ApprovalsInboxPage() {
  const me = await requireSession(PERMISSIONS.APPROVE_REQUESTS);
  const today = new Date().toISOString().slice(0, 10);

  // Requests routed directly to me, plus requests routed to anyone who has
  // delegated their approval authority to me for today.
  const delegators = await getDelegatorsFor(me.id, today);
  const routedLists = await Promise.all([
    listPendingRoutedTo(me.id),
    ...delegators.map(id => listPendingRoutedTo(id)),
  ]);
  const seen = new Set<string>();
  const requests: Request[] = [];
  for (const list of routedLists) {
    for (const r of list) {
      if (r.userId === me.id) continue;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      requests.push(r);
    }
  }
  requests.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Optional leave inbox if the approver also holds APPROVE_LEAVE.
  const canApproveLeave = hasPermission(me, PERMISSIONS.APPROVE_LEAVE);
  const pendingLeave = canApproveLeave ? await listPendingForAll() : [];

  const users = await listUsers();
  const userMap = new Map(users.map(u => [u.id, u]));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">Approvals</h1>

      {/* ============= REQUESTS ============= */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Requests routed to me</h2>
        {requests.length === 0 ? (
          <GlassPanel>
            <p className="text-sm text-text-muted">No pending requests.</p>
          </GlassPanel>
        ) : (
          requests.map(r => {
            const requester = userMap.get(r.userId);
            return (
              <GlassPanel key={r.id}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">{requester?.displayName ?? r.userId}</h3>
                    <p className="text-sm text-text-muted">{requester?.email ?? ''}</p>
                    <p className="text-sm">
                      <strong>{REQUEST_TYPE_LABELS[r.type]}</strong> · {r.title}
                      {r.amount !== null && <> · {r.amount.toFixed(2)}</>}
                    </p>
                    <p className="text-sm text-text-muted whitespace-pre-line">{r.details}</p>
                    <p className="text-xs text-text-muted">Submitted {new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <form action={decideRequestAction} className="flex flex-col gap-2 min-w-[200px]">
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
          })
        )}
      </section>

      {/* ============= PENDING LEAVE ============= */}
      {canApproveLeave && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Pending leave</h2>
          {pendingLeave.length === 0 ? (
            <GlassPanel>
              <p className="text-sm text-text-muted">No pending leave requests.</p>
            </GlassPanel>
          ) : (
            pendingLeave.map(r => {
              const requester = userMap.get(r.userId);
              return (
                <GlassPanel key={r.id}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold">{requester?.displayName ?? r.userId}</h3>
                      <p className="text-sm text-text-muted">{requester?.email ?? ''}</p>
                      <p className="text-sm">
                        <strong>{LEAVE_TYPE_LABELS[r.type]}</strong> · {r.startDate} → {r.endDate} · {r.days} day{r.days === 1 ? '' : 's'}
                      </p>
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
            })
          )}
        </section>
      )}
    </div>
  );
}
