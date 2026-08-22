'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { FinanceService, CommissionRow, CommissionStatus } from '@/lib/services/finance.service';
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
} from '@/components/superadmin/ui';

const STATUS_TONE: Record<CommissionStatus, Tone> = {
  queued: 'amber',
  paid: 'green',
  hold: 'red',
};

export default function SuperAdminCommissionsPage() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<CommissionStatus>('queued');
  const [saving, setSaving] = useState(false);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FinanceService.getCommissionRates();
      setCommissions(res.commissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commission rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const startEdit = (row: CommissionRow) => {
    setEditingId(row.clubId);
    setEditRate(row.commissionRate ?? 0);
    setEditStatus(row.commissionStatus ?? 'queued');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await FinanceService.updateCommissionRate(editingId, {
        commissionRate: editRate,
        commissionStatus: editStatus,
      });
      setCommissions((prev) => prev.map((row) => (row.clubId === editingId ? updated : row)));
      toast({ title: 'Commission updated', description: 'The club commission has been saved.' });
      setEditingId(null);
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Could not update commission',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading commission rates…" />;
  if (error) return <ErrorState message={error} onRetry={loadCommissions} />;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Commission rates"
        subtitle="Per-club partnership rates used by the payouts workflow. Update the percentage and status for each business admin club."
      />

      <Card>
        <div className="sa-label mb-3">Commission table</div>
        {commissions.length === 0 ? (
          <EmptyState message="No commission data available yet." />
        ) : (
          <Table>
            <TableHead cols="2.2fr 1fr 1fr 1fr 150px">
              <div>CLUB</div>
              <div>COMMISSION</div>
              <div>STATUS</div>
              <div>BUSINESS ADMIN</div>
              <div />
            </TableHead>
            {commissions.map((row) => {
              const editing = editingId === row.clubId;
              return (
                <TableRow key={row.clubId} cols="2.2fr 1fr 1fr 1fr 150px">
                  <div>
                    <div className="sa-display text-[13px] font-bold truncate">{row.clubName || row.clubId}</div>
                    <div className="text-[11px] text-[var(--sa-text-dim)] truncate">
                      {row.clubId}
                    </div>
                  </div>
                  <div>
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editRate}
                        onChange={(e) => setEditRate(Number(e.target.value))}
                        className="w-full h-[38px] px-3 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-raised)] text-[13px] text-[var(--sa-text)]"
                      />
                    ) : row.commissionRate == null ? (
                      <span className="text-[var(--sa-text-dim)]">—</span>
                    ) : (
                      <span className="font-semibold">{row.commissionRate.toFixed(2)}%</span>
                    )}
                  </div>
                  <div>
                    {editing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as CommissionStatus)}
                        className="w-full h-[38px] px-3 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-raised)] text-[13px] text-[var(--sa-text)]"
                      >
                        <option value="queued">Queued</option>
                        <option value="paid">Paid</option>
                        <option value="hold">Hold</option>
                      </select>
                    ) : (
                      <Badge tone={STATUS_TONE[row.commissionStatus ?? 'queued']} dot>
                        {row.commissionStatus === 'paid'
                          ? 'Paid'
                          : row.commissionStatus === 'hold'
                          ? 'Hold'
                          : 'Queued'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[13px] font-medium truncate">
                    {row.businessAdminEmail || '—'}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {editing ? (
                      <>
                        <button
                          onClick={cancelEdit}
                          className="h-[36px] px-3 rounded-[10px] text-[12.5px] font-semibold bg-[var(--sa-raised)] text-[var(--sa-text-dim)]"
                        >
                          <X className="w-[14px] h-[14px]" />
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="h-[36px] px-3 rounded-[10px] text-[12.5px] font-semibold bg-[var(--sa-accent)] text-[var(--sa-accent-ink)]"
                        >
                          <Save className="w-[14px] h-[14px]" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(row)}
                        className="h-[36px] px-3 rounded-[10px] text-[12.5px] font-semibold bg-[var(--sa-inset)] text-[var(--sa-text)]"
                      >
                        <Pencil className="w-[14px] h-[14px]" /> Edit
                      </button>
                    )}
                  </div>
                </TableRow>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
