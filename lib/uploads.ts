/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/uploads.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDataDir } from './db/core';

// ============= CONFIG =============
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB


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

// ============= PUBLIC/PRIVATE SPLIT =============
// Only branding + avatar images are servable by the unauthenticated
// /api/uploads route. Private attachments (file-<hex>.<ext>, written by
// saveUploadedFile) must go through the auth-gated /api/files/[id] route.
const PUBLIC_FILENAME_RE = /^(logo|favicon|hero|avatar)-[a-f0-9]+\.[a-z0-9]+$/;

export function isPublicUploadFilename(filename: string): boolean {
  return PUBLIC_FILENAME_RE.test(filename);
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
    ext === 'pdf' ? 'application/pdf' :
    ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
    ext === 'csv' ? 'text/csv' :
    ext === 'txt' ? 'text/plain' :
    'application/octet-stream';
  return { buffer, contentType };
}

// ============= GENERAL FILE UPLOADS (images + documents) =============
// Broader than saveUploadedImage: accepts docs too, and returns metadata for the
// attachment registry. Files land in the same uploads/ dir but are served ONLY
// through the auth-gated /api/files/[id] route (never the public /api/uploads).
const ALLOWED_FILE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'txt',
};
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// The `accept` attribute string for file inputs, kept in sync with ALLOWED_FILE_EXT.
export const FILE_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,.pdf,.docx,.xlsx,.csv,.txt';

export type StoredFile = { storedName: string; originalName: string; mime: string; size: number };

export function isImageMime(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp';
}

export async function saveUploadedFile(file: File): Promise<StoredFile> {
  const ext = ALLOWED_FILE_EXT[file.type];
  if (!ext) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }
  if (file.size === 0) {
    throw new Error('Empty file');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_FILE_BYTES})`);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const rand = crypto.randomBytes(8).toString('hex');
  const storedName = `file-${rand}.${ext}`;
  const target = path.join(getDataDir(), 'uploads', storedName);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buf);
  // Preserve a human-friendly original name (sanitized) for downloads.
  const originalName = (file.name || `attachment.${ext}`).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120);
  return { storedName, originalName, mime: file.type, size: file.size };
}
