// lib/db/salary.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('addPayslip / listPayslips', () => {
  it("creates a payslip with id 'pay_...' and defaults", async () => {
    const { addPayslip } = await import('./salary');
    const slip = await addPayslip({
      userId: 'u1',
      period: '2026-05',
      grossPay: 5000,
      netPay: 4200,
    });
    expect(slip.id.startsWith('pay_')).toBe(true);
    expect(slip.userId).toBe('u1');
    expect(slip.period).toBe('2026-05');
    expect(slip.grossPay).toBe(5000);
    expect(slip.netPay).toBe(4200);
    expect(slip.currency).toBe('USD');
    expect(slip.note).toBe('');
    expect(typeof slip.issuedAt).toBe('string');
  });

  it('scopes payslips per user', async () => {
    const { addPayslip, listPayslips } = await import('./salary');
    await addPayslip({ userId: 'u1', period: '2026-05', grossPay: 5000, netPay: 4200 });
    await addPayslip({ userId: 'u2', period: '2026-05', grossPay: 6000, netPay: 5000 });
    const u1 = await listPayslips('u1');
    const u2 = await listPayslips('u2');
    expect(u1).toHaveLength(1);
    expect(u2).toHaveLength(1);
    expect(u1[0]!.grossPay).toBe(5000);
    expect(u2[0]!.grossPay).toBe(6000);
  });

  it('orders payslips by period descending (newest first)', async () => {
    const { addPayslip, listPayslips } = await import('./salary');
    await addPayslip({ userId: 'u1', period: '2026-03', grossPay: 5000, netPay: 4200 });
    await addPayslip({ userId: 'u1', period: '2026-06', grossPay: 5100, netPay: 4300 });
    await addPayslip({ userId: 'u1', period: '2026-01', grossPay: 4900, netPay: 4100 });
    const slips = await listPayslips('u1');
    expect(slips.map(s => s.period)).toEqual(['2026-06', '2026-03', '2026-01']);
  });

  it('returns empty array for a user with no payslips', async () => {
    const { listPayslips } = await import('./salary');
    expect(await listPayslips('nobody')).toEqual([]);
  });
});

describe('listAllPayslips', () => {
  it('gathers payslips across all users', async () => {
    const { addPayslip, listAllPayslips } = await import('./salary');
    const { createUser } = await import('./users');
    await createUser({ email: 'a@x.test', passwordHash: 'h', displayName: 'A' });
    await createUser({ email: 'b@x.test', passwordHash: 'h', displayName: 'B' });
    const users = await (await import('./users')).listUsers();
    await addPayslip({ userId: users[0]!.id, period: '2026-05', grossPay: 5000, netPay: 4200 });
    await addPayslip({ userId: users[1]!.id, period: '2026-06', grossPay: 6000, netPay: 5000 });
    const all = await listAllPayslips();
    expect(all).toHaveLength(2);
    expect(all[0]!.period).toBe('2026-06');
  });
});

describe('addTaxDoc / listTaxDocs', () => {
  it("creates a tax doc with id 'tax_...' scoped per user", async () => {
    const { addTaxDoc, listTaxDocs } = await import('./salary');
    const doc = await addTaxDoc({ userId: 'u1', year: 2026, kind: 'W-2', label: 'Wage statement' });
    expect(doc.id.startsWith('tax_')).toBe(true);
    expect(doc.kind).toBe('W-2');
    const list = await listTaxDocs('u1');
    expect(list).toHaveLength(1);
    expect(await listTaxDocs('u2')).toEqual([]);
  });

  it('orders tax docs by year descending', async () => {
    const { addTaxDoc, listTaxDocs } = await import('./salary');
    await addTaxDoc({ userId: 'u1', year: 2024, kind: 'W-2', label: '2024' });
    await addTaxDoc({ userId: 'u1', year: 2026, kind: 'W-2', label: '2026' });
    await addTaxDoc({ userId: 'u1', year: 2025, kind: 'Form-16', label: '2025' });
    const docs = await listTaxDocs('u1');
    expect(docs.map(d => d.year)).toEqual([2026, 2025, 2024]);
  });
});
