import { type IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import { type IDriverListItemDTO, type IDriverFiltersDTO, type ICatalogItemDTO } from './driver-list.dto';
import { type IDriverDetailDTO, type IDocumentDTO, type IOrderDTO, type IPaymentWeekDTO } from './driver-detail.dto';
import { type IUpdateDriverDTO } from './update-driver.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IChangeDriverStatusInputDTO, IChangeDriverStatusOutputDTO } from './change-driver-status.dto';
import type { IUploadDocumentInputDTO, IUploadDocumentOutputDTO } from './upload-document.dto';
import type { IExpiredDocumentItemDTO, IExpiredDocumentsFiltersDTO } from './expired-document.dto';

export interface IDriverRepository {
  getDrivers(filters: IDriverFiltersDTO): Promise<IResultApi<{ items: IDriverListItemDTO[]; total: number }>>;
  getDriverById(id: string): Promise<IResultApi<IDriverDetailDTO>>;
  updateDriver(id: string, data: IUpdateDriverDTO): Promise<IResultApi<IDriverDetailDTO>>;
  deleteDriver(id: string): Promise<IResultApi<void>>;
  exportDrivers(filters: IDriverFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getDocuments(driverId: string): Promise<IResultApi<IDocumentDTO[]>>;
  updateDocument(driverId: string, documentType: string, data: Partial<IDocumentDTO>): Promise<IResultApi<IDocumentDTO>>;
  getOrders(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>>;
  getPayments(driverId: string, pagination: IPagination, filterYear?: number, filterWeek?: number): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>>;
  getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>>;
  changeStatus(input: IChangeDriverStatusInputDTO): Promise<IResultApi<IChangeDriverStatusOutputDTO>>;
  uploadDocument(input: IUploadDocumentInputDTO): Promise<IResultApi<IUploadDocumentOutputDTO>>;
  getExpiredDocuments(filters: IExpiredDocumentsFiltersDTO): Promise<IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>>;
  exportExpiredDocuments(format: string): Promise<IResultApi<Blob>>;
}
