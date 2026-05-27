// app/(portal)/attendance/clock/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { getOpenDay, todayInUtcDate } from '@/lib/db/attendance';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { clockInAction, clockOutAction } from '../actions';

// ============= PAGE =============
export default async function ClockPage() {
  const user = await requireSession();
  const open = await getOpenDay(user.id);
  const today = todayInUtcDate();

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-3xl font-semibold">Clock in / out</h1>
      <GlassPanel variant="strong">
        {open ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-text-muted">Currently clocked in</p>
              <p className="text-lg font-semibold">{open.date} at {new Date(open.clockIn).toLocaleTimeString()}</p>
              {open.note && <p className="text-sm mt-2">Note: {open.note}</p>}
            </div>
            <form action={clockOutAction}>
              <Button type="submit" size="lg" variant="danger">Clock out</Button>
            </form>
          </div>
        ) : (
          <form action={clockInAction} className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-text-muted">Not clocked in</p>
              <p className="text-lg font-semibold">Today is {today}</p>
            </div>
            <Input name="note" label="Note (optional)" placeholder="What are you working on today?" />
            <Button type="submit" size="lg">Clock in</Button>
          </form>
        )}
      </GlassPanel>
    </div>
  );
}
