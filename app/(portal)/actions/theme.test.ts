// app/(portal)/actions/theme.test.ts

// ============= IMPORTS =============
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============= MOCKS =============
const cookieStore = { set: vi.fn(), delete: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ============= TESTS =============
describe('setThemeAction', () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it('writes hrp_theme cookie with correct attrs', async () => {
    const { setThemeAction } = await import('./theme');
    await setThemeAction('dark');
    expect(cookieStore.set).toHaveBeenCalledWith('hrp_theme', 'dark', expect.objectContaining({
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    }));
  });

  it('accepts "light", "dark", and "system"', async () => {
    const { setThemeAction } = await import('./theme');
    await setThemeAction('light');
    await setThemeAction('dark');
    await setThemeAction('system');
    expect(cookieStore.set).toHaveBeenCalledTimes(3);
  });

  it('throws on invalid value', async () => {
    const { setThemeAction } = await import('./theme');
    await expect(setThemeAction('banana' as never)).rejects.toThrow();
  });
});
