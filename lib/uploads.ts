/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/uploads.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// ============= CONFIG =============
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
}

// ============= TYPES =============
export type UploadResult = { filename: string; publicUrl: string };

// ============= SAVE =============
export async function saveUploadedImage(
  file: File,
  purpose: 'logo' | 'favicon' | 'hero' | 'avatar',
): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type as any)) {
    throw new Error(`Invalid MIME type: ${file.type}`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_SIZE_BYTES})`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const ext = EXT_BY_MIME[file.type]!;
  const filename = `${purpose}-${hash}.${ext}`;
  const target = path.join(getDataDir(), 'uploads', filename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buf);

  return { filename, publicUrl: `/api/uploads/${filename}` };
}

// ============= READ =============
export async function readUploadStream(filename: string): Promise<{ buffer: Buffer; contentType: string }> {
  // Strict filename validation: no slashes, no traversal, must match our pattern
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  const full = path.join(getDataDir(), 'uploads', filename);
  const buffer = await fs.readFile(full);
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'png' ? 'image/png' :
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'webp' ? 'image/webp' :
    ext === 'svg' ? 'image/svg+xml' :
    'application/octet-stream';
  return { buffer, contentType };
}
