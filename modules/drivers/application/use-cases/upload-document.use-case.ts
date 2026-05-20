import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import type { IUploadDocumentInputDTO, IUploadDocumentOutputDTO } from '../../domain/contracts/upload-document.dto';

export class UploadDocumentUseCase
  implements IUseCase<IUploadDocumentInputDTO, IResultApi<IUploadDocumentOutputDTO>> {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: IUploadDocumentInputDTO): Promise<IResultApi<IUploadDocumentOutputDTO>> {
    return this.repository.uploadDocument(input);
  }
}
