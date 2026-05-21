// app/(portal)/home/page.tsx

// ============= IMPORTS =============
import { auth } from '@/lib/auth';
import { GlassPanel } from '@/components/ui/GlassPanel';

// ============= PAGE =============
export default async function HomePage() {
  const session = await auth();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Welcome, {session!.user.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-2">Today</h2>
          <p className="text-sm text-text-muted">Clock in to start your day.</p>
        </GlassPanel>
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-2">Leave Balance</h2>
          <p className="text-sm text-text-muted">Coming soon.</p>
        </GlassPanel>
        <GlassPanel>
          <h2 className="text-lg font-semibold mb-2">Announcements</h2>
          <p className="text-sm text-text-muted">Coming soon.</p>
        </GlassPanel>
      </div>
    </div>
  );
}
