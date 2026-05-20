import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ISendTrainingDTO } from './training.dto';

export interface ISendTrainingUseCase extends IUseCase<ISendTrainingDTO, IResultApi<{ sent: number; failed: string[] }>> {}
