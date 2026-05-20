import { type IGetDriverByIdUseCase } from '../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IDriverDetailDTO } from '../../domain/contracts/driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetDriverByIdUseCase implements IGetDriverByIdUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(id: string): Promise<IResultApi<IDriverDetailDTO>> {
    return this.repository.getDriverById(id);
  }
}
