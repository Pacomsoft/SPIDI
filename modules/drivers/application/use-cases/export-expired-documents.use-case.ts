import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDriverRepository } from '../../domain/contracts/driver-repository.interface';

export class ExportExpiredDocumentsUseCase
  implements IUseCase<{ format: string }, IResultApi<Blob>> {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: { format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportExpiredDocuments(input.format);
  }
}
