'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { OffersService, ClubOffer, CreateOfferRequest } from '@/lib/services/offers.service';
import { SuperAdminService, AdminClub } from '@/lib/services/superadmin.service';
import { useToast } from '@/hooks/use-toast';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  Table,
  TableHead,
  TableRow,
  Tone,
  formatDate,
} from '@/components/superadmin/ui';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const COLS = '1.2fr 1.8fr 1.4fr 1fr 1fr 44px';

const OFFER_TYPE_LABEL: Record<string, string> = {
  PERCENTAGE_DISCOUNT: '% discount',
  FIXED_DISCOUNT: 'Flat discount',
  BUY_ONE_GET_ONE: 'Buy 1 get 1',
  FREE_ENTRY: 'Free entry',
  OTHER: 'Other',
};

const OFFER_TYPE_TONE: Record<string, Tone> = {
  PERCENTAGE_DISCOUNT: 'teal',
  FIXED_DISCOUNT: 'blue',
  BUY_ONE_GET_ONE: 'pink',
  FREE_ENTRY: 'amber',
  OTHER: 'neutral',
};

const rewardText = (offer: ClubOffer): string => {
  if (offer.offerType === 'PERCENTAGE_DISCOUNT' && offer.discountPercentage)
    return `${offer.discountPercentage}% off`;
  if (offer.offerType === 'FIXED_DISCOUNT' && offer.discountAmount)
    return `₹${offer.discountAmount} off`;
  return OFFER_TYPE_LABEL[offer.offerType] ?? offer.offerType;
};

export default function SuperAdminPromosPage() {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [clubId, setClubId] = useState<string>('');
  const [offers, setOffers] = useState<ClubOffer[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ClubOffer | null>(null);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = (await SuperAdminService.getAllClubs()) ?? [];
        setClubs(list);
        if (list.length) setClubId(list[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clubs');
      } finally {
        setLoadingClubs(false);
      }
    })();
  }, []);

  const loadOffers = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingOffers(true);
    try {
      const res = await OffersService.getClubOffers(id);
      setOffers(res.data ?? []);
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    loadOffers(clubId);
  }, [clubId, loadOffers]);

  const remove = (offer: ClubOffer) => {
    if (!offer.id) return;
    setSelectedOffer(offer);
    setDeleteDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedOffer) return;
    setIsDeletingOffer(true);
    const res = await OffersService.deleteOffer(clubId, selectedOffer.id);
    if (res.success) {
      setOffers((prev) => prev.filter((o) => o.id !== selectedOffer.id));
      toast({ title: 'Offer deleted' });
      setDeleteDialogOpen(false);
      setSelectedOffer(null);
    } else {
      toast({
        title: 'Delete failed',
        description: res.error || 'Could not delete this offer',
        variant: 'destructive',
      });
    }
    setIsDeletingOffer(false);
  };

  if (loadingClubs) return <LoadingState label="Loading clubs…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div>
      {/*
        The offers API is scoped per club (/pricing-offers/clubs/{id}/offers) —
        there is no site-wide promo endpoint, so a club is chosen first.
      */}
      <div className="flex items-end justify-between gap-4 mb-[18px] flex-wrap">
        <div className="min-w-[280px]">
          <div className="sa-label mb-2">CLUB</div>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full h-[46px] px-[14px] rounded-[11px] border outline-none text-[13.5px] font-semibold bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]"
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id} className="bg-[#12211C]">
                {club.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setComposerOpen(true)}
          disabled={!clubId}
          className="h-[46px] px-[18px] rounded-xl flex items-center gap-2 sa-display text-[13px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)] disabled:opacity-40"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} /> Create offer
        </button>
      </div>

      <div className="mb-3">
        <SectionHeading
          title="Offers & promo codes"
          subtitle="Discounts attached to the selected club"
        />
      </div>

      {loadingOffers ? (
        <LoadingState label="Loading offers…" />
      ) : (
        <Table>
          <TableHead cols={COLS}>
            <div>CODE</div>
            <div>OFFER</div>
            <div>REWARD</div>
            <div>RUNS</div>
            <div>STATUS</div>
            <div />
          </TableHead>

          {offers.length === 0 ? (
            <EmptyState message="This club has no offers yet." />
          ) : (
            offers.map((offer) => (
              <TableRow key={offer.id ?? offer.title} cols={COLS}>
                <div className="sa-display text-[13.5px] font-bold tracking-[0.5px] truncate text-[var(--sa-accent)]">
                  {offer.promoCode || '—'}
                </div>

                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">{offer.title}</div>
                  <div className="text-[11px] text-[var(--sa-text-faint)] truncate">
                    {offer.description}
                  </div>
                </div>

                <div>
                  <Badge tone={OFFER_TYPE_TONE[offer.offerType] ?? 'neutral'}>
                    {rewardText(offer)}
                  </Badge>
                </div>

                <div className="text-[11.5px] font-medium text-[var(--sa-text-dim)]">
                  {formatDate(offer.startDate)} → {formatDate(offer.endDate)}
                </div>

                <div>
                  <Badge tone={offer.isActive ? 'green' : 'neutral'} dot>
                    {offer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => remove(offer)}
                    aria-label="Delete offer"
                    className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center bg-[rgba(248,113,113,0.1)] text-[var(--sa-red)]"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.9} />
                  </button>
                </div>
              </TableRow>
            ))
          )}
        </Table>
      )}

      {composerOpen && (
        <OfferComposer
          clubId={clubId}
          clubName={clubs.find((c) => c.id === clubId)?.name ?? ''}
          onClose={() => setComposerOpen(false)}
          onCreated={() => {
            setComposerOpen(false);
            loadOffers(clubId);
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete offer"
        description={
          selectedOffer
            ? `Delete the offer "${selectedOffer.title}"? This action cannot be undone.`
            : 'Delete this offer?'
        }
        loading={isDeletingOffer}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

// ============================================================================

const FIELD =
  'w-full h-[46px] px-[14px] rounded-[11px] border outline-none text-[13.5px] font-semibold bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]';

const OfferComposer = ({
  clubId,
  clubName,
  onClose,
  onCreated,
}: {
  clubId: string;
  clubName: string;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateOfferRequest>({
    title: '',
    description: '',
    offerType: 'PERCENTAGE_DISCOUNT',
    discountPercentage: 10,
    promoCode: '',
    minimumAmount: 0,
    usageLimit: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    isActive: true,
  });

  const set = <K extends keyof CreateOfferRequest>(key: K, value: CreateOfferRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const res = await OffersService.createOffer(clubId, form);
    setSubmitting(false);

    if (res.success) {
      toast({ title: 'Offer created', description: `Added to ${clubName}.` });
      onCreated();
    } else {
      toast({
        title: 'Could not create offer',
        description: res.error || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isPercent = form.offerType === 'PERCENTAGE_DISCOUNT';
  const isFixed = form.offerType === 'FIXED_DISCOUNT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(2,10,7,0.72)]">
      <div className="w-full max-w-[620px] max-h-[90vh] overflow-auto rounded-[22px] border p-[26px] bg-[var(--sa-card)] border-white/[0.08]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="sa-display text-lg font-bold mb-[3px]">Create offer</div>
            <div className="text-xs font-medium text-[var(--sa-text-dim)]">For {clubName}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-white/[0.06] text-[rgba(234,242,238,0.7)]"
          >
            <X className="w-[17px] h-[17px]" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sa-label mb-2">PROMO CODE</div>
              <input
                value={form.promoCode}
                onChange={(e) => set('promoCode', e.target.value.toUpperCase())}
                placeholder="WEEKEND10"
                className={`${FIELD} tracking-[1px] text-[var(--sa-accent)]`}
              />
            </div>
            <div>
              <div className="sa-label mb-2">OFFER TYPE</div>
              <select
                value={form.offerType}
                onChange={(e) => set('offerType', e.target.value)}
                className={FIELD}
              >
                {Object.entries(OFFER_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#12211C]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="sa-label mb-2">TITLE</div>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Weekend early-bird"
              className={FIELD}
            />
          </div>

          <div>
            <div className="sa-label mb-2">DESCRIPTION</div>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Shown to users on the offer card…"
              className="w-full h-[80px] p-[12px_14px] rounded-[11px] border outline-none resize-none text-[13px] leading-relaxed font-medium bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {isPercent && (
              <div>
                <div className="sa-label mb-2">DISCOUNT %</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPercentage ?? 0}
                  onChange={(e) => set('discountPercentage', Number(e.target.value) || 0)}
                  className={FIELD}
                />
              </div>
            )}
            {isFixed && (
              <div>
                <div className="sa-label mb-2">AMOUNT OFF ₹</div>
                <input
                  type="number"
                  min={0}
                  value={form.discountAmount ?? 0}
                  onChange={(e) => set('discountAmount', Number(e.target.value) || 0)}
                  className={FIELD}
                />
              </div>
            )}
            <div>
              <div className="sa-label mb-2">MIN SPEND ₹</div>
              <input
                type="number"
                min={0}
                value={form.minimumAmount ?? 0}
                onChange={(e) => set('minimumAmount', Number(e.target.value) || 0)}
                className={FIELD}
              />
            </div>
            <div>
              <div className="sa-label mb-2">USAGE LIMIT</div>
              <input
                type="number"
                min={0}
                value={form.usageLimit ?? 0}
                onChange={(e) => set('usageLimit', Number(e.target.value) || 0)}
                className={FIELD}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sa-label mb-2">STARTS</div>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <div className="sa-label mb-2">EXPIRES</div>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={FIELD}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-[11px] mt-[22px]">
          <button
            onClick={onClose}
            className="h-[46px] px-5 rounded-xl border text-[13px] font-bold border-white/[0.1] text-[rgba(234,242,238,0.7)]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="h-[46px] px-[22px] rounded-xl sa-display text-[13.5px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)] disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create offer'}
          </button>
        </div>
      </div>
    </div>
  );
};
