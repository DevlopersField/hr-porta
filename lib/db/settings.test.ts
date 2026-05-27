// lib/db/settings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('getSettings (defaults)', () => {
  it("returns default branding.companyName === 'Acme Inc.' when no settings.json exists", async () => {
    const { getSettings } = await import('./settings');
    const s = await getSettings();
    expect(s.branding.companyName).toBe('Acme Inc.');
    // sanity: other defaults too
    expect(s.appearance.primaryColor).toBe('#4F46E5');
  });
});

describe('saveSettings (deep merge)', () => {
  it("merges branding.companyName patch, preserving appearance.primaryColor default", async () => {
    const { saveSettings } = await import('./settings');
    const out = await saveSettings({ branding: { companyName: 'X' } } as any, 'user1');
    expect(out.branding.companyName).toBe('X');
    expect(out.appearance.primaryColor).toBe('#4F46E5');
  });

  it("preserves branding.companyName across a second save that only patches appearance", async () => {
    const { saveSettings } = await import('./settings');
    await saveSettings({ branding: { companyName: 'X' } } as any, 'user1');
    const out2 = await saveSettings({ appearance: { primaryColor: '#000000' } } as any, 'user1');
    expect(out2.branding.companyName).toBe('X');
    expect(out2.appearance.primaryColor).toBe('#000000');
  });

  it("sets updatedAt and updatedBy", async () => {
    const { saveSettings } = await import('./settings');
    const before = new Date().toISOString();
    const out = await saveSettings({ branding: { companyName: 'X' } } as any, 'user-abc');
    expect(out.updatedBy).toBe('user-abc');
    expect(typeof out.updatedAt).toBe('string');
    expect(out.updatedAt >= before).toBe(true);
  });
});
