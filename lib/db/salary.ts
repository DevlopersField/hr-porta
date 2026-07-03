// lib/db/salary.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { listUsers } from './users';

// ============= SCHEMA =============
export const PayslipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  grossPay: z.number(),
  netPay: z.number(),
  currency: z.string().default('USD'),
  note: z.string().default(''),
  issuedAt: z.string(),
});
export type Payslip = z.infer<typeof PayslipSchema>;

export const TaxDocSchema = z.object({
  id: z.string(),
  userId: z.string(),
  year: z.number().int(),
  kind: z.string(),
  label: z.string(),
  issuedAt: z.string(),
});
export type TaxDoc = z.infer<typeof TaxDocSchema>;

export const SalaryFileSchema = z.object({
  payslips: z.array(PayslipSchema),
  taxDocuments: z.array(TaxDocSchema),
});
export type SalaryFile = z.infer<typeof SalaryFileSchema>;

const EMPTY: SalaryFile = { payslips: [], taxDocuments: [] };

function pathFor(userId: string): string {
  return `salary/${userId}.json`;
}

// ============= READS =============
export async function listPayslips(userId: string): Promise<Payslip[]> {
  const data = await readJson(pathFor(userId), SalaryFileSchema, EMPTY);
  return [...data.payslips].sort((a, b) => b.period.localeCompare(a.period));
}

export async function listTaxDocs(userId: string): Promise<TaxDoc[]> {
  const data = await readJson(pathFor(userId), SalaryFileSchema, EMPTY);
  return [...data.taxDocuments].sort((a, b) => b.year - a.year);
}

export async function listAllPayslips(): Promise<Payslip[]> {
  const users = await listUsers();
  const out: Payslip[] = [];
  for (const u of users) {
    const slips = await listPayslips(u.id);
    out.push(...slips);
  }
  return out.sort((a, b) => b.period.localeCompare(a.period));
}

// ============= WRITES =============
export type AddPayslipInput = {
  userId: string;
  period: string;
  grossPay: number;
  netPay: number;
  currency?: string;
  note?: string;
};

export async function addPayslip(input: AddPayslipInput): Promise<Payslip> {
  const result = await updateJson(pathFor(input.userId), SalaryFileSchema, EMPTY, (current) => {
    const slip: Payslip = {
      id: `pay_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      period: input.period,
      grossPay: input.grossPay,
      netPay: input.netPay,
      currency: input.currency ?? 'USD',
      note: input.note ?? '',
      issuedAt: new Date().toISOString(),
    };
    return { ...current, payslips: [...current.payslips, slip] };
  });
  return result.payslips[result.payslips.length - 1]!;
}

export type AddTaxDocInput = {
  userId: string;
  year: number;
  kind: string;
  label: string;
};

export async function addTaxDoc(input: AddTaxDocInput): Promise<TaxDoc> {
  const result = await updateJson(pathFor(input.userId), SalaryFileSchema, EMPTY, (current) => {
    const doc: TaxDoc = {
      id: `tax_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      year: input.year,
      kind: input.kind,
      label: input.label,
      issuedAt: new Date().toISOString(),
    };
    return { ...current, taxDocuments: [...current.taxDocuments, doc] };
  });
  return result.taxDocuments[result.taxDocuments.length - 1]!;
}
