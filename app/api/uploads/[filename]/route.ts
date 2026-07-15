// app/api/uploads/[filename]/route.ts

// ============= IMPORTS =============
import { readUploadStream, isPublicUploadFilename } from '@/lib/uploads';

// ============= GET =============
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    // Private attachments (file-*) are never served here — only via the
    // auth-gated /api/files/[id] route. Serving them publicly would bypass
    // per-module access control.
    if (!isPublicUploadFilename(filename)) {
      return new Response('Not Found', { status: 404 });
    }
    const { buffer, contentType } = await readUploadStream(filename);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
