import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDailySummaryFiltersDTO } from './daily-summary.dto';

export interface IExportDailySummariesUseCase extends IUseCase<{ filters: IDailySummaryFiltersDTO; format: string }, IResultApi<Blob>> {}
