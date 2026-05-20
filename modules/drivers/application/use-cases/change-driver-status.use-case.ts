import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import type { IChangeDriverStatusInputDTO, IChangeDriverStatusOutputDTO } from '../../domain/contracts/change-driver-status.dto';

export class ChangeDriverStatusUseCase
  implements IUseCase<IChangeDriverStatusInputDTO, IResultApi<IChangeDriverStatusOutputDTO>> {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: IChangeDriverStatusInputDTO): Promise<IResultApi<IChangeDriverStatusOutputDTO>> {
    return this.repository.changeStatus(input);
  }
}
