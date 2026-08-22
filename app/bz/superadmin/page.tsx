'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ShieldCheck,
  Ticket,
  UserCheck,
  Users,
} from 'lucide-react';
import { SuperAdminService, AdminClub, AdminStats } from '@/lib/services/superadmin.service';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  StatTile,
  formatCount,
  formatDate,
} from '@/components/superadmin/ui';

export default function SuperAdminDashboardPage() {
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setClubsError(null);

    try {
      const clubsResult = await SuperAdminService.getAllClubs();
      setClubs(clubsResult ?? []);
    } catch (err) {
      setClubsError(err instanceof Error ? err.message : 'Could not load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // An inactive club is one awaiting review — the API has no separate status field.
  const awaitingReview = useMemo(
    () =>
      clubs
        .filter((c) => !c.isActive)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [clubs],
  );

  const recentClubs = useMemo(
    () =>
      [...clubs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [clubs],
  );

  if (loading) return <LoadingState label="Loading platform overview…" />;

  // If clubs failed to load completely, show error state for the page.
  if (clubsError) return <ErrorState message={clubsError} onRetry={load} />;

  return (
    <div className="space-y-4">
      

      {/* headline numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Total clubs"
          value={formatCount(clubs.length)}
          icon={<Building2 className="w-5 h-5" strokeWidth={1.9} />}
          tone="teal"
          highlight
          note={awaitingReview.length ? `${awaitingReview.length} pending` : undefined}
        />
        <StatTile
          label="Total events"
          value={formatCount(0)}
          icon={<CalendarDays className="w-5 h-5" strokeWidth={1.9} />}
          tone="blue"
        />
        <StatTile
          label="Total bookings"
          value={formatCount(0)}
          icon={<Ticket className="w-5 h-5" strokeWidth={1.9} />}
          tone="pink"
        />
        <StatTile
          label="Total users"
          value={formatCount(0)}
          icon={<Users className="w-5 h-5" strokeWidth={1.9} />}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* account breakdown */}
        <Card>
          <div className="mb-[22px]">
            <SectionHeading
              title="Accounts"
              subtitle="Every registered account, split by state and privilege"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: 'Active users',
                value: 0,
                tone: 'green' as const,
                icon: <UserCheck className="w-[18px] h-[18px]" strokeWidth={1.9} />,
              },
              {
                label: 'Inactive users',
                value: 0,
                tone: 'red' as const,
                icon: <Users className="w-[18px] h-[18px]" strokeWidth={1.9} />,
              },
              {
                label: 'Admins',
                value: 0,
                tone: 'blue' as const,
                icon: <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={1.9} />,
              },
              {
                label: 'Super admins',
                value: 0,
                tone: 'teal' as const,
                icon: <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={1.9} />,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 p-4 rounded-[14px] border bg-[var(--sa-raised)] border-[var(--sa-border)]"
              >
                <span
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      row.tone === 'green'
                        ? 'rgba(61,220,132,.14)'
                        : row.tone === 'red'
                          ? 'rgba(248,113,113,.14)'
                          : row.tone === 'blue'
                            ? 'rgba(56,189,248,.14)'
                            : 'rgba(29,233,182,.14)',
                    color:
                      row.tone === 'green'
                        ? 'var(--sa-green)'
                        : row.tone === 'red'
                          ? 'var(--sa-red)'
                          : row.tone === 'blue'
                            ? 'var(--sa-blue)'
                            : 'var(--sa-accent)',
                  }}
                >
                  {row.icon}
                </span>
                <div className="min-w-0">
                  <div className="sa-display text-[21px] font-bold leading-none">
                    {formatCount(row.value)}
                  </div>
                  <div className="text-[11.5px] font-semibold mt-[5px] text-[var(--sa-text-dim)]">
                    {row.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/bz/superadmin/users"
            className="inline-block mt-4 text-[12.5px] font-semibold text-[var(--sa-accent)]"
          >
            Manage users & roles →
          </Link>
        </Card>

        {/* review queue */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading title="Awaiting review" />
            <Badge tone={awaitingReview.length ? 'amber' : 'green'}>{awaitingReview.length}</Badge>
          </div>

          {awaitingReview.length === 0 ? (
            <EmptyState message="No clubs awaiting review." />
          ) : (
            <div className="space-y-[10px]">
              {awaitingReview.slice(0, 5).map((club) => (
                <Link
                  key={club.id}
                  href="/bz/superadmin/clubs"
                  className="flex items-center gap-3 p-3 rounded-[13px] border bg-[var(--sa-raised)] border-white/[0.05]"
                >
                  <Avatar name={club.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="sa-display text-[13.5px] font-bold truncate">{club.name}</div>
                    <div className="text-[11px] font-medium text-[var(--sa-text-dim)] truncate">
                      {club.locationText?.city || 'Location not set'} · {formatDate(club.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
              {awaitingReview.length > 5 && (
                <Link
                  href="/bz/superadmin/clubs"
                  className="block pt-1 text-[12.5px] font-semibold text-[var(--sa-accent)]"
                >
                  View all {awaitingReview.length} →
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* newest clubs */}
      <Card padded={false}>
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[var(--sa-border)]">
          <SectionHeading title="Recently added clubs" />
          <Link href="/bz/superadmin/clubs" className="text-[12.5px] font-semibold text-[var(--sa-accent)]">
            View all
          </Link>
        </div>
        {recentClubs.length === 0 ? (
          <EmptyState message="No clubs on the platform yet." />
        ) : (
          recentClubs.map((club) => (
            <div
              key={club.id}
              className="flex items-center gap-3 px-[22px] py-[14px] border-b border-white/[0.04]"
            >
              <Avatar name={club.name} size={38} />
              <div className="flex-1 min-w-0">
                <div className="sa-display text-[13.5px] font-bold truncate">{club.name}</div>
                <div className="text-[11px] font-medium text-[var(--sa-text-dim)] truncate">
                  {club.owner?.fullName || club.owner?.username || 'Owner unknown'} ·{' '}
                  {club.locationText?.city || 'No city'}
                </div>
              </div>
              <div className="text-[11.5px] font-medium text-[var(--sa-text-faint)]">
                {formatDate(club.createdAt)}
              </div>
              <Badge tone={club.isActive ? 'green' : 'amber'} dot>
                {club.isActive ? 'Active' : 'Pending'}
              </Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
