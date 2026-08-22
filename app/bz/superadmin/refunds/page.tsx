'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Slash, ShieldAlert } from 'lucide-react';
import { FinanceService, RefundRow } from '@/lib/services/finance.service';
import { useToast } from '@/hooks/use-toast';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  Tabs,
  Table,
  TableHead,
  TableRow,
  formatINR,
} from '@/components/superadmin/ui';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'dispute', label: 'Disputes' },
  { id: 'all', label: 'All' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  dispute: 'Dispute',
};

const STATUS_TONE: Record<string, 'green' | 'red' | 'amber' | 'neutral'> = {
  pending: 'amber',
  approved: 'green',
  denied: 'red',
  dispute: 'neutral',
};

export default function SuperAdminRefundsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('pending');
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [totals, setTotals] = useState({ pendingCount: 0, disputeCount: 0 });

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FinanceService.getRefunds(tab);
      setRefunds(res.refunds ?? []);
      setTotals({ pendingCount: res.pendingCount ?? 0, disputeCount: res.disputeCount ?? 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const action = async (refund: RefundRow, type: 'approve' | 'deny' | 'dispute') => {
    const note = window.prompt(`Enter notes for ${type}:`, '');
    if (note === null) return;
    setSavingId(refund.id);
    try {
      const updated =
        type === 'approve'
          ? await FinanceService.approveRefund(refund.id, { notes: note || undefined })
          : type === 'deny'
          ? await FinanceService.denyRefund(refund.id, { notes: note || undefined })
          : await FinanceService.disputeRefund(refund.id, { notes: note || undefined });

      setRefunds((prev) => prev.map((item) => (item.id === refund.id ? updated : item)));
      toast({ title: 'Refund updated', description: `Status changed to ${updated.status}.` });
      await loadRefunds();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update refund',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const counts = useMemo(
    () => ({ pending: totals.pendingCount, dispute: totals.disputeCount, all: refunds.length }),
    [refunds.length, totals.pendingCount, totals.disputeCount],
  );

  if (loading) return <LoadingState label="Loading refunds…" />;
  if (error) return <ErrorState message={error} onRetry={loadRefunds} />;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Refunds & disputes"
        subtitle="Review customer refund requests and change their status to approved, denied, or dispute."
      />

      <Card>
        <Tabs
          active={tab}
          onChange={(value) => setTab(value)}
          tabs={TABS.map((item) => ({ id: item.id, label: item.label, count: counts[item.id] }))}
        />
      </Card>

      <Card>
        {refunds.length === 0 ? (
          <EmptyState message="No refund cases in this view." />
        ) : (
          <Table>
            <TableHead cols="1.2fr 1fr 1fr 1fr 1fr 1fr 220px">
              <div>REF</div>
              <div>USER</div>
              <div>CLUB</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div>DATE</div>
              <div />
            </TableHead>
            {refunds.map((refund) => (
              <TableRow key={refund.id} cols="1.2fr 1fr 1fr 1fr 1fr 1fr 220px">
                <div>
                  <div className="sa-display text-[13px] font-bold truncate">{refund.referenceId}</div>
                  <div className="text-[11px] text-(--sa-text-dim) truncate">{refund.reason}</div>
                </div>
                <div>{refund.userName}</div>
                <div>{refund.clubName}</div>
                <div>{formatINR(refund.amount)}</div>
                <div>
                  <Badge tone={STATUS_TONE[refund.status]} dot>
                    {STATUS_LABEL[refund.status] ?? refund.status}
                  </Badge>
                </div>
                <div className="text-[12px] text-(--sa-text-dim)">
                  {new Date(refund.createdAt).toLocaleDateString('en-IN')}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {refund.status !== 'approved' && refund.status !== 'denied' && (
                    <button
                      onClick={() => action(refund, 'approve')}
                      disabled={savingId === refund.id}
                      className="h-8.5 px-3 rounded-[10px] text-[12.5px] font-semibold bg-(--sa-accent) text-(--sa-accent-ink) disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {refund.status !== 'denied' && (
                    <button
                      onClick={() => action(refund, 'deny')}
                      disabled={savingId === refund.id}
                      className="h-8.5 px-3 rounded-[10px] text-[12.5px] font-semibold bg-(--sa-inset) text-(--sa-text) disabled:opacity-40"
                    >
                      <Slash className="w-3.5 h-3.5" /> Deny
                    </button>
                  )}
                  {refund.status !== 'dispute' && (
                    <button
                      onClick={() => action(refund, 'dispute')}
                      disabled={savingId === refund.id}
                      className="h-8.5 px-3 rounded-[10px] text-[12.5px] font-semibold bg-(--sa-inset) text-(--sa-text) disabled:opacity-40"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Dispute
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
