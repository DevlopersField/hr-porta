// lib/email.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const SMTP_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of SMTP_VARS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of SMTP_VARS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('isEmailConfigured', () => {
  it('is false when SMTP env vars are absent', async () => {
    const { isEmailConfigured } = await import('./email');
    expect(isEmailConfigured()).toBe(false);
  });

  it('is true when host and from are set', async () => {
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_FROM = 'HR Portal <hr@example.test>';
    const { isEmailConfigured } = await import('./email');
    expect(isEmailConfigured()).toBe(true);
  });
});

describe('sendUserInviteEmail', () => {
  it('no-ops with sent:false when SMTP is not configured', async () => {
    const { sendUserInviteEmail } = await import('./email');
    const result = await sendUserInviteEmail({
      to: 'new.hire@example.test',
      displayName: 'New Hire',
      tempPassword: 'abc123',
      kind: 'invite',
    });
    expect(result.sent).toBe(false);
    expect(result.reason).toMatch(/not configured/i);
  });
});
