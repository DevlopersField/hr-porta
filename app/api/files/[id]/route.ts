// app/api/files/[id]/route.ts
// Auth-gated download for private attachments. Access policy lives in
// lib/db/attachment-access.ts (unit-tested), unlike the public /api/uploads
// route (which only serves branding/avatar images).

// ============= IMPORTS =============
import { auth } from '@/lib/auth';
import { getAttachment } from '@/lib/db/attachments';
import { canAccessAttachment, type AccessUser } from '@/lib/db/attachment-access';
import { readUploadStream, isImageMime } from '@/lib/uploads';

// ============= GET =============
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id } = await params;
  const att = await getAttachment(id);
  if (!att) {
    return new Response('Not Found', { status: 404 });
  }
  const user = session.user as unknown as AccessUser;
  if (!(await canAccessAttachment(user, att))) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { buffer, contentType } = await readUploadStream(att.storedName);
    // Images and PDFs preview inline; everything else downloads. nosniff stops
    // browsers second-guessing the declared type (the MIME is client-supplied
    // at upload time, so it must never be sniffable into something executable).
    const mime = att.mime || contentType;
    const inline = isImageMime(mime) || mime === 'application/pdf';
    const safeName = att.originalName.replace(/"/g, '');
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
