import type { IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';

export interface IApplicantDocumentSummaryDTO {
  name: string;
  status: 'complete' | 'pending' | 'rejected' | 'revision';
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
  documentationStatus: 'Pending' | 'Incomplete' | 'Complete' | 'Review';
  documents?: IApplicantDocumentSummaryDTO[];
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
  documentationStatus?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}
