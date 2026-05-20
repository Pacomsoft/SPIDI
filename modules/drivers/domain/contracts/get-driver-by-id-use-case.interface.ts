import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverDetailDTO } from './driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriverByIdUseCase extends IUseCase<string, IResultApi<IDriverDetailDTO>> {}
