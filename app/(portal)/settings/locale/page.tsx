// app/(portal)/settings/locale/page.tsx

// ============= IMPORTS =============
import { getSettings } from '@/lib/db/settings';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { updateSettingsSection } from '../actions';

// ============= PAGE =============
export default async function LocalePage() {
  const settings = await getSettings();
  const lo = settings.locale;

  async function save(formData: FormData) {
    'use server';
    await updateSettingsSection('locale', formData);
  }

  const selectStyle = {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface-strong)',
    fontSize: '14px',
  } as React.CSSProperties;

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>
      <SettingsTabs />
      <GlassPanel className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Locale</h2>
        <form action={save} className="flex flex-col gap-4">
          <label className="text-sm font-medium">Date format</label>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <select name="dateFormat" defaultValue={lo.dateFormat} style={selectStyle}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
          <Input name="timezone" label="Timezone (e.g. Asia/Kolkata, UTC, America/New_York)" defaultValue={lo.timezone} />
          <label className="text-sm font-medium">Week starts on</label>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <select name="weekStartsOn" defaultValue={lo.weekStartsOn} style={selectStyle}>
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
          <Button type="submit" className="self-start">Save locale</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
