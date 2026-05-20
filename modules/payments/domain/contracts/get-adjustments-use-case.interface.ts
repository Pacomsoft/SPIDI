import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IAdjustmentFiltersDTO, IAdjustmentListItemDTO } from './adjustment.dto';

export interface IGetAdjustmentsUseCase extends IUseCase<IAdjustmentFiltersDTO, IResultApi<{ items: IAdjustmentListItemDTO[]; total: number }>> {}
