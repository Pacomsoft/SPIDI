import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import { type IDriverListItemDTO, type IDriverFiltersDTO, type ICatalogItemDTO } from '../../domain/contracts/driver-list.dto';
import { type IDriverDetailDTO, type IDocumentDTO, type IOrderDTO, type IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';
import { type IUpdateDriverDTO } from '../../domain/contracts/update-driver.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';
import type { IChangeDriverStatusInputDTO, IChangeDriverStatusOutputDTO } from '../../domain/contracts/change-driver-status.dto';
import type { IUploadDocumentInputDTO, IUploadDocumentOutputDTO } from '../../domain/contracts/upload-document.dto';
import type { IExpiredDocumentItemDTO, IExpiredDocumentsFiltersDTO } from '../../domain/contracts/expired-document.dto';

export class ApiDriversRepository implements IDriverRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  async getDrivers(filters: IDriverFiltersDTO): Promise<IResultApi<{ items: IDriverListItemDTO[]; total: number }>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(filters.page),
        pageSize: String(filters.pageSize),
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.driverStatus?.length) queryParams.driverStatus = filters.driverStatus.join(',');
      if (filters.stateOfCountry) queryParams.stateOfCountry = filters.stateOfCountry;
      if (filters.lastOrderStore) queryParams.lastOrderStore = filters.lastOrderStore;

      const response = await this.httpClient.get<{ items: IDriverListItemDTO[]; total: number }>(
        API_ENDPOINTS.DRIVER, { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async getDriverById(id: string): Promise<IResultApi<IDriverDetailDTO>> {
    try {
      const response = await this.httpClient.get<IDriverDetailDTO>(API_ENDPOINTS.DRIVER_BY_ID(id));
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async updateDriver(id: string, data: IUpdateDriverDTO): Promise<IResultApi<IDriverDetailDTO>> {
    try {
      const response = await this.httpClient.put<IDriverDetailDTO>(API_ENDPOINTS.DRIVER_BY_ID(id), data);
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async deleteDriver(id: string): Promise<IResultApi<void>> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.DRIVER_BY_ID(id));
      return { success: true };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async exportDrivers(filters: IDriverFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(filters.page),
        pageSize: String(filters.pageSize),
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.driverStatus?.length) queryParams.driverStatus = filters.driverStatus.join(',');
      if (filters.stateOfCountry) queryParams.stateOfCountry = filters.stateOfCountry;
      if (filters.lastOrderStore) queryParams.lastOrderStore = filters.lastOrderStore;

      const response = await this.httpClient.get<Blob>(API_ENDPOINTS.DRIVER_EXPORT(format), { queryParams });
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async getDocuments(driverId: string): Promise<IResultApi<IDocumentDTO[]>> {
    try {
      const response = await this.httpClient.get<IDocumentDTO[]>(`${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/documents`);
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async updateDocument(driverId: string, documentType: string, data: Partial<IDocumentDTO>): Promise<IResultApi<IDocumentDTO>> {
    try {
      const response = await this.httpClient.put<IDocumentDTO>(`${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/documents/${documentType}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async getOrders(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        sortBy: pagination.sortBy,
        sortDirection: pagination.sortDirection,
      };
      if (pagination.search) queryParams.search = pagination.search;
      const response = await this.httpClient.get<{ items: IOrderDTO[]; total: number }>(
        `${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/orders`,
        { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async getPayments(driverId: string, pagination: IPagination, filterYear?: number, filterWeek?: number): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        sortBy: pagination.sortBy,
        sortDirection: pagination.sortDirection,
      };
      if (filterYear !== undefined) queryParams.year = String(filterYear);
      if (filterWeek !== undefined) queryParams.week = String(filterWeek);
      const response = await this.httpClient.get<{ items: IPaymentWeekDTO[]; total: number }>(
        `${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/payments`,
        { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    try {
      const response = await this.httpClient.get<ICatalogItemDTO[]>(catalogEndpoint);
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error') } };
    }
  }

  async changeStatus(input: IChangeDriverStatusInputDTO): Promise<IResultApi<IChangeDriverStatusOutputDTO>> {
    try {
      const response = await this.httpClient.put<IChangeDriverStatusOutputDTO>(
        API_ENDPOINTS.DRIVER_CHANGE_STATUS(input.driverId),
        { status: input.status, changedBy: input.changedBy }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? 'Error al cambiar estatus' } };
    }
  }

  async uploadDocument(input: IUploadDocumentInputDTO): Promise<IResultApi<IUploadDocumentOutputDTO>> {
    try {
      const formData = new FormData();
      formData.append('file', input.file);
      const response = await this.httpClient.put<IUploadDocumentOutputDTO>(
        API_ENDPOINTS.DRIVER_UPLOAD_DOCUMENT(input.driverId, input.documentType),
        formData
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? 'Error al cargar documento' } };
    }
  }

  async getExpiredDocuments(filters: IExpiredDocumentsFiltersDTO): Promise<IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(filters.page));
      params.append('pageSize', String(filters.pageSize));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
      const response = await this.httpClient.get<{ items: IExpiredDocumentItemDTO[]; total: number }>(
        `${API_ENDPOINTS.DRIVER_EXPIRED_DOCUMENTS}?${params.toString()}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? 'Error al obtener documentos vencidos' } };
    }
  }

  async exportExpiredDocuments(format: string): Promise<IResultApi<Blob>> {
    try {
      const response = await this.httpClient.get<Blob>(API_ENDPOINTS.DRIVER_EXPIRED_DOCUMENTS_EXPORT(format));
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? 'Error al exportar' } };
    }
  }
}
