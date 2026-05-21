// components/layout/ThemeInjector.tsx

// ============= IMPORTS =============
import type { Settings } from '@/lib/db/settings';
import { settingsToCssBlock } from '@/lib/theme';

// ============= TYPES =============
type Props = { settings: Settings };

// ============= COMPONENT =============
export function ThemeInjector({ settings }: Props) {
  // ============= RENDER =============
  return (
    <style
      dangerouslySetInnerHTML={{ __html: settingsToCssBlock(settings) }}
    />
  );
}
