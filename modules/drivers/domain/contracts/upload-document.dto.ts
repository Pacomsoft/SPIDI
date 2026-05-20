export interface IUploadDocumentInputDTO {
  driverId: string;
  documentType: string;
  documentLabel: string;
  file: File;
}

export interface IUploadDocumentOutputDTO {
  driverId: string;
  documentType: string;
  url: string;
  uploadedAt: string;
}
