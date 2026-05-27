// lib/db/documents.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('getDocument slug validation', () => {
  it("returns null for '../../../etc/passwd' (slug regex rejects)", async () => {
    const { getDocument } = await import('./documents');
    expect(await getDocument('../../../etc/passwd')).toBeNull();
  });

  it("returns null for 'foo/bar' (slash rejected)", async () => {
    const { getDocument } = await import('./documents');
    expect(await getDocument('foo/bar')).toBeNull();
  });

  it("returns null for a syntactically valid but non-existent slug", async () => {
    const { getDocument } = await import('./documents');
    expect(await getDocument('non-existent-document-slug-zzz')).toBeNull();
  });
});

describe('listDocuments', () => {
  it('returns at least the two seeded docs (employee-handbook, code-of-conduct)', async () => {
    const { listDocuments } = await import('./documents');
    const docs = await listDocuments();
    const slugs = docs.map(d => d.slug);
    expect(slugs).toContain('employee-handbook');
    expect(slugs).toContain('code-of-conduct');
  });

  it('returns docs with required fields (slug, title, category, updatedAt)', async () => {
    const { listDocuments } = await import('./documents');
    const docs = await listDocuments();
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      expect(typeof doc.slug).toBe('string');
      expect(typeof doc.title).toBe('string');
      expect(typeof doc.category).toBe('string');
      expect(typeof doc.updatedAt).toBe('string');
    }
  });
});

describe('getDocument positive path (uses real seeded docs)', () => {
  it('returns full document with html + raw for the employee-handbook slug', async () => {
    const { getDocument } = await import('./documents');
    const doc = await getDocument('employee-handbook');
    expect(doc).not.toBeNull();
    expect(doc?.slug).toBe('employee-handbook');
    expect(doc?.title).toBe('Employee Handbook');
    expect(doc?.category).toBe('Policies');
    expect(typeof doc?.updatedAt).toBe('string');
    expect(typeof doc?.html).toBe('string');
    expect(typeof doc?.raw).toBe('string');
    expect(doc!.html.length).toBeGreaterThan(0);
  });
});

describe('getDocument HTML sanitization', () => {
  const fixtureSlug = 'test-xss-fixture';
  const fixturePath = path.join(process.cwd(), 'content', 'document-center', `${fixtureSlug}.md`);

  beforeEach(async () => {
    const body = [
      '---',
      'title: XSS Fixture',
      'category: Test',
      'updatedAt: 2025-01-01',
      '---',
      '',
      '# Hello',
      '',
      '<script>alert(1)</script>',
      '',
      '<img src="x" onerror="alert(2)" />',
      '',
      'Some safe **bold** text.',
      '',
    ].join('\n');
    await fs.writeFile(fixturePath, body, 'utf8');
  });

  afterEach(async () => {
    await fs.unlink(fixturePath).catch(() => {});
  });

  it('strips <script> tags from rendered HTML', async () => {
    const { getDocument } = await import('./documents');
    const doc = await getDocument(fixtureSlug);
    expect(doc).not.toBeNull();
    expect(doc!.html).not.toContain('<script>');
    expect(doc!.html).not.toContain('alert(1)');
  });

  it('strips event handler attributes like onerror', async () => {
    const { getDocument } = await import('./documents');
    const doc = await getDocument(fixtureSlug);
    expect(doc).not.toBeNull();
    expect(doc!.html).not.toContain('onerror');
  });

  it('preserves safe markdown rendering (bold)', async () => {
    const { getDocument } = await import('./documents');
    const doc = await getDocument(fixtureSlug);
    expect(doc).not.toBeNull();
    expect(doc!.html).toContain('<strong>bold</strong>');
  });
});
