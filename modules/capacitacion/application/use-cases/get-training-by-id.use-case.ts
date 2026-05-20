import type { IGetTrainingByIdUseCase } from '../../domain/contracts/get-training-by-id-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ITrainingDetailDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetTrainingByIdUseCase implements IGetTrainingByIdUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(id: string): Promise<IResultApi<ITrainingDetailDTO>> {
    return this.repository.getTrainingById(id);
  }
}
