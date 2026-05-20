import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IAdjustmentDetailDTO, IUpdateAdjustmentDTO } from './adjustment.dto';

export interface IUpdateAdjustmentUseCase
  extends IUseCase<{ id: string; data: IUpdateAdjustmentDTO }, IResultApi<IAdjustmentDetailDTO>> {}
