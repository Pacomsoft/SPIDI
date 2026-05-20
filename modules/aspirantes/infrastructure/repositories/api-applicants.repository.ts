/**
 * Repositorio de aspirantes.
 *
 * Patrón: API-first + fallback a mock en el front.
 *
 * Cada método:
 *  - Intenta consumir el endpoint REAL del backend.
 *  - Si el backend devuelve error (4xx/5xx) o no está disponible,
 *    devuelve datos mock en memoria — sin depender del backend.
 *
 * Cuando un endpoint esté listo en el backend y sea estable,
 * simplemente elimina el bloque `catch` / fallback de ese método.
 *
 * Estado actual de cada endpoint:
 *  ✅ REAL   getApplicants       → GET /api/v1/applicants
 *  ✅ REAL   getCatalogItems     → GET /api/v1/catalogs/*
 *  🟡 MOCK   getApplicantById    → sin endpoint real aún
 *  🟡 MOCK   updateApplicant     → sin endpoint real aún
 *  🟡 MOCK   deleteApplicant     → sin endpoint real aún
 *  🟡 MOCK   exportApplicants    → sin endpoint real aún
 *  🟡 MOCK   getDocuments        → sin endpoint real aún
 *  🟡 MOCK   updateDocument      → sin endpoint real aún
 *  🟡 MOCK   getProposals        → sin endpoint real aún
 *  🟡 MOCK   createProposal      → sin endpoint real aún
 */

import type { IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type {
  IApplicantListItemDTO,
  IApplicantFiltersDTO,
  ICatalogItemDTO,
} from '../../domain/contracts/applicant-list.dto';
import type {
  IApplicantDetailDTO,
  IApplicantDocumentDTO,
  IProposalDTO,
  ICreateProposalDTO,
} from '../../domain/contracts/applicant-detail.dto';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import {
  MOCK_APPLICANTS,
  MOCK_APPLICANT_DOCUMENTS,
  MOCK_PROPOSALS,
  MOCK_CATALOG_CITIES,
  MOCK_CATALOG_APPLICATION_STATUSES,
  getMockApplicantDetail,
  filterMockApplicants,
} from '../../domain/entities/applicants.mock';

// ─────────────────────────────────────────────────────────────────────────────
//  Tipos del contrato REAL del backend
// ─────────────────────────────────────────────────────────────────────────────
interface IBackendDocumentEntity {
  id: number;
  driverId: number;
  name: string;
  number: string;
  status: string;   // 'Pendiente' | 'No legible' | 'Prevalidado' | 'Validado'
  type: string;     // código corto: NSS, LICENSE, CAR_INSURANCE, INE, CSF, BANK_CLABE
  link: string;
  issueDate: string | null;
  expireDate: string | null;
}

interface IBackendVehicleEntity {
  id: number;
  driverId: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  vin: string | null;
  status: string;
}

interface IBackendApplicantEntity {
  id: number;
  firstName: string;
  parentalSurname: string;
  maternalSurname: string | null;
  phone: string | null;
  email: string | null;
  location: string;
  registrationDate: string | null;
  applicationStatus: string;
  applicationStatusId: number;
  notes: string | null;
  documents: IBackendDocumentEntity[];
  vehicle: IBackendVehicleEntity | null;
  totalCount: number;
}

interface IBackendPaginatedResponse {
  items: IBackendApplicantEntity[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mapeo de filtros front → backend
// ─────────────────────────────────────────────────────────────────────────────

// applicationStatus string (front) → int (backend)
//   0  = default → SP usa estados activos [1,2,3,4,5]
//  -1  = todos los estados
//  1-5 = estatus específico
const APPLICATION_STATUS_TO_INT: Record<string, number> = {
  '':              0,
  'activos':       0,
  'todos':        -1,
  'Pending':       1,
  'In Review':     2,
  'Proposal Sent': 3,
  'Approved':      4,
  'Rejected':      5,
};

// documentationStatus (front label) → códigos que el backend entiende
// Pendiente agrupa: PENDIENTE + ESCANEADO + ELIMINADO (lógica de negocio)
const DOC_STATUS_TO_CODES: Record<string, string[]> = {
  '':           [],
  'Pendiente':  ['PENDIENTE', 'ESCANEADO', 'ELIMINADO'],
  'No legible': ['NO_LEGIBLE'],
  'Prevalidado': ['PREVALIDADO'],
  'Validado':   ['VALIDADO'],
};

// applicationStatusId (int backend) → label (front)
const STATUS_ID_TO_LABEL: Record<number, IApplicantListItemDTO['applicationStatus']> = {
  1: 'Pending',
  2: 'In Review',
  3: 'Proposal Sent',
  4: 'Approved',
  5: 'Rejected',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Mappers
// ─────────────────────────────────────────────────────────────────────────────
function mapApplicant(entity: IBackendApplicantEntity): IApplicantListItemDTO {
  return {
    id:               String(entity.id),
    firstName:        entity.firstName,
    paternalLastName: entity.parentalSurname,
    maternalLastName: entity.maternalSurname ?? '',
    phone:            entity.phone ?? '',
    email:            entity.email ?? '',
    location:         entity.location,
    registrationDate: entity.registrationDate ?? '',
    applicationStatus: STATUS_ID_TO_LABEL[entity.applicationStatusId] ?? 'Pending',
    notes:            entity.notes ?? undefined,
    documents: entity.documents.map((doc) => ({
      code:   doc.type,
      name:   doc.name,
      status: (doc.status as IApplicantListItemDTO['documents'][number]['status']) ?? 'Pendiente',
    })),
    vehicle: entity.vehicle
      ? {
          make:  entity.vehicle.brand,
          model: entity.vehicle.model,
          year:  entity.vehicle.year,
          color: entity.vehicle.color,
        }
      : undefined,
  };
}

function mapCatalogItem(raw: Record<string, unknown>): ICatalogItemDTO {
  return {
    value: String(raw['value'] ?? ''),
    label: String(raw['label'] ?? ''),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mock catalog por endpoint — fallback para catálogos cuando el backend falla
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_CATALOG_BY_ENDPOINT: Record<string, ICatalogItemDTO[]> = {
  [API_ENDPOINTS.CATALOGS_CITIES]:               MOCK_CATALOG_CITIES,
  [API_ENDPOINTS.CATALOGS_APPLICATION_STATUSES]: MOCK_CATALOG_APPLICATION_STATUSES,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Repositorio
// ─────────────────────────────────────────────────────────────────────────────
export class ApiApplicantsRepository implements IApplicantRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  // ── GET /api/v1/applicants ─────────────────────────────── ✅ REAL
  async getApplicants(
    filters: IApplicantFiltersDTO,
  ): Promise<IResultApi<{ items: IApplicantListItemDTO[]; total: number }>> {
    try {
      const applicationStatusInt =
        APPLICATION_STATUS_TO_INT[filters.applicationStatus ?? ''] ?? 0;
      const docStatusCodes =
        DOC_STATUS_TO_CODES[filters.documentationStatus ?? ''] ?? [];

      const queryParams: Record<string, string> = {
        page:              String(filters.page),
        pageSize:          String(filters.pageSize),
        sortBy:            filters.sortBy,
        sortDirection:     filters.sortDirection,
        applicationStatus: String(applicationStatusInt),
      };

      // Enviar códigos de documentación como parámetros separados si aplica
      if (docStatusCodes.length > 0) {
        queryParams.documentationStatus = docStatusCodes.join(',');
      }

      if (filters.search)   queryParams.search   = filters.search;
      if (filters.location) queryParams.location = filters.location;
      if (filters.dateFrom) queryParams.dateFrom = filters.dateFrom;
      if (filters.dateTo)   queryParams.dateTo   = filters.dateTo;

      const response = await this.httpClient.get<IBackendPaginatedResponse>(
        API_ENDPOINTS.APPLICANT,
        { queryParams },
      );

      return {
        success: true,
        data: {
          items: (response.data.items ?? []).map(mapApplicant),
          total: response.data.total ?? 0,
        },
      };
    } catch {
      // Fallback: filtrar mock en memoria con los mismos filtros
      const fallback = filterMockApplicants(MOCK_APPLICANTS, {
        search:              filters.search,
        applicationStatus:   filters.applicationStatus,
        documentationStatus: filters.documentationStatus,
        location:            filters.location,
        page:                filters.page,
        pageSize:            filters.pageSize,
        sortBy:              filters.sortBy,
        sortDirection:       filters.sortDirection,
      });
      return { success: true, data: fallback };
    }
  }

  // ── GET /api/v1/applicant/{id} ────────────────────────── 🟡 MOCK (sin endpoint real)
  async getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
    try {
      const response = await this.httpClient.get<IApplicantDetailDTO>(
        API_ENDPOINTS.APPLICANT_BY_ID(id),
      );
      return { success: true, data: response.data };
    } catch {
      return { success: true, data: getMockApplicantDetail(id) };
    }
  }

  // ── PUT /api/v1/applicant/{id} ────────────────────────── 🟡 MOCK (sin endpoint real)
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
    } catch {
      // Simula update exitoso devolviendo el payload fusionado con el mock
      const base = getMockApplicantDetail(id);
      return { success: true, data: { ...base, ...data, id } as IApplicantDetailDTO };
    }
  }

  // ── DELETE /api/v1/applicant/{id} ────────────────────── 🟡 MOCK (sin endpoint real)
  async deleteApplicant(id: string): Promise<IResultApi<void>> {
    try {
      await this.httpClient.delete<void>(API_ENDPOINTS.APPLICANT_BY_ID(id));
      return { success: true };
    } catch {
      return { success: true }; // mock: siempre OK
    }
  }

  // ── GET /api/v1/applicant/export/{format} ────────────── 🟡 MOCK (sin endpoint real)
  async exportApplicants(filters: IApplicantFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    try {
      const queryParams: Record<string, string> = {
        page:          String(filters.page),
        pageSize:      String(filters.pageSize),
        sortBy:        filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      if (filters.search)            queryParams.search            = filters.search;
      if (filters.applicationStatus) queryParams.applicationStatus = filters.applicationStatus;

      const response = await this.httpClient.get<Blob>(
        API_ENDPOINTS.APPLICANT_EXPORT(format),
        { queryParams },
      );
      return { success: true, data: response.data };
    } catch {
      // Mock: genera CSV en memoria
      const csvRows = [
        'Id,Nombre,ApellidoPaterno,Telefono,Email,Estatus',
        ...MOCK_APPLICANTS.map(
          (a) =>
            `${a.id},${a.firstName},${a.paternalLastName},${a.phone},${a.email},${a.applicationStatus}`,
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      return { success: true, data: blob };
    }
  }

  // ── GET /api/v1/applicant/{id}/documents ─────────────── 🟡 MOCK (sin endpoint real)
  async getDocuments(applicantId: string): Promise<IResultApi<IApplicantDocumentDTO[]>> {
    try {
      const response = await this.httpClient.get<IApplicantDocumentDTO[]>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(applicantId)}/documents`,
      );
      return { success: true, data: response.data };
    } catch {
      return { success: true, data: MOCK_APPLICANT_DOCUMENTS };
    }
  }

  // ── PUT /api/v1/applicant/{id}/documents/{type} ──────── 🟡 MOCK (sin endpoint real)
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
    } catch {
      const base = MOCK_APPLICANT_DOCUMENTS.find((d) => d.type === documentType);
      return {
        success: true,
        data: { ...(base ?? MOCK_APPLICANT_DOCUMENTS[0]), ...data, type: documentType },
      };
    }
  }

  // ── GET /api/v1/applicant/{id}/proposals ─────────────── 🟡 MOCK (sin endpoint real)
  async getProposals(applicantId: string): Promise<IResultApi<IProposalDTO[]>> {
    try {
      const response = await this.httpClient.get<IProposalDTO[]>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(applicantId)}/proposals`,
      );
      return { success: true, data: response.data };
    } catch {
      return { success: true, data: MOCK_PROPOSALS };
    }
  }

  // ── POST /api/v1/applicant/{id}/proposals ────────────── 🟡 MOCK (sin endpoint real)
  async createProposal(data: ICreateProposalDTO): Promise<IResultApi<IProposalDTO>> {
    try {
      const response = await this.httpClient.post<IProposalDTO>(
        `${API_ENDPOINTS.APPLICANT_BY_ID(data.applicantId)}/proposals`,
        data,
      );
      return { success: true, data: response.data };
    } catch {
      const proposal: IProposalDTO = {
        id:          `prop-${Date.now()}`,
        store:       data.store,
        schedule:    `${data.startTime} - ${data.endTime}`,
        sentAt:      new Date().toISOString(),
        status:      'Active',
        expiresIn:   72 * 3600 * 1000,
        respondedAt: undefined,
      };
      return { success: true, data: proposal };
    }
  }

  // ── GET /api/v1/catalogs/* ──────────────────────────── ✅ REAL (con fallback)
  async getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    try {
      const response = await this.httpClient.get<Record<string, unknown>[]>(catalogEndpoint);
      const mapped = (response.data ?? []).map(mapCatalogItem);
      return { success: true, data: mapped };
    } catch {
      // Fallback: devuelve mock si existe para ese endpoint
      const mockData = MOCK_CATALOG_BY_ENDPOINT[catalogEndpoint] ?? [];
      return { success: true, data: mockData };
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
