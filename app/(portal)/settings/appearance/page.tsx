// app/(portal)/settings/appearance/page.tsx

// ============= IMPORTS =============
import { getSettings } from '@/lib/db/settings';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { updateSettingsSection } from '../actions';

// ============= PAGE =============
export default async function AppearancePage() {
  const settings = await getSettings();
  const a = settings.appearance;

  async function save(formData: FormData) {
    'use server';
    await updateSettingsSection('appearance', formData);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>
      <SettingsTabs />
      <GlassPanel className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <form action={save} className="flex flex-col gap-4">
          <Input name="primaryColor"      label="Primary color"       type="color" defaultValue={a.primaryColor} />
          <Input name="primaryHoverColor" label="Primary hover color" type="color" defaultValue={a.primaryHoverColor} />
          <Input name="accentColor"       label="Accent color"        type="color" defaultValue={a.accentColor} />
          <Input name="backgroundTint"    label="Background tint"     type="color" defaultValue={a.backgroundTint} />
          <Input name="glassOpacity"      label="Glass opacity (0-100)" type="number" min={0} max={100} defaultValue={a.glassOpacity} />
          <Input name="glassBlurPx"       label="Glass blur (0-48 px)" type="number" min={0} max={48}  defaultValue={a.glassBlurPx} />
          <label className="text-sm font-medium">Default mode</label>
          <select
            name="defaultMode"
            defaultValue={a.defaultMode}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-strong)',
              fontSize: '14px',
            } as React.CSSProperties}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <Button type="submit" className="self-start">Save appearance</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
