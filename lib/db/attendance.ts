// lib/db/attendance.ts

// ============= IMPORTS =============
import { z } from 'zod';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const DayRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clockIn: z.string(),
  clockOut: z.string().nullable(),
  totalMinutes: z.number().nonnegative(),
  note: z.string().default(''),
});
export type DayRecord = z.infer<typeof DayRecordSchema>;

export const AttendanceFileSchema = z.object({
  days: z.array(DayRecordSchema),
});
export type AttendanceFile = z.infer<typeof AttendanceFileSchema>;

const EMPTY: AttendanceFile = { days: [] };

function pathFor(userId: string): string {
  return `attendance/${userId}.json`;
}

// ============= HELPERS =============
export function todayInUtcDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ============= READS =============
export async function listDays(userId: string): Promise<DayRecord[]> {
  const data = await readJson(pathFor(userId), AttendanceFileSchema, EMPTY);
  return data.days;
}

export async function getOpenDay(userId: string): Promise<DayRecord | null> {
  const days = await listDays(userId);
  return days.find(d => d.clockOut === null) ?? null;
}

export async function listMonth(userId: string, year: number, month: number): Promise<DayRecord[]> {
  const days = await listDays(userId);
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return days
    .filter(d => d.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============= WRITES =============
export async function clockIn(userId: string, when = new Date(), note = ''): Promise<DayRecord> {
  const date = todayInUtcDate(when);
  const result = await updateJson(pathFor(userId), AttendanceFileSchema, EMPTY, (current) => {
    const open = current.days.find(d => d.clockOut === null);
    if (open) throw new Error(`Already clocked in on ${open.date}. Clock out first.`);
    const sameDay = current.days.find(d => d.date === date);
    if (sameDay) throw new Error(`Already worked on ${date} (clocked out at ${sameDay.clockOut}). Re-clocking same day is not allowed in v1.`);
    const newDay: DayRecord = {
      date,
      clockIn: when.toISOString(),
      clockOut: null,
      totalMinutes: 0,
      note,
    };
    return { days: [...current.days, newDay] };
  });
  return result.days[result.days.length - 1]!;
}

export async function clockOut(userId: string, when = new Date()): Promise<DayRecord> {
  let closed: DayRecord | null = null;
  await updateJson(pathFor(userId), AttendanceFileSchema, EMPTY, (current) => {
    const idx = current.days.findIndex(d => d.clockOut === null);
    if (idx === -1) throw new Error('Not clocked in.');
    const open = current.days[idx]!;
    const totalMinutes = Math.max(0, Math.round((when.getTime() - new Date(open.clockIn).getTime()) / 60000));
    closed = { ...open, clockOut: when.toISOString(), totalMinutes };
    const next = [...current.days];
    next[idx] = closed;
    return { days: next };
  });
  return closed!;
}

export async function annotateDay(userId: string, date: string, note: string): Promise<void> {
  await updateJson(pathFor(userId), AttendanceFileSchema, EMPTY, (current) => ({
    days: current.days.map(d => d.date === date ? { ...d, note } : d),
  }));
}
