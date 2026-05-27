// lib/db/documents.ts

// ============= IMPORTS =============
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// ============= TYPES =============
export type DocMetadata = {
  slug: string;
  title: string;
  category: string;
  updatedAt: string;
};

export type DocFull = DocMetadata & {
  html: string;
  raw: string;
};

// ============= CONFIG =============
function contentDir(): string {
  return path.join(process.cwd(), 'content', 'document-center');
}

// ============= READS =============
export async function listDocuments(): Promise<DocMetadata[]> {
  const dir = contentDir();
  let entries: string[];
  try { entries = await fs.readdir(dir); }
  catch { return []; }
  const docs: DocMetadata[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const slug = entry.slice(0, -3);
    const raw = await fs.readFile(path.join(dir, entry), 'utf8');
    const { data } = matter(raw);
    docs.push({
      slug,
      title: String(data.title ?? slug),
      category: String(data.category ?? 'Uncategorized'),
      updatedAt: String(data.updatedAt ?? ''),
    });
  }
  return docs.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getDocument(slug: string): Promise<DocFull | null> {
  // Strict slug validation: no path traversal
  if (!/^[a-z0-9_-]+$/i.test(slug)) return null;
  const file = path.join(contentDir(), `${slug}.md`);
  let raw: string;
  try { raw = await fs.readFile(file, 'utf8'); }
  catch { return null; }
  const { data, content } = matter(raw);
  const rawHtml = await marked.parse(content);
  const html = DOMPurify.sanitize(rawHtml) as string;
  return {
    slug,
    title: String(data.title ?? slug),
    category: String(data.category ?? 'Uncategorized'),
    updatedAt: String(data.updatedAt ?? ''),
    html,
    raw: content,
  };
}
