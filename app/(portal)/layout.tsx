// app/(portal)/layout.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/db/settings';
import { resolveTheme } from '@/lib/theme';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PortalShell } from '@/components/layout/PortalShell';

// ============= LAYOUT =============
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const settings = await getSettings();

  // ============= RESOLVE THEME (for the toggle's current value) =============
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('hrp_theme')?.value;
  const { intent } = resolveTheme({
    cookie: themeCookie,
    settingsDefault: settings.appearance.defaultMode,
    prefersDark: undefined,
  });

  return (
    <PortalShell
      sidebar={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Sidebar user={session.user as any} settings={settings} />
      }
      topbar={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <TopBar user={session.user as any} themeIntent={intent} />
      }
    >
      {children}
    </PortalShell>
  );
}
