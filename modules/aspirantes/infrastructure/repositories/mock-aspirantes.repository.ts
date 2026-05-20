/**
 * MockApplicantsRepository
 *
 * Implementación 100% en memoria del contrato IApplicantRepository.
 * Activo en el despliegue Vercel (demo). No realiza ninguna llamada HTTP.
 *
 * Todos los datos provienen de applicants.mock.ts — sin información real de negocio.
 */

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
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

// Estado mutable en memoria (simula BD en el cliente)
let _applicants = [...MOCK_APPLICANTS];

export class MockApplicantsRepository implements IApplicantRepository {
  // ── Listado paginado ──────────────────────────────────────────────────────
  async getApplicants(
    filters: IApplicantFiltersDTO,
  ): Promise<IResultApi<{ items: IApplicantListItemDTO[]; total: number }>> {
    await this._delay();
    const result = filterMockApplicants(_applicants, {
      search:              filters.search,
      applicationStatus:   filters.applicationStatus,
      documentationStatus: filters.documentationStatus,
      location:            filters.location,
      page:                filters.page,
      pageSize:            filters.pageSize,
      sortBy:              filters.sortBy,
      sortDirection:       filters.sortDirection,
    });
    return { success: true, data: result };
  }

  // ── Detalle ───────────────────────────────────────────────────────────────
  async getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
    await this._delay();
    return { success: true, data: getMockApplicantDetail(id) };
  }

  // ── Update ────────────────────────────────────────────────────────────────
  async updateApplicant(
    id: string,
    data: Partial<IApplicantDetailDTO>,
  ): Promise<IResultApi<IApplicantDetailDTO>> {
    await this._delay();
    const base = getMockApplicantDetail(id);
    return { success: true, data: { ...base, ...data, id } as IApplicantDetailDTO };
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async deleteApplicant(id: string): Promise<IResultApi<void>> {
    await this._delay();
    _applicants = _applicants.filter((a) => a.id !== id);
    return { success: true };
  }

  // ── Export ────────────────────────────────────────────────────────────────
  async exportApplicants(
    _filters: IApplicantFiltersDTO,
    _format: string,
  ): Promise<IResultApi<Blob>> {
    await this._delay();
    const csvRows = [
      'Id,Nombre,ApellidoPaterno,Telefono,Email,Estatus',
      ..._applicants.map(
        (a) =>
          `${a.id},${a.firstName},${a.paternalLastName},${a.phone},${a.email},${a.applicationStatus}`,
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    return { success: true, data: blob };
  }

  // ── Documentos ────────────────────────────────────────────────────────────
  async getDocuments(_applicantId: string): Promise<IResultApi<IApplicantDocumentDTO[]>> {
    await this._delay();
    return { success: true, data: MOCK_APPLICANT_DOCUMENTS };
  }

  async updateDocument(
    _applicantId: string,
    documentType: string,
    data: Partial<IApplicantDocumentDTO>,
  ): Promise<IResultApi<IApplicantDocumentDTO>> {
    await this._delay();
    const base = MOCK_APPLICANT_DOCUMENTS.find((d) => d.type === documentType);
    return {
      success: true,
      data: { ...(base ?? MOCK_APPLICANT_DOCUMENTS[0]), ...data, type: documentType },
    };
  }

  // ── Propuestas ────────────────────────────────────────────────────────────
  async getProposals(_applicantId: string): Promise<IResultApi<IProposalDTO[]>> {
    await this._delay();
    return { success: true, data: MOCK_PROPOSALS };
  }

  async createProposal(data: ICreateProposalDTO): Promise<IResultApi<IProposalDTO>> {
    await this._delay();
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

  // ── Catálogos ─────────────────────────────────────────────────────────────
  async getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    await this._delay();
    const catalogMap: Record<string, ICatalogItemDTO[]> = {
      [API_ENDPOINTS.CATALOGS_CITIES]:               MOCK_CATALOG_CITIES,
      [API_ENDPOINTS.CATALOGS_APPLICATION_STATUSES]: MOCK_CATALOG_APPLICATION_STATUSES,
    };
    const data = catalogMap[catalogEndpoint] ?? [];
    return { success: true, data };
  }

  // ── Simula latencia de red ────────────────────────────────────────────────
  private _delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
