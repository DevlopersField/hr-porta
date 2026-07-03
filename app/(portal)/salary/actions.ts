// app/(portal)/salary/actions.ts

// ============= IMPORTS =============
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { PERMISSIONS, hasPermission, ForbiddenError } from '@/lib/permissions';
import { addPayslip, addTaxDoc } from '@/lib/db/salary';
import { auditLog } from '@/lib/db/audit';

// ============= SCHEMAS =============
const PayslipSchema = z.object({
  targetId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  grossPay: z.coerce.number(),
  netPay: z.coerce.number(),
  currency: z.string().min(1).max(8).default('USD'),
  note: z.string().max(500).default(''),
});

const TaxDocSchema = z.object({
  targetId: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(3000),
  kind: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
});

// ============= ADD PAYSLIP =============
export async function addPayslipAction(formData: FormData): Promise<void> {
  // Either permission may add payslips.
  const user = await requireSession();
  if (!hasPermission(user, PERMISSIONS.GENERATE_PAYSLIPS) && !hasPermission(user, PERMISSIONS.EDIT_SALARY)) {
    throw new ForbiddenError('Missing permission to add payslips');
  }
  const input = PayslipSchema.parse(Object.fromEntries(formData));
  const created = await addPayslip({
    userId: input.targetId,
    period: input.period,
    grossPay: input.grossPay,
    netPay: input.netPay,
    currency: input.currency,
    note: input.note,
  });
  // SENSITIVE: never log pay amounts — only ids + period.
  await auditLog({
    actorId: user.id,
    action: 'salary.payslip.add',
    target: created.id,
    details: { userId: input.targetId, period: input.period },
  });
  revalidatePath('/salary/payslips');
}

// ============= ADD TAX DOCUMENT =============
export async function addTaxDocAction(formData: FormData): Promise<void> {
  const user = await requireSession(PERMISSIONS.EDIT_SALARY);
  const input = TaxDocSchema.parse(Object.fromEntries(formData));
  const created = await addTaxDoc({
    userId: input.targetId,
    year: input.year,
    kind: input.kind,
    label: input.label,
  });
  await auditLog({
    actorId: user.id,
    action: 'salary.taxdoc.add',
    target: created.id,
    details: { userId: input.targetId, year: input.year },
  });
  revalidatePath('/salary/tax-documents');
}
