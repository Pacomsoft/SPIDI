export interface IExpiredDocumentItemDTO {
  driverId: string;
  fullName: string;
  rfc: string;
  expiredDocuments: string[];      // documentos ya vencidos
  expiringDocuments: string[];     // documentos que vencen en los próximos 30 días
  oldestExpiryDate: string;        // ISO date - la expiración más antigua
}

export interface IExpiredDocumentsFiltersDTO {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
