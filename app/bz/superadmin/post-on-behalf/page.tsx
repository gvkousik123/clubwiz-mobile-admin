'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { SuperAdminService, AdminClub } from '@/lib/services/superadmin.service';
import { EventService } from '@/lib/services/event.service';
import { StoryService } from '@/lib/services/story.service';
import { fileToBase64 } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  ErrorState,
  LoadingState,
  SectionHeading,
  Tabs,
} from '@/components/superadmin/ui';

type PostKind = 'event' | 'story';

const FIELD =
  'w-full h-[46px] px-[14px] rounded-[11px] border outline-none text-[13.5px] font-semibold bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]';

const localDateTime = (offsetDays = 1) =>
  new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 16);

/**
 * Publishes an event or story attributed to another club.
 *
 * Both create endpoints take a clubId, so "on behalf of" is simply targeting
 * the chosen club's id rather than the signed-in user's own.
 */
export default function SuperAdminPostOnBehalfPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const [clubId, setClubId] = useState('');
  const [kind, setKind] = useState<PostKind>('event');
  const [submitting, setSubmitting] = useState(false);

  const [media, setMedia] = useState<{ base64: string; fileName: string; preview: string } | null>(
    null,
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState(localDateTime(1));
  const [endAt, setEndAt] = useState(localDateTime(1.2));
  const [caption, setCaption] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = (await SuperAdminService.getAllClubs()) ?? [];
        setClubs(list);
        if (list.length) setClubId(list[0].id);
      } catch (err) {
        setClubsError(err instanceof Error ? err.message : 'Failed to load clubs');
      } finally {
        setLoadingClubs(false);
      }
    })();
  }, []);

  const club = clubs.find((c) => c.id === clubId);

  const pickFile = async (file?: File) => {
    if (!file) return;
    try {
      setMedia({
        base64: await fileToBase64(file),
        fileName: file.name,
        preview: URL.createObjectURL(file),
      });
    } catch {
      toast({ title: 'Could not read that file', variant: 'destructive' });
    }
  };

  const reset = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setCaption('');
    setMedia(null);
  };

  const publish = async () => {
    if (!clubId) return;

    if (kind === 'story') {
      if (!media) {
        toast({ title: 'A story needs an image', variant: 'destructive' });
        return;
      }
      setSubmitting(true);
      try {
        await StoryService.uploadStory({
          base64Data: media.base64,
          fileName: media.fileName,
          caption,
          clubId,
        });
        toast({ title: 'Story published', description: `Posted as ${club?.name}.` });
        reset();
      } catch (err) {
        toast({
          title: 'Could not publish story',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Event title is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await EventService.createEvent({
        title,
        description,
        startDateTime: new Date(startAt).toISOString(),
        endDateTime: new Date(endAt).toISOString(),
        location: location || club?.locationText?.fullAddress || '',
        clubId,
        isPublic: true,
        requiresApproval: false,
      });
      toast({ title: 'Event published', description: `Created under ${club?.name}.` });
      reset();
    } catch (err) {
      toast({
        title: 'Could not publish event',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClubs) return <LoadingState label="Loading clubs…" />;
  if (clubsError) return <ErrorState message={clubsError} onRetry={() => window.location.reload()} />;

  return (
    <div className="grid grid-cols-[1fr_1.1fr] gap-5 items-start">
      <Card>
        <div className="mb-[18px]">
          <SectionHeading
            title="Post on behalf of a club"
            subtitle="If a club hasn't posted for itself, publish for them. It appears in the app under the club's own name."
          />
        </div>

        <div className="sa-label mb-2">CLUB</div>
        <select
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          className={`${FIELD} mb-[18px]`}
        >
          {clubs.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#12211C]">
              {c.name}
            </option>
          ))}
        </select>

        <div className="sa-label mb-[10px]">POST TYPE</div>
        <div className="mb-[18px]">
          <Tabs<PostKind>
            active={kind}
            onChange={setKind}
            tabs={[
              { id: 'event', label: 'Create event' },
              { id: 'story', label: 'Upload story' },
            ]}
          />
        </div>

        <div className="sa-label mb-[10px]">{kind === 'story' ? 'STORY IMAGE' : 'COVER IMAGE'}</div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-[120px] rounded-[13px] border-[1.5px] border-dashed flex flex-col items-center justify-center gap-2 mb-4 overflow-hidden bg-[var(--sa-raised)] border-white/[0.15]"
        >
          {media ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              <ImagePlus className="w-[26px] h-[26px] text-[rgba(29,233,182,0.7)]" strokeWidth={1.7} />
              <span className="text-xs font-semibold text-[var(--sa-text-dim)]">
                Click to upload
              </span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {kind === 'event' ? (
          <>
            <div className="sa-label mb-2">TITLE</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title…"
              className={`${FIELD} mb-[14px]`}
            />

            <div className="grid grid-cols-2 gap-3 mb-[14px]">
              <div>
                <div className="sa-label mb-2">STARTS</div>
                <input
                  type="datetime-local"
                  value={startAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setStartAt(e.target.value)}
                  className={FIELD}
                />
              </div>
              <div>
                <div className="sa-label mb-2">ENDS</div>
                <input
                  type="datetime-local"
                  value={endAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setEndAt(e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>

            <div className="sa-label mb-2">VENUE</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={club?.locationText?.fullAddress || 'Venue / area'}
              className={`${FIELD} mb-[14px]`}
            />

            <div className="sa-label mb-2">DESCRIPTION</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event details…"
              className="w-full h-[88px] p-[12px_14px] rounded-[11px] border outline-none resize-none mb-[18px] text-[13px] leading-relaxed font-medium bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]"
            />
          </>
        ) : (
          <>
            <div className="sa-label mb-2">CAPTION</div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption…"
              className="w-full h-[88px] p-[12px_14px] rounded-[11px] border outline-none resize-none mb-[18px] text-[13px] leading-relaxed font-medium bg-[var(--sa-raised)] border-white/[0.08] text-[var(--sa-text)]"
            />
          </>
        )}

        <button
          onClick={publish}
          disabled={submitting || !clubId}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 sa-display text-sm font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)] disabled:opacity-50"
        >
          <Send className="w-[17px] h-[17px]" strokeWidth={2.2} />
          {submitting ? 'Publishing…' : `Publish for ${club?.name ?? 'club'}`}
        </button>
      </Card>

      {/* live preview */}
      <Card>
        <div className="sa-label mb-3">PREVIEW</div>
        <div className="rounded-[16px] overflow-hidden border bg-[var(--sa-raised)] border-[var(--sa-border)]">
          <div className="h-[190px] relative bg-[var(--sa-inset)]">
            {media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--sa-text-faint)]">
                No image selected
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="text-[11px] font-semibold mb-1 text-[var(--sa-accent)]">
              {club?.name ?? 'Club'}
            </div>
            <div className="sa-display text-[16px] font-bold mb-1">
              {kind === 'event' ? title || 'Event title' : caption || 'Story caption'}
            </div>
            {kind === 'event' && (
              <div className="text-[12px] text-[var(--sa-text-dim)]">
                {new Date(startAt).toLocaleString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {location ? ` · ${location}` : ''}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--sa-text-faint)]">
          Posts published here are attributed to the selected club and are indistinguishable from
          the club&apos;s own posts in the app.
        </p>
      </Card>
    </div>
  );
}
