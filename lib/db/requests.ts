// lib/db/requests.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { listUsers } from './users';

// ============= TYPES =============
export const REQUEST_TYPES = ['equipment', 'travel', 'wfh', 'expense', 'general'] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export const RequestStatus = ['pending', 'approved', 'rejected'] as const;
export type RequestStatus = typeof RequestStatus[number];

// ============= SCHEMA =============
export const RequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(REQUEST_TYPES),
  title: z.string(),
  details: z.string(),
  amount: z.number().nullable().default(null),
  status: z.enum(RequestStatus),
  createdAt: z.string(),
  decidedBy: z.string().nullable().default(null),
  decidedAt: z.string().nullable().default(null),
  decisionNote: z.string().nullable().default(null),
  attachmentIds: z.array(z.string()).default([]),
});
export type Request = z.infer<typeof RequestSchema>;

export const RequestFileSchema = z.object({
  requests: z.array(RequestSchema),
});
export type RequestFile = z.infer<typeof RequestFileSchema>;

const EMPTY: RequestFile = { requests: [] };

function pathFor(userId: string): string {
  return `requests/${userId}.json`;
}

// ============= READS =============
export async function listUserRequests(userId: string): Promise<Request[]> {
  const data = await readJson(pathFor(userId), RequestFileSchema, EMPTY);
  return data.requests;
}

export async function getRequest(userId: string, id: string): Promise<Request | null> {
  const reqs = await listUserRequests(userId);
  return reqs.find(r => r.id === id) ?? null;
}

// Return pending requests routed to the given approver. A request is routed to
// an approver when the requester's managerId === approverId. Additionally,
// requests from requesters with no manager are visible to any approver (as long
// as the approver is not the requester themselves).
export async function listPendingRoutedTo(approverId: string): Promise<Request[]> {
  const users = await listUsers();
  const managerOf = new Map(users.map(u => [u.id, u.managerId] as const));
  const out: Request[] = [];
  for (const u of users) {
    const reqs = await listUserRequests(u.id);
    for (const r of reqs) {
      if (r.status !== 'pending') continue;
      if (r.userId === approverId) continue;
      const managerId = managerOf.get(r.userId) ?? null;
      if (managerId === approverId || managerId === null) {
        out.push(r);
      }
    }
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ============= WRITES =============
export type CreateRequestInput = {
  userId: string;
  type: RequestType;
  title: string;
  details: string;
  amount?: number | null;
  attachmentIds?: string[];
};

export async function createRequest(input: CreateRequestInput): Promise<Request> {
  const result = await updateJson(pathFor(input.userId), RequestFileSchema, EMPTY, (current) => {
    const newReq: Request = {
      id: `req_${crypto.randomBytes(6).toString('hex')}`,
      userId: input.userId,
      type: input.type,
      title: input.title,
      details: input.details,
      amount: input.type === 'expense' ? (input.amount ?? null) : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      attachmentIds: input.attachmentIds ?? [],
    };
    return { requests: [...current.requests, newReq] };
  });
  return result.requests[result.requests.length - 1]!;
}

export async function withdrawRequest(userId: string, id: string): Promise<void> {
  await updateJson(pathFor(userId), RequestFileSchema, EMPTY, (current) => ({
    requests: current.requests.filter(r => !(r.id === id && r.status === 'pending')),
  }));
}

export async function decideRequest(
  userId: string,
  id: string,
  decision: 'approved' | 'rejected',
  decidedBy: string,
  note?: string,
): Promise<void> {
  if (userId === decidedBy) {
    throw new Error('Cannot decide your own request');
  }
  await updateJson(pathFor(userId), RequestFileSchema, EMPTY, (current) => {
    const target = current.requests.find(r => r.id === id);
    if (!target) throw new Error('Request not found');
    if (target.status !== 'pending') {
      throw new Error(`Request already ${target.status}`);
    }
    return {
      requests: current.requests.map(r =>
        r.id === id
          ? { ...r, status: decision, decidedBy, decidedAt: new Date().toISOString(), decisionNote: note ?? null }
          : r,
      ),
    };
  });
}
