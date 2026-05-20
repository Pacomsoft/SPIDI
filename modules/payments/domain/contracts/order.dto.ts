import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export type OrderStatus = 'Delivered' | 'Cancelled' | 'Pending' | 'InRoute';

/** Catálogo de tienda — alineado con GET /api/v1/catalogs/stores */
export interface IStoreDTO {
  value: number;
  label: string;
  externalId: string;
}

export interface IAppliedBonusDTO {
  bonusId: string;
  bonusType: string;
  amount: number;
}

export interface IOrderListItemDTO {
  orderId: string;
  driverName: string;
  driverId: string;
  deliveryDateTime: string;
  store: string;
  orderStatus: OrderStatus;
  paymentAmount: number;
  bonusAmount: number;
  adjustmentAmount: number;
}

export interface IOrderDetailDTO extends IOrderListItemDTO {
  routeId?: string;
  assignedAt: string;
  startedAt: string;
  closedAt: string;
  customerSlot: string;
  appliedBonuses: IAppliedBonusDTO[];
}

export interface IOrderFiltersDTO extends IPagination {
  search?: string;
  driverName?: string;
  dateFrom?: string;
  dateTo?: string;
  orderStatus?: OrderStatus[];
  store?: string[];
}
