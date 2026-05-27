// app/(portal)/leave/request/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { LEAVE_TYPES } from '@/lib/db/leaves';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitLeaveAction } from '../actions';

const TYPE_LABELS: Record<typeof LEAVE_TYPES[number], string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
};

// ============= PAGE =============
export default async function LeaveRequestPage() {
  await requireSession();
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-3xl font-semibold">Request time off</h1>
      <GlassPanel>
        <form action={submitLeaveAction} className="flex flex-col gap-4">
          <label className="text-sm font-medium">Leave type</label>
          <select
            name="type"
            defaultValue="annual"
            required
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <Input name="startDate" type="date" label="Start date" required />
          <Input name="endDate"   type="date" label="End date"   required />
          <label className="text-sm font-medium">Reason</label>
          <textarea
            name="reason"
            required
            rows={4}
            maxLength={500}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
          />
          <Button type="submit" className="self-start">Submit request</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
