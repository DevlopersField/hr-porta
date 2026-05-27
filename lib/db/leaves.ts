// lib/db/leaves.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { listUsers } from './users';

// ============= TYPES =============
export const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid'] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

export const LEAVE_QUOTAS: Record<LeaveType, number | null> = {
  annual: 20,
  sick: 10,
  casual: 7,
  unpaid: null, // unlimited
};

export const LeaveStatus = ['pending', 'approved', 'rejected'] as const;
export type LeaveStatus = typeof LeaveStatus[number];

// ============= SCHEMA =============
export const LeaveRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(LEAVE_TYPES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().positive(),
  reason: z.string(),
  status: z.enum(LeaveStatus),
  createdAt: z.string(),
  decidedBy: z.string().nullable().default(null),
  decidedAt: z.string().nullable().default(null),
  decisionNote: z.string().nullable().default(null),
});
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const LeaveFileSchema = z.object({
  requests: z.array(LeaveRequestSchema),
});
export type LeaveFile = z.infer<typeof LeaveFileSchema>;

const EMPTY: LeaveFile = { requests: [] };

function pathFor(userId: string): string {
  return `leaves/${userId}.json`;
}

// ============= READS =============
export async function listUserLeaves(userId: string): Promise<LeaveRequest[]> {
  const data = await readJson(pathFor(userId), LeaveFileSchema, EMPTY);
  return data.requests;
}

export async function getLeaveRequest(userId: string, id: string): Promise<LeaveRequest | null> {
  const reqs = await listUserLeaves(userId);
  return reqs.find(r => r.id === id) ?? null;
}

export async function listPendingForAll(): Promise<LeaveRequest[]> {
  const users = await listUsers();
  const out: LeaveRequest[] = [];
  for (const u of users) {
    const reqs = await listUserLeaves(u.id);
    out.push(...reqs.filter(r => r.status === 'pending'));
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ============= WRITES =============
export type CreateLeaveInput = {
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
};

export async function createLeaveRequest(input: CreateLeaveInput): Promise<LeaveRequest> {
  const result = await updateJson(pathFor(input.userId), LeaveFileSchema, EMPTY, (current) => {
    const newReq: LeaveRequest = {
      id: `lv_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days: input.days,
      reason: input.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
    };
    return { requests: [...current.requests, newReq] };
  });
  return result.requests[result.requests.length - 1]!;
}

export async function decideLeaveRequest(
  userId: string,
  id: string,
  decision: 'approved' | 'rejected',
  decidedBy: string,
  decisionNote?: string,
): Promise<void> {
  if (userId === decidedBy) {
    throw new Error('Cannot decide your own leave request');
  }
  await updateJson(pathFor(userId), LeaveFileSchema, EMPTY, (current) => {
    const target = current.requests.find(r => r.id === id);
    if (!target) throw new Error('Leave request not found');
    if (target.status !== 'pending') {
      throw new Error(`Leave request already ${target.status}`);
    }
    return {
      requests: current.requests.map(r =>
        r.id === id
          ? { ...r, status: decision, decidedBy, decidedAt: new Date().toISOString(), decisionNote: decisionNote ?? null }
          : r,
      ),
    };
  });
}

export async function withdrawLeaveRequest(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), LeaveFileSchema, EMPTY, (current) => ({
    requests: current.requests.filter(r => !(r.id === id && r.status === 'pending')),
  }));
}

// ============= BALANCE =============
export type LeaveBalance = Record<LeaveType, { quota: number | null; used: number; remaining: number | null }>;

export async function getLeaveBalance(userId: string, year = new Date().getFullYear()): Promise<LeaveBalance> {
  const reqs = await listUserLeaves(userId);
  const inYear = reqs.filter(r => r.status === 'approved' && r.startDate.startsWith(String(year)));
  const used: Record<LeaveType, number> = { annual: 0, sick: 0, casual: 0, unpaid: 0 };
  for (const r of inYear) used[r.type] += r.days;

  const balance = {} as LeaveBalance;
  for (const t of LEAVE_TYPES) {
    const quota = LEAVE_QUOTAS[t];
    balance[t] = {
      quota,
      used: used[t],
      remaining: quota === null ? null : quota - used[t],
    };
  }
  return balance;
}

// ============= UTILITIES =============
export function countLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (end < start) throw new Error('endDate must be >= startDate');
  // Inclusive day count; weekend exclusion is left as a v2 improvement
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / 86400000) + 1;
}
