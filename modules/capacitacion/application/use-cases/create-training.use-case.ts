import type { ICreateTrainingUseCase } from '../../domain/contracts/create-training-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ICreateTrainingDTO, ITrainingDetailDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class CreateTrainingUseCase implements ICreateTrainingUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(data: ICreateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>> {
    return this.repository.createTraining(data);
  }
}
