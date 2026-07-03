// lib/db/delegates.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const DelegationSchema = z.object({
  id: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string(),
});
export type Delegation = z.infer<typeof DelegationSchema>;

export const DelegationFileSchema = z.object({
  delegations: z.array(DelegationSchema),
});
export type DelegationFile = z.infer<typeof DelegationFileSchema>;

const EMPTY: DelegationFile = { delegations: [] };
const PATH = 'delegates.json';

// ============= READS =============
export async function listDelegations(): Promise<Delegation[]> {
  const data = await readJson(PATH, DelegationFileSchema, EMPTY);
  return data.delegations;
}

export async function listMyDelegations(fromUserId: string): Promise<Delegation[]> {
  const all = await listDelegations();
  return all.filter(d => d.fromUserId === fromUserId);
}

// Return the fromUserIds for which toUserId currently holds delegated authority
// on the given ISO date (inclusive of startDate and endDate).
export async function getDelegatorsFor(toUserId: string, isoDate: string): Promise<string[]> {
  const all = await listDelegations();
  return all
    .filter(d => d.toUserId === toUserId && d.startDate <= isoDate && isoDate <= d.endDate)
    .map(d => d.fromUserId);
}

// ============= WRITES =============
export type AddDelegationInput = {
  fromUserId: string;
  toUserId: string;
  startDate: string;
  endDate: string;
};

export async function addDelegation(input: AddDelegationInput): Promise<Delegation> {
  const result = await updateJson(PATH, DelegationFileSchema, EMPTY, (current) => {
    const newDel: Delegation = {
      id: `del_${crypto.randomBytes(6).toString('hex')}`,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };
    return { delegations: [...current.delegations, newDel] };
  });
  return result.delegations[result.delegations.length - 1]!;
}

export async function removeDelegation(id: string): Promise<void> {
  await updateJson(PATH, DelegationFileSchema, EMPTY, (current) => ({
    delegations: current.delegations.filter(d => d.id !== id),
  }));
}
