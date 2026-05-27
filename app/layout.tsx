// app/layout.tsx

// ============= IMPORTS =============
import type { Metadata } from 'next';
import { getSettings } from '@/lib/db/settings';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
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
  return (
    <html lang="en">
      <head>
        <ThemeInjector settings={settings} />
      </head>
      <body className="bg-mesh">{children}</body>
    </html>
  );
}
