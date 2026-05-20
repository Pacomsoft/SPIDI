import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderListItemDTO, IOrderDetailDTO, IOrderFiltersDTO, IStoreDTO } from './order.dto';
import type { IBonusListItemDTO, IBonusDetailDTO, IBonusFiltersDTO, ICreateBonusDTO, IUpdateBonusDTO } from './bonus.dto';
import type { IAdjustmentListItemDTO, IAdjustmentDetailDTO, IAdjustmentFiltersDTO, ICreateAdjustmentDTO, IUpdateAdjustmentDTO } from './adjustment.dto';
import type { IDailySummaryListItemDTO, IDailySummaryDetailDTO, IDailySummaryFiltersDTO } from './daily-summary.dto';
import type { IWeeklySummaryListItemDTO, IWeeklySummaryDetailDTO, IWeeklySummaryFiltersDTO } from './weekly-summary.dto';

export interface IPaymentRepository {
  getStores(): Promise<IResultApi<IStoreDTO[]>>;
  getOrders(filters: IOrderFiltersDTO): Promise<IResultApi<{ items: IOrderListItemDTO[]; total: number }>>;
  getOrderById(id: string): Promise<IResultApi<IOrderDetailDTO>>;
  exportOrders(filters: IOrderFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getBonuses(filters: IBonusFiltersDTO): Promise<IResultApi<{ items: IBonusListItemDTO[]; total: number }>>;
  getBonusById(id: string): Promise<IResultApi<IBonusDetailDTO>>;
  createBonus(data: ICreateBonusDTO): Promise<IResultApi<IBonusDetailDTO>>;
  updateBonus(id: string, data: IUpdateBonusDTO): Promise<IResultApi<IBonusDetailDTO>>;
  exportBonuses(filters: IBonusFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getAdjustments(filters: IAdjustmentFiltersDTO): Promise<IResultApi<{ items: IAdjustmentListItemDTO[]; total: number }>>;
  getAdjustmentById(id: string): Promise<IResultApi<IAdjustmentDetailDTO>>;
  createAdjustment(data: ICreateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>>;
  updateAdjustment(id: string, data: IUpdateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>>;
  exportAdjustments(filters: IAdjustmentFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getDailySummaries(filters: IDailySummaryFiltersDTO): Promise<IResultApi<{ items: IDailySummaryListItemDTO[]; total: number }>>;
  getDailySummaryById(id: string): Promise<IResultApi<IDailySummaryDetailDTO>>;
  exportDailySummaries(filters: IDailySummaryFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getWeeklySummaries(filters: IWeeklySummaryFiltersDTO): Promise<IResultApi<{ items: IWeeklySummaryListItemDTO[]; total: number }>>;
  getWeeklySummaryById(id: string): Promise<IResultApi<IWeeklySummaryDetailDTO>>;
  exportWeeklySummaries(filters: IWeeklySummaryFiltersDTO, format: string): Promise<IResultApi<Blob>>;
}
