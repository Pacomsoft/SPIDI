import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ICreateAdjustmentDTO, IAdjustmentDetailDTO } from './adjustment.dto';

export interface ICreateAdjustmentUseCase extends IUseCase<ICreateAdjustmentDTO, IResultApi<IAdjustmentDetailDTO>> {}
