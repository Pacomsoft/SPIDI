import type { IUpdateTrainingUseCase, IUpdateTrainingInput } from '../../domain/contracts/update-training-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ITrainingDetailDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class UpdateTrainingUseCase implements IUpdateTrainingUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(input: IUpdateTrainingInput): Promise<IResultApi<ITrainingDetailDTO>> {
    return this.repository.updateTraining(input.id, input.data);
  }
}
