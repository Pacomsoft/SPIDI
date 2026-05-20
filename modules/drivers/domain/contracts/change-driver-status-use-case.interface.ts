import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IChangeDriverStatusInputDTO, IChangeDriverStatusOutputDTO } from './change-driver-status.dto';

export interface IChangeDriverStatusUseCase
  extends IUseCase<IChangeDriverStatusInputDTO, IResultApi<IChangeDriverStatusOutputDTO>> {}
