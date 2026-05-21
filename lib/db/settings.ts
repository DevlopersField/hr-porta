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
    primaryColor: z.string().default('#4F46E5'),
    primaryHoverColor: z.string().default('#4338CA'),
    accentColor: z.string().default('#06B6D4'),
    backgroundTint: z.string().default('#F5F7FB'),
    surfaceColor: z.string().default('rgba(255, 255, 255, 0.65)'),
    surfaceStrongColor: z.string().default('rgba(255, 255, 255, 0.85)'),
    borderColor: z.string().default('rgba(255, 255, 255, 0.4)'),
    textColor: z.string().default('#0F172A'),
    textMutedColor: z.string().default('#64748B'),
    glassOpacity: z.number().min(0).max(100).default(65),
    glassBlurPx: z.number().min(0).max(48).default(24),
    defaultMode: z.enum(['light', 'dark']).default('light'),
  }).default({
    primaryColor: '#4F46E5',
    primaryHoverColor: '#4338CA',
    accentColor: '#06B6D4',
    backgroundTint: '#F5F7FB',
    surfaceColor: 'rgba(255, 255, 255, 0.65)',
    surfaceStrongColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    textColor: '#0F172A',
    textMutedColor: '#64748B',
    glassOpacity: 65,
    glassBlurPx: 24,
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
