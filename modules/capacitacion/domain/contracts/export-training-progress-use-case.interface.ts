import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ITrainingProgressDTO } from './training.dto';

export interface IExportTrainingProgressInput {
  trainingId: string;
  format: string;
}

export interface IExportTrainingProgressUseCase extends IUseCase<IExportTrainingProgressInput, IResultApi<Blob>> {}

export interface IGetTrainingProgressUseCase extends IUseCase<string, IResultApi<ITrainingProgressDTO[]>> {}
