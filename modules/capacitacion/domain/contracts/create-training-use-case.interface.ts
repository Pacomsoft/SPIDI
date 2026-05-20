import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ICreateTrainingDTO, ITrainingDetailDTO } from './training.dto';

export interface ICreateTrainingUseCase extends IUseCase<ICreateTrainingDTO, IResultApi<ITrainingDetailDTO>> {}
