import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IAdjustmentFiltersDTO } from './adjustment.dto';

export interface IExportAdjustmentsUseCase extends IUseCase<{ filters: IAdjustmentFiltersDTO; format: string }, IResultApi<Blob>> {}
