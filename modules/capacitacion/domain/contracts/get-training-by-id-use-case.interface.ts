import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ITrainingDetailDTO } from './training.dto';

export interface IGetTrainingByIdUseCase extends IUseCase<string, IResultApi<ITrainingDetailDTO>> {}
