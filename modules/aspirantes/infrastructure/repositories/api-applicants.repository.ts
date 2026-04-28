import type { IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IApplicantListItemDTO, IApplicantFiltersDTO, ICatalogItemDTO } from '../../domain/contracts/applicant-list.dto';
import type {
  IApplicantDetailDTO,
  IApplicantDocumentDTO,
  IProposalDTO,
  ICreateProposalDTO,
} from '../../domain/contracts/applicant-detail.dto';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';

export class ApiApplicantsRepository implements IApplicantRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  async getApplicants(
    filters: IApplicantFiltersDTO,
  ): Promise<IResultApi<{ items: IApplicantListItemDTO[]; total: number }>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(filters.page),
        pageSize: String(filters.pageSize),
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.applicationStatus) queryParams.applicationStatus = filters.applicationStatus;
      if (filters.documentationStatus) queryParams.documentationStatus = filters.documentationStatus;
      if (filters.location) queryParams.location = filters.location;
      if (filters.dateFrom) queryParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) queryParams.dateTo = filters.dateTo;

      const response = await this.httpClient.get<{ items: IApplicantListItemDTO[]; total: number }>(
        API_ENDPOINTS.APPLICANTS,
        { queryParams },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
    try {
      const response = await this.httpClient.get<IApplicantDetailDTO>(
        API_ENDPOINTS.APPLICANT_BY_ID(id),
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateApplicant(
    id: string,
    data: Partial<IApplicantDetailDTO>,
  ): Promise<IResultApi<IApplicantDetailDTO>> {
    try {
      const response = await this.httpClient.put<IApplicantDetailDTO>(
        API_ENDPOINTS.APPLICANT_BY_ID(id),
        data,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteApplicant(id: string): Promise<IResultApi<void>> {
    try {
      await this.httpClient.delete<void>(API_ENDPOINTS.APPLICANT_BY_ID(id));
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async exportApplicants(filters: IApplicantFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    try {
      const queryParams: Record<string, string> = {
        page: String(filters.page),
        pageSize: String(filters.pageSize),
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.applicationStatus) queryParams.applicationStatus = filters.applicationStatus;

      const response = await this.httpClient.get<Blob>(
        API_ENDPOINTS.APPLICANTS_EXPORT(format),
        { queryParams },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getDocuments(applicantId: string): Promise<IResultApi<IApplicantDocumentDTO[]>> {
    try {
      const response = await this.httpClient.get<IApplicantDocumentDTO[]>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(applicantId)}/documents`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateDocument(
    applicantId: string,
    documentType: string,
    data: Partial<IApplicantDocumentDTO>,
  ): Promise<IResultApi<IApplicantDocumentDTO>> {
    try {
      const response = await this.httpClient.put<IApplicantDocumentDTO>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(applicantId)}/documents/${documentType}`,
        data,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProposals(applicantId: string): Promise<IResultApi<IProposalDTO[]>> {
    try {
      const response = await this.httpClient.get<IProposalDTO[]>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(applicantId)}/proposals`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createProposal(data: ICreateProposalDTO): Promise<IResultApi<IProposalDTO>> {
    try {
      const response = await this.httpClient.post<IProposalDTO>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(data.applicantId)}/proposals`,
        data,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    try {
      const response = await this.httpClient.get<ICatalogItemDTO[]>(catalogEndpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): IResultApi<never> {
    if (error instanceof FetchError) {
      return {
        success: false,
        error: { statusCode: error.statusCode, message: error.message },
      };
    }
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}
