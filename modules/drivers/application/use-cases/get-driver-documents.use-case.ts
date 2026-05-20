import { type IGetDriverDocumentsUseCase } from '../../domain/contracts/get-driver-documents-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IDocumentDTO } from '../../domain/contracts/driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetDriverDocumentsUseCase implements IGetDriverDocumentsUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(driverId: string): Promise<IResultApi<IDocumentDTO[]>> {
    return this.repository.getDocuments(driverId);
  }
}
