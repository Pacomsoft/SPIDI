import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ITrainingFiltersDTO, ITrainingListItemDTO } from './training.dto';

export interface IGetTrainingsUseCase extends IUseCase<ITrainingFiltersDTO, IResultApi<{ items: ITrainingListItemDTO[]; total: number }>> {}
