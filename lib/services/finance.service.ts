import { api, handleApiError, handleApiResponse } from '../api-client';
import { ApiResponse } from '../api-types';

const unwrap = <T>(body: any): T =>
  body && typeof body === 'object' && 'data' in body ? body.data : body;

export type CommissionStatus = 'queued' | 'paid' | 'hold';
export interface CommissionRow {
  clubId: string;
  clubName: string;
  commissionRate?: number | null;
  commissionStatus?: CommissionStatus | null;
  businessAdminEmail?: string;
  [key: string]: unknown;
}

export interface CommissionRatesResponse {
  commissions: CommissionRow[];
  total: number;
  averageRate: number;
}

export type PayoutStatus = 'queued' | 'paid' | 'hold';
export interface PayoutRow {
  id: string;
  clubId: string;
  clubName: string;
  businessAdminEmail?: string;
  periodLabel: string;
  grossAmount: number;
  feeAmount: number;
  refundsAmount: number;
  netPayout: number;
  commissionRate: number;
  status: PayoutStatus;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface PayoutSummary {
  pendingSettlement: number;
  settledPaid: number;
  platformCommission: number;
  onHold: number;
  totalRows: number;
}

export interface PayoutsResponse {
  payouts: PayoutRow[];
  total: number;
  summary: PayoutSummary;
}

export type RefundStatus = 'pending' | 'approved' | 'denied' | 'dispute';
export interface RefundRow {
  id: string;
  referenceId: string;
  userName: string;
  userEmail: string;
  clubId: string;
  clubName: string;
  reason: string;
  amount: number;
  currency: string;
  orderId: string;
  ticketId: string;
  status: RefundStatus;
  notes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface RefundsResponse {
  refunds: RefundRow[];
  total: number;
  pendingCount: number;
  disputeCount: number;
}

export interface UpdateCommissionRequest {
  commissionRate: number;
  commissionStatus: CommissionStatus;
}

export interface UpdatePayoutStatusRequest {
  status: PayoutStatus;
  notes?: string;
}

export interface UpdateRefundStatusRequest {
  notes?: string;
}

export class FinanceService {
  static async getCommissionRates(): Promise<CommissionRatesResponse> {
    try {
      const response = await api.get<ApiResponse<CommissionRatesResponse>>('/clubs/commissions');
      return unwrap<CommissionRatesResponse>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateCommissionRate(
    clubId: string,
    payload: UpdateCommissionRequest,
  ): Promise<CommissionRow> {
    try {
      const response = await api.put<ApiResponse<CommissionRow>>(
        `/clubs/${clubId}/commission`,
        payload,
      );
      return unwrap<CommissionRow>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPayouts(
    status?: PayoutStatus,
    clubId?: string,
    filterByBa: boolean = true,
  ): Promise<PayoutsResponse> {
    try {
      const response = await api.get<ApiResponse<PayoutsResponse>>('/payment/finance/payouts', {
        params: { status, clubId, filterByBa },
      });
      return unwrap<PayoutsResponse>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPayoutSummary(): Promise<PayoutSummary> {
    try {
      const response = await api.get<ApiResponse<PayoutSummary>>('/payment/finance/payouts/summary');
      return unwrap<PayoutSummary>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updatePayoutStatus(
    payoutId: string,
    payload: UpdatePayoutStatusRequest,
  ): Promise<PayoutRow> {
    try {
      const response = await api.put<ApiResponse<PayoutRow>>(
        `/payment/finance/payouts/${payoutId}/status`,
        payload,
      );
      return unwrap<PayoutRow>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getRefunds(
    tab: 'pending' | 'dispute' | 'all' = 'all',
    status?: RefundStatus,
  ): Promise<RefundsResponse> {
    try {
      const response = await api.get<ApiResponse<RefundsResponse>>('/payment/finance/refunds', {
        params: { tab, status },
      });
      return unwrap<RefundsResponse>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async approveRefund(
    refundId: string,
    payload: UpdateRefundStatusRequest = {},
  ): Promise<RefundRow> {
    try {
      const response = await api.put<ApiResponse<RefundRow>>(
        `/payment/finance/refunds/${refundId}/approve`,
        payload,
      );
      return unwrap<RefundRow>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async denyRefund(
    refundId: string,
    payload: UpdateRefundStatusRequest = {},
  ): Promise<RefundRow> {
    try {
      const response = await api.put<ApiResponse<RefundRow>>(
        `/payment/finance/refunds/${refundId}/deny`,
        payload,
      );
      return unwrap<RefundRow>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async disputeRefund(
    refundId: string,
    payload: UpdateRefundStatusRequest = {},
  ): Promise<RefundRow> {
    try {
      const response = await api.put<ApiResponse<RefundRow>>(
        `/payment/finance/refunds/${refundId}/dispute`,
        payload,
      );
      return unwrap<RefundRow>(handleApiResponse(response));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
