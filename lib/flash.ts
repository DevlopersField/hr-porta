// lib/flash.ts
// One-time server-side "flash" for showing a generated temp password ONCE without
// leaking it through the URL query string (browser history / access logs / Referer).
// Stored in an HttpOnly, short-lived cookie readable only by the server render.

// ============= IMPORTS =============
import { cookies } from 'next/headers';

// ============= CONFIG =============
const PW_FLASH = 'hrp_pw_flash';
const MAX_AGE_SECONDS = 300;

export type PasswordFlash = { kind: 'create' | 'reset'; value: string };

// ============= WRITE =============
export async function setPasswordFlash(flash: PasswordFlash): Promise<void> {
  const store = await cookies();
  store.set(PW_FLASH, JSON.stringify(flash), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

// ============= READ =============
export async function readPasswordFlash(): Promise<PasswordFlash | null> {
  const store = await cookies();
  const raw = store.get(PW_FLASH)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.kind === 'create' || parsed.kind === 'reset') && typeof parsed.value === 'string') {
      return parsed as PasswordFlash;
    }
    return null;
  } catch {
    return null;
  }
}

// ============= CLEAR =============
export async function clearPasswordFlash(): Promise<void> {
  const store = await cookies();
  store.delete(PW_FLASH);
}
