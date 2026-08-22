'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import {
  RunningAdsService,
  RunningAd,
  CreateRunningAdRequest,
} from '@/lib/services/running-ads.service';
import { fileToBase64 } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Tabs,
  Tone,
  formatDate,
} from '@/components/superadmin/ui';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
type Placement = RunningAd['placement'];
type PlacementFilter = 'ALL' | Placement;

const PLACEMENT_LABEL: Record<Placement, string> = {
  HOME_HERO: 'Home hero',
  EVENT_DETAIL: 'Event detail',
  CLUB_PROFILE: 'Club profile',
};

const PLACEMENT_TONE: Record<Placement, Tone> = {
  HOME_HERO: 'teal',
  EVENT_DETAIL: 'blue',
  CLUB_PROFILE: 'pink',
};

const LINK_LABEL: Record<RunningAd['linkType'], string> = {
  NONE: 'No link',
  EVENT: 'Event',
  CLUB: 'Club',
  EXTERNAL_URL: 'External URL',
};

const todayISO = () => new Date().toISOString().slice(0, 16);
const inAWeekISO = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16);

export default function SuperAdminAdsPage() {
  const { toast } = useToast();
  const [ads, setAds] = useState<RunningAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlacementFilter>('ALL');
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<RunningAd | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RunningAdsService.getAllAds();
      setAds(
        (res?.data?.ads ?? []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      ALL: ads.length,
      HOME_HERO: ads.filter((a) => a.placement === 'HOME_HERO').length,
      EVENT_DETAIL: ads.filter((a) => a.placement === 'EVENT_DETAIL').length,
      CLUB_PROFILE: ads.filter((a) => a.placement === 'CLUB_PROFILE').length,
    }),
    [ads],
  );

  const visible = useMemo(
    () => (filter === 'ALL' ? ads : ads.filter((a) => a.placement === filter)),
    [ads, filter],
  );

  const toggle = async (ad: RunningAd) => {
    try {
      await RunningAdsService.toggleStatus(ad.id, !ad.isActive);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: !a.isActive } : a)));
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not change ad status',
        variant: 'destructive',
      });
    }
  };

  const remove = (ad: RunningAd) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedAd) return;
    setIsDeleting(true);
    try {
      await RunningAdsService.deleteAd(selectedAd.id);
      setAds((prev) => prev.filter((a) => a.id !== selectedAd.id));
      toast({ title: 'Ad deleted' });
      setDeleteDialogOpen(false);
      setSelectedAd(null);
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete ad',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <LoadingState label="Loading ads…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[18px] flex-wrap">
        <Tabs<PlacementFilter>
          active={filter}
          onChange={setFilter}
          tabs={[
            { id: 'ALL', label: 'All', count: counts.ALL },
            { id: 'HOME_HERO', label: 'Home hero', count: counts.HOME_HERO },
            { id: 'EVENT_DETAIL', label: 'Event detail', count: counts.EVENT_DETAIL },
            { id: 'CLUB_PROFILE', label: 'Club profile', count: counts.CLUB_PROFILE },
          ]}
        />
        <button
          onClick={() => setComposerOpen(true)}
          className="ml-auto h-[42px] px-[18px] rounded-xl flex items-center gap-2 sa-display text-[13px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} /> Create ad
        </button>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState message="No ads for this placement yet." />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-[14px] p-[14px] rounded-[16px] border bg-[var(--sa-card)] border-[var(--sa-border)]"
            >
              <div className="w-[68px] h-[46px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[var(--sa-raised)]">
                {ad.mediaUrl && ad.mediaType === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.mediaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--sa-text-faint)]">
                    {ad.mediaType}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-[3px]">
                  <span className="sa-display text-[13.5px] font-bold truncate">{ad.title}</span>
                  <Badge tone={PLACEMENT_TONE[ad.placement]}>
                    {PLACEMENT_LABEL[ad.placement]}
                  </Badge>
                </div>
                <div className="text-[11px] font-medium text-[var(--sa-text-dim)] truncate">
                  {LINK_LABEL[ad.linkType]}
                  {ad.linkTarget ? ` → ${ad.linkTarget}` : ''} · {formatDate(ad.startDateTime)} →{' '}
                  {formatDate(ad.endDateTime)}
                </div>
              </div>

              <Badge tone={ad.isActive ? 'green' : 'neutral'} dot>
                {ad.isActive ? 'Live' : 'Paused'}
              </Badge>

              <button
                onClick={() => toggle(ad)}
                aria-label={ad.isActive ? 'Pause ad' : 'Activate ad'}
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-white/[0.05] text-[var(--sa-text-dim)]"
              >
                {ad.isActive ? (
                  <Pause className="w-4 h-4" strokeWidth={1.9} />
                ) : (
                  <Play className="w-4 h-4" strokeWidth={1.9} />
                )}
              </button>

              <button
                onClick={() => remove(ad)}
                aria-label="Delete ad"
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[rgba(248,113,113,0.1)] text-[var(--sa-red)]"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.9} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete ad"
        description={
          selectedAd
            ? `Delete the ad "${selectedAd.title}"? This action cannot be undone.`
            : 'Delete this ad?'
        }
        loading={isDeleting}
        onConfirm={confirmRemove}
      />

      {composerOpen && (
        <AdComposer
          onClose={() => setComposerOpen(false)}
          onCreated={(ad) => {
            setAds((prev) => [ad, ...prev]);
            setComposerOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================

const FIELD =
  'w-full h-[46px] px-[14px] rounded-[11px] border outline-none text-[13.5px] font-semibold bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]';

const AdComposer = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ad: RunningAd) => void;
}) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRunningAdRequest>({
    mediaBase64: '',
    mediaType: 'IMAGE',
    fileName: '',
    title: '',
    subtitle: '',
    badgeLabel: '',
    placement: 'HOME_HERO',
    displayOrder: 0,
    isActive: true,
    startDateTime: todayISO(),
    endDateTime: inAWeekISO(),
    linkType: 'NONE',
    linkTarget: '',
    ctaText: '',
  });

  const set = <K extends keyof CreateRunningAdRequest>(key: K, value: CreateRunningAdRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickFile = async (file?: File) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setForm((prev) => ({
        ...prev,
        mediaBase64: base64,
        fileName: file.name,
        mediaType: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
      }));
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      toast({ title: 'Could not read that file', variant: 'destructive' });
    }
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!form.mediaBase64) {
      toast({ title: 'A creative image is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await RunningAdsService.createAd({
        ...form,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
      });
      if (!res?.data) throw new Error(res?.message || 'Ad was not created');
      toast({ title: 'Ad published' });
      onCreated(res.data);
    } catch (err) {
      toast({
        title: 'Could not publish ad',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(2,10,7,0.72)]">
      <div className="w-full max-w-[760px] max-h-[90vh] overflow-auto rounded-[22px] border p-[26px] bg-[var(--sa-card)] border-white/[0.08]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="sa-display text-lg font-bold mb-[3px]">Create ad</div>
            <div className="text-xs font-medium text-[var(--sa-text-dim)]">
              Home-hero ads also appear in the Event carousel, ordered by display order.
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
          <div>
            <div className="sa-label mb-[10px]">CREATIVE</div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/5] rounded-[14px] border-[1.5px] border-dashed flex flex-col items-center justify-center gap-2 p-[14px] overflow-hidden bg-[var(--sa-raised)] border-white/[0.16]"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7 text-[rgba(29,233,182,0.7)]" strokeWidth={1.7} />
                  <span className="text-[11.5px] font-semibold text-[var(--sa-text-dim)]">
                    Click to upload
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </div>

          <div className="space-y-4">
            <div>
              <div className="sa-label mb-2">TITLE</div>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Saturday Rooftop Rave"
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">SUBTITLE</div>
                <input
                  value={form.subtitle}
                  onChange={(e) => set('subtitle', e.target.value)}
                  placeholder="Venue · date"
                  className={FIELD}
                />
              </div>
              <div>
                <div className="sa-label mb-2">BADGE</div>
                <input
                  value={form.badgeLabel}
                  onChange={(e) => set('badgeLabel', e.target.value)}
                  placeholder="e.g. FEATURED"
                  className={FIELD}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">PLACEMENT</div>
                <select
                  value={form.placement}
                  onChange={(e) => set('placement', e.target.value as Placement)}
                  className={FIELD}
                >
                  {(Object.keys(PLACEMENT_LABEL) as Placement[]).map((p) => (
                    <option key={p} value={p} className="bg-[#12211C]">
                      {PLACEMENT_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="sa-label mb-2">DISPLAY ORDER</div>
                <input
                  type="number"
                  min={0}
                  value={form.displayOrder}
                  onChange={(e) => set('displayOrder', Number(e.target.value) || 0)}
                  className={FIELD}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">LINKS TO</div>
                <select
                  value={form.linkType}
                  onChange={(e) => set('linkType', e.target.value as RunningAd['linkType'])}
                  className={FIELD}
                >
                  {(Object.keys(LINK_LABEL) as RunningAd['linkType'][]).map((t) => (
                    <option key={t} value={t} className="bg-[#12211C]">
                      {LINK_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="sa-label mb-2">TARGET</div>
                <input
                  value={form.linkTarget}
                  onChange={(e) => set('linkTarget', e.target.value)}
                  disabled={form.linkType === 'NONE'}
                  placeholder={form.linkType === 'EXTERNAL_URL' ? 'https://…' : 'Event / club id'}
                  className={`${FIELD} disabled:opacity-40`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sa-label mb-2">START</div>
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => set('startDateTime', e.target.value)}
                  className={FIELD}
                />
              </div>
              <div>
                <div className="sa-label mb-2">END</div>
                <input
                  type="datetime-local"
                  value={form.endDateTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => set('endDateTime', e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <div className="sa-label mb-2">CTA TEXT</div>
              <input
                value={form.ctaText}
                onChange={(e) => set('ctaText', e.target.value)}
                placeholder="e.g. Book now"
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
            {submitting ? 'Publishing…' : 'Publish ad'}
          </button>
        </div>
      </div>
    </div>
  );
};
