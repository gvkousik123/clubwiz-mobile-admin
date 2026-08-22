'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  CarouselService,
  CarouselEventCard,
  CarouselEventItem,
  CarouselManageResponse,
  CarouselPromoItem,
  CreatePromoRequest,
  HomeCarouselSlide,
  PromoCarouselSlide,
  SlideStatus,
} from '@/lib/services/carousel.service';
import { useToast } from '@/hooks/use-toast';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  Tone,
} from '@/components/superadmin/ui';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const STATUS_TONE: Record<SlideStatus, Tone> = {
  live: 'green',
  scheduled: 'blue',
  paused: 'neutral',
};

/** One entry in the merged hero preview, built from event + promo slides. */
interface HeroSlide {
  key: string;
  order: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  badge?: string;
}

export default function SuperAdminCarouselPage() {
  const { toast } = useToast();
  const [data, setData] = useState<CarouselManageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [preview, setPreview] = useState(0);
  const [promoModal, setPromoModal] = useState<{ open: boolean; editing: CarouselPromoItem | null }>(
    { open: false, editing: null },
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'event'; item: CarouselEventItem }
    | { type: 'promo'; item: CarouselPromoItem }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await CarouselService.getManage());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load carousel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- event slide ops ----

  const reorderEvents = async (next: CarouselEventItem[]) => {
    if (!data) return;
    setData({ ...data, carousel: next });
    setSavingOrder(true);
    try {
      await CarouselService.reorderEvents(next.map((c) => c.event.id));
    } catch (err) {
      toast({
        title: 'Could not save order',
        description: err instanceof Error ? err.message : 'Reorder failed',
        variant: 'destructive',
      });
      load();
    } finally {
      setSavingOrder(false);
    }
  };

  const moveEvent = (index: number, dir: -1 | 1) => {
    if (!data) return;
    const target = index + dir;
    if (target < 0 || target >= data.carousel.length) return;
    const next = [...data.carousel];
    [next[index], next[target]] = [next[target], next[index]];
    reorderEvents(next);
  };

  const removeEvent = (item: CarouselEventItem) => {
    setDeleteTarget({ type: 'event', item });
    setDeleteDialogOpen(true);
  };

  const removeEventConfirmed = async () => {
    if (!data || !deleteTarget || deleteTarget.type !== 'event') return;
    setIsDeleting(true);
    const item = deleteTarget.item;
    try {
      await CarouselService.removeEvent(item.event.id);
      setData({
        ...data,
        carousel: data.carousel.filter((c) => c.event.id !== item.event.id),
        partners: [item.event, ...data.partners],
        carouselCount: Math.max(0, data.carouselCount - 1),
        partnerCount: data.partnerCount + 1,
      });
      toast({ title: 'Removed from carousel' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: 'Remove failed',
        description: err instanceof Error ? err.message : 'Could not remove slide',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const promotePartner = async (event: CarouselEventCard) => {
    if (!data) return;
    try {
      const slide = await CarouselService.promoteEvent(event.id);
      setData({
        ...data,
        carousel: [
          ...data.carousel,
          { slideType: 'EVENT', event, slide, posterSource: 'club', status: slide.status ?? 'scheduled' },
        ],
        partners: data.partners.filter((p) => p.id !== event.id),
        carouselCount: data.carouselCount + 1,
        partnerCount: Math.max(0, data.partnerCount - 1),
      });
      toast({ title: 'Event promoted', description: `${event.title} is now on the carousel.` });
    } catch (err) {
      toast({
        title: 'Promote failed',
        description: err instanceof Error ? err.message : 'Could not promote event',
        variant: 'destructive',
      });
    }
  };

  // ---- promo slide ops ----

  const reorderPromos = async (next: CarouselPromoItem[]) => {
    if (!data) return;
    setData({ ...data, promos: next });
    setSavingOrder(true);
    try {
      await CarouselService.reorderPromos(next.map((p) => p.promo.id));
    } catch (err) {
      toast({
        title: 'Could not save order',
        description: err instanceof Error ? err.message : 'Reorder failed',
        variant: 'destructive',
      });
      load();
    } finally {
      setSavingOrder(false);
    }
  };

  const movePromo = (index: number, dir: -1 | 1) => {
    if (!data) return;
    const target = index + dir;
    if (target < 0 || target >= data.promos.length) return;
    const next = [...data.promos];
    [next[index], next[target]] = [next[target], next[index]];
    reorderPromos(next);
  };

  const deletePromo = (item: CarouselPromoItem) => {
    setDeleteTarget({ type: 'promo', item });
    setDeleteDialogOpen(true);
  };

  const deletePromoConfirmed = async () => {
    if (!data || !deleteTarget || deleteTarget.type !== 'promo') return;
    setIsDeleting(true);
    const item = deleteTarget.item;
    try {
      await CarouselService.deletePromo(item.promo.id);
      setData({
        ...data,
        promos: data.promos.filter((p) => p.promo.id !== item.promo.id),
        promoCount: Math.max(0, data.promoCount - 1),
      });
      toast({ title: 'Promo slide deleted' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete promo',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- hero preview: merge both slide sets by carouselOrder ----

  const heroSlides: HeroSlide[] = useMemo(() => {
    if (!data) return [];
    const events = data.carousel.map((c, i) => ({
      key: `e-${c.event.id}`,
      order: orderOf(c.slide, i),
      title: slideTitle(c.slide, c.event.title),
      subtitle: slideSubtitle(c.slide, c.event.clubName, c.event.formattedDate),
      imageUrl: c.slide.imageUrl || c.event.imageUrl,
      badge: c.slide.badgeLabel,
    }));
    const promos = data.promos.map((p, i) => ({
      key: `p-${p.promo.id}`,
      order: orderOf(p.slide, 1000 + i),
      title: slideTitle(p.slide, p.promo.title),
      subtitle: slideSubtitle(p.slide, p.promo.venueLabel, p.promo.dateLabel),
      imageUrl: p.slide.imageUrl || p.promo.imageUrl,
      badge: p.slide.badgeLabel || p.promo.badgeLabel,
    }));
    return [...events, ...promos].sort((a, b) => a.order - b.order);
  }, [data]);

  const partnerResults = useMemo(() => {
    if (!data) return [];
    const q = partnerQuery.trim().toLowerCase();
    if (!q) return data.partners;
    return data.partners.filter((p) =>
      [p.title, p.clubName, p.location].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [data, partnerQuery]);

  if (loading) return <LoadingState label="Loading carousel…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={load} />;

  const hero = heroSlides[Math.min(preview, Math.max(heroSlides.length - 1, 0))];

  return (
    <div className="grid grid-cols-[1.55fr_0.92fr] gap-5 items-start">
      {/* ---------- LEFT: managed slides ---------- */}
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[520px]">
            <SectionHeading
              title="Promoted event carousel"
              subtitle="Event slides and admin promos shown on the app home screen. Each list reorders on its own; the preview merges them by order."
            />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {savingOrder && (
              <span className="text-[11.5px] font-semibold text-[var(--sa-accent)]">Saving…</span>
            )}
            <button
              onClick={() => setPromoModal({ open: true, editing: null })}
              className="h-[42px] px-[16px] rounded-xl flex items-center gap-2 sa-display text-[12.5px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]"
            >
              <Plus className="w-[15px] h-[15px]" strokeWidth={2.6} /> Create slide
            </button>
          </div>
        </div>

        {/* event slides */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="sa-label">EVENT SLIDES</span>
            <Badge tone="teal">{data.carousel.length}</Badge>
          </div>
          {data.carousel.length === 0 ? (
            <Card>
              <EmptyState message="No events promoted yet. Add one from the partner list on the right." />
            </Card>
          ) : (
            <div className="space-y-3">
              {data.carousel.map((item, index) => (
                <SlideRow
                  key={item.event.id}
                  pos={index + 1}
                  title={slideTitle(item.slide, item.event.title)}
                  meta={slideSubtitle(item.slide, item.event.clubName, item.event.formattedDate)}
                  imageUrl={item.slide.imageUrl || item.event.imageUrl}
                  status={item.status}
                  posterSource={item.posterSource}
                  upDisabled={index === 0}
                  downDisabled={index === data.carousel.length - 1}
                  onUp={() => moveEvent(index, -1)}
                  onDown={() => moveEvent(index, 1)}
                  onRemove={() => removeEvent(item)}
                  removeLabel="Remove from carousel"
                />
              ))}
            </div>
          )}
        </div>

        {/* promo slides */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="sa-label">NON-EVENT SLIDES</span>
            <Badge tone="pink">{data.promos.length}</Badge>
          </div>
          {data.promos.length === 0 ? (
            <Card>
              <EmptyState message="No promo slides. Use “Create slide” to add a custom, non-event banner." />
            </Card>
          ) : (
            <div className="space-y-3">
              {data.promos.map((item, index) => (
                <SlideRow
                  key={item.promo.id}
                  pos={index + 1}
                  title={slideTitle(item.slide, item.promo.title)}
                  meta={slideSubtitle(item.slide, item.promo.venueLabel, item.promo.dateLabel)}
                  imageUrl={item.slide.imageUrl || item.promo.imageUrl}
                  status={item.status}
                  upDisabled={index === 0}
                  downDisabled={index === data.promos.length - 1}
                  onUp={() => movePromo(index, -1)}
                  onDown={() => movePromo(index, 1)}
                  onEdit={() => setPromoModal({ open: true, editing: item })}
                  onRemove={() => deletePromo(item)}
                  removeLabel="Delete promo slide"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- RIGHT: preview + partner picker ---------- */}
      <div className="space-y-5">
        <Card>
          <div className="sa-label mb-3">APP HOME PREVIEW</div>
          {!hero ? (
            <div className="h-[210px] rounded-2xl flex items-center justify-center text-[12.5px] bg-[var(--sa-raised)] text-[var(--sa-text-dim)]">
              Nothing to preview
            </div>
          ) : (
            <>
              <div className="relative h-[210px] rounded-2xl overflow-hidden flex flex-col justify-between p-[15px] bg-[var(--sa-raised)]">
                {hero.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                {heroSlides.length > 1 && (
                  <>
                    <button
                      onClick={() => setPreview((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
                      aria-label="Previous slide"
                      className="absolute left-[10px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={2.6} />
                    </button>
                    <button
                      onClick={() => setPreview((p) => (p + 1) % heroSlides.length)}
                      aria-label="Next slide"
                      className="absolute right-[10px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white"
                    >
                      <ChevronRight className="w-4 h-4" strokeWidth={2.6} />
                    </button>
                  </>
                )}

                <div className="relative flex items-center justify-between">
                  {hero.badge && (
                    <span className="sa-display text-[9px] font-bold tracking-[0.6px] px-[9px] py-1 rounded-full bg-black/40 text-white">
                      {hero.badge}
                    </span>
                  )}
                  <span className="sa-display text-[10px] font-bold px-[9px] py-1 rounded-full bg-black/40 text-white ml-auto">
                    {Math.min(preview + 1, heroSlides.length)} / {heroSlides.length}
                  </span>
                </div>

                <div className="relative">
                  <div className="sa-display text-[21px] font-extrabold leading-[1.1] text-white mb-1">
                    {hero.title}
                  </div>
                  <div className="text-xs font-semibold text-white/85">{hero.subtitle}</div>
                </div>
              </div>

              <div className="flex justify-center gap-[6px] mt-3">
                {heroSlides.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setPreview(i)}
                    aria-label={`Preview slide ${i + 1}`}
                    className="h-[6px] rounded-full transition-all"
                    style={{
                      width: i === preview ? 20 : 6,
                      background: i === preview ? 'var(--sa-text)' : 'rgba(234,242,238,0.25)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="sa-display text-[15px] font-bold mb-1">Promote a partner event</div>
          <div className="text-[11.5px] leading-relaxed mb-[14px] text-[var(--sa-text-dim)]">
            Events eligible for the carousel that aren&apos;t on it yet.
          </div>

          <div className="flex items-center gap-[9px] h-[42px] px-[13px] rounded-[11px] border mb-[14px] bg-[var(--sa-raised)] border-white/[0.08]">
            <Search className="w-[15px] h-[15px] flex-shrink-0 text-[rgba(234,242,238,0.4)]" />
            <input
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              placeholder="Search partner events…"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[12.5px] font-medium text-[var(--sa-text)]"
            />
          </div>

          {partnerResults.length === 0 ? (
            <EmptyState
              message={partnerQuery ? 'No partner events match.' : 'No partner events available.'}
            />
          ) : (
            <div className="space-y-[10px] max-h-[380px] overflow-auto -mr-1 pr-1">
              {partnerResults.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-[11px] p-[9px] rounded-[13px] border bg-[var(--sa-raised)] border-white/[0.05]"
                >
                  <div className="w-[38px] h-[48px] rounded-[8px] flex-shrink-0 overflow-hidden bg-[var(--sa-inset)]">
                    {event.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="sa-display text-[12.5px] font-bold truncate">{event.title}</div>
                    <div className="text-[10.5px] font-medium text-[var(--sa-text-faint)] truncate">
                      {[event.clubName, event.formattedDate].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => promotePartner(event)}
                    className="flex items-center gap-[5px] h-8 px-3 rounded-[9px] flex-shrink-0 sa-display text-[11.5px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]"
                  >
                    <Plus className="w-[13px] h-[13px]" strokeWidth={2.8} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {promoModal.open && (
        <PromoModal
          editing={promoModal.editing}
          onClose={() => setPromoModal({ open: false, editing: null })}
          onSaved={() => {
            setPromoModal({ open: false, editing: null });
            load();
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.type === 'event' ? 'Remove event from carousel' : 'Delete promo slide'}
        description={
          deleteTarget?.type === 'event'
            ? `Remove "${slideTitle(deleteTarget.item.slide, deleteTarget.item.event.title)}" from the carousel? This action cannot be undone.`
            : `Delete the promo slide "${deleteTarget?.item.promo.title}"? This action cannot be undone.`
        }
        loading={isDeleting}
        onConfirm={deleteTarget?.type === 'event' ? removeEventConfirmed : deletePromoConfirmed}
      />
    </div>
  );
}

// ============================================================================
// Slide row (shared by event + promo lists)
// ============================================================================

const SlideRow = ({
  pos,
  title,
  meta,
  imageUrl,
  status,
  posterSource,
  upDisabled,
  downDisabled,
  onUp,
  onDown,
  onEdit,
  onRemove,
  removeLabel,
}: {
  pos: number;
  title: string;
  meta: string;
  imageUrl?: string;
  status: SlideStatus;
  posterSource?: string;
  upDisabled: boolean;
  downDisabled: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit?: () => void;
  onRemove: () => void;
  removeLabel: string;
}) => (
  <div className="flex items-center gap-[14px] p-3 rounded-[16px] border bg-[var(--sa-card)] border-[var(--sa-border)]">
    <div className="flex flex-col gap-[3px] flex-shrink-0">
      <button
        onClick={onUp}
        disabled={upDisabled}
        aria-label="Move up"
        className="w-6 h-5 rounded-md flex items-center justify-center bg-white/[0.06] text-[rgba(234,242,238,0.65)] disabled:opacity-25"
      >
        <ChevronUp className="w-[13px] h-[13px]" strokeWidth={2.6} />
      </button>
      <button
        onClick={onDown}
        disabled={downDisabled}
        aria-label="Move down"
        className="w-6 h-5 rounded-md flex items-center justify-center bg-white/[0.06] text-[rgba(234,242,238,0.65)] disabled:opacity-25"
      >
        <ChevronDown className="w-[13px] h-[13px]" strokeWidth={2.6} />
      </button>
    </div>

    <span className="sa-display text-xs font-bold w-4 text-center flex-shrink-0 text-[var(--sa-text-faint)]">
      {pos}
    </span>

    <div className="w-16 h-[82px] rounded-[11px] flex-shrink-0 overflow-hidden bg-[var(--sa-raised)]">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="sa-display text-sm font-bold truncate mb-[3px]">{title}</div>
      <div className="text-[11.5px] font-medium mb-2 text-[var(--sa-text-dim)] truncate">{meta}</div>
      <div className="flex items-center gap-2 flex-wrap">
        {posterSource && (
          <Badge tone={posterSource === 'custom' ? 'teal' : 'blue'}>
            {posterSource === 'custom' ? 'Custom poster' : 'Club poster'}
          </Badge>
        )}
      </div>
    </div>

    <Badge tone={STATUS_TONE[status]} dot>
      {status === 'live' ? 'Live' : status === 'scheduled' ? 'Scheduled' : 'Paused'}
    </Badge>

    {onEdit && (
      <button
        onClick={onEdit}
        aria-label="Edit slide"
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-white/[0.05] text-[var(--sa-text-dim)]"
      >
        <Pencil className="w-4 h-4" strokeWidth={1.9} />
      </button>
    )}
    <button
      onClick={onRemove}
      aria-label={removeLabel}
      className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[rgba(248,113,113,0.1)] text-[var(--sa-red)]"
    >
      <Trash2 className="w-4 h-4" strokeWidth={1.9} />
    </button>
  </div>
);

// ============================================================================
// Create / edit promo modal
// ============================================================================

const FIELD =
  'w-full h-[46px] px-[14px] rounded-[11px] border outline-none text-[13.5px] font-semibold bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]';

const PromoModal = ({
  editing,
  onClose,
  onSaved,
}: {
  editing: CarouselPromoItem | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const existing = editing?.promo;
  const [form, setForm] = useState<CreatePromoRequest>({
    title: existing?.title ?? '',
    subtitle: existing?.subtitle ?? '',
    venueLabel: existing?.venueLabel ?? '',
    dateLabel: existing?.dateLabel ?? '',
    imageUrl: existing?.imageUrl ?? '',
    linkUrl: existing?.linkUrl ?? '',
    badgeLabel: existing?.badgeLabel ?? 'FEATURED',
    status: (existing?.status as SlideStatus) ?? 'scheduled',
    isActive: existing?.isActive ?? true,
  });

  const set = <K extends keyof CreatePromoRequest>(key: K, value: CreatePromoRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      if (existing) await CarouselService.updatePromo(existing.id, form);
      else await CarouselService.createPromo(form);
      toast({ title: existing ? 'Promo slide updated' : 'Promo slide created' });
      onSaved();
    } catch (err) {
      toast({
        title: existing ? 'Update failed' : 'Create failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(2,10,7,0.72)]">
      <div className="w-full max-w-[720px] max-h-[90vh] overflow-auto rounded-[22px] border p-[26px] bg-[var(--sa-card)] border-white/[0.08]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="sa-display text-lg font-bold mb-[3px]">
              {existing ? 'Edit promo slide' : 'Create promo slide'}
            </div>
            <div className="text-xs font-medium text-[var(--sa-text-dim)]">
              A non-event banner in the app home carousel. Link it anywhere on the app or web.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-white/[0.06] text-[rgba(234,242,238,0.7)]"
          >
            <X className="w-[17px] h-[17px]" />
          </button>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-[22px]">
          {/* poster preview */}
          <div>
            <div className="sa-label mb-[10px]">POSTER</div>
            <div className="aspect-[4/5] rounded-[14px] overflow-hidden border bg-[var(--sa-raised)] border-white/[0.1]">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center px-3 text-[11px] text-[var(--sa-text-faint)]">
                  Paste an image URL to preview
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="sa-label mb-2">TITLE</div>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Clubwiz Festival"
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">SUBTITLE</div>
                <input
                  value={form.subtitle}
                  onChange={(e) => set('subtitle', e.target.value)}
                  placeholder="City-wide weekend"
                  className={FIELD}
                />
              </div>
              <div>
                <div className="sa-label mb-2">BADGE</div>
                <input
                  value={form.badgeLabel}
                  onChange={(e) => set('badgeLabel', e.target.value)}
                  placeholder="FEATURED"
                  className={FIELD}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">VENUE LABEL</div>
                <input
                  value={form.venueLabel}
                  onChange={(e) => set('venueLabel', e.target.value)}
                  placeholder="Bengaluru"
                  className={FIELD}
                />
              </div>
              <div>
                <div className="sa-label mb-2">DATE LABEL</div>
                <input
                  value={form.dateLabel}
                  onChange={(e) => set('dateLabel', e.target.value)}
                  placeholder="Sat · 20 Jul"
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <div className="sa-label mb-2">IMAGE URL</div>
              <input
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://cdn…/promo.jpg"
                className={FIELD}
              />
            </div>

            <div>
              <div className="sa-label mb-2">LINK URL (CTA TARGET)</div>
              <input
                value={form.linkUrl}
                onChange={(e) => set('linkUrl', e.target.value)}
                placeholder="https://clubwiz.in/promo"
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">STATUS</div>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as SlideStatus)}
                  className={FIELD}
                >
                  <option value="scheduled" className="bg-[#12211C]">Scheduled</option>
                  <option value="live" className="bg-[#12211C]">Live</option>
                  <option value="paused" className="bg-[#12211C]">Paused</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className="flex items-center gap-3 h-[46px] mt-[22px] px-[14px] rounded-[11px] border bg-[var(--sa-raised)] border-white/[0.08]"
              >
                <span className="text-[13px] font-semibold flex-1 text-left">Active</span>
                <span
                  className="w-[42px] h-[24px] rounded-full relative flex-shrink-0 transition-colors"
                  style={{ background: form.isActive ? 'var(--sa-accent)' : 'rgba(255,255,255,0.14)' }}
                >
                  <span
                    className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                    style={{ left: form.isActive ? 21 : 3 }}
                  />
                </span>
              </button>
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
            {submitting ? 'Saving…' : existing ? 'Save changes' : 'Add to carousel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// helpers
// ============================================================================

const orderOf = (slide: HomeCarouselSlide, fallback: number): number =>
  slide.carouselOrder ?? slide.displayOrder ?? fallback;

const slideTitle = (slide: HomeCarouselSlide, fallback: string): string =>
  slide.title || fallback || 'Untitled';

const slideSubtitle = (
  slide: HomeCarouselSlide,
  a?: string,
  b?: string,
): string =>
  slide.subtitle ||
  [a, b].filter(Boolean).join(' · ') ||
  '';
