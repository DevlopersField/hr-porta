// lib/db/attachment-access.ts
// Central access policy for private attachments, shared by the download route.
// Mirrors each module's own visibility rules so a user can fetch exactly the
// files they could already see in the UI — no more, no less.

// ============= IMPORTS =============
import { hasPermission, PERMISSIONS } from '../permissions';
import type { Attachment } from './attachments';
import { getTicket } from './helpdesk';
import { getUserById } from './users';
import { getDelegatorsFor } from './delegates';

// ============= TYPES =============
export type AccessUser = { id: string; permissions: string[] };

// ============= POLICY =============
export async function canAccessAttachment(user: AccessUser, att: Attachment): Promise<boolean> {
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

    // Requests: mirrors listPendingRoutedTo — the requester's manager (or a
    // delegate of that manager today), any approver when the requester has no
    // manager, or a VIEW_ALL_REQUESTS holder. A blanket APPROVE_REQUESTS
    // permission alone does NOT grant org-wide access to receipts.
    case 'request': {
      if (hasPermission(user, PERMISSIONS.VIEW_ALL_REQUESTS)) return true;
      if (!hasPermission(user, PERMISSIONS.APPROVE_REQUESTS)) return false;
      const requester = await getUserById(att.ownerId);
      const managerId = requester?.managerId ?? null;
      if (managerId === null) return true; // manager-less requests route to any approver
      if (managerId === user.id) return true;
      const today = new Date().toISOString().slice(0, 10);
      const delegators = await getDelegatorsFor(user.id, today);
      return delegators.includes(managerId);
    }

    default:
      return false;
  }
}
