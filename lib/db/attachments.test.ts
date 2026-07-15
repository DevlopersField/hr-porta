// lib/db/attachments.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { makeTempDataDir } from '../../tests/setup';

beforeEach(() => {
  makeTempDataDir();
});

function pngFile(name = 'shot.png'): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: 'image/png' });
}

describe('attachments registry', () => {
  it('creates an attachment, stores metadata, and reads it back', async () => {
    const { createAttachment, getAttachment } = await import('./attachments');
    const att = await createAttachment({ file: pngFile(), ownerId: 'u1', module: 'helpdesk', recordId: 'tkt_1' });
    expect(att.id).toMatch(/^att_/);
    expect(att.module).toBe('helpdesk');
    expect(att.recordId).toBe('tkt_1');
    expect(att.originalName).toBe('shot.png');
    const fetched = await getAttachment(att.id);
    expect(fetched?.storedName).toBe(att.storedName);
    expect(fetched?.mime).toBe('image/png');
  });

  it('rejects an unsupported file type', async () => {
    const { createAttachment } = await import('./attachments');
    const bad = new File([new Uint8Array([0])], 'evil.exe', { type: 'application/x-msdownload' });
    await expect(
      createAttachment({ file: bad, ownerId: 'u1', module: 'request' }),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it('lists attachments by module, newest first', async () => {
    const { createAttachment, listByModule } = await import('./attachments');
    await createAttachment({ file: pngFile('a.png'), ownerId: 'u1', module: 'engage' });
    await createAttachment({ file: pngFile('b.png'), ownerId: 'u1', module: 'engage' });
    await createAttachment({ file: pngFile('c.png'), ownerId: 'u1', module: 'helpdesk' });
    const engage = await listByModule('engage');
    expect(engage).toHaveLength(2);
    expect(engage.every(a => a.module === 'engage')).toBe(true);
  });

  it('createAttachmentsFromFiles skips empty inputs and returns ids in order', async () => {
    const { createAttachmentsFromFiles, listAttachments } = await import('./attachments');
    const empty = new File([], 'nothing.png', { type: 'image/png' });
    const ids = await createAttachmentsFromFiles([pngFile('one.png'), empty, pngFile('two.png')], 'u1', 'request', 'req_1');
    expect(ids).toHaveLength(2);
    const list = await listAttachments(ids);
    expect(list.map(a => a.originalName)).toEqual(['one.png', 'two.png']);
  });

  it('setAttachmentsRecord backfills recordId on the given ids only', async () => {
    const { createAttachmentsFromFiles, setAttachmentsRecord, listAttachments } = await import('./attachments');
    const ids = await createAttachmentsFromFiles([pngFile('a.png'), pngFile('b.png')], 'u1', 'request', null);
    const otherIds = await createAttachmentsFromFiles([pngFile('c.png')], 'u1', 'request', null);
    await setAttachmentsRecord(ids, 'req_42');
    const updated = await listAttachments(ids);
    expect(updated.map(a => a.recordId)).toEqual(['req_42', 'req_42']);
    const untouched = await listAttachments(otherIds);
    expect(untouched[0]!.recordId).toBeNull();
  });
});
