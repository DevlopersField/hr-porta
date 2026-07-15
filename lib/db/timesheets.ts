// lib/db/timesheets.ts
// Manual project time entries: employees pick a project and log hours per
// day. Distinct from attendance (clock in/out), which tracks presence.
// Write-heavy per-user data, so per-user shards.

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { getProject } from './projects';

// ============= CONSTANTS =============
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HOURS_PER_DAY = 24;

// ============= SCHEMA =============
export const TimesheetEntrySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string().regex(DATE_RE),
  hours: z.number(),
  note: z.string().default(''),
  createdAt: z.string(),
});
export type TimesheetEntry = z.infer<typeof TimesheetEntrySchema>;

export const TimesheetFileSchema = z.object({
  entries: z.array(TimesheetEntrySchema),
});
export type TimesheetFile = z.infer<typeof TimesheetFileSchema>;

const EMPTY: TimesheetFile = { entries: [] };

function pathFor(userId: string): string {
  return `timesheets/${userId}.json`;
}

// ============= READS =============
// monthPrefix is 'YYYY-MM'. Newest date first, ties broken by createdAt desc.
export async function listMonthEntries(userId: string, monthPrefix: string): Promise<TimesheetEntry[]> {
  const data = await readJson(pathFor(userId), TimesheetFileSchema, EMPTY);
  return data.entries
    .filter(e => e.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// Pure helper: total hours per projectId.
export function summarizeByProject(entries: TimesheetEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of entries) {
    totals.set(e.projectId, (totals.get(e.projectId) ?? 0) + e.hours);
  }
  return totals;
}

// ============= WRITES =============
export type AddTimesheetEntryInput = {
  userId: string;
  projectId: string;
  date: string;
  hours: number;
  note?: string;
};

export async function addTimesheetEntry(input: AddTimesheetEntryInput): Promise<TimesheetEntry> {
  if (!DATE_RE.test(input.date)) {
    throw new Error('Invalid date (expected YYYY-MM-DD)');
  }
  if (!Number.isFinite(input.hours) || input.hours <= 0 || input.hours > MAX_HOURS_PER_DAY) {
    throw new Error(`Invalid hours (must be between 0 and ${MAX_HOURS_PER_DAY})`);
  }
  const project = await getProject(input.projectId);
  if (!project) throw new Error('Project not found');
  if (!project.active) throw new Error('Project is archived');

  const entry: TimesheetEntry = {
    id: `tse_${crypto.randomBytes(6).toString('hex')}`,
    projectId: input.projectId,
    date: input.date,
    hours: input.hours,
    note: input.note?.trim() ?? '',
    createdAt: new Date().toISOString(),
  };
  await updateJson(pathFor(input.userId), TimesheetFileSchema, EMPTY, (current) => {
    const dayTotal = current.entries
      .filter(e => e.date === input.date)
      .reduce((sum, e) => sum + e.hours, 0);
    if (dayTotal + input.hours > MAX_HOURS_PER_DAY) {
      throw new Error(`Day total would exceed ${MAX_HOURS_PER_DAY} hours (already logged: ${dayTotal})`);
    }
    return { entries: [...current.entries, entry] };
  });
  return entry;
}

export async function deleteTimesheetEntry(userId: string, entryId: string): Promise<void> {
  await updateJson(pathFor(userId), TimesheetFileSchema, EMPTY, (current) => ({
    entries: current.entries.filter(e => e.id !== entryId),
  }));
}
