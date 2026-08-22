'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { FinanceService, PayoutRow, PayoutStatus, PayoutSummary } from '@/lib/services/finance.service';
import { useToast } from '@/hooks/use-toast';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  StatTile,
  Table,
  TableHead,
  TableRow,
  Tone,
  formatINR,
} from '@/components/superadmin/ui';

const STATUS_TONE: Record<PayoutStatus, Tone> = {
  queued: 'amber',
  paid: 'green',
  hold: 'red',
};

const FILTERS: Array<{ id: 'all' | PayoutStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'queued', label: 'Queued' },
  { id: 'paid', label: 'Paid' },
  { id: 'hold', label: 'Hold' },
];

export default function SuperAdminPayoutsPage() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [filter, setFilter] = useState<'all' | PayoutStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FinanceService.getPayouts(filter === 'all' ? undefined : filter);
      setPayouts(res.payouts ?? []);
      setSummary(res.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const updateStatus = async (payout: PayoutRow, nextStatus: PayoutStatus) => {
    const notes = window.prompt(`Notes for changing status to ${nextStatus}:`, '');
    if (notes === null) return;
    setSavingId(payout.id);
    try {
      const updated = await FinanceService.updatePayoutStatus(payout.id, { status: nextStatus, notes: notes || undefined });
      setPayouts((prev) => prev.map((row) => (row.id === payout.id ? updated : row)));
      toast({ title: 'Payout updated', description: `Status set to ${nextStatus}.` });
      if (summary) {
        await loadPayouts();
      }
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update payout status',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const filteredPayouts = useMemo(
    () => (filter === 'all' ? payouts : payouts.filter((row) => row.status === filter)),
    [filter, payouts],
  );

  if (loading) return <LoadingState label="Loading payouts…" />;
  if (error) return <ErrorState message={error} onRetry={loadPayouts} />;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Payouts"
        subtitle="Settlement rows for club partners and business admins, including gross, fees, refunds and net payout amounts."
      />

      <div className="grid grid-cols-4 gap-4">
        <StatTile
          label="Pending settlement"
          value={summary ? formatINR(summary.pendingSettlement) : '—'}
          tone="amber"
          icon={<RefreshCw className="w-5 h-5" />}
        />
        <StatTile
          label="Settled paid"
          value={summary ? formatINR(summary.settledPaid) : '—'}
          tone="green"
          icon={<Play className="w-5 h-5" />}
        />
        <StatTile
          label="Platform commission"
          value={summary ? formatINR(summary.platformCommission) : '—'}
          tone="teal"
          icon={<Pause className="w-5 h-5" />}
        />
        <StatTile
          label="On hold"
          value={summary ? formatINR(summary.onHold) : '—'}
          tone="red"
          icon={<Pause className="w-5 h-5" />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="sa-label mb-2">Filter</div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`h-[38px] px-4 rounded-[11px] text-[13px] font-semibold transition-colors ${
                    filter === item.id
                      ? 'bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]'
                      : 'bg-[var(--sa-inset)] text-[var(--sa-text-dim)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={loadPayouts}
            className="h-[38px] px-4 rounded-[11px] text-[13px] font-semibold bg-[var(--sa-inset)] text-[var(--sa-text)]"
          >
            Refresh
          </button>
        </div>

        {filteredPayouts.length === 0 ? (
          <EmptyState message="No payouts match this filter." />
        ) : (
          <Table>
            <TableHead cols="1.7fr 1fr 1fr 1fr 1fr 1fr 170px">
              <div>CLUB</div>
              <div>GROSS</div>
              <div>FEES</div>
              <div>REFUNDS</div>
              <div>NET</div>
              <div>STATUS</div>
              <div />
            </TableHead>
            {filteredPayouts.map((row) => (
              <TableRow key={row.id} cols="1.7fr 1fr 1fr 1fr 1fr 1fr 170px">
                <div>
                  <div className="sa-display text-[13px] font-bold truncate">{row.clubName}</div>
                  <div className="text-[11px] text-[var(--sa-text-dim)] truncate">
                    {row.businessAdminEmail || row.periodLabel}
                  </div>
                </div>
                <div>{formatINR(row.grossAmount)}</div>
                <div>{formatINR(row.feeAmount)}</div>
                <div>{formatINR(row.refundsAmount)}</div>
                <div>{formatINR(row.netPayout)}</div>
                <div>
                  <Badge tone={STATUS_TONE[row.status]} dot>
                    {row.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => updateStatus(row, 'paid')}
                    disabled={savingId === row.id || row.status === 'paid'}
                    className="h-[34px] px-3 rounded-[10px] text-[12.5px] font-semibold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)] disabled:opacity-40"
                  >
                    Mark paid
                  </button>
                  {row.status !== 'paid' && (
                    <button
                      onClick={() => updateStatus(row, row.status === 'hold' ? 'queued' : 'hold')}
                      disabled={savingId === row.id}
                      className="h-[34px] px-3 rounded-[10px] text-[12.5px] font-semibold bg-[var(--sa-inset)] text-[var(--sa-text)] disabled:opacity-40"
                    >
                      {row.status === 'hold' ? 'Release hold' : 'Hold'}
                    </button>
                  )}
                </div>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
