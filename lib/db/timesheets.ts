// lib/db/timesheets.ts
// Manual project time entries: employees pick a project and log hours per
// day. Distinct from attendance (clock in/out), which tracks presence.
// Write-heavy per-user data, so per-user shards.

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { getProject } from './projects';
import { formatHoursHM } from '../format-hours';

// Re-exported so existing call sites keep working unchanged; the canonical,
// dependency-free definition lives in lib/format-hours.ts.
export { formatHoursHM };

// ============= CONSTANTS =============
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HOURS_PER_DAY = 24;

// ============= SCHEMA =============
export const TimesheetEntrySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  // null = the project's implicit "Other" bucket.
  taskId: z.string().nullable().default(null),
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

// ============= HOURS FORMAT =============
// Users enter time as "5:30" (hours:minutes) or a plain decimal like "7.5".
export function parseHoursInput(raw: string): number {
  const s = raw.trim();
  const hm = /^(\d{1,2}):([0-5]\d)$/.exec(s);
  if (hm) {
    return parseInt(hm[1]!, 10) + parseInt(hm[2]!, 10) / 60;
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    return parseFloat(s);
  }
  throw new Error('Invalid hours — use H:MM (e.g. 5:30) or a decimal (e.g. 7.5)');
}


// ============= READS =============
// monthPrefix is 'YYYY-MM'. Newest date first, ties broken by createdAt desc.
export async function listMonthEntries(userId: string, monthPrefix: string): Promise<TimesheetEntry[]> {
  const data = await readJson(pathFor(userId), TimesheetFileSchema, EMPTY);
  return data.entries
    .filter(e => e.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// Inclusive from..to (YYYY-MM-DD), newest date first — powers the weekly grid.
export async function listEntriesInRange(userId: string, from: string, to: string): Promise<TimesheetEntry[]> {
  const data = await readJson(pathFor(userId), TimesheetFileSchema, EMPTY);
  return data.entries
    .filter(e => e.date >= from && e.date <= to)
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
  taskId?: string | null;
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
  const taskId = input.taskId ?? null;
  if (taskId !== null && !project.tasks.some(t => t.id === taskId)) {
    throw new Error('Task does not belong to this project');
  }

  const entry: TimesheetEntry = {
    id: `tse_${crypto.randomBytes(6).toString('hex')}`,
    projectId: input.projectId,
    taskId,
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

export type UpdateTimesheetEntryInput = {
  projectId?: string;
  taskId?: string | null;
  date?: string;
  hours?: number;
  note?: string;
};

export async function updateTimesheetEntry(
  userId: string,
  entryId: string,
  patch: UpdateTimesheetEntryInput,
): Promise<void> {
  if (patch.date !== undefined && !DATE_RE.test(patch.date)) {
    throw new Error('Invalid date (expected YYYY-MM-DD)');
  }
  if (patch.hours !== undefined && (!Number.isFinite(patch.hours) || patch.hours <= 0 || patch.hours > MAX_HOURS_PER_DAY)) {
    throw new Error(`Invalid hours (must be between 0 and ${MAX_HOURS_PER_DAY})`);
  }
  if (patch.projectId !== undefined) {
    const project = await getProject(patch.projectId);
    if (!project) throw new Error('Project not found');
    const taskId = patch.taskId ?? null;
    if (taskId !== null && !project.tasks.some(t => t.id === taskId)) {
      throw new Error('Task does not belong to this project');
    }
  }
  await updateJson(pathFor(userId), TimesheetFileSchema, EMPTY, (current) => {
    const target = current.entries.find(e => e.id === entryId);
    if (!target) throw new Error('Entry not found');
    const next: TimesheetEntry = {
      ...target,
      ...(patch.projectId !== undefined && { projectId: patch.projectId }),
      ...(patch.taskId !== undefined && { taskId: patch.taskId }),
      ...(patch.date !== undefined && { date: patch.date }),
      ...(patch.hours !== undefined && { hours: patch.hours }),
      ...(patch.note !== undefined && { note: patch.note.trim() }),
    };
    const dayTotal = current.entries
      .filter(e => e.id !== entryId && e.date === next.date)
      .reduce((sum, e) => sum + e.hours, 0);
    if (dayTotal + next.hours > MAX_HOURS_PER_DAY) {
      throw new Error(`Day total would exceed ${MAX_HOURS_PER_DAY} hours (already logged: ${dayTotal})`);
    }
    return { entries: current.entries.map(e => (e.id === entryId ? next : e)) };
  });
}

export async function deleteTimesheetEntry(userId: string, entryId: string): Promise<void> {
  await updateJson(pathFor(userId), TimesheetFileSchema, EMPTY, (current) => ({
    entries: current.entries.filter(e => e.id !== entryId),
  }));
}

// ============= AGGREGATES =============
// Total hours logged against a project across every given user's shard, all
// time. Admin-only (Projects page), so O(users) file reads is acceptable.
export async function sumHoursForProjectAllUsers(projectId: string, userIds: string[]): Promise<number> {
  let total = 0;
  for (const userId of userIds) {
    const data = await readJson(pathFor(userId), TimesheetFileSchema, EMPTY);
    total += data.entries
      .filter(e => e.projectId === projectId)
      .reduce((sum, e) => sum + e.hours, 0);
  }
  return total;
}
