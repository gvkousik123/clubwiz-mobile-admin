'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Search, Trash2, X } from 'lucide-react';
import { SuperAdminService, AdminClub } from '@/lib/services/superadmin.service';
import { useToast } from '@/hooks/use-toast';
import {
  Avatar,
  Badge,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingState,
  Table,
  TableHead,
  TableRow,
  Tabs,
  formatDate,
} from '@/components/superadmin/ui';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

type ClubFilter = 'all' | 'pending' | 'active';

const COLS = '2.4fr 1.4fr 1.2fr 1fr 44px';

export default function SuperAdminClubsPage() {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ClubFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminClub | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<AdminClub | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setClubs((await SuperAdminService.getAllClubs()) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      all: clubs.length,
      pending: clubs.filter((c) => !c.isActive).length,
      active: clubs.filter((c) => c.isActive).length,
    }),
    [clubs],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter((club) => {
      if (filter === 'pending' && club.isActive) return false;
      if (filter === 'active' && !club.isActive) return false;
      if (!q) return true;
      const haystack = [
        club.name,
        club.locationText?.city,
        club.owner?.fullName,
        club.owner?.username,
        club.owner?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [clubs, filter, query]);

  const handleDelete = (club: AdminClub) => {
    setSelectedClub(club);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClub) return;
    setIsDeleting(true);
    setDeletingId(selectedClub.id);

    try {
      await SuperAdminService.deleteClub(selectedClub.id);
      setClubs((prev) => prev.filter((c) => c.id !== selectedClub.id));
      setSelected((prev) => (prev?.id === selectedClub.id ? null : prev));
      toast({ title: 'Club deleted', description: `${selectedClub.name} has been removed.` });
      setDeleteDialogOpen(false);
      setSelectedClub(null);
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete this club',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState label="Loading clubs…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[18px] flex-wrap">
        <Tabs<ClubFilter>
          active={filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'active', label: 'Active', count: counts.active },
          ]}
        />

        <div className="ml-auto flex items-center gap-[9px] px-[14px] h-[42px] w-[260px] rounded-xl border bg-[var(--sa-raised)] border-[var(--sa-border)]">
          <Search className="w-4 h-4 flex-shrink-0 text-[rgba(234,242,238,0.4)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter clubs…"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] font-medium text-[var(--sa-text)]"
          />
        </div>
      </div>

      <Table>
        <TableHead cols={COLS}>
          <div>CLUB</div>
          <div>OWNER</div>
          <div>ADDED</div>
          <div>STATUS</div>
          <div />
        </TableHead>

        {visible.length === 0 ? (
          <EmptyState message={query ? 'No clubs match your search.' : 'No clubs in this view.'} />
        ) : (
          visible.map((club) => (
            <TableRow key={club.id} cols={COLS} onClick={() => setSelected(club)}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={club.name} />
                <div className="min-w-0">
                  <div className="sa-display text-sm font-bold truncate">{club.name}</div>
                  <div className="text-[11px] font-medium text-[var(--sa-text-faint)] truncate">
                    {club.locationText?.city || 'No city set'}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold truncate text-[rgba(234,242,238,0.72)]">
                  {club.owner?.fullName || club.owner?.username || '—'}
                </div>
                <div className="text-[11px] text-[var(--sa-text-faint)] truncate">
                  {club.owner?.email || ''}
                </div>
              </div>

              <div className="text-[12.5px] font-medium text-[var(--sa-text-dim)]">
                {formatDate(club.createdAt)}
              </div>

              <div>
                <Badge tone={club.isActive ? 'green' : 'amber'} dot>
                  {club.isActive ? 'Active' : 'Pending'}
                </Badge>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(club);
                  }}
                  disabled={deletingId === club.id}
                  aria-label={`Delete ${club.name}`}
                  className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center bg-[rgba(248,113,113,0.1)] text-[var(--sa-red)] disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.9} />
                </button>
              </div>
            </TableRow>
          ))
        )}
      </Table>

      <ClubDetailDrawer club={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete club"
        description={
          selectedClub
            ? `Delete "${selectedClub.name}"? This permanently removes the club and cannot be undone.`
            : 'Delete this club?'
        }
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ============================================================================

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 px-4 py-[13px] border-b border-white/[0.04]">
    <span className="text-[12.5px] font-medium flex-shrink-0 text-[var(--sa-text-dim)]">
      {label}
    </span>
    <span className="text-[13px] font-semibold text-right break-words">{value}</span>
  </div>
);

const ClubDetailDrawer = ({
  club,
  onClose,
  onDelete,
}: {
  club: AdminClub | null;
  onClose: () => void;
  onDelete: (club: AdminClub) => void;
}) => {
  if (!club) return null;

  const location = club.locationText?.fullAddress || club.locationText?.city || 'Not set';
  const pricing = club.entryPricing;

  return (
    <Drawer open onClose={onClose}>
      <div className="flex items-start gap-[14px] px-6 py-[22px] border-b border-white/[0.07]">
        <Avatar name={club.name} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[9px] flex-wrap">
            <span className="sa-display text-[18px] font-bold">{club.name}</span>
            <Badge tone={club.isActive ? 'green' : 'amber'} dot>
              {club.isActive ? 'Active' : 'Pending'}
            </Badge>
          </div>
          <div className="text-[12px] font-medium mt-[3px] text-[var(--sa-text-dim)]">
            Added {formatDate(club.createdAt)}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-[38px] h-[38px] rounded-[11px] border flex items-center justify-center flex-shrink-0 bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text-dim)]"
        >
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-[22px] space-y-5">
        {club.description && (
          <p className="text-[13px] leading-relaxed text-[rgba(234,242,238,0.7)]">
            {club.description}
          </p>
        )}

        <div>
          <div className="sa-label mb-3">OWNER</div>
          <div className="rounded-[14px] border overflow-hidden bg-[var(--sa-raised)] border-[var(--sa-border)]">
            <DetailRow label="Name" value={club.owner?.fullName || '—'} />
            <DetailRow label="Username" value={club.owner?.username || '—'} />
            <DetailRow label="Email" value={club.owner?.email || '—'} />
            <DetailRow label="Mobile" value={club.owner?.mobileNumber || '—'} />
          </div>
        </div>

        <div>
          <div className="sa-label mb-3">CONTACT & LOCATION</div>
          <div className="rounded-[14px] border overflow-hidden bg-[var(--sa-raised)] border-[var(--sa-border)]">
            <DetailRow label="Address" value={location} />
            <DetailRow label="Contact email" value={club.contactEmail || '—'} />
            <DetailRow label="Contact phone" value={club.contactPhone || '—'} />
            <DetailRow label="Category" value={club.category || '—'} />
          </div>
        </div>

        {pricing && (
          <div>
            <div className="sa-label mb-3">ENTRY PRICING</div>
            <div className="rounded-[14px] border overflow-hidden bg-[var(--sa-raised)] border-[var(--sa-border)]">
              <DetailRow
                label="Couple"
                value={pricing.coupleEntryPrice != null ? `₹${pricing.coupleEntryPrice}` : '—'}
              />
              <DetailRow
                label="Male stag"
                value={pricing.maleStagEntryPrice != null ? `₹${pricing.maleStagEntryPrice}` : '—'}
              />
              <DetailRow
                label="Female stag"
                value={
                  pricing.femaleStagEntryPrice != null ? `₹${pricing.femaleStagEntryPrice}` : '—'
                }
              />
              <DetailRow
                label="Cover charge"
                value={pricing.coverCharge != null ? `₹${pricing.coverCharge}` : '—'}
              />
            </div>
          </div>
        )}

        {/*
          Approve / suspend are intentionally absent: there is no endpoint to
          change a club's active flag yet. Delete is the only state change the
          API currently supports.
        */}
        <p className="text-[11.5px] leading-relaxed text-[var(--sa-text-faint)]">
          Approving or suspending a club is not available yet — the backend has no endpoint to
          change a club&apos;s active state.
        </p>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.07] flex gap-[10px]">
        {club.contactEmail && (
          <a
            href={`mailto:${club.contactEmail}`}
            className="flex-1 h-[46px] rounded-xl border flex items-center justify-center gap-2 text-[13px] font-bold border-white/[0.1] text-[rgba(234,242,238,0.75)]"
          >
            <Mail className="w-4 h-4" /> Email owner
          </a>
        )}
        <button
          onClick={() => onDelete(club)}
          className="h-[46px] px-5 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-bold border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.08)] text-[var(--sa-red)]"
        >
          <Trash2 className="w-4 h-4" /> Delete club
        </button>
      </div>
    </Drawer>
  );
};
