// app/api/uploads/[filename]/route.ts

// ============= IMPORTS =============
import { readUploadStream } from '@/lib/uploads';

// ============= GET =============
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const { buffer, contentType } = await readUploadStream(filename);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
