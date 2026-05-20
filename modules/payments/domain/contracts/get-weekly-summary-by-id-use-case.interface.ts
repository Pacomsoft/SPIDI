import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IWeeklySummaryDetailDTO } from './weekly-summary.dto';

export interface IGetWeeklySummaryByIdUseCase extends IUseCase<string, IResultApi<IWeeklySummaryDetailDTO>> {}
