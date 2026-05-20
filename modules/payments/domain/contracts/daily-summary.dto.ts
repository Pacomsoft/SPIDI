import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export interface IDailySummaryListItemDTO {
  summaryId: string;
  driverId: string;
  driverName: string;
  rfc: string;
  summaryDate: string;
  checkinCount: number;
  orderCount: number;
  ordersAmount: number;
  bonusAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
}

export interface IDailySummaryDetailDTO extends IDailySummaryListItemDTO {
  relatedOrders: IOrderRefDTO[];
  relatedBonuses: IBonusRefDTO[];
  relatedAdjustments: IAdjustmentRefDTO[];
}

export interface IOrderRefDTO {
  orderId: string;
  store: string;
  deliveryDateTime: string;
  paymentAmount: number;
}

export interface IBonusRefDTO {
  bonusId: string;
  bonusType: string;
  amount: number;
}

export interface IAdjustmentRefDTO {
  adjustmentId: string;
  adjustmentType: string;
  amount: number;
}

export interface IDailySummaryFiltersDTO extends IPagination {
  driverSearch?: string;
  dateFrom?: string;
  dateTo?: string;
}
