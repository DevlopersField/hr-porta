// lib/db/attendance.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => { makeTempDataDir(); });

describe('clockIn', () => {
  it('creates an open day with clockOut=null', async () => {
    const { clockIn } = await import('./attendance');
    const rec = await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    expect(rec.date).toBe('2026-05-01');
    expect(rec.clockOut).toBeNull();
    expect(rec.clockIn).toBe('2026-05-01T09:00:00.000Z');
    expect(rec.totalMinutes).toBe(0);
  });

  it('throws when an open day already exists', async () => {
    const { clockIn } = await import('./attendance');
    await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    await expect(clockIn('u1', new Date('2026-05-02T09:00:00Z'))).rejects.toThrow(/Already clocked in on 2026-05-01/);
  });

  it('throws when same-date closed record already exists', async () => {
    const { clockIn, clockOut } = await import('./attendance');
    await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    await clockOut('u1', new Date('2026-05-01T17:00:00Z'));
    await expect(clockIn('u1', new Date('2026-05-01T18:00:00Z'))).rejects.toThrow(/Already worked on 2026-05-01/);
  });
});

describe('clockOut', () => {
  it("throws 'Not clocked in.' when no open day", async () => {
    const { clockOut } = await import('./attendance');
    await expect(clockOut('u1', new Date('2026-05-01T17:00:00Z'))).rejects.toThrow(/Not clocked in/);
  });

  it('sets clockOut and computes totalMinutes correctly (510 for 09:00→17:30)', async () => {
    const { clockIn, clockOut } = await import('./attendance');
    await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    const closed = await clockOut('u1', new Date('2026-05-01T17:30:00Z'));
    expect(closed.clockOut).toBe('2026-05-01T17:30:00.000Z');
    expect(closed.totalMinutes).toBe(510);
  });
});

describe('listMonth', () => {
  it('returns only days in the requested month, sorted by date', async () => {
    const { clockIn, clockOut, listMonth } = await import('./attendance');
    // Apr 30
    await clockIn('u1', new Date('2026-04-30T09:00:00Z'));
    await clockOut('u1', new Date('2026-04-30T17:00:00Z'));
    // May 5
    await clockIn('u1', new Date('2026-05-05T09:00:00Z'));
    await clockOut('u1', new Date('2026-05-05T17:00:00Z'));
    // May 1 (insert out-of-order to verify sorting)
    await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    await clockOut('u1', new Date('2026-05-01T17:00:00Z'));
    // Jun 1
    await clockIn('u1', new Date('2026-06-01T09:00:00Z'));
    await clockOut('u1', new Date('2026-06-01T17:00:00Z'));

    const may = await listMonth('u1', 2026, 5);
    expect(may.map(d => d.date)).toEqual(['2026-05-01', '2026-05-05']);
  });
});

describe('getOpenDay', () => {
  it('returns null when none open', async () => {
    const { getOpenDay } = await import('./attendance');
    expect(await getOpenDay('u-nobody')).toBeNull();
  });

  it('returns the open record when one exists', async () => {
    const { clockIn, getOpenDay } = await import('./attendance');
    await clockIn('u1', new Date('2026-05-01T09:00:00Z'));
    const open = await getOpenDay('u1');
    expect(open?.date).toBe('2026-05-01');
    expect(open?.clockOut).toBeNull();
  });
});
