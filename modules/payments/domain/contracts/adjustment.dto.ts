import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export type AdjustmentType = 'OperationalError' | 'SystemError' | 'OperationalAdjustment';

export interface IAdjustmentListItemDTO {
  adjustmentId: string;
  driverName: string;
  driverId: string;
  store: string;
  applicationDate: string;
  adjustmentType: AdjustmentType;
  amount: number;
  createdAt: string;
}

export interface IAdjustmentDetailDTO extends IAdjustmentListItemDTO {
  notes: string;
  createdBy: string;
}

export interface ICreateAdjustmentDTO {
  driverId: string;
  store: string;
  applicationDate: string;
  adjustmentType: AdjustmentType;
  amount: number;
  notes: string;
}

export interface IUpdateAdjustmentDTO {
  store?: string;
  applicationDate?: string;
  adjustmentType?: AdjustmentType;
  amount?: number;
  notes?: string;
}

export interface IAdjustmentFiltersDTO extends IPagination {
  driverName?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
  store?: string[];
  adjustmentType?: AdjustmentType[];
}

