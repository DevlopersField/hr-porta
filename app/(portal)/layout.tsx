// app/(portal)/layout.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db/users';
import { getSettings } from '@/lib/db/settings';
import { resolveTheme } from '@/lib/theme';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PortalShell } from '@/components/layout/PortalShell';
import { Toast } from '@/components/ui/Toast';
import { readNoticeFlash } from '@/lib/flash';

// ============= LAYOUT =============
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // ============= FORCE PASSWORD CHANGE ON FIRST LOGIN =============
  const dbUser = await getUserById(session.user.id);
  if (dbUser?.mustChangePassword) redirect('/change-password');

  const settings = await getSettings();
  const notice = await readNoticeFlash();

  // The JWT carries a login-time snapshot; read the name fresh from the db so
  // profile edits show up in the shell immediately (no re-login needed).
  const shellUser = { ...session.user, name: dbUser?.displayName ?? session.user.name };

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
        <Sidebar user={shellUser as any} settings={settings} />
      }
      topbar={
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <TopBar user={shellUser as any} themeIntent={intent} />
      }
    >
      {children}
      <Toast message={notice} />
    </PortalShell>
  );
}
