import { type IUpdateDriverUseCase } from '../../domain/contracts/update-driver-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IDriverDetailDTO } from '../../domain/contracts/driver-detail.dto';
import { type IUpdateDriverDTO } from '../../domain/contracts/update-driver.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class UpdateDriverUseCase implements IUpdateDriverUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: { id: string; data: IUpdateDriverDTO }): Promise<IResultApi<IDriverDetailDTO>> {
    return this.repository.updateDriver(input.id, input.data);
  }
}
