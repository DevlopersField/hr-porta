// app/(portal)/home/page.tsx

// ============= IMPORTS =============
import { auth } from '@/lib/auth';
import { listUsers } from '@/lib/db/users';
import { listPendingForAll, listUserLeaves } from '@/lib/db/leaves';
import { StatCard } from '@/components/ui/StatCard';

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome, {session!.user.name}</h1>
        <p className="text-sm text-text-muted mt-1">Plan, prioritize, and accomplish your work with ease.</p>
      </div>

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
    </div>
  );
}
