// app/layout.tsx

// ============= IMPORTS =============
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/db/settings';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { resolveTheme } from '@/lib/theme';
import './globals.css';

// ============= METADATA =============
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.branding.companyName + ' — HR Portal',
    icons: settings.branding.faviconPath ? [{ url: settings.branding.faviconPath }] : undefined,
  };
}

// ============= LAYOUT =============
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('hrp_theme')?.value;
  const { intent, resolved } = resolveTheme({
    cookie: themeCookie,
    settingsDefault: settings.appearance.defaultMode,
    prefersDark: undefined, // server can't know
  });

  // On server, if intent==='system' we DON'T set data-theme; the inline script
  // in ThemeInjector handles it before first paint. Otherwise, we set explicitly.
  const dataTheme = resolved ?? undefined;

  return (
    // suppressHydrationWarning: required because the inline system-mode script
    // in ThemeInjector mutates <html data-theme> before React hydrates, which
    // would otherwise trip a hydration mismatch warning.
    <html lang="en" suppressHydrationWarning {...(dataTheme ? { 'data-theme': dataTheme } : {})}>
      <head>
        <ThemeInjector settings={settings} intent={intent} />
      </head>
      <body>{children}</body>
    </html>
  );
}
