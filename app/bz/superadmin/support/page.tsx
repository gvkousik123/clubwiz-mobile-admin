'use client';

import { PendingBackendState } from '@/components/superadmin/ui';

export default function SuperAdminSupportPage() {
  return (
    <PendingBackendState
      title="The support inbox is not wired up yet"
      description="Tickets can be submitted, but the only read endpoint is /contact-form/contact/tickets/user, which returns the signed-in user's own tickets. Pointing this screen at it would show the super admin their own tickets rather than the platform inbox, so it is deliberately left unwired."
      needs={[
        'GET   /admin/support/tickets?status=…   — every ticket, not just the caller’s',
        'GET   /admin/support/tickets/{id}       — thread with replies',
        'POST  /admin/support/tickets/{id}/reply — respond as Clubwiz',
        'PATCH /admin/support/tickets/{id}       — change status or assignee',
      ]}
    />
  );
}
