import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ITrainingFiltersDTO } from './training.dto';

export interface IExportTrainingsInput {
  filters: ITrainingFiltersDTO;
  format: string;
}

export interface IExportTrainingsUseCase extends IUseCase<IExportTrainingsInput, IResultApi<Blob>> {}
