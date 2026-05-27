// lib/uploads.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { makeTempDataDir } from '../tests/setup';

let dir: string;
beforeEach(() => { dir = makeTempDataDir(); });

describe('saveUploadedImage', () => {
  it('rejects when MIME is text/html', async () => {
    const { saveUploadedImage } = await import('./uploads');
    const file = new File([new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c])], 'x.html', { type: 'text/html' });
    await expect(saveUploadedImage(file, 'logo')).rejects.toThrow(/Invalid MIME type/);
  });

  it('rejects when file > 2MB', async () => {
    const { saveUploadedImage } = await import('./uploads');
    const big = new Uint8Array(Math.floor(2.1 * 1024 * 1024));
    const file = new File([big], 'big.png', { type: 'image/png' });
    await expect(saveUploadedImage(file, 'logo')).rejects.toThrow(/File too large/);
  });

  it('writes the file under data/uploads/ and returns filename + publicUrl', async () => {
    const { saveUploadedImage } = await import('./uploads');
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'tiny.png', { type: 'image/png' });
    const result = await saveUploadedImage(file, 'logo');
    expect(result.filename).toBeTruthy();
    expect(result.publicUrl.startsWith('/api/uploads/')).toBe(true);
    // File should actually be on disk under DATA_DIR/uploads
    const onDisk = path.join(dir, 'uploads', result.filename);
    const stat = await fs.stat(onDisk);
    expect(stat.isFile()).toBe(true);
  });

  it('generates filename of form logo-<hexhash>.png', async () => {
    const { saveUploadedImage } = await import('./uploads');
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'tiny.png', { type: 'image/png' });
    const result = await saveUploadedImage(file, 'logo');
    expect(result.filename).toMatch(/^logo-[a-f0-9]+\.png$/);
  });
});

describe('readUploadStream', () => {
  it("rejects '../etc/passwd' as invalid filename", async () => {
    const { readUploadStream } = await import('./uploads');
    await expect(readUploadStream('../etc/passwd')).rejects.toThrow(/Invalid filename/);
  });

  it("rejects 'a/b.png' (slash) as invalid filename", async () => {
    const { readUploadStream } = await import('./uploads');
    await expect(readUploadStream('a/b.png')).rejects.toThrow(/Invalid filename/);
  });

  it('returns buffer + image/png content-type for a previously saved png', async () => {
    const { saveUploadedImage, readUploadStream } = await import('./uploads');
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'tiny.png', { type: 'image/png' });
    const saved = await saveUploadedImage(file, 'logo');
    const { buffer, contentType } = await readUploadStream(saved.filename);
    expect(contentType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('throws (ENOENT) on missing file', async () => {
    const { readUploadStream } = await import('./uploads');
    await expect(readUploadStream('missing.png')).rejects.toThrow();
  });
});
