import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import type { IExpiredDocumentItemDTO, IExpiredDocumentsFiltersDTO } from '../../domain/contracts/expired-document.dto';

export class GetExpiredDocumentsUseCase
  implements IUseCase<IExpiredDocumentsFiltersDTO, IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>> {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(filters: IExpiredDocumentsFiltersDTO): Promise<IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>> {
    return this.repository.getExpiredDocuments(filters);
  }
}
