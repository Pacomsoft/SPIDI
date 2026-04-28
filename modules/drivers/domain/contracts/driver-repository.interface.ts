import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IDriverListItemDTO, type IDriverFiltersDTO, type ICatalogItemDTO } from './driver-list.dto';
import { type IDriverDetailDTO, type IDocumentDTO, type IOrderDTO, type IPaymentWeekDTO } from './driver-detail.dto';
import { type IUpdateDriverDTO } from './update-driver.dto';

export interface IDriverRepository {
  getDrivers(filters: IDriverFiltersDTO): Promise<IResultApi<{ items: IDriverListItemDTO[]; total: number }>>;
  getDriverById(id: string): Promise<IResultApi<IDriverDetailDTO>>;
  updateDriver(id: string, data: IUpdateDriverDTO): Promise<IResultApi<IDriverDetailDTO>>;
  deleteDriver(id: string): Promise<IResultApi<void>>;
  exportDrivers(filters: IDriverFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getDocuments(driverId: string): Promise<IResultApi<IDocumentDTO[]>>;
  updateDocument(driverId: string, documentType: string, data: Partial<IDocumentDTO>): Promise<IResultApi<IDocumentDTO>>;
  getOrders(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>>;
  getPayments(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>>;
  getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>>;
}
