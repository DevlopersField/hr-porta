// lib/db/documents.test.ts
import { describe, it, expect } from 'vitest';

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
