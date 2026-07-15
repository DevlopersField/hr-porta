// lib/db/attachments.ts
// Central registry mapping an attachment id -> stored file + owner + scope.
// The auth-gated /api/files/[id] route reads this to enforce access control,
// and modules store attachment ids on their records.

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';
import { saveUploadedFile } from '../uploads';

// ============= TYPES =============
export const ATTACHMENT_MODULES = ['helpdesk', 'request', 'engage', 'document-center'] as const;
export type AttachmentModule = typeof ATTACHMENT_MODULES[number];

// ============= SCHEMA =============
export const AttachmentSchema = z.object({
  id: z.string(),
  storedName: z.string(),
  originalName: z.string(),
  mime: z.string(),
  size: z.number(),
  ownerId: z.string(),
  module: z.enum(ATTACHMENT_MODULES),
  recordId: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const AttachmentsFileSchema = z.object({
  attachments: z.array(AttachmentSchema),
});
export type AttachmentsFile = z.infer<typeof AttachmentsFileSchema>;

const EMPTY: AttachmentsFile = { attachments: [] };
const PATH = 'attachments.json';

// ============= READS =============
export async function getAttachment(id: string): Promise<Attachment | null> {
  const data = await readJson(PATH, AttachmentsFileSchema, EMPTY);
  return data.attachments.find(a => a.id === id) ?? null;
}

export async function listAttachments(ids: string[]): Promise<Attachment[]> {
  if (ids.length === 0) return [];
  const data = await readJson(PATH, AttachmentsFileSchema, EMPTY);
  const set = new Set(ids);
  // Preserve the caller's id order.
  const byId = new Map(data.attachments.filter(a => set.has(a.id)).map(a => [a.id, a]));
  return ids.map(id => byId.get(id)).filter((a): a is Attachment => a !== undefined);
}

export async function listByModule(module: AttachmentModule): Promise<Attachment[]> {
  const data = await readJson(PATH, AttachmentsFileSchema, EMPTY);
  return data.attachments
    .filter(a => a.module === module)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Resolve a list of attachment ids into a Map for render-time lookups.
// Shared by every page that displays attachments on its records.
export async function resolveAttachmentsById(ids: string[]): Promise<Map<string, Attachment>> {
  const list = await listAttachments(ids);
  return new Map(list.map(a => [a.id, a]));
}

// Pick resolved attachments for one record, dropping ids that no longer exist.
export function pickAttachments(byId: Map<string, Attachment>, ids: string[]): Attachment[] {
  return ids.map(id => byId.get(id)).filter((a): a is Attachment => a !== undefined);
}

// Extract the uploaded File objects from a form submission.
export function getUploadedFiles(formData: FormData, field = 'attachments'): File[] {
  return formData.getAll(field).filter((f): f is File => f instanceof File);
}

// ============= WRITES =============
export type CreateAttachmentInput = {
  file: File;
  ownerId: string;
  module: AttachmentModule;
  recordId?: string | null;
};

export async function createAttachment(input: CreateAttachmentInput): Promise<Attachment> {
  const stored = await saveUploadedFile(input.file);
  const attachment: Attachment = {
    id: `att_${crypto.randomBytes(8).toString('hex')}`,
    storedName: stored.storedName,
    originalName: stored.originalName,
    mime: stored.mime,
    size: stored.size,
    ownerId: input.ownerId,
    module: input.module,
    recordId: input.recordId ?? null,
    createdAt: new Date().toISOString(),
  };
  await updateJson(PATH, AttachmentsFileSchema, EMPTY, (current) => ({
    attachments: [...current.attachments, attachment],
  }));
  return attachment;
}

// Backfill the owning record id after the record itself is created (the
// upload-first flow validates files before any module record exists).
export async function setAttachmentsRecord(ids: string[], recordId: string): Promise<void> {
  if (ids.length === 0) return;
  const set = new Set(ids);
  await updateJson(PATH, AttachmentsFileSchema, EMPTY, (current) => ({
    attachments: current.attachments.map(a => (set.has(a.id) ? { ...a, recordId } : a)),
  }));
}

// Save many files (skips empty inputs); returns the created attachment ids.
export async function createAttachmentsFromFiles(
  files: File[],
  ownerId: string,
  module: AttachmentModule,
  recordId?: string | null,
): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const att = await createAttachment({ file, ownerId, module, recordId });
    ids.push(att.id);
  }
  return ids;
}
