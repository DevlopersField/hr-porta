// components/layout/ThemeInjector.tsx

// ============= IMPORTS =============
import type { Settings } from '@/lib/db/settings';
import { settingsToCssBlock } from '@/lib/theme';
import type { ThemeIntent } from '@/lib/theme';

// ============= TYPES =============
type Props = {
  settings: Settings;
  intent: ThemeIntent;
};

// ============= SYSTEM-MODE SCRIPT =============
// This runs BEFORE first paint to prevent FOUC when intent is 'system'.
// It sets data-theme on <html> based on the current prefers-color-scheme,
// and attaches a listener so OS-level theme changes propagate live.
const SYSTEM_SCRIPT = `
(function() {
  function apply() {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  apply();
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  } catch (e) {}
})();
`.trim();

// ============= COMPONENT =============
export function ThemeInjector({ settings, intent }: Props) {
  // ============= ADMIN PALETTE OVERRIDES (light only in v1) =============
  // The Settings module lets admin override light-mode colors. These overrides
  // apply only when data-theme is NOT "dark" (i.e., light or system-resolved-light).
  const lightOverrides = settingsToCssBlock(settings);
  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: lightOverrides }}
      />
      {intent === 'system' && (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: SYSTEM_SCRIPT }}
        />
      )}
    </>
  );
}
