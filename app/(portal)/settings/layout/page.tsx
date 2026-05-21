// app/(portal)/settings/layout/page.tsx

// ============= IMPORTS =============
import { getSettings } from '@/lib/db/settings';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { updateSettingsSection } from '../actions';
import { NAV } from '@/components/layout/nav-config';

// ============= PAGE =============
export default async function LayoutSettingsPage() {
  const settings = await getSettings();
  const l = settings.layout;

  async function save(formData: FormData) {
    'use server';
    await updateSettingsSection('layout', formData);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>
      <SettingsTabs />
      <GlassPanel className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Layout</h2>
        <form action={save} className="flex flex-col gap-4">
          <label className="text-sm font-medium">Sidebar position</label>
          <select
            name="sidebarPosition"
            defaultValue={l.sidebarPosition}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <Input name="sidebarWidthPx" type="number" min={200} max={320} label="Sidebar width (200-320 px)" defaultValue={l.sidebarWidthPx} />

          <label className="text-sm font-medium mt-2">Hide navigation items</label>
          <div className="flex flex-col gap-2">
            {NAV.map(item => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="navItemsHidden"
                  value={item.id}
                  defaultChecked={l.navItemsHidden.includes(item.id)}
                />
                {item.label}
              </label>
            ))}
          </div>

          <Button type="submit" className="self-start mt-2">Save layout</Button>
        </form>
      </GlassPanel>
    </div>
  );
}
