// lib/db/timesheets.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => {
  makeTempDataDir();
});

async function makeProject(name = 'Website Redesign') {
  const { createProject } = await import('./projects');
  return createProject({ name });
}

describe('addTimesheetEntry', () => {
  it('adds a manual entry with project, date, hours, and note', async () => {
    const { addTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const p = await makeProject();
    const entry = await addTimesheetEntry({
      userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 3.5, note: 'wireframes',
    });
    expect(entry.id).toMatch(/^tse_/);
    expect(entry.hours).toBe(3.5);
    const listed = await listMonthEntries('u1', '2026-07');
    expect(listed).toHaveLength(1);
    expect(listed[0]!.projectId).toBe(p.id);
  });

  it('rejects an unknown project', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    await expect(
      addTimesheetEntry({ userId: 'u1', projectId: 'prj_nope', date: '2026-07-14', hours: 1 }),
    ).rejects.toThrow(/project/i);
  });

  it('rejects an archived project', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const { setProjectActive } = await import('./projects');
    const p = await makeProject('Sunset');
    await setProjectActive(p.id, false);
    await expect(
      addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 1 }),
    ).rejects.toThrow(/archived/i);
  });

  it('rejects invalid hours (zero, negative, >24, bad increments ok)', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const p = await makeProject();
    await expect(addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 0 })).rejects.toThrow(/hours/i);
    await expect(addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: -2 })).rejects.toThrow(/hours/i);
    await expect(addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 25 })).rejects.toThrow(/hours/i);
  });

  it('rejects a malformed date', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const p = await makeProject();
    await expect(addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '14/07/2026', hours: 1 })).rejects.toThrow(/date/i);
  });

  it('caps a single day at 24 total hours across entries', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const p = await makeProject();
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 20 });
    await expect(
      addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 5 }),
    ).rejects.toThrow(/24/);
  });
});

describe('deleteTimesheetEntry', () => {
  it('removes an entry by id', async () => {
    const { addTimesheetEntry, deleteTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const p = await makeProject();
    const e = await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 2 });
    await deleteTimesheetEntry('u1', e.id);
    expect(await listMonthEntries('u1', '2026-07')).toHaveLength(0);
  });
});

describe('listMonthEntries', () => {
  it('returns only the requested month, newest date first', async () => {
    const { addTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const p = await makeProject();
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-06-30', hours: 1 });
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-02', hours: 2 });
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-10', hours: 3 });
    const july = await listMonthEntries('u1', '2026-07');
    expect(july.map(e => e.date)).toEqual(['2026-07-10', '2026-07-02']);
  });
});

describe('summarizeByProject', () => {
  it('totals hours per project', async () => {
    const { addTimesheetEntry, listMonthEntries, summarizeByProject } = await import('./timesheets');
    const a = await makeProject('Alpha');
    const b = await makeProject('Beta');
    await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-01', hours: 2 });
    await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-02', hours: 3.5 });
    await addTimesheetEntry({ userId: 'u1', projectId: b.id, date: '2026-07-02', hours: 1 });
    const entries = await listMonthEntries('u1', '2026-07');
    const totals = summarizeByProject(entries);
    expect(totals.get(a.id)).toBe(5.5);
    expect(totals.get(b.id)).toBe(1);
  });
});
