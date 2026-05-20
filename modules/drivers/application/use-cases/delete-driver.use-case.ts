import { type IDeleteDriverUseCase } from '../../domain/contracts/delete-driver-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class DeleteDriverUseCase implements IDeleteDriverUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(id: string): Promise<IResultApi<void>> {
    return this.repository.deleteDriver(id);
  }
}
