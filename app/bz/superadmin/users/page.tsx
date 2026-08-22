"use client";

import { useEffect, useState } from 'react';
import { EventService } from '@/lib/services/event.service';
import { Table, TableHead, TableRow, LoadingState, EmptyState, ErrorState, SectionHeading } from '@/components/superadmin/ui';

interface EventCard {
  id: string;
  title: string;
  clubName?: string;
  startDateTime?: string;
  status?: string;
}

export default function SuperAdminUsersPage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await EventService.getPublicEvents(0, 200, 'startDateTime', 'asc');
        const content = res.content || [];
        setEvents(content.map((e: any) => ({ id: e.id, title: e.title || e.name || 'Untitled', clubName: e.clubName || e.venueLabel, startDateTime: e.startDateTime, status: e.status })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState label="Loading events…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div>
      <SectionHeading title="Public events (User tab)" subtitle="Events from the Event-management service" />
      {events.length === 0 ? (
        <EmptyState message="No public events found." />
      ) : (
        <Table>
          <TableHead cols="2fr 1fr 1fr 120px">
            <div>TITLE</div>
            <div>CLUB</div>
            <div>DATE</div>
            <div>STATUS</div>
          </TableHead>
          {events.map((ev) => (
            <TableRow key={ev.id} cols="2fr 1fr 1fr 120px">
              <div className="sa-display text-[13px] font-bold truncate">{ev.title}</div>
              <div className="text-[12px] text-[var(--sa-text-dim)] truncate">{ev.clubName || '—'}</div>
              <div className="text-[12px] text-[var(--sa-text-dim)]">{ev.startDateTime ? new Date(ev.startDateTime).toLocaleString() : '—'}</div>
              <div className="text-[12px] font-semibold">{(ev.status || '—').toUpperCase()}</div>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
