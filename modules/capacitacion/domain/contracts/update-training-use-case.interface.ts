import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IUpdateTrainingDTO, ITrainingDetailDTO } from './training.dto';

export interface IUpdateTrainingInput {
  id: string;
  data: IUpdateTrainingDTO;
}

export interface IUpdateTrainingUseCase extends IUseCase<IUpdateTrainingInput, IResultApi<ITrainingDetailDTO>> {}
