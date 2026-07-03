// app/api/files/[id]/route.ts
// Auth-gated download for private attachments. Access is decided per module scope,
// unlike the public /api/uploads route (which is only for branding/avatars).

// ============= IMPORTS =============
import { auth } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getAttachment, type Attachment } from '@/lib/db/attachments';
import { readUploadStream } from '@/lib/uploads';
import { getTicket } from '@/lib/db/helpdesk';

// ============= ACCESS POLICY =============
type SessionUser = { id: string; permissions: string[] };

async function canAccess(user: SessionUser, att: Attachment): Promise<boolean> {
  // Uploader can always retrieve their own file.
  if (att.ownerId === user.id) return true;

  switch (att.module) {
    // Org-wide content: any authenticated employee may view.
    case 'engage':
    case 'document-center':
      return true;
    // Support: agents, or the employee who owns the ticket.
    case 'helpdesk': {
      if (hasPermission(user, PERMISSIONS.EDIT_HELPDESK)) return true;
      if (att.recordId) {
        const ticket = await getTicket(att.recordId);
        if (ticket && ticket.requesterId === user.id) return true;
      }
      return false;
    }
    // Requests: approvers / request admins.
    case 'request':
      return (
        hasPermission(user, PERMISSIONS.APPROVE_REQUESTS) ||
        hasPermission(user, PERMISSIONS.VIEW_ALL_REQUESTS)
      );
    default:
      return false;
  }
}

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
  const user = session.user as unknown as SessionUser;
  if (!(await canAccess(user, att))) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { buffer, contentType } = await readUploadStream(att.storedName);
    // inline so images/PDFs preview in-browser; the sanitized original name is
    // offered for save-as. Private cache only.
    const safeName = att.originalName.replace(/"/g, '');
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': att.mime || contentType,
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
