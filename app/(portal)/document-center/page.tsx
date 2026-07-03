// app/(portal)/document-center/page.tsx

// ============= IMPORTS =============
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { listDocuments } from '@/lib/db/documents';
import { listByModule } from '@/lib/db/attachments';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { FileInput } from '@/components/ui/FileInput';
import { AttachmentList } from '@/components/ui/AttachmentList';
import { uploadDocumentFilesAction } from './actions';

// ============= PAGE =============
export default async function DocumentCenterPage() {
  const user = await requireSession();
  const docs = await listDocuments();
  const files = await listByModule('document-center');
  const canEdit = hasPermission(user, PERMISSIONS.EDIT_DOCUMENTS);

  // ============= GROUP BY CATEGORY =============
  const byCategory = new Map<string, typeof docs>();
  for (const d of docs) {
    const list = byCategory.get(d.category) ?? [];
    list.push(d);
    byCategory.set(d.category, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Document Center</h1>

      {docs.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-text-muted">No documents available yet. Place markdown files in <code>content/document-center/</code>.</p>
        </GlassPanel>
      ) : (
        Array.from(byCategory.entries()).map(([category, list]) => (
          <GlassPanel key={category}>
            <h2 className="text-lg font-semibold mb-4">{category}</h2>
            <ul className="flex flex-col gap-2">
              {list.map(d => (
                <li key={d.slug}>
                  <Link href={`/document-center/${d.slug}`} className="text-sm font-medium hover:underline">
                    {d.title}
                  </Link>
                  {d.updatedAt && <span className="text-xs text-text-muted ml-2">· updated {d.updatedAt}</span>}
                </li>
              ))}
            </ul>
          </GlassPanel>
        ))
      )}

      {/* ============= FILES ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold mb-4">Files</h2>
        {files.length === 0 ? (
          <p className="text-sm text-text-muted">No files uploaded yet.</p>
        ) : (
          <AttachmentList attachments={files} />
        )}

        {canEdit && (
          <form action={uploadDocumentFilesAction} className="flex flex-col gap-3 mt-6">
            <FileInput name="attachments" label="Upload files" />
            <div>
              <Button type="submit">Upload</Button>
            </div>
          </form>
        )}
      </GlassPanel>
    </div>
  );
}
