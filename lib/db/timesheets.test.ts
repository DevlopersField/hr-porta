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

  it('allows logging time against any existing project', async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const p = await makeProject('Maintained');
    const entry = await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 1 });
    expect(entry.hours).toBe(1);
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

describe('task-scoped entries', () => {
  it('stores taskId when the task belongs to the project', async () => {
    const { addTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const { addProjectTask } = await import('./projects');
    const p = await makeProject('Tasked');
    const task = await addProjectTask(p.id, 'Design');
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, taskId: task.id, date: '2026-07-14', hours: 2 });
    const listed = await listMonthEntries('u1', '2026-07');
    expect(listed[0]!.taskId).toBe(task.id);
  });

  it('defaults taskId to null (Other) when omitted', async () => {
    const { addTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const p = await makeProject('Untasked');
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 1 });
    expect((await listMonthEntries('u1', '2026-07'))[0]!.taskId).toBeNull();
  });

  it("rejects a taskId that doesn't belong to the project", async () => {
    const { addTimesheetEntry } = await import('./timesheets');
    const { addProjectTask } = await import('./projects');
    const a = await makeProject('A');
    const b = await makeProject('B');
    const taskB = await addProjectTask(b.id, 'Bwork');
    await expect(
      addTimesheetEntry({ userId: 'u1', projectId: a.id, taskId: taskB.id, date: '2026-07-14', hours: 1 }),
    ).rejects.toThrow(/task/i);
  });
});

describe('listEntriesInRange', () => {
  it('returns entries between from and to inclusive, newest first', async () => {
    const { addTimesheetEntry, listEntriesInRange } = await import('./timesheets');
    const p = await makeProject('Range');
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-12', hours: 1 }); // Sunday before
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-13', hours: 2 }); // Monday
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-19', hours: 3 }); // Sunday
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-20', hours: 4 }); // Monday after
    const week = await listEntriesInRange('u1', '2026-07-13', '2026-07-19');
    expect(week.map(e => e.date)).toEqual(['2026-07-19', '2026-07-13']);
  });
});

describe('hours format helpers', () => {
  it('parseHoursInput accepts H:MM and decimal forms', async () => {
    const { parseHoursInput } = await import('./timesheets');
    expect(parseHoursInput('5:30')).toBe(5.5);
    expect(parseHoursInput('0:15')).toBe(0.25);
    expect(parseHoursInput('8')).toBe(8);
    expect(parseHoursInput('7.75')).toBe(7.75);
    expect(parseHoursInput(' 2:45 ')).toBe(2.75);
  });

  it('parseHoursInput rejects garbage and invalid minutes', async () => {
    const { parseHoursInput } = await import('./timesheets');
    expect(() => parseHoursInput('abc')).toThrow(/hours/i);
    expect(() => parseHoursInput('5:60')).toThrow(/hours/i);
    expect(() => parseHoursInput('5:7')).toThrow(/hours/i); // minutes must be 2 digits
    expect(() => parseHoursInput('')).toThrow(/hours/i);
    expect(() => parseHoursInput('-1:30')).toThrow(/hours/i);
  });

  it('formatHoursHM renders decimal hours as H:MM', async () => {
    const { formatHoursHM } = await import('./timesheets');
    expect(formatHoursHM(5.5)).toBe('5:30');
    expect(formatHoursHM(0.25)).toBe('0:15');
    expect(formatHoursHM(8)).toBe('8:00');
    expect(formatHoursHM(7.755)).toBe('7:45'); // rounds to nearest minute-ish
  });
});

describe('updateTimesheetEntry', () => {
  it('edits hours, note, date, and project of an existing entry', async () => {
    const { addTimesheetEntry, updateTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const a = await makeProject('Alpha');
    const b = await makeProject('Beta');
    const e = await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-14', hours: 2, note: 'old' });
    await updateTimesheetEntry('u1', e.id, { projectId: b.id, date: '2026-07-15', hours: 3.5, note: 'new' });
    const listed = await listMonthEntries('u1', '2026-07');
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ projectId: b.id, date: '2026-07-15', hours: 3.5, note: 'new' });
  });

  it('throws for a missing entry', async () => {
    const { updateTimesheetEntry } = await import('./timesheets');
    await expect(updateTimesheetEntry('u1', 'tse_missing', { hours: 1 })).rejects.toThrow(/not found/i);
  });

  it('enforces the 24h day cap excluding the entry being edited', async () => {
    const { addTimesheetEntry, updateTimesheetEntry } = await import('./timesheets');
    const p = await makeProject('Gamma');
    await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 20 });
    const e = await addTimesheetEntry({ userId: 'u1', projectId: p.id, date: '2026-07-14', hours: 2 });
    // Raising the second entry to 4h keeps the day at 24 — allowed.
    await updateTimesheetEntry('u1', e.id, { hours: 4 });
    // Raising it further busts the cap.
    await expect(updateTimesheetEntry('u1', e.id, { hours: 5 })).rejects.toThrow(/24/);
  });

  it('allows switching to a different existing project', async () => {
    const { addTimesheetEntry, updateTimesheetEntry, listMonthEntries } = await import('./timesheets');
    const a = await makeProject('Live');
    const done = await makeProject('Done');
    const e = await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-14', hours: 1 });
    await updateTimesheetEntry('u1', e.id, { projectId: done.id });
    const listed = await listMonthEntries('u1', '2026-07');
    expect(listed[0]!.projectId).toBe(done.id);
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

describe('sumHoursForProjectAllUsers', () => {
  it('sums hours logged against a project across multiple user shards', async () => {
    const { addTimesheetEntry, sumHoursForProjectAllUsers } = await import('./timesheets');
    const a = await makeProject('Alpha');
    const b = await makeProject('Beta');
    await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-01', hours: 2 });
    await addTimesheetEntry({ userId: 'u1', projectId: b.id, date: '2026-07-02', hours: 1 });
    await addTimesheetEntry({ userId: 'u2', projectId: a.id, date: '2026-07-03', hours: 4 });
    await addTimesheetEntry({ userId: 'u3', projectId: a.id, date: '2026-07-04', hours: 1.5 });
    const total = await sumHoursForProjectAllUsers(a.id, ['u1', 'u2', 'u3']);
    expect(total).toBe(7.5);
  });

  it('ignores users not passed in and returns 0 when nobody logged time', async () => {
    const { addTimesheetEntry, sumHoursForProjectAllUsers } = await import('./timesheets');
    const a = await makeProject('Alpha');
    await addTimesheetEntry({ userId: 'u1', projectId: a.id, date: '2026-07-01', hours: 2 });
    expect(await sumHoursForProjectAllUsers(a.id, ['u2', 'u3'])).toBe(0);
    expect(await sumHoursForProjectAllUsers(a.id, [])).toBe(0);
  });
});
