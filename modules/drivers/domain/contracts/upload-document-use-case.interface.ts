import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IUploadDocumentInputDTO, IUploadDocumentOutputDTO } from './upload-document.dto';

export interface IUploadDocumentUseCase
  extends IUseCase<IUploadDocumentInputDTO, IResultApi<IUploadDocumentOutputDTO>> {}
