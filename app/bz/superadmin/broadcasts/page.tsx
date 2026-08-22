'use client';

import { PendingBackendState } from '@/components/superadmin/ui';

export default function SuperAdminBroadcastsPage() {
  return (
    <PendingBackendState
      title="Broadcasts are not wired up yet"
      description="The notification service currently only reads a signed-in user's own notifications (GET /notification/api/notifications). There is no endpoint that sends a push to an audience, and no delivery or open-rate reporting to show afterwards."
      needs={[
        'POST /admin/broadcasts                  — send to an audience segment',
        'GET  /admin/broadcasts                  — sent, scheduled and draft history',
        'GET  /admin/broadcasts/{id}/stats       — delivered and opened counts',
        'GET  /admin/audiences                   — segments (city, club followers, …)',
      ]}
    />
  );
}
