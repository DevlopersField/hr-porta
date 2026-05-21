/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(portal)/layout.tsx

// ============= IMPORTS =============
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/db/settings';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

// ============= LAYOUT =============
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const settings = await getSettings();

  return (
    <div
      className="grid min-h-screen"
      style={
        // eslint-disable-next-line react/forbid-dom-props
        {
          gridTemplateColumns: 'var(--sidebar-width) 1fr',
          padding: '16px',
          gap: '16px',
        } as React.CSSProperties
      }
    >
      <Sidebar user={session.user as any} settings={settings} />
      <div
        className="grid"
        style={
          // eslint-disable-next-line react/forbid-dom-props
          {
            gridTemplateRows: 'var(--topbar-height) 1fr',
            gap: '16px',
            minWidth: 0,
          } as React.CSSProperties
        }
      >
        <TopBar user={session.user as any} />
        <main className="overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
