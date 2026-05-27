// app/(portal)/actions/theme.ts

// ============= IMPORTS =============
'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============= SCHEMA =============
const ThemeIntentSchema = z.enum(['light', 'dark', 'system']);

// ============= ACTION =============
export async function setThemeAction(value: 'light' | 'dark' | 'system'): Promise<void> {
  const parsed = ThemeIntentSchema.parse(value);
  const store = await cookies();
  store.set('hrp_theme', parsed, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
