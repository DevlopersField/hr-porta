// app/(portal)/settings/layout.tsx
// Gate the entire /settings/* segment on MANAGE_SETTINGS. The save actions
// already enforce this, but the pages themselves did not — so a user without
// the permission could VIEW settings (branding/appearance/locale) by direct
// URL. This layout applies the same page-level guard the rest of the portal
// uses (see CLAUDE.md: "gate every protected page — defense in depth").

import { requireSession } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireSession(PERMISSIONS.MANAGE_SETTINGS);
  return <>{children}</>;
}
