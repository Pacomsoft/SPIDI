import type { IApplicantListItemDTO, IApplicantFiltersDTO, ICatalogItemDTO } from './applicant-list.dto';
import type {
  IApplicantDetailDTO,
  IApplicantDocumentDTO,
  IProposalDTO,
  ICreateProposalDTO,
} from './applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IApplicantRepository {
  getApplicants(
    filters: IApplicantFiltersDTO,
  ): Promise<IResultApi<{ items: IApplicantListItemDTO[]; total: number }>>;

  getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>>;

  updateApplicant(
    id: string,
    data: Partial<IApplicantDetailDTO>,
  ): Promise<IResultApi<IApplicantDetailDTO>>;

  deleteApplicant(id: string): Promise<IResultApi<void>>;

  exportApplicants(
    filters: IApplicantFiltersDTO,
    format: string,
  ): Promise<IResultApi<Blob>>;

  getDocuments(applicantId: string): Promise<IResultApi<IApplicantDocumentDTO[]>>;

  updateDocument(
    applicantId: string,
    documentType: string,
    data: Partial<IApplicantDocumentDTO>,
  ): Promise<IResultApi<IApplicantDocumentDTO>>;

  getProposals(applicantId: string): Promise<IResultApi<IProposalDTO[]>>;

  createProposal(data: ICreateProposalDTO): Promise<IResultApi<IProposalDTO>>;

  getCatalogItems(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>>;
}
