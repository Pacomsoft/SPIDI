import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IDailySummaryFiltersDTO, IDailySummaryListItemDTO } from './daily-summary.dto';

export interface IGetDailySummariesUseCase extends IUseCase<IDailySummaryFiltersDTO, IResultApi<{ items: IDailySummaryListItemDTO[]; total: number }>> {}
