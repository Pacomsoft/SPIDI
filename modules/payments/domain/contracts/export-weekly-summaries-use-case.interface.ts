import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IWeeklySummaryFiltersDTO } from './weekly-summary.dto';

export interface IExportWeeklySummariesUseCase extends IUseCase<{ filters: IWeeklySummaryFiltersDTO; format: string }, IResultApi<Blob>> {}
