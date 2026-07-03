// lib/db/settings.ts

// ============= IMPORTS =============
import { z } from 'zod';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const SettingsSchema = z.object({
  branding: z.object({
    companyName: z.string().default('Acme Inc.'),
    logoPath: z.string().nullable().default(null),
    faviconPath: z.string().nullable().default(null),
    loginHeroPath: z.string().nullable().default(null),
  }).default({
    companyName: 'Acme Inc.',
    logoPath: null,
    faviconPath: null,
    loginHeroPath: null,
  }),
  appearance: z.object({
    primaryColor: z.string().default('#1F4D2F'),
    primaryHoverColor: z.string().default('#143F2D'),
    accentColor: z.string().default('#22C55E'),
    backgroundTint: z.string().default('#F5F5F0'),
    surfaceColor: z.string().default('#F5F5F0'),
    surfaceStrongColor: z.string().default('#FFFFFF'),
    borderColor: z.string().default('#E8E8E0'),
    textColor: z.string().default('#1A1A1A'),
    textMutedColor: z.string().default('#6B7280'),
    glassOpacity: z.number().min(0).max(100).default(100),
    glassBlurPx: z.number().min(0).max(48).default(0),
    defaultMode: z.enum(['light', 'dark']).default('light'),
  }).default({
    primaryColor: '#1F4D2F',
    primaryHoverColor: '#143F2D',
    accentColor: '#22C55E',
    backgroundTint: '#F5F5F0',
    surfaceColor: '#F5F5F0',
    surfaceStrongColor: '#FFFFFF',
    borderColor: '#E8E8E0',
    textColor: '#1A1A1A',
    textMutedColor: '#6B7280',
    glassOpacity: 100,
    glassBlurPx: 0,
    defaultMode: 'light',
  }),
  layout: z.object({
    sidebarPosition: z.enum(['left', 'right']).default('left'),
    sidebarWidthPx: z.number().min(200).max(320).default(264),
    navItemsHidden: z.array(z.string()).default([]),
    navOrder: z.array(z.string()).default([]),
  }).default({
    sidebarPosition: 'left',
    sidebarWidthPx: 264,
    navItemsHidden: [],
    navOrder: [],
  }),
  locale: z.object({
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
    timezone: z.string().default('UTC'),
    weekStartsOn: z.enum(['monday', 'sunday']).default('monday'),
  }).default({
    dateFormat: 'DD/MM/YYYY',
    timezone: 'UTC',
    weekStartsOn: 'monday',
  }),
  updatedAt: z.string().default(() => new Date().toISOString()),
  updatedBy: z.string().nullable().default(null),
});
export type Settings = z.infer<typeof SettingsSchema>;

const PATH = 'settings.json';
const DEFAULTS = SettingsSchema.parse({});

// ============= READS =============
export async function getSettings(): Promise<Settings> {
  return readJson(PATH, SettingsSchema, DEFAULTS);
}

// ============= WRITES =============
export async function saveSettings(
  patch: Partial<Settings>,
  updatedBy: string,
): Promise<Settings> {
  return updateJson(PATH, SettingsSchema, DEFAULTS, (current) => {
    const merged: Settings = {
      ...current,
      ...patch,
      branding: { ...current.branding, ...(patch.branding ?? {}) },
      appearance: { ...current.appearance, ...(patch.appearance ?? {}) },
      layout: { ...current.layout, ...(patch.layout ?? {}) },
      locale: { ...current.locale, ...(patch.locale ?? {}) },
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    return merged;
  });
}
