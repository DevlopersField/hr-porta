// app/(portal)/settings/branding/page.tsx

// ============= IMPORTS =============
import { getSettings } from '@/lib/db/settings';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ImageUpload } from '@/components/settings/ImageUpload';
import { updateSettingsSection, uploadBrandingImage, clearBrandingImage } from '../actions';

// ============= PAGE =============
export default async function BrandingPage() {
  const settings = await getSettings();
  const b = settings.branding;

  async function saveBranding(formData: FormData) {
    'use server';
    await updateSettingsSection('branding', formData);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>
      <SettingsTabs />
      <GlassPanel className="max-w-2xl flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Branding</h2>

        <form action={saveBranding} className="flex flex-col gap-4">
          <Input name="companyName" label="Company name" defaultValue={b.companyName} required />
          <Button type="submit" className="self-start">Save company name</Button>
        </form>

        <ImageUpload
          label="Logo"
          purpose="logo"
          currentUrl={b.logoPath}
          onUpload={uploadBrandingImage}
          onClear={async () => { 'use server'; await clearBrandingImage('logo'); }}
        />
        <ImageUpload
          label="Favicon"
          purpose="favicon"
          currentUrl={b.faviconPath}
          onUpload={uploadBrandingImage}
          onClear={async () => { 'use server'; await clearBrandingImage('favicon'); }}
        />
        <ImageUpload
          label="Login hero image"
          purpose="hero"
          currentUrl={b.loginHeroPath}
          onUpload={uploadBrandingImage}
          onClear={async () => { 'use server'; await clearBrandingImage('hero'); }}
        />
      </GlassPanel>
    </div>
  );
}
