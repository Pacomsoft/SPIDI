import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IWeeklySummaryFiltersDTO, IWeeklySummaryListItemDTO } from './weekly-summary.dto';

export interface IGetWeeklySummariesUseCase extends IUseCase<IWeeklySummaryFiltersDTO, IResultApi<{ items: IWeeklySummaryListItemDTO[]; total: number }>> {}
