// app/(portal)/document-center/[slug]/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { getDocument } from '@/lib/db/documents';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

// ============= PAGE =============
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();
  const { slug } = await params;
  const doc = await getDocument(slug);
  if (!doc) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/document-center">
          <Button variant="ghost" size="sm">← All documents</Button>
        </Link>
        {doc.updatedAt && (
          <span className="text-xs text-text-muted">Updated {doc.updatedAt}</span>
        )}
      </div>

      <GlassPanel>
        <div
          className="prose-doc"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </GlassPanel>
    </div>
  );
}
