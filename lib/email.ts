// lib/email.ts
// Zero-cost email: plain SMTP via nodemailer. Works with any free SMTP
// provider (Gmail app password, Brevo/Sendinblue free tier, Mailgun sandbox,
// or a self-hosted relay). When SMTP env vars are absent the portal runs
// exactly as before — sends become logged no-ops, nothing breaks.
//
// Env:
//   SMTP_HOST  (required to enable)
//   SMTP_FROM  (required to enable, e.g. "HR Portal <hr@company.test>")
//   SMTP_PORT  (default 587)
//   SMTP_USER / SMTP_PASS (optional, for authenticated relays)

// ============= IMPORTS =============
import nodemailer from 'nodemailer';
import { logger } from './logger';

// ============= CONFIG =============
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function makeTransport() {
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

// ============= SEND =============
export type SendResult = { sent: boolean; reason?: string };

export type UserInviteEmail = {
  to: string;
  displayName: string;
  tempPassword: string;
  kind: 'invite' | 'reset';
};

// Invite / password-reset notification. Failures never block the calling
// action — account creation must succeed even if the relay is down.
export async function sendUserInviteEmail(input: UserInviteEmail): Promise<SendResult> {
  if (!isEmailConfigured()) {
    logger.info({ to: input.to, kind: input.kind }, 'email skipped — SMTP not configured');
    return { sent: false, reason: 'SMTP not configured' };
  }
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const subject =
    input.kind === 'invite'
      ? 'Your HR Portal account is ready'
      : 'Your HR Portal password was reset';
  const intro =
    input.kind === 'invite'
      ? `An account has been created for you on the HR Portal.`
      : `Your HR Portal password has been reset by an administrator.`;
  const text = [
    `Hi ${input.displayName},`,
    '',
    intro,
    '',
    `Sign in at: ${appUrl}/login`,
    `Email: ${input.to}`,
    `Temporary password: ${input.tempPassword}`,
    '',
    'You will be asked to choose a new password on first login.',
  ].join('\n');

  try {
    await makeTransport().sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject,
      text,
    });
    logger.info({ to: input.to, kind: input.kind }, 'email sent');
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: input.to, kind: input.kind }, 'email send failed');
    return { sent: false, reason: 'send failed' };
  }
}
