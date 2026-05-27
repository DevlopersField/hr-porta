// lib/theme.test.ts

// ============= IMPORTS =============
import { describe, it, expect } from 'vitest';
import { resolveTheme } from './theme';

// ============= TESTS =============
describe('resolveTheme', () => {
  it('cookie="light" resolves to light regardless of settings', () => {
    const out = resolveTheme({ cookie: 'light', settingsDefault: 'dark', prefersDark: undefined });
    expect(out).toEqual({ intent: 'light', resolved: 'light' });
  });

  it('cookie="dark" resolves to dark regardless of settings', () => {
    const out = resolveTheme({ cookie: 'dark', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'dark', resolved: 'dark' });
  });

  it('cookie="system" on server (prefersDark=undefined) returns intent=system and resolved=null', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'system', resolved: null });
  });

  it('cookie="system" on client with prefersDark=true resolves to dark', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'light', prefersDark: true });
    expect(out).toEqual({ intent: 'system', resolved: 'dark' });
  });

  it('cookie="system" on client with prefersDark=false resolves to light', () => {
    const out = resolveTheme({ cookie: 'system', settingsDefault: 'dark', prefersDark: false });
    expect(out).toEqual({ intent: 'system', resolved: 'light' });
  });

  it('no cookie falls back to settingsDefault', () => {
    const out = resolveTheme({ cookie: undefined, settingsDefault: 'dark', prefersDark: undefined });
    expect(out).toEqual({ intent: 'dark', resolved: 'dark' });
  });

  it('invalid cookie value falls back to settingsDefault', () => {
    const out = resolveTheme({ cookie: 'banana', settingsDefault: 'light', prefersDark: undefined });
    expect(out).toEqual({ intent: 'light', resolved: 'light' });
  });
});
