// app/(portal)/home/page.tsx

// ============= IMPORTS =============
import { auth } from '@/lib/auth';
import { listUsers } from '@/lib/db/users';
import { listPendingForAll, listUserLeaves } from '@/lib/db/leaves';
import { StatCard } from '@/components/ui/StatCard';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { BarChart, type BarDatum } from '@/components/ui/BarChart';

// ============= PAGE =============
export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [users, pending, myLeaves] = await Promise.all([
    listUsers(),
    listPendingForAll(),
    listUserLeaves(userId),
  ]);

  const activeCount = users.filter(u => u.active).length;
  const year = String(new Date().getUTCFullYear());
  const myApprovedThisYear = myLeaves.filter(l => l.status === 'approved' && l.startDate.startsWith(year)).length;

  // ============= HEADCOUNT BY DEPARTMENT (magnitude) =============
  const deptCounts = new Map<string, number>();
  for (const u of users.filter(u => u.active)) {
    const dept = u.department || 'Unassigned';
    deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + 1);
  }
  const deptData: BarDatum[] = [...deptCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // ============= LEAVE REQUESTS BY STATUS (status breakdown) =============
  const allLeaves = (await Promise.all(users.map(u => listUserLeaves(u.id)))).flat();
  const statusCounts = { approved: 0, pending: 0, rejected: 0 };
  for (const l of allLeaves) statusCounts[l.status] += 1;
  const statusData: BarDatum[] = [
    { label: 'Approved', value: statusCounts.approved, tone: 'good' },
    { label: 'Pending', value: statusCounts.pending, tone: 'warn' },
    { label: 'Rejected', value: statusCounts.rejected, tone: 'bad' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome, {session!.user.name}</h1>
        <p className="text-sm text-text-muted mt-1">Plan, prioritize, and accomplish your work with ease.</p>
      </div>

      {/* ============= STAT TILES ============= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Employees"
          value={users.length}
          featured
          hint={users.length === 1 ? '1 record' : `${users.length} records`}
        />
        <StatCard
          label="Active Employees"
          value={activeCount}
          delta={`${activeCount}/${users.length}`}
          deltaTone="green"
        />
        <StatCard
          label="Pending Leave Requests"
          value={pending.length}
          deltaTone={pending.length > 0 ? 'amber' : 'green'}
          delta={pending.length > 0 ? 'Awaiting approval' : 'All clear'}
        />
        <StatCard
          label="My Approved Leave"
          value={myApprovedThisYear}
          hint="this year"
        />
      </div>

      {/* ============= CHARTS ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel>
          <h2 className="text-lg font-semibold">Headcount by department</h2>
          <p className="text-sm text-text-muted mb-4">Active employees</p>
          <BarChart data={deptData} ariaLabel="Active headcount by department" emptyText="No active employees." />
        </GlassPanel>
        <GlassPanel>
          <h2 className="text-lg font-semibold">Leave requests by status</h2>
          <p className="text-sm text-text-muted mb-4">All time, across the organization</p>
          <BarChart data={statusData} ariaLabel="Leave requests by status" emptyText="No leave requests yet." />
        </GlassPanel>
      </div>
    </div>
  );
}
