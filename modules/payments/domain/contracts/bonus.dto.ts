import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export type BonusType = 'Punctuality' | 'Productivity' | 'SpecialSchedule' | 'Zone' | 'Weather';

export interface IBonusListItemDTO {
  bonusId: string;
  store: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  bonusType: BonusType;
  bonusAmount: number;
}

export interface IBonusDetailDTO extends IBonusListItemDTO {
  threshold?: number;
  minimumOrders: number;
  createdBy: string;
  lastModifiedBy: string;
  affectedOrders: string[];
}

export interface ICreateBonusDTO {
  store: string[];
  startDate: string;
  endDate: string;
  bonusType: BonusType;
  threshold?: number;
  minimumOrders: number;
  bonusAmount: number;
}

export interface IUpdateBonusDTO {
  store?: string[];
  startDate?: string;
  endDate?: string;
  bonusType?: BonusType;
  bonusAmount?: number;
}

export interface IBonusFiltersDTO extends IPagination {
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  store?: string[];
  bonusType?: BonusType[];
}
