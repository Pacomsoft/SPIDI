import type { IGetTrainingsUseCase } from '../../domain/contracts/get-trainings-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ITrainingFiltersDTO, ITrainingListItemDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetTrainingsUseCase implements IGetTrainingsUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(filters: ITrainingFiltersDTO): Promise<IResultApi<{ items: ITrainingListItemDTO[]; total: number }>> {
    return this.repository.getTrainings(filters);
  }
}
