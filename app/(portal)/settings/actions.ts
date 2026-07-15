/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(portal)/settings/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { saveSettings, type Settings } from '@/lib/db/settings';
import { saveUploadedImage } from '@/lib/uploads';
import { auditLog } from '@/lib/db/audit';
import { setNoticeFlash } from '@/lib/flash';

// ============= SCHEMAS =============
const AppearanceSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  primaryHoverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundTint: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  glassOpacity: z.coerce.number().min(0).max(100).optional(),
  glassBlurPx: z.coerce.number().min(0).max(48).optional(),
  defaultMode: z.enum(['light', 'dark']).optional(),
}).strict();

const BrandingSchema = z.object({
  companyName: z.string().min(1).max(80).optional(),
}).strict();

const LayoutSchema = z.object({
  sidebarPosition: z.enum(['left', 'right']).optional(),
  sidebarWidthPx: z.coerce.number().min(200).max(320).optional(),
  navItemsHidden: z.array(z.string()).optional(),
}).strict();

const LocaleSchema = z.object({
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  timezone: z.string().optional(),
  weekStartsOn: z.enum(['monday', 'sunday']).optional(),
}).strict();

// ============= UPDATE SETTINGS ACTION =============
type SettingsSection = 'appearance' | 'branding' | 'layout' | 'locale';

export async function updateSettingsSection(
  section: SettingsSection,
  formData: FormData,
): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_SETTINGS);
  const raw = Object.fromEntries(formData);
  let patch: Partial<Settings> = {};
  switch (section) {
    case 'appearance': patch = { appearance: AppearanceSchema.parse(raw) as any }; break;
    case 'branding': patch = { branding: BrandingSchema.parse(raw) as any }; break;
    case 'layout': {
      const parsed = LayoutSchema.parse({
        ...raw,
        navItemsHidden: formData.getAll('navItemsHidden').map(String),
      });
      patch = { layout: parsed as any };
      break;
    }
    case 'locale': patch = { locale: LocaleSchema.parse(raw) as any }; break;
  }
  await saveSettings(patch, user.id);
  await auditLog({ actorId: user.id, action: `settings.${section}.update`, details: raw });
  await setNoticeFlash('Settings saved');
  revalidatePath('/', 'layout');
}

// ============= UPLOAD IMAGE ACTION =============
const UploadPurpose = z.enum(['logo', 'favicon', 'hero']);

export async function uploadBrandingImage(formData: FormData): Promise<{ url: string }> {
  const user = await requireSession(PERMISSIONS.MANAGE_SETTINGS);
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('No file provided');
  const purpose = UploadPurpose.parse(formData.get('purpose'));

  const { publicUrl } = await saveUploadedImage(file, purpose);

  const fieldName: keyof Settings['branding'] =
    purpose === 'logo' ? 'logoPath' :
    purpose === 'favicon' ? 'faviconPath' :
    'loginHeroPath';

  await saveSettings({ branding: { [fieldName]: publicUrl } as any }, user.id);
  await auditLog({ actorId: user.id, action: `settings.upload.${purpose}`, target: publicUrl });
  revalidatePath('/', 'layout');
  return { url: publicUrl };
}

// ============= CLEAR IMAGE ACTION =============
export async function clearBrandingImage(purpose: 'logo' | 'favicon' | 'hero'): Promise<void> {
  const user = await requireSession(PERMISSIONS.MANAGE_SETTINGS);
  const fieldName: keyof Settings['branding'] =
    purpose === 'logo' ? 'logoPath' :
    purpose === 'favicon' ? 'faviconPath' :
    'loginHeroPath';
  await saveSettings({ branding: { [fieldName]: null } as any }, user.id);
  await auditLog({ actorId: user.id, action: `settings.clear.${purpose}` });
  await setNoticeFlash('Image removed');
  revalidatePath('/', 'layout');
}
