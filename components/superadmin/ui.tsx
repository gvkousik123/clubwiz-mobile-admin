'use client';

import { ReactNode } from 'react';
import { AlertCircle, Construction, Loader2 } from 'lucide-react';

// ============================================================================
// SURFACES
// ============================================================================

export const Card = ({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) => (
  <div
    className={`rounded-[18px] border bg-[var(--sa-card)] border-[var(--sa-border)] ${
      padded ? 'p-[22px]' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div>
    <div className="sa-display text-base font-bold">{title}</div>
    {subtitle && (
      <div className="text-[12px] font-medium mt-[3px] text-[var(--sa-text-dim)]">{subtitle}</div>
    )}
  </div>
);

// ============================================================================
// STATS
// ============================================================================

export type Tone = 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'pink' | 'neutral';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  teal: { bg: 'rgba(29,233,182,.14)', fg: 'var(--sa-accent)' },
  green: { bg: 'rgba(61,220,132,.14)', fg: 'var(--sa-green)' },
  amber: { bg: 'rgba(251,191,36,.14)', fg: 'var(--sa-amber)' },
  red: { bg: 'rgba(248,113,113,.14)', fg: 'var(--sa-red)' },
  blue: { bg: 'rgba(56,189,248,.14)', fg: 'var(--sa-blue)' },
  pink: { bg: 'rgba(232,121,249,.14)', fg: 'var(--sa-pink)' },
  neutral: { bg: 'rgba(255,255,255,.06)', fg: 'var(--sa-text-dim)' },
};

export const StatTile = ({
  label,
  value,
  icon,
  tone = 'teal',
  note,
  highlight = false,
  loading = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  note?: string;
  highlight?: boolean;
  loading?: boolean;
}) => {
  const t = TONE[tone];
  return (
    <div
      className="p-5 rounded-[18px] border"
      style={{
        background: highlight
          ? 'linear-gradient(160deg, rgba(29,233,182,.1), rgba(29,233,182,.02))'
          : 'var(--sa-card)',
        borderColor: highlight ? 'rgba(29,233,182,.2)' : 'var(--sa-border)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <span
            className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
            style={{ background: t.bg, color: t.fg }}
          >
            {icon}
          </span>
        )}
        {note && (
          <span
            className="text-[11px] font-bold px-[9px] py-[3px] rounded-full"
            style={{ background: t.bg, color: t.fg }}
          >
            {note}
          </span>
        )}
      </div>
      <div className="sa-display text-[28px] font-bold leading-none mb-[6px] tracking-[-0.8px]">
        {loading ? <span className="opacity-30">—</span> : value}
      </div>
      <div className="text-[12px] font-semibold text-[var(--sa-text-dim)]">{label}</div>
    </div>
  );
};

// ============================================================================
// BADGES
// ============================================================================

export const Badge = ({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) => {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-[6px] text-[11px] font-bold px-[10px] py-1 rounded-full whitespace-nowrap"
      style={{ background: t.bg, color: t.fg }}
    >
      {dot && <span className="w-[6px] h-[6px] rounded-full" style={{ background: t.fg }} />}
      {children}
    </span>
  );
};

/** Circular avatar built from a name — the API rarely returns logos for every club. */
const AVATAR_GRADIENTS = [
  ['#1DE9B6', '#0FA57E'],
  ['#E879F9', '#C084FC'],
  ['#38BDF8', '#2563EB'],
  ['#FBBF24', '#F97316'],
  ['#F472B6', '#DB2777'],
  ['#3DDC84', '#0FA57E'],
  ['#A78BFA', '#6D28D9'],
  ['#22D3EE', '#0891B2'],
];

export const Avatar = ({ name, size = 42 }: { name: string; size?: number }) => {
  // Hash the name so a given club keeps the same colour between renders.
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [from, to] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  return (
    <div
      className="rounded-[12px] flex items-center justify-center flex-shrink-0 sa-display font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

// ============================================================================
// TABS
// ============================================================================

export interface Tab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-[5px] p-[5px] rounded-[13px] w-fit bg-[var(--sa-inset)]">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-[7px] px-4 py-[9px] rounded-[9px] text-[13px] font-semibold transition-colors ${
              on ? 'bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]' : 'text-[var(--sa-text-dim)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`sa-display text-[10.5px] font-bold px-[7px] py-[1px] rounded-full ${
                  on ? 'bg-black/20 text-[var(--sa-accent-ink)]' : 'bg-white/[0.06] text-[var(--sa-text-dim)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// TABLE
// ============================================================================

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-[18px] border bg-[var(--sa-card)] border-[var(--sa-border)]">
    <div className="min-w-[720px] md:min-w-full">{children}</div>
  </div>
);

export const TableHead = ({ cols, children }: { cols: string; children: ReactNode }) => (
  <div
    className="grid gap-[14px] px-5 py-[14px] border-b sa-label border-[var(--sa-border)] min-w-max"
    style={{ gridTemplateColumns: cols }}
  >
    {children}
  </div>
);

export const TableRow = ({
  cols,
  children,
  onClick,
}: {
  cols: string;
  children: ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`grid gap-[14px] px-5 py-[15px] items-center border-b border-white/[0.04] ${
      onClick ? 'cursor-pointer sa-row-hover' : ''
    } min-w-max`}
    style={{ gridTemplateColumns: cols }}
  >
    {children}
  </div>
);

// ============================================================================
// STATES
// ============================================================================

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20">
    <Loader2 className="w-6 h-6 animate-spin text-[var(--sa-accent)]" />
    <p className="text-[13px] text-[var(--sa-text-dim)]">{label}</p>
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
  actionLabel,
  onAction,
}: {
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <AlertCircle className="w-7 h-7 text-[var(--sa-red)]" />
    <p className="text-[13px] max-w-sm text-[var(--sa-text-dim)]">{message}</p>
    <div className="flex gap-2">
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-4 h-9 rounded-[10px] text-[12.5px] font-bold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]"
        >
          Retry
        </button>
      )}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-1 px-4 h-9 rounded-[10px] text-[12.5px] font-bold bg-[var(--sa-red)] text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="py-16 text-center text-[13px] text-[var(--sa-text-dim)]">{message}</div>
);

/**
 * Shown by sections whose backend does not exist yet.
 *
 * Deliberately not a mock dashboard — placeholder numbers on a money screen
 * get screenshotted and quoted as if they were real.
 */
export const PendingBackendState = ({
  title,
  description,
  needs,
}: {
  title: string;
  description: string;
  needs: string[];
}) => (
  <Card className="max-w-2xl">
    <div className="flex items-start gap-4">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[rgba(251,191,36,.14)] text-[var(--sa-amber)]">
        <Construction className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <div className="sa-display text-[15px] font-bold mb-1">{title}</div>
        <p className="text-[13px] leading-relaxed mb-4 text-[var(--sa-text-dim)]">{description}</p>
        <div className="sa-label mb-2">REQUIRES</div>
        <ul className="space-y-[6px]">
          {needs.map((n) => (
            <li key={n} className="flex items-center gap-[10px] text-[12.5px]">
              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-[var(--sa-amber)]" />
              <code className="font-mono text-[12px] text-[rgba(234,242,238,0.72)]">{n}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Card>
);

// ============================================================================
// DRAWER
// ============================================================================

export const Drawer = ({
  open,
  onClose,
  children,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) => {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-[rgba(3,10,7,0.62)] backdrop-blur-[3px]"
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-[51] flex flex-col border-l bg-[#0B1512] border-[var(--sa-border-strong)] shadow-[-24px_0_60px_rgba(0,0,0,0.5)]"
        style={{ width, maxWidth: '94vw' }}
      >
        {children}
      </div>
    </>
  );
};

// ============================================================================
// FORMATTING
// ============================================================================

/** Indian-format short currency: ₹4.86Cr, ₹38.4L, ₹1.2K. */
export const formatINR = (value: number): string => {
  const n = Math.round(value || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${n}`;
};

export const formatCount = (value: number): string =>
  (value || 0).toLocaleString('en-IN');

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** "2h ago" / "3d ago" — used across support and activity lists. */
export const formatRelative = (iso?: string | null): string => {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : formatDate(iso);
};
