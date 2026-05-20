import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

// Estados de documento visibles al front — alineados con RN02, RN03, RN04, RN05
// Los estados internos de BD (Escaneado, Eliminado) se mapean a 'Pendiente' en el SP
export type DocumentStatus = 'Pendiente' | 'No legible' | 'Prevalidado' | 'Validado';

export interface IApplicantDocumentSummaryDTO {
  code: string;   // Identificador corto: NSS, LICENSE, CAR_INSURANCE, INE, CSF, BANK_CLABE
  name: string;
  status: DocumentStatus;
}

export interface ICatalogItemDTO {
  value: string;
  label: string;
}

export interface IApplicantListItemDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  location: string;
  registrationDate: string;
  applicationStatus: 'Pending' | 'In Review' | 'Proposal Sent' | 'Approved' | 'Rejected';
  // documentationStatus eliminado — el estado vive a nivel de cada documento individual
  documents: IApplicantDocumentSummaryDTO[]; // siempre presente — 6 docs del catálogo
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
  };
  notes?: string;
}

export interface IApplicantFiltersDTO extends IPagination {
  search?: string;
  applicationStatus?: string;
  // Valores válidos: Pendiente | No legible | Prevalidado | Validado
  // Se traduce a statusIds en el repositorio antes de enviarse al backend
  documentationStatus?: DocumentStatus | '';
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}
