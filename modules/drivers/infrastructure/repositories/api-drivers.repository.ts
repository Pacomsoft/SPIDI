import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IDriverListItemDTO, type IDriverFiltersDTO, type ICatalogItemDTO } from '../../domain/contracts/driver-list.dto';
import { type IDriverDetailDTO, type IDocumentDTO, type IOrderDTO, type IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';
import { type IUpdateDriverDTO } from '../../domain/contracts/update-driver.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

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
        API_ENDPOINTS.DRIVERS, { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async getDriverById(id: string): Promise<IResultApi<IDriverDetailDTO>> {
    try {
      const response = await this.httpClient.get<IDriverDetailDTO>(API_ENDPOINTS.DRIVER_BY_ID(id));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async updateDriver(id: string, data: IUpdateDriverDTO): Promise<IResultApi<IDriverDetailDTO>> {
    try {
      const response = await this.httpClient.put<IDriverDetailDTO>(API_ENDPOINTS.DRIVER_BY_ID(id), data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async deleteDriver(id: string): Promise<IResultApi<void>> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.DRIVER_BY_ID(id));
      return { success: true };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
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

      const response = await this.httpClient.get<Blob>(API_ENDPOINTS.DRIVERS_EXPORT(format), { queryParams });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async getDocuments(driverId: string): Promise<IResultApi<IDocumentDTO[]>> {
    try {
      const response = await this.httpClient.get<IDocumentDTO[]>(`${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/documents`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async updateDocument(driverId: string, documentType: string, data: Partial<IDocumentDTO>): Promise<IResultApi<IDocumentDTO>> {
    try {
      const response = await this.httpClient.put<IDocumentDTO>(`${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/documents/${documentType}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async getOrders(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>> {
    try {
      const response = await this.httpClient.get<{ items: IOrderDTO[]; total: number }>(
        `${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/orders`,
        { queryParams: { page: String(pagination.page), pageSize: String(pagination.pageSize), sortBy: pagination.sortBy, sortDirection: pagination.sortDirection } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async getPayments(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {
    try {
      const response = await this.httpClient.get<{ items: IPaymentWeekDTO[]; total: number }>(
        `${API_ENDPOINTS.DRIVER_BY_ID(driverId)}/payments`,
        { queryParams: { page: String(pagination.page), pageSize: String(pagination.pageSize), sortBy: pagination.sortBy, sortDirection: pagination.sortDirection } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }

  async getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    try {
      const response = await this.httpClient.get<ICatalogItemDTO[]>(catalogEndpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: { statusCode: (error as { statusCode?: number }).statusCode, message: error instanceof Error ? error.message : 'Error' } };
    }
  }
}
