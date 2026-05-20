import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import type { IDailySummaryListItemDTO } from './daily-summary.dto';

export interface IWeeklySummaryListItemDTO {
  summaryId: string;
  driverId: string;
  driverName: string;
  rfc: string;
  weekStartDate: string;
  ordersAmount: number;
  bonusAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
}

export interface IWeeklySummaryDetailDTO extends IWeeklySummaryListItemDTO {
  totalCheckins: number;
  totalOrders: number;
  totalWaitTime: number;
  totalWorkTime: number;
  executionDateTime: string;
  dailySummaries: IDailySummaryListItemDTO[];
}

export interface IWeeklySummaryFiltersDTO extends IPagination {
  driverSearch?: string;
  dateFrom?: string;
  dateTo?: string;
}
