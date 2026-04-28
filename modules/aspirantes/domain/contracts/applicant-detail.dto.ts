export interface IApplicantDocumentDTO {
  type: string;
  label: string;
  expirationDate?: string;
  status: 'Pending' | 'Unreadable' | 'Prevalidated' | 'Validated';
  fileUrl?: string;
}

export interface IProposalDTO {
  id: string;
  store: string;
  schedule: string;
  sentAt: string;
  status: 'Active' | 'Accepted' | 'Rejected' | 'Expired';
  expiresIn?: number;
  respondedAt?: string;
}

export interface ICreateProposalDTO {
  applicantId: string;
  store: string;
  startTime: string;
  endTime: string;
}

export interface IApplicantDetailDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gender?: string;
  birthDate?: string;
  nationality?: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  photoUrl?: string;
  cityOfInterest?: string;
  street?: string;
  externalNumber?: string;
  internalNumber?: string;
  neighborhood?: string;
  postalCode?: string;
  fiscalStreet?: string;
  fiscalExternalNumber?: string;
  fiscalInternalNumber?: string;
  fiscalNeighborhood?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalPostalCode?: string;
  fiscalRegime?: string;
  bank?: string;
  clabe?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlates: string;
  vehicleColor: string;
  applicationStatus: 'Pending' | 'In Review' | 'Proposal Sent' | 'Approved' | 'Rejected';
  isDriver: boolean;
  contractSignature?: string;
  contractSignatureDate?: string;
  internalNotes?: string;
  beneficiaries?: Array<{
    name: string;
    phone: string;
    percentage: number;
  }>;
}
