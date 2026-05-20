import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverFiltersDTO } from './driver-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IExportDriversUseCase extends IUseCase<{ filters: IDriverFiltersDTO; format: string }, IResultApi<Blob>> {}
